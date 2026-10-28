# rce_aus

Australian events from [Robot Combat Events](https://www.robotcombatevents.com), served as a GitHub Pages site with a calendar and list linking through to each event's RCE page for registration.

## How it works

- `scraper/scraper.py` runs daily via `.github/workflows/scrape.yml` and writes `data/events.json`.
- `data/registered.json` is a list of event URLs you've registered for. The scraper never touches it.
- `data.js` loads both; `calendar.js` and `list.js` render them.

## Tracking registrations

Edit `data/registered.json` on GitHub and add the RCE URL of each event you've registered for, e.g.

```json
["https://www.robotcombatevents.com/events/10025"]
```

Those events show as registered in the list and calendar.

## Running the scraper locally

```sh
pip install -r scraper/requirements.txt
python scraper/scraper.py
```
