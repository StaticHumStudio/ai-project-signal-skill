#!/usr/bin/env python3
"""Unit tests for collect.py, no network.

Every defect found in this file so far was an off-by-one in selection or
paging: a slice that returned everything, a page walk that stopped one page
short, a count that included the post it was counting replies to. None of them
raised, and all of them quietly returned the wrong documents, which the rubric
then treats as evidence. These tests pin the selection arithmetic.

    python3 -m unittest discover -s collector
"""

import argparse
import json
import os
import tempfile
import unittest
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest import mock

import collect


class DiscoursePostSelection(unittest.TestCase):
    """_discourse_posts picks which of a topic's posts to keep."""

    def detail(self, stream, inlined=()):
        return {
            "post_stream": {
                "stream": list(stream),
                "posts": [{"id": post_id} for post_id in inlined],
            }
        }

    def select(self, stream, max_posts, inlined=None):
        inlined = stream if inlined is None else inlined
        with mock.patch.object(collect, "fetch_json") as fetch:
            posts = collect._discourse_posts(
                "https://example.test", self.detail(stream, inlined), 7, max_posts, 0
            )
            self.assertEqual(fetch.call_count, 0, "nothing was missing to fetch")
        return [post["id"] for post in posts]

    def test_one_post_returns_only_the_opener(self):
        # stream[-0:] is the whole list, so this case gets its own branch.
        self.assertEqual(self.select([10, 11, 12, 13], 1), [10])

    def test_two_posts_returns_opener_and_newest(self):
        self.assertEqual(self.select([10, 11, 12, 13], 2), [10, 13])

    def test_exactly_the_stream_length_returns_everything(self):
        self.assertEqual(self.select([10, 11, 12, 13], 4), [10, 11, 12, 13])

    def test_over_the_stream_length_returns_everything(self):
        self.assertEqual(self.select([10, 11], 50), [10, 11])

    def test_opener_is_not_duplicated_when_it_is_also_newest(self):
        self.assertEqual(self.select([10], 3), [10])

    def test_no_stream_falls_back_to_the_inlined_posts(self):
        detail = {"post_stream": {"stream": [], "posts": [{"id": 1}, {"id": 2}]}}
        posts = collect._discourse_posts("https://example.test", detail, 7, 1, 0)
        self.assertEqual([post["id"] for post in posts], [1])

    def test_missing_posts_are_fetched_and_kept_in_stream_order(self):
        stream = list(range(100, 160))
        detail = self.detail(stream, inlined=stream[:20])
        fetched = {
            "post_stream": {"posts": [{"id": post_id} for post_id in stream[20:]]}
        }
        with mock.patch.object(collect, "fetch_json", return_value=fetched) as fetch:
            posts = collect._discourse_posts(
                "https://example.test", detail, 7, 10, 0
            )
        self.assertEqual(fetch.call_count, 1)
        self.assertEqual(
            [post["id"] for post in posts], [100] + list(range(151, 160))
        )

    def test_a_failed_fetch_returns_what_is_already_in_hand(self):
        stream = [1, 2, 3]
        detail = self.detail(stream, inlined=[1])
        with mock.patch.object(
            collect, "fetch_json", side_effect=PermissionError("robots.txt")
        ):
            posts = collect._discourse_posts(
                "https://example.test", detail, 7, 3, 0
            )
        self.assertEqual([post["id"] for post in posts], [1])


class GithubCommentPaging(unittest.TestCase):
    """_github_comments walks back from the last page until it has enough."""

    def run_with(self, pages, count, want):
        """pages maps a 1-based page number to the comment ids it returns."""
        requested = []

        def fake_run(command, **kwargs):
            # per_page= matches a bare 'page=' first, so split on the full key.
            path = command[-1]
            page = int(path.split("&page=")[1])
            requested.append(page)
            body = [
                {"id": comment_id, "body": "b", "user": {"login": "u"},
                 "html_url": f"https://example.test/c/{comment_id}",
                 "created_at": "2026-07-30T00:00:00Z"}
                for comment_id in pages.get(page, [])
            ]
            return SimpleNamespace(returncode=0, stdout=json.dumps(body), stderr="")

        with mock.patch.object(collect.subprocess, "run", side_effect=fake_run):
            records = collect._github_comments(
                "o/r", 1, "o/r#1", "https://example.test/i/1", count, want
            )
        return requested, records

    def test_a_thin_last_page_walks_back_for_the_rest(self):
        pages = {1: list(range(1, 101)), 2: [101]}
        requested, records = self.run_with(pages, count=101, want=10)
        self.assertEqual(requested, [2, 1])
        self.assertEqual(
            [r["id"] for r in records],
            [f"github:o/r#1-c{n}" for n in range(92, 102)],
        )

    def test_one_page_is_enough_when_the_issue_is_small(self):
        requested, records = self.run_with({1: [1, 2, 3]}, count=3, want=10)
        self.assertEqual(requested, [1])
        self.assertEqual(len(records), 3)

    def test_it_stops_at_page_one_rather_than_asking_for_page_zero(self):
        requested, records = self.run_with({1: [1]}, count=1, want=50)
        self.assertEqual(requested, [1])
        self.assertEqual(len(records), 1)

    def test_a_gh_failure_returns_what_it_had(self):
        def fake_run(command, **kwargs):
            return SimpleNamespace(returncode=1, stdout="", stderr="rate limited")

        with mock.patch.object(collect.subprocess, "run", side_effect=fake_run):
            records = collect._github_comments(
                "o/r", 1, "o/r#1", "https://example.test/i/1", 10, 5
            )
        self.assertEqual(records, [])

    def test_records_carry_the_thread_back_to_the_issue(self):
        _, records = self.run_with({1: [7]}, count=1, want=1)
        self.assertEqual(records[0]["thread_id"], "github:o/r#1")
        self.assertEqual(records[0]["kind"], "comment")
        self.assertEqual(records[0]["created_utc"], "2026-07-30T00:00:00Z")


class HnPaging(unittest.TestCase):
    """collect_hn pages Algolia and pulls each matched story's own replies."""

    def args(self, **overrides):
        base = dict(query="invoice", since="30d", limit=150, replies=0)
        base.update(overrides)
        return SimpleNamespace(**base)

    def test_page_size_stays_fixed_so_pages_do_not_overlap(self):
        urls = []

        def fake_fetch(url, **kwargs):
            urls.append(url)
            page = int(url.split("page=")[-1])
            start = page * 100
            return {
                "nbPages": 5,
                "hits": [
                    {"objectID": str(start + n), "title": "t", "story_text": "x",
                     "comment_text": "x", "created_at_i": 1}
                    for n in range(100)
                ],
            }

        with mock.patch.object(collect, "fetch_json", side_effect=fake_fetch):
            results = collect.collect_hn(self.args())

        self.assertTrue(all("hitsPerPage=100" in url for url in urls), urls)
        # Two pages per tag, the second truncated locally to reach 150.
        self.assertEqual(len(urls), 4)
        self.assertEqual(len(results), 150)

    def test_blank_comments_do_not_push_the_limit_onto_an_older_page(self):
        """Skipped blanks must be refilled from the same page. Algolia sorts
        newest first, so spending the slice on blanks and moving to page 1
        returns older comments while newer ones on page 0 go unread."""

        def fake_fetch(url, **kwargs):
            if "tags=story" in url:
                return {"nbPages": 1, "hits": []}
            page = int(url.split("page=")[-1])
            start = page * 10
            return {
                "nbPages": 2,
                "hits": [
                    {
                        "objectID": str(start + n),
                        # The two newest comments on page 0 are deleted.
                        "comment_text": "" if page == 0 and n < 2 else "real",
                        "created_at_i": 1000 - (start + n),
                    }
                    for n in range(10)
                ],
            }

        with mock.patch.object(collect, "fetch_json", side_effect=fake_fetch):
            results = collect.collect_hn(self.args(limit=5))

        ids = [r["id"] for r in results]
        self.assertEqual(len(ids), 5)
        # The five newest non-blank comments, all still on page 0.
        self.assertEqual(
            ids,
            ["hackernews:2", "hackernews:3", "hackernews:4",
             "hackernews:5", "hackernews:6"],
        )

    def test_replies_are_pulled_for_each_matched_story(self):
        def fake_fetch(url, **kwargs):
            if "story_" in url:
                return {"hits": [
                    {"objectID": "900", "comment_text": "me too",
                     "story_id": "1", "created_at_i": 2}
                ]}
            if "tags=story" in url:
                return {"nbPages": 1, "hits": [
                    {"objectID": "1", "title": "t", "story_text": "x",
                     "created_at_i": 1}
                ]}
            return {"nbPages": 1, "hits": []}

        with mock.patch.object(collect, "fetch_json", side_effect=fake_fetch):
            results = collect.collect_hn(self.args(limit=10, replies=20))

        self.assertEqual(
            [r["id"] for r in results], ["hackernews:1", "hackernews:900"]
        )
        self.assertEqual(results[1]["thread_id"], "hackernews:1")

    def test_replies_zero_skips_the_extra_requests(self):
        urls = []

        def fake_fetch(url, **kwargs):
            urls.append(url)
            if "tags=story" in url:
                return {"nbPages": 1, "hits": [
                    {"objectID": "1", "title": "t", "story_text": "x",
                     "created_at_i": 1}
                ]}
            return {"nbPages": 1, "hits": []}

        with mock.patch.object(collect, "fetch_json", side_effect=fake_fetch):
            collect.collect_hn(self.args(limit=10, replies=0))

        self.assertFalse(any("story_" in url for url in urls), urls)

    def test_a_reply_found_twice_is_cached_once(self):
        comment = {"objectID": "900", "comment_text": "me too", "story_id": "1",
                   "created_at_i": 2}

        def fake_fetch(url, **kwargs):
            if "story_" in url:
                return {"hits": [comment]}
            if "tags=story" in url:
                return {"nbPages": 1, "hits": [
                    {"objectID": "1", "title": "t", "story_text": "x",
                     "created_at_i": 1}
                ]}
            return {"nbPages": 1, "hits": [comment]}

        with mock.patch.object(collect, "fetch_json", side_effect=fake_fetch):
            results = collect.collect_hn(self.args(limit=10, replies=20))

        self.assertEqual(len(results), 2)


class DiscourseReplyCount(unittest.TestCase):
    def collect_one(self, posts_count):
        args = SimpleNamespace(
            instance="example.test", category=None, match=None,
            limit=1, max_posts=50, delay=0,
        )
        detail = {
            "posts_count": posts_count,
            "post_stream": {
                "stream": [10],
                "posts": [{
                    "id": 10, "post_number": 1, "cooked": "<p>hi</p>",
                    "username": "u", "created_at": "2026-07-30T00:00:00Z",
                }],
            },
        }

        def fake_fetch(url, **kwargs):
            if "/latest.json" in url:
                return {"topic_list": {"topics": [
                    {"id": 7, "title": "T", "slug": "t"}
                ]}}
            return detail

        with mock.patch.object(collect, "fetch_json", side_effect=fake_fetch):
            return collect.collect_discourse(args)

    def test_a_topic_with_no_replies_reports_zero(self):
        self.assertEqual(self.collect_one(1)[0]["num_comments"], 0)

    def test_the_opener_is_excluded_from_the_reply_count(self):
        self.assertEqual(self.collect_one(4)[0]["num_comments"], 3)

    def test_a_missing_count_stays_missing(self):
        self.assertIsNone(self.collect_one(None)[0]["num_comments"])


class Iso(unittest.TestCase):
    def test_unix_seconds(self):
        self.assertEqual(collect.iso(0), "1970-01-01T00:00:00Z")
        self.assertEqual(collect.iso(1700000000), "2023-11-14T22:13:20Z")

    def test_iso_string_with_zulu(self):
        self.assertEqual(collect.iso("2026-07-30T12:00:00Z"), "2026-07-30T12:00:00Z")

    def test_offsets_are_normalized_to_utc(self):
        self.assertEqual(
            collect.iso("2026-07-30T12:00:00+02:00"), "2026-07-30T10:00:00Z"
        )

    def test_naive_timestamps_are_read_as_utc(self):
        self.assertEqual(collect.iso("2026-07-30T12:00:00"), "2026-07-30T12:00:00Z")

    def test_none_stays_none(self):
        self.assertIsNone(collect.iso(None))

    def test_an_unparseable_value_is_passed_through_rather_than_invented(self):
        self.assertEqual(collect.iso("last tuesday"), "last tuesday")


class ParseSince(unittest.TestCase):
    def elapsed(self, value):
        now = datetime.now(timezone.utc).timestamp()
        return now - collect.parse_since(value)

    def test_days(self):
        self.assertAlmostEqual(self.elapsed("14d"), 14 * 86400, delta=5)

    def test_hours(self):
        self.assertAlmostEqual(self.elapsed("48h"), 48 * 3600, delta=5)

    def test_weeks(self):
        self.assertAlmostEqual(self.elapsed("2w"), 14 * 86400, delta=5)

    def test_case_and_whitespace(self):
        self.assertAlmostEqual(self.elapsed(" 30D "), 30 * 86400, delta=5)

    def test_garbage_is_rejected(self):
        for value in ("", "d", "30", "30m", "1.5d", "30 days", "-5d"):
            with self.assertRaises(argparse.ArgumentTypeError, msg=value):
                collect.parse_since(value)


class StripHtml(unittest.TestCase):
    def test_empty_inputs(self):
        self.assertEqual(collect.strip_html(None), "")
        self.assertEqual(collect.strip_html(""), "")

    def test_block_tags_become_line_breaks(self):
        self.assertEqual(collect.strip_html("<p>a</p><p>b</p>"), "a\nb")

    def test_script_and_style_contents_are_dropped(self):
        self.assertEqual(collect.strip_html("<script>bad()</script>ok"), "ok")
        self.assertEqual(collect.strip_html("<style>.a{}</style>ok"), "ok")

    def test_runs_of_blank_lines_collapse(self):
        self.assertEqual(collect.strip_html("a<p></p><p></p><p>b"), "a\n\nb")

    def test_entities_are_decoded(self):
        self.assertEqual(collect.strip_html("R&amp;D &gt; guessing"), "R&D > guessing")


class WriteCache(unittest.TestCase):
    def rows(self, path):
        with open(path, encoding="utf-8") as handle:
            return [json.loads(line) for line in handle if line.strip()]

    def item(self, doc_id, **fields):
        return collect.record(
            doc_id=doc_id, source="github", kind="issue",
            url="https://example.test", body="b", **fields
        )

    def test_repeated_passes_accumulate_and_refresh(self):
        with tempfile.TemporaryDirectory() as out:
            path = collect.write_cache([self.item(1, num_comments=2)], "github", out)
            collect.write_cache(
                [self.item(1, num_comments=9), self.item(2)], "github", out
            )
            rows = self.rows(path)

        self.assertEqual([row["id"] for row in rows], ["github:1", "github:2"])
        self.assertEqual(rows[0]["num_comments"], 9)

    def test_the_file_lands_under_todays_date(self):
        day = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        with tempfile.TemporaryDirectory() as out:
            path = collect.write_cache([self.item(1)], "github", out)
            self.assertEqual(path, os.path.join(out, day, "github.jsonl"))
            self.assertFalse(os.path.exists(f"{path}.tmp"))

    def test_an_unreadable_line_does_not_stop_the_merge(self):
        with tempfile.TemporaryDirectory() as out:
            path = collect.write_cache([self.item(1)], "github", out)
            with open(path, "a", encoding="utf-8") as handle:
                handle.write("{not json\n")
            collect.write_cache([self.item(2)], "github", out)
            self.assertEqual(
                [row["id"] for row in self.rows(path)], ["github:1", "github:2"]
            )


if __name__ == "__main__":
    unittest.main()
