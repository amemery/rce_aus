# rce_aus

Australian events from [Robot Combat Events](https://www.robotcombatevents.com), served as a GitHub Pages site with a calendar and list linking through to each event's RCE page for registration.

## How it works

- `scraper/scraper.py` runs daily via `.github/workflows/scrape.yml` and writes `data/events.json`.
- `data/registered.json` is a list of event URLs you've registered for. The scraper never touches it.
- `data.js` loads both; `calendar.js` and `list.js` render them.

## Tracking registrations

Open the site with `?admin` (e.g. `https://amemery.github.io/rce_aus/?admin`). On first use you'll be asked for a GitHub **fine-grained PAT** limited to this repo with **Contents: Read and write**. It's stored in that browser's localStorage only. Toggling an event commits `data/registered.json`. Use `?admin=logout` to forget the token.

Repo/environment secrets can't be used for this – they're only available inside Actions runs, not in the browser.

## Running the scraper locally

```sh
pip install -r scraper/requirements.txt
python scraper/scraper.py
```
