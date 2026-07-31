#!/usr/bin/env python3
"""Retrieve raw discussion into a local cache, so the model never has to fetch.

Signal's method has one structural weakness: retrieval and judgment are welded
together in a single prompt, so whether an assistant can reach a page decides
whether the method can clear its own evidence bar. When it cannot reach the
page, the failure is silent. You get a confident, well-formed batch built on
search snippets and recall.

This script splits the two. Python does retrieval into a local JSONL cache with
real timestamps taken from each API. The model then reads the cache and does
discrimination against method/RUBRIC.md. Dates come from the source, not from
the model's reading of a page, which structurally removes the single most
common fabrication.

Standard library only. No pip install, no virtualenv, no API keys.

    python3 collector/collect.py hn --query "invoice" --since 30d
    python3 collector/collect.py discourse --instance meta.discourse.org
    python3 collector/collect.py github --query "org:foo is:open label:bug"

Every record lands in cache/<YYYY-MM-DD>/<source>.jsonl. See collector/README.md
for the record shape and for what each source is good for.
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

# Minimum seconds between requests to the same host. Deliberately unhurried.
# Nothing here is time critical, and a collector that hammers a volunteer run
# forum is a collector that gets the whole project blocked.
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
    """Check url against the host's robots.txt for our user agent.

    A host that does not serve robots.txt is treated as allowing everything,
    which is the documented default. A host we cannot reach at all is treated
    as disallowed, because guessing in the permissive direction is how you end
    up scraping something that asked you not to.
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
    """One cached document. Every field the RUBRIC needs to verify a citation."""
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
    """Append to today's cache file, skipping ids already present.

    Re-running a collector is safe and additive. That matters because a real
    hunt is several passes with different queries, and you want the union.
    """
    day = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    directory = os.path.join(out_dir, day)
    os.makedirs(directory, exist_ok=True)
    path = os.path.join(directory, f"{source}.jsonl")

    seen = set()
    if os.path.exists(path):
        with open(path, encoding="utf-8") as handle:
            for line in handle:
                line = line.strip()
                if line:
                    try:
                        seen.add(json.loads(line)["id"])
                    except (json.JSONDecodeError, KeyError):
                        continue

    added = 0
    with open(path, "a", encoding="utf-8") as handle:
        for item in records:
            if item["id"] in seen:
                continue
            seen.add(item["id"])
            handle.write(json.dumps(item, ensure_ascii=False) + "\n")
            added += 1

    print(f"  wrote {added} new ({len(records) - added} already cached) -> {path}")
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


def collect_hn(args) -> list[dict]:
    """Hacker News via the Algolia search API. No auth, real timestamps.

    Comments carry the signal, so this pulls both stories and comments and
    keeps the story linkage on each comment for citation.
    """
    results: list[dict] = []
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
                    "hitsPerPage": min(100, args.limit - collected),
                    "page": page,
                }
            )
            url = f"https://hn.algolia.com/api/v1/search_by_date?{params}"
            print(f"  {tag} page {page}: {url}")
            payload = fetch_json(url, respect_robots=False)
            hits = payload.get("hits", [])
            if not hits:
                break

            for hit in hits:
                object_id = hit.get("objectID")
                is_comment = tag == "comment"
                body = hit.get("comment_text") or hit.get("story_text") or ""
                if is_comment and not body.strip():
                    continue
                story_id = hit.get("story_id") or object_id
                results.append(
                    record(
                        doc_id=object_id,
                        source="hackernews",
                        kind="comment" if is_comment else "story",
                        url=f"https://news.ycombinator.com/item?id={object_id}",
                        title=hit.get("title") or hit.get("story_title"),
                        body=strip_html(body) or (hit.get("url") or ""),
                        author=hit.get("author"),
                        created=hit.get("created_at_i"),
                        score=hit.get("points"),
                        num_comments=hit.get("num_comments"),
                        thread_id=story_id,
                        thread_url=f"https://news.ycombinator.com/item?id={story_id}",
                        query=args.query,
                    )
                )
                collected += 1

            page += 1
            if page >= payload.get("nbPages", 0):
                break

    return results


# ------------------------------------------------------- source: discourse


def _discourse_posts(base, detail, topic_id, max_posts, delay) -> list[dict]:
    """Resolve a topic's posts, following post_stream.stream past the first page.

    /t/{id}.json only inlines the first ~20 posts. The complete ordered list of
    post ids lives in post_stream.stream, and anything beyond the first window
    has to be requested from /t/{id}/posts.json. Skipping that quietly capped
    every topic at 20 posts, which is the worst possible 20: a long thread's
    OLDEST replies. The rubric needs the newest activity to judge whether a
    discussion is live, so a stale window does not just lose data, it produces
    confidently wrong recency calls.

    When a topic is longer than max_posts, keep the first post (the actual ask)
    and the most recent ones (the proof it is still alive) rather than an
    arbitrary leading slice.
    """
    stream = detail.get("post_stream", {}).get("stream", []) or []
    have = {p.get("id"): p for p in detail.get("post_stream", {}).get("posts", [])}

    if not stream:
        return list(have.values())[:max_posts]

    if len(stream) <= max_posts:
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

    Probably the most untapped vector available. Every Discourse instance
    exposes /latest.json and /t/{id}.json publicly, and a lot of trade and
    niche communities run Discourse without anyone thinking of them as APIs.

    Note the deliberate omission: /search.json works, but stock Discourse
    robots.txt disallows /search, so this walks latest and category listings
    instead. Filter by keyword locally.
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
                    num_comments=detail.get("posts_count"),
                    thread_id=topic_id,
                    thread_url=topic_url,
                    query=args.match,
                )
            )

    return results


# ---------------------------------------------------------- source: github


def collect_github(args) -> list[dict]:
    """Open GitHub issues via the gh CLI, which is already authenticated.

    gh is used rather than the raw REST API on purpose: unauthenticated GitHub
    is 60 requests an hour, which is unusable, and gh already holds a token
    without this script ever touching a credential.

    The RUBRIC only counts OPEN issues as evidence of unmet demand, so is:open
    is forced into the query.
    """
    # Distinguish "you have not set this up" from "there was nothing to find".
    # Both used to print a bare message and exit 0, which reads as a broken
    # collector rather than an unconfigured optional dependency.
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
        results.append(
            record(
                doc_id=f"{repo}#{issue.get('number')}",
                source="github",
                kind="issue",
                url=issue.get("url"),
                title=issue.get("title"),
                body=issue.get("body") or "",
                author=(issue.get("author") or {}).get("login"),
                created=issue.get("createdAt"),
                num_comments=issue.get("commentsCount"),
                thread_url=issue.get("url"),
                query=query,
            )
        )
    return results


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
