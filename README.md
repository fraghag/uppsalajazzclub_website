# Uppsala Jazz Club Website

This repository contains the source code for the Uppsala Jazz Club website. 

## Structure

* **`index.html`**, **`app.js`**, **`assets/`**: The frontend code for the website, built with HTML, JavaScript, and styled with a custom design system.
* **`data/`**: Contains the JSON data for events, which is fetched from Facebook.
* **`fetcher/`**: Contains a Python script (`fetch_events.py`) and its configuration (`pyproject.toml`) that fetches the latest event data from the Uppsala Jazz Club Facebook page.
* **`.github/workflows/`**: Contains the GitHub Actions workflow (`update-events.yml`) that automatically runs the fetcher script daily to update the `data/events.json` file.

## Event Fetcher

The events are fetched automatically via a GitHub Action every day at 03:00 UTC. 

To run the fetcher locally:

1. Ensure you have Python 3.10+ installed.
2. Install the required dependencies using `uv`:
   ```bash
   cd fetcher
   uv sync
   ```
3. Set the required environment variables:
   * `FB_PAGE_ACCESS_TOKEN`
   * `FB_PAGE_ID`
4. Run the script from the root directory so the `data/` folder is updated properly:
   ```bash
   uv run --project fetcher fetcher/fetch_events.py
   ```
