#!/usr/bin/env python3
"""Retrieve discussion into a local JSONL cache, so the model never has to fetch.

Timestamps come from each API rather than from a model reading a page, which is
where fabricated dates come from. See collector/README.md for the record shape,
what each source is good for, and why Reddit is absent.

    python3 collector/collect.py hn --query "invoice" --since 30d
    python3 collector/collect.py discourse --instance meta.discourse.org
    python3 collector/collect.py github --query "org:foo is:open label:bug"
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
from datetime import datetime, timedelta, timezone
from html.parser import HTMLParser

USER_AGENT = (
    "signal-demand-research/0.1 "
    "(+https://github.com/StaticHumStudio/ai-project-signal-skill)"
)

# Minimum seconds between requests to the same host. Nothing here is time
# critical, and most of these forums are volunteer run.
DEFAULT_DELAY = 1.5

_last_request: dict[str, float] = {}
_robots: dict[str, urllib.robotparser.RobotFileParser | None] = {}


class SetupRequired(Exception):
    """A collector needs something installed or configured, not a retry."""


# ---------------------------------------------------------------- http helpers


def _host(url: str) -> str:
    return urllib.parse.urlparse(url).netloc


def _throttle(host: str, delay: float) -> None:
    previous = _last_request.get(host)
    if previous is not None:
        wait = delay - (time.monotonic() - previous)
        if wait > 0:
            time.sleep(wait)
    _last_request[host] = time.monotonic()


def robots_allows(url: str) -> bool:
    """Check url against the host's robots.txt.

    No robots.txt means allow all. A host we cannot reach at all means deny,
    since guessing permissively is how you scrape something that said no.
    """
    host = _host(url)
    if host not in _robots:
        parser = urllib.robotparser.RobotFileParser()
        robots_url = f"{urllib.parse.urlparse(url).scheme}://{host}/robots.txt"
        try:
            request = urllib.request.Request(
                robots_url, headers={"User-Agent": USER_AGENT}
            )
            with urllib.request.urlopen(request, timeout=20) as response:
                parser.parse(response.read().decode("utf-8", "replace").splitlines())
            _robots[host] = parser
        except urllib.error.HTTPError as error:
            # 404 means no robots.txt, which means no restrictions.
            _robots[host] = None if error.code == 404 else parser
        except Exception:
            _robots[host] = parser
    parser = _robots[host]
    if parser is None:
        return True
    return parser.can_fetch(USER_AGENT, url)


def fetch_json(url: str, delay: float = DEFAULT_DELAY, respect_robots: bool = True):
    """GET a URL and parse JSON, throttled and robots aware."""
    if respect_robots and not robots_allows(url):
        raise PermissionError(
            f"robots.txt on {_host(url)} disallows {url}\n"
            f"  This is not a bug to work around. Pick a different endpoint."
        )
    _throttle(_host(url), delay)
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8", "replace"))


# ------------------------------------------------------------- record plumbing


def iso(timestamp) -> str | None:
    """Normalize a unix int or an ISO string to UTC ISO 8601."""
    if timestamp is None:
        return None
    if isinstance(timestamp, (int, float)):
        return (
            datetime.fromtimestamp(timestamp, timezone.utc)
            .isoformat()
            .replace("+00:00", "Z")
        )
    cleaned = str(timestamp).replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(cleaned)
    except ValueError:
        return str(timestamp)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def record(
    *,
    doc_id,
    source,
    kind,
    url,
    body,
    author=None,
    title=None,
    created=None,
    score=None,
    num_comments=None,
    thread_id=None,
    thread_url=None,
    query=None,
) -> dict:
    """One cached document, carrying everything the rubric needs to cite it."""
    return {
        "id": f"{source}:{doc_id}",
        "source": source,
        "kind": kind,
        "url": url,
        "title": title,
        "body": (body or "").strip(),
        "author": author,
        "created_utc": iso(created),
        "score": score,
        "num_comments": num_comments,
        "thread_id": f"{source}:{thread_id}" if thread_id is not None else None,
        "thread_url": thread_url,
        "query": query,
        "retrieved_at": datetime.now(timezone.utc)
        .isoformat(timespec="seconds")
        .replace("+00:00", "Z"),
    }


def write_cache(records: list[dict], source: str, out_dir: str) -> str:
    """Merge into today's cache file, so repeated passes with different queries
    accumulate instead of clobbering.

    A record collected again replaces the older copy rather than being dropped.
    A GitHub issue's whole claim to being alive is its comment count, and the
    first pass of the day is the one most likely to be stale.
    """
    day = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    directory = os.path.join(out_dir, day)
    os.makedirs(directory, exist_ok=True)
    path = os.path.join(directory, f"{source}.jsonl")

    merged: dict[str, dict] = {}
    if os.path.exists(path):
        with open(path, encoding="utf-8") as handle:
            for line in handle:
                line = line.strip()
                if line:
                    try:
                        item = json.loads(line)
                        merged[item["id"]] = item
                    except (json.JSONDecodeError, KeyError):
                        continue

    added = 0
    for item in records:
        if item["id"] not in merged:
            added += 1
        merged[item["id"]] = item

    temporary = f"{path}.tmp"
    with open(temporary, "w", encoding="utf-8") as handle:
        for item in merged.values():
            handle.write(json.dumps(item, ensure_ascii=False) + "\n")
    os.replace(temporary, path)

    print(f"  wrote {added} new ({len(records) - added} refreshed) -> {path}")
    return path


def parse_since(value: str) -> int:
    """Turn 30d / 12h / 2w into a unix timestamp cutoff."""
    match = re.fullmatch(r"(\d+)([dhw])", value.strip().lower())
    if not match:
        raise argparse.ArgumentTypeError("use forms like 14d, 48h, 2w")
    amount, unit = int(match.group(1)), match.group(2)
    delta = {"h": timedelta(hours=amount), "d": timedelta(days=amount), "w": timedelta(weeks=amount)}[unit]
    return int((datetime.now(timezone.utc) - delta).timestamp())


class _Stripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts: list[str] = []
        self._skip = False

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self._skip = True
        elif tag in ("p", "br", "li", "div", "blockquote"):
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self._skip = False

    def handle_data(self, data):
        if not self._skip:
            self.parts.append(data)


def strip_html(value: str | None) -> str:
    if not value:
        return ""
    stripper = _Stripper()
    stripper.feed(value)
    text = "".join(stripper.parts)
    return re.sub(r"\n{3,}", "\n\n", re.sub(r"[ \t]+", " ", text)).strip()


# -------------------------------------------------------------- source: hn


HN_PAGE_SIZE = 100


def _hn_record(hit, kind, query) -> dict:
    object_id = hit.get("objectID")
    story_id = hit.get("story_id") or object_id
    body = hit.get("comment_text") or hit.get("story_text") or ""
    return record(
        doc_id=object_id,
        source="hackernews",
        kind=kind,
        url=f"https://news.ycombinator.com/item?id={object_id}",
        title=hit.get("title") or hit.get("story_title"),
        body=strip_html(body) or (hit.get("url") or ""),
        author=hit.get("author"),
        created=hit.get("created_at_i"),
        score=hit.get("points"),
        num_comments=hit.get("num_comments"),
        thread_id=story_id,
        thread_url=f"https://news.ycombinator.com/item?id={story_id}",
        query=query,
    )


def collect_hn(args) -> list[dict]:
    """Hacker News via the Algolia search API. Stories and comments both, since
    the signal is usually in the replies."""
    results: list[dict] = []
    story_ids: list[str] = []
    cutoff = parse_since(args.since)

    for tag in ("story", "comment"):
        page = 0
        collected = 0
        while collected < args.limit:
            params = urllib.parse.urlencode(
                {
                    "query": args.query,
                    "tags": tag,
                    "numericFilters": f"created_at_i>{cutoff}",
                    # Algolia derives each page's offset from hitsPerPage, so
                    # shrinking it on the last request re-reads earlier hits.
                    "hitsPerPage": HN_PAGE_SIZE,
                    "page": page,
                }
            )
            url = f"https://hn.algolia.com/api/v1/search_by_date?{params}"
            print(f"  {tag} page {page}: {url}")
            payload = fetch_json(url)
            hits = payload.get("hits", [])
            if not hits:
                break

            # Walk the whole page and stop on count, rather than slicing to the
            # remaining capacity first. Blank comments are skipped below without
            # incrementing collected, and a slice would spend that capacity
            # anyway, sending us to an older page while newer hits further down
            # this one went unread.
            for hit in hits:
                if collected >= args.limit:
                    break
                is_comment = tag == "comment"
                body = hit.get("comment_text") or hit.get("story_text") or ""
                if is_comment and not body.strip():
                    continue
                if not is_comment:
                    story_ids.append(hit.get("objectID"))
                results.append(
                    _hn_record(hit, "comment" if is_comment else "story", args.query)
                )
                collected += 1

            page += 1
            if page >= payload.get("nbPages", 0):
                break

    results.extend(_hn_replies(story_ids, args.replies, args.query))

    deduped: dict[str, dict] = {}
    for item in results:
        deduped.setdefault(item["id"], item)
    return list(deduped.values())


def _hn_replies(story_ids: list[str], want: int, query: str) -> list[dict]:
    """Pull each matched story's own replies, newest first.

    The comment pass above only finds comments containing the query text. A
    story about the problem usually draws replies that never repeat its
    wording, and those replies are where the method says the demand lives.
    """
    results: list[dict] = []
    if want <= 0:
        return results

    for story_id in story_ids:
        params = urllib.parse.urlencode(
            {"tags": f"comment,story_{story_id}", "hitsPerPage": min(HN_PAGE_SIZE, want)}
        )
        url = f"https://hn.algolia.com/api/v1/search_by_date?{params}"
        print(f"  replies to {story_id}: {url}")
        try:
            payload = fetch_json(url)
        except urllib.error.HTTPError as error:
            print(f"    could not fetch replies: {error}")
            continue
        for hit in payload.get("hits", []):
            if not (hit.get("comment_text") or "").strip():
                continue
            results.append(_hn_record(hit, "comment", query))

    return results


# ------------------------------------------------------- source: discourse


def _discourse_posts(base, detail, topic_id, max_posts, delay) -> list[dict]:
    """Resolve a topic's posts, following post_stream.stream past the first page.

    /t/{id}.json inlines only ~20 posts. Reading just those gives you a long
    thread's OLDEST replies, which reads as a dead thread even when it had one
    this morning. Over max_posts, keep the first post and the newest rest.
    """
    stream = detail.get("post_stream", {}).get("stream", []) or []
    have = {p.get("id"): p for p in detail.get("post_stream", {}).get("posts", [])}

    if not stream:
        return list(have.values())[:max_posts]

    if max_posts <= 1:
        # stream[-0:] is the whole list, so this case cannot go through the
        # branch below.
        wanted = stream[:1]
    elif len(stream) <= max_posts:
        wanted = stream
    else:
        wanted = [stream[0]] + stream[-(max_posts - 1):]
        seen, deduped = set(), []
        for post_id in wanted:
            if post_id not in seen:
                seen.add(post_id)
                deduped.append(post_id)
        wanted = deduped

    missing = [post_id for post_id in wanted if post_id not in have]
    for start in range(0, len(missing), 50):
        chunk = missing[start : start + 50]
        query = "&".join(f"post_ids[]={post_id}" for post_id in chunk)
        url = f"{base}/t/{topic_id}/posts.json?{query}"
        try:
            payload = fetch_json(url, delay=delay)
        except (urllib.error.HTTPError, PermissionError) as error:
            print(f"    could not fetch {len(chunk)} more posts: {error}")
            break
        for post in payload.get("post_stream", {}).get("posts", []):
            have[post.get("id")] = post

    return [have[post_id] for post_id in wanted if post_id in have]


def collect_discourse(args) -> list[dict]:
    """Any Discourse forum via its public JSON endpoints.

    /search.json works but stock Discourse robots.txt disallows /search, so
    this walks latest and category listings and filters titles locally.
    """
    base = args.instance.rstrip("/")
    if not base.startswith("http"):
        base = f"https://{base}"

    listing = f"{base}/c/{args.category}.json" if args.category else f"{base}/latest.json"
    results: list[dict] = []
    needle = args.match.lower() if args.match else None

    topics: list[dict] = []
    page = 0
    while len(topics) < args.limit:
        url = f"{listing}?page={page}"
        print(f"  listing page {page}: {url}")
        payload = fetch_json(url, delay=args.delay)
        batch = payload.get("topic_list", {}).get("topics", [])
        if not batch:
            break
        topics.extend(batch)
        page += 1
        if page > 20:
            break

    for topic in topics[: args.limit]:
        title = topic.get("title") or ""
        if needle and needle not in title.lower():
            continue

        topic_id = topic.get("id")
        slug = topic.get("slug", "")
        topic_url = f"{base}/t/{slug}/{topic_id}"
        print(f"  topic {topic_id}: {title[:70]}")
        try:
            detail = fetch_json(f"{base}/t/{topic_id}.json", delay=args.delay)
        except (urllib.error.HTTPError, PermissionError) as error:
            print(f"    skipped: {error}")
            continue

        posts = _discourse_posts(base, detail, topic_id, args.max_posts, args.delay)
        # posts_count counts the opener, and the rubric rejects zero-reply
        # threads, so a lone topic must not read as one comment.
        total = detail.get("posts_count")
        replies = max(0, total - 1) if isinstance(total, int) else None
        for post in posts:
            number = post.get("post_number", 1)
            results.append(
                record(
                    doc_id=post.get("id"),
                    source="discourse",
                    kind="topic" if number == 1 else "reply",
                    url=f"{topic_url}/{number}",
                    title=title if number == 1 else None,
                    body=strip_html(post.get("cooked")),
                    author=post.get("username"),
                    created=post.get("created_at"),
                    score=post.get("score"),
                    num_comments=replies,
                    thread_id=topic_id,
                    thread_url=topic_url,
                    query=args.match,
                )
            )

    return results


# ---------------------------------------------------------- source: github


def collect_github(args) -> list[dict]:
    """Open GitHub issues via the gh CLI.

    gh rather than raw REST because unauthenticated GitHub is 60 requests an
    hour, and this way the script never touches a token. Closed issues do not
    prove unmet demand, so is:open is forced in.
    """
    if not shutil.which("gh"):
        raise SetupRequired(
            "the GitHub collector needs the gh CLI, which is not installed.\n"
            "  Install it from https://cli.github.com/ then run: gh auth login\n"
            "  The hn and discourse collectors need no setup and work without it."
        )
    auth = subprocess.run(["gh", "auth", "status"], capture_output=True, text=True)
    if auth.returncode != 0:
        raise SetupRequired(
            "gh is installed but not authenticated.\n"
            "  Run: gh auth login\n"
            "  The hn and discourse collectors need no setup and work without it."
        )

    query = args.query
    if "is:open" not in query:
        query = f"{query} is:open"
    if "is:issue" not in query and "is:pr" not in query:
        query = f"{query} is:issue"

    fields = "number,title,body,url,createdAt,author,commentsCount,repository"
    command = [
        "gh", "search", "issues", query,
        "--limit", str(args.limit),
        "--json", fields,
        "--sort", "created",
        "--order", "desc",
    ]
    print(f"  gh search issues {query!r} --limit {args.limit}")
    completed = subprocess.run(command, capture_output=True, text=True)
    if completed.returncode != 0:
        print(f"  gh failed: {completed.stderr.strip()}")
        return []

    results = []
    for issue in json.loads(completed.stdout or "[]"):
        repo = (issue.get("repository") or {}).get("nameWithOwner", "?")
        number = issue.get("number")
        issue_id = f"{repo}#{number}"
        count = issue.get("commentsCount") or 0
        results.append(
            record(
                doc_id=issue_id,
                source="github",
                kind="issue",
                url=issue.get("url"),
                title=issue.get("title"),
                body=issue.get("body") or "",
                author=(issue.get("author") or {}).get("login"),
                created=issue.get("createdAt"),
                num_comments=count,
                thread_id=issue_id,
                thread_url=issue.get("url"),
                query=query,
            )
        )
        if count and args.comments:
            results.extend(
                _github_comments(repo, number, issue_id, issue.get("url"), count, args.comments)
            )
    return results


def _github_comments(repo, number, issue_id, issue_url, count, want) -> list[dict]:
    """Cache an issue's most recent comments.

    Without these the cache holds a count and no dates, so an issue older than
    the rubric's recency window cannot be shown to be alive from the cache
    alone. That forces the assistant to drop a live issue or guess at its
    activity, which is the fabrication this whole script exists to prevent.
    """
    # Comments come back oldest first, so the newest are on the last page. That
    # page can hold as little as one comment, so walk backwards until we have
    # enough rather than assuming one page covers `want`.
    comments: list[dict] = []
    page = max(1, -(-count // 100))
    while page >= 1 and len(comments) < want:
        path = f"repos/{repo}/issues/{number}/comments?per_page=100&page={page}"
        completed = subprocess.run(["gh", "api", path], capture_output=True, text=True)
        if completed.returncode != 0:
            print(f"    could not fetch comments for {issue_id}: {completed.stderr.strip()[:120]}")
            break
        try:
            batch = json.loads(completed.stdout or "[]")
        except json.JSONDecodeError:
            break
        if not batch:
            break
        comments = batch + comments
        page -= 1

    return [
        record(
            doc_id=f"{issue_id}-c{comment.get('id')}",
            source="github",
            kind="comment",
            url=comment.get("html_url"),
            body=comment.get("body") or "",
            author=(comment.get("user") or {}).get("login"),
            created=comment.get("created_at"),
            thread_id=issue_id,
            thread_url=issue_url,
        )
        for comment in comments[-want:]
    ]


# ------------------------------------------------------------------------ cli


def main() -> int:
    parser = argparse.ArgumentParser(
        prog="collect.py",
        description="Retrieve discussion into a local cache for Signal's method.",
    )
    parser.add_argument("--out", default="cache", help="cache directory (default: cache)")
    subparsers = parser.add_subparsers(dest="source", required=True)

    hn = subparsers.add_parser("hn", help="Hacker News via Algolia")
    hn.add_argument("--query", required=True)
    hn.add_argument("--since", default="30d", help="14d, 48h, 2w (default: 30d)")
    hn.add_argument("--limit", type=int, default=100, help="per kind (default: 100)")
    hn.add_argument(
        "--replies",
        type=int,
        default=20,
        help="newest replies to pull per matched story, 0 to skip (default: 20)",
    )
    hn.set_defaults(func=collect_hn, name="hackernews")

    discourse = subparsers.add_parser("discourse", help="any Discourse forum")
    discourse.add_argument("--instance", required=True, help="e.g. meta.discourse.org")
    discourse.add_argument("--category", help="category slug/id, else /latest")
    discourse.add_argument("--match", help="only topics whose title contains this")
    discourse.add_argument("--limit", type=int, default=30, help="topics (default: 30)")
    discourse.add_argument("--max-posts", type=int, default=50, help="posts per topic")
    discourse.add_argument("--delay", type=float, default=DEFAULT_DELAY)
    discourse.set_defaults(func=collect_discourse, name="discourse")

    github = subparsers.add_parser("github", help="open issues via the gh CLI")
    github.add_argument("--query", required=True, help="gh search syntax")
    github.add_argument("--limit", type=int, default=50)
    github.add_argument(
        "--comments",
        type=int,
        default=10,
        help="most recent comments to cache per issue, 0 to skip (default: 10)",
    )
    github.set_defaults(func=collect_github, name="github")

    args = parser.parse_args()

    print(f"collecting from {args.name}...")
    try:
        results = args.func(args)
    except SetupRequired as error:
        print(f"\nsetup needed: {error}", file=sys.stderr)
        return 3
    except PermissionError as error:
        print(f"\nrefused: {error}", file=sys.stderr)
        return 2
    except urllib.error.HTTPError as error:
        print(f"\nHTTP {error.code} from {error.url}", file=sys.stderr)
        return 1

    if not results:
        print("  nothing found. Widen the query or the time window.")
        return 0

    write_cache(results, args.name, args.out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
