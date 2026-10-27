#!/usr/bin/env python3
"""
Scrape Robot Combat Events (RCE) for events that match the term “Australia”.
The script is intended to run daily via a GitHub Action and write the
filtered results to data/events.json.
"""

import json
import re
import sys
from datetime import datetime
from pathlib import Path

import requests
from bs4 import BeautifulSoup

# --------------------------------------------------------------------------- #
# CONFIGURATION
# --------------------------------------------------------------------------- #
BASE_URL   = "https://www.robotcombatevents.com"
SEARCH_URL = (
    f"{BASE_URL}/searches?"
    "search%5Bcategory%5D=address&"
    "search%5Bterms%5D=Australia&"
    "search%5Btype_id%5D=&"
    "search%5Bpast_events%5D=0&"
    "commit=Find+Events"
)

OUTPUT_PATH = Path("data/events.json")   # relative to repo root


# --------------------------------------------------------------------------- #
# HELPER: fetch and parse a page
# --------------------------------------------------------------------------- #
def fetch_page(url: str) -> BeautifulSoup:
    """Download ``url`` and return a BeautifulSoup object."""
    try:
        r = requests.get(url, timeout=15)
        r.raise_for_status()
        return BeautifulSoup(r.text, "html.parser")
    except Exception as exc:
        raise RuntimeError(f"Could not fetch {url!r}: {exc}") from exc


# --------------------------------------------------------------------------- #
# HELPER: turn a raw date string into ISO‑8601 (fallback to original)
# --------------------------------------------------------------------------- #
def parse_date(raw: str) -> str:
    """
    RCE date strings are typically like “12 Sep 2024”.  If parsing fails we
    keep the original text so the front‑end can still display something.
    """
    for fmt in ("%d %b %Y", "%d %B %Y"):
        try:
            dt = datetime.strptime(raw.strip(), fmt)
            return dt.isoformat()
        except ValueError:
            continue
    return raw.strip()   # fallback


# --------------------------------------------------------------------------- #
# HELPER: extract an event from a single “result” card
# --------------------------------------------------------------------------- #
def parse_event(card) -> dict:
    """
    The search results use the same markup as the main listing:
      • .event-title       – event name
      • a[href]            – link to the event page (relative)
      • .event-date        – date string
      • .event-location    – location string
    Adjust selectors if RCE changes its HTML.
    """
    title_el = card.select_one(".event-title")
    link_el  = card.select_one("a[href]")
    date_el  = card.select_one(".event-date")
    loc_el   = card.select_one(".event-location")

    if not (title_el and link_el and date_el):
        raise ValueError("Missing expected fields in a result card")

    title = title_el.get_text(strip=True)
    url   = BASE_URL + link_el["href"]
    date  = parse_date(date_el.get_text())
    loc   = loc_el.get_text(strip=True) if loc_el else ""

    return {
        "title": title,
        "url": url,
        "date": date,
        "location": loc,
        "registered": False   # UI can flip later
    }


# --------------------------------------------------------------------------- #
# MAIN SCRAPER LOGIC
# --------------------------------------------------------------------------- #
def scrape():
    soup = fetch_page(SEARCH_URL)

    # The results are wrapped in elements with class “event-card”.
    # If the site uses a different wrapper, change the selector accordingly.
    cards = soup.select(".event-card")
    if not cards:
        raise RuntimeError("No event cards found – selector may be outdated")

    events = [parse_event(card) for card in cards]

    # Sort chronologically (ISO dates sort correctly)
    events.sort(key=lambda e: e["date"])

    # Ensure the output directory exists
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    # Write pretty‑printed JSON
    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(events, f, indent=2, ensure_ascii=False)

    print(f"Wrote {len(events)} Australian events to {OUTPUT_PATH}")


# --------------------------------------------------------------------------- #
# ENTRY POINT
# --------------------------------------------------------------------------- #
if __name__ == "__main__":
    try:
        scrape()
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)