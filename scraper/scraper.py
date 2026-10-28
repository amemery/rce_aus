#!/usr/bin/env python3
"""
Scrape Robot Combat Events (RCE) for Australian events and write them to
data/events.json. Runs daily via .github/workflows/scrape.yml.

Registration state lives separately in data/registered.json (edited from the
site's admin mode), so this script never overwrites it.
"""

import json
import re
import sys
import time
from datetime import datetime
from pathlib import Path

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.robotcombatevents.com"
SEARCH_URL = (
    f"{BASE_URL}/searches?"
    "search%5Bcategory%5D=address&"
    "search%5Bterms%5D=Australia&"
    "search%5Btype_id%5D=&"
    "search%5Bpast_events%5D=0&"
    "commit=Find+Events"
)
OUTPUT_PATH = Path("data/events.json")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}

# Location must look Australian (country name or a state/territory code).
AU_LOCATION = re.compile(r"\b(Australia|ACT|NSW|NT|QLD|SA|TAS|VIC|WA)\b")
RETRY_STATUS = {403, 429, 500, 502, 503, 504}


def fetch_page_text(url: str, retries: int = 3, backoff: int = 2) -> str:
    """GET url, retrying on bot-block/5xx statuses and network errors."""
    last_exc = None
    for attempt in range(1, retries + 1):
        try:
            r = requests.get(url, headers=HEADERS, timeout=15)
            if r.status_code in RETRY_STATUS and attempt < retries:
                time.sleep(backoff * attempt)
                continue
            r.raise_for_status()
            return r.text
        except (requests.ConnectionError, requests.Timeout) as exc:
            last_exc = exc
            if attempt < retries:
                time.sleep(backoff * attempt)
                continue
        except requests.HTTPError as exc:
            last_exc = exc
            break
    raise RuntimeError(f"Could not fetch {url!r}: {last_exc}")


def parse_date(raw: str) -> str:
    """RCE is a US site and uses MM/DD/YYYY. Return YYYY-MM-DD (date only,
    so browsers don't shift it by timezone). Falls back to the raw string."""
    raw = raw.strip()
    try:
        return datetime.strptime(raw, "%m/%d/%Y").date().isoformat()
    except ValueError:
        print(f"WARNING: unrecognised date format {raw!r}", file=sys.stderr)
        return raw


def scrape() -> None:
    soup = BeautifulSoup(fetch_page_text(SEARCH_URL), "html.parser")

    events = []
    for row in soup.select("tr.search-tr"):
        cols = row.select("td")
        if len(cols) < 3:
            continue

        link_el = cols[1].select_one("a[href]")
        if not link_el:
            continue

        location = cols[2].get_text(" ", strip=True)
        if not AU_LOCATION.search(location):
            continue

        events.append({
            "title": link_el.get_text(strip=True),
            "url": requests.compat.urljoin(BASE_URL, link_el["href"]),
            "date": parse_date(cols[0].get_text(strip=True)),
            "location": location,
        })

    events.sort(key=lambda e: e["date"])

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8", newline="\n") as f:
        json.dump(events, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"Wrote {len(events)} Australian events to {OUTPUT_PATH}")


if __name__ == "__main__":
    try:
        scrape()
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
