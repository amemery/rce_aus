#!/usr/bin/env python3
"""
Scrape Robot Combat Events (RCE) for events that match the term "Australia".
The script is intended to run daily via a GitHub Action and write the
filtered results to data/events.json.
"""

import json, sys, time
from datetime import datetime
from pathlib import Path

import requests
from bs4 import BeautifulSoup

# ---------------------------------------------------------------------------
# CONFIGURATION
# ---------------------------------------------------------------------------
BASE_URL = "https://www.robotcombatevents.com"
SEARCH_URL = (
    f"{BASE_URL}/searches?"
    "search%5Bcategory%5D=address&"
    "search%5Bterms%5D=Australia&"
    "search%5Btype_id%5D=&"
    "search%5Bpast_events%5D=0&"
    "commit=Find+Events"
)
OUTPUT_PATH = Path("data/events.json")   # relative to repo root

# Use a common browser User‑Agent to avoid simple bot blocks
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}

# ---------------------------------------------------------------------------
# Helper: fetch the raw page text (with simple retry on 403)
# ---------------------------------------------------------------------------
def fetch_page_text(url: str, retries: int = 3, backoff: int = 2) -> str:
    """Return the raw HTML/markdown text of the search page.

    Retries on HTTP 403 (common for bot blocks) with exponential back‑off.
    """
    for attempt in range(1, retries + 1):
        try:
            r = requests.get(url, headers=HEADERS, timeout=15)
            r.raise_for_status()
            return r.text
        except requests.HTTPError as exc:
            if r.status_code == 403 and attempt < retries:
                time.sleep(backoff * attempt)
                continue
            raise RuntimeError(f"Could not fetch {url!r}: {exc}")
        except Exception as exc:
            raise RuntimeError(f"Could not fetch {url!r}: {exc}")

# ---------------------------------------------------------------------------
# Helper: turn a raw date string into ISO‑8601 (fallback to original)
# ---------------------------------------------------------------------------
def parse_date(raw: str) -> str:
    """Convert dates like '12/05/2026' to ISO‑8601.
    If parsing fails we keep the original string.
    """
    for fmt in ("%d/%m/%Y", "%m/%d/%Y"):  # handle both orderings
        try:
            dt = datetime.strptime(raw.strip(), fmt)
            return dt.isoformat()
        except ValueError:
            continue
    return raw.strip()   # fallback

# ---------------------------------------------------------------------------
# MAIN SCRAPER LOGIC
# ---------------------------------------------------------------------------
def scrape():
    # Get the raw HTML page
    page_text = fetch_page_text(SEARCH_URL)
    # NOTE: you can delete the next two lines once you’ve confirmed parsing works
    # print(f"DEBUG page length: {len(page_text)} characters")
    # print("DEBUG snippet:", page_text[:500])

    soup = BeautifulSoup(page_text, "html.parser")
    rows = soup.select("tr.search-tr")

    events = []
    for row in rows:
        cols = row.select("td")
        if len(cols) < 3:
            continue

        raw_date = cols[0].get_text(strip=True)

        link_el = cols[1].select_one("a")
        if not link_el:
            continue
        title = link_el.get_text(strip=True)
        url = BASE_URL + link_el["href"]

        location = cols[2].get_text(strip=True)

        # Keep only Australian events
        if "Australia" not in location:
            continue

        iso_date = parse_date(raw_date)
        events.append({
            "title": title,
            "url": url,
            "date": iso_date,
            "location": location,
            "registered": False,
        })
    # Sort chronologically (ISO dates sort correctly)
    events.sort(key=lambda e: e["date"])

    # Ensure output directory exists and write JSON
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(events, f, indent=2, ensure_ascii=False)

    print(f"Wrote {len(events)} Australian events to {OUTPUT_PATH}")

# ---------------------------------------------------------------------------
# ENTRY POINT
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    try:
        scrape()
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)