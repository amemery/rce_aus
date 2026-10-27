#!/usr/bin/env python3
import json, re, sys
import requests
from bs4 import BeautifulSoup
from datetime import datetime

BASE = "https://www.robotcombatevents.com"
LIST_URL = f"{BASE}/events"

def fetch_page(url: str) -> BeautifulSoup:
    r = requests.get(url, timeout=15)
    r.raise_for_status()
    return BeautifulSoup(r.text, "html.parser")

def parse_event(card) -> dict:
    title = card.select_one(".event-title").get_text(strip=True)
    link = BASE + card.select_one("a")["href"]
    date_txt = card.select_one(".event-date").get_text(strip=True)
    # simple date parsing – adjust format if needed
    try:
        date = datetime.strptime(date_txt, "%d %b %Y")
        iso = date.isoformat()
    except ValueError:
        iso = date_txt  # fallback unchanged
    location = card.select_one(".event-location").get_text(strip=True)
    return {
        "title": title,
        "url": link,
        "date": iso,
        "location": location,
        "registered": False   # default, UI can flip later
    }

def is_australian(loc: str) -> bool:
    # crude check – you can extend with more city names or regexes
    return bool(re.search(r"\bAustralia\b|\bAU\b|Sydney|Melbourne|Brisbane|Perth|Adelaide|Canberra|Gold Coast|Newcastle", loc, re.I))

def scrape():
    soup = fetch_page(LIST_URL)
    cards = soup.select(".event-card")          # adjust selector to RCE markup
    events = [e for e in (parse_event(c) for c in cards) if is_australian(e["location"])]
    # sort by date
    events.sort(key=lambda x: x["date"])
    out_path = "data/events.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(events, f, indent=2, ensure_ascii=False)
    print(f"Wrote {len(events)} Australian events to {out_path}")

if __name__ == "__main__":
    try:
        scrape()
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)