# Uppsala Jazz Club Website

This repository contains the source code for the Uppsala Jazz Club website. 

## Structure

* **`index.html`**, **`app.js`**, **`assets/`**: The frontend code for the website, built with HTML, JavaScript, and styled with a custom design system.
* **`data/`**: Contains the JSON data for events, which is fetched from Facebook.
* **`fetcher/`**: Contains a Python script (`fetch_events.py`) and its configuration (`pyproject.toml`) that fetches the latest event data from the Uppsala Jazz Club Facebook page.
* **`.github/workflows/`**: Contains the GitHub Actions workflow (`update-events.yml`) that automatically runs the fetcher script daily to update the `data/events.json` file.

## Facebook Events Integration

The upcoming concerts section on the website is completely automated. A Python script runs daily via GitHub Actions, pulling data from the Uppsala Jazz Club Facebook page and generating a static `data/events.json` file. 

To keep this pipeline running without manual intervention, the repository relies on a **Never-Expiring Page Access Token** from Meta.

### Architecture Flow
1. **GitHub Actions Workflow** triggers every night (and can be manually triggered).
2. The workflow executes `fetch_events.py`, injecting the `FB_PAGE_ACCESS_TOKEN` secret.
3. The script fetches upcoming events via the **Facebook Graph API** (`/v20.0/{page-id}/events`).
4. If changes are detected, the workflow commits the updated `data/events.json` file back to the repo, which automatically pushes the updates live via GitHub Pages.

---

### Required Environment Variables & Secrets
To configure or fix the integration, ensure the following secret is set in the repository under **Settings > Secrets and variables > Actions**:

*   `FB_PAGE_ACCESS_TOKEN`: The long-lived, non-expiring Meta Page Access Token.

*Note: Because this application is purely internal and used by the Page Admin, it runs in **Standard Access** mode. You do **not** need to submit the Meta App for App Review or get Business Verification.*

---

### Maintenance: How to Regenerate the Token
If the token is ever compromised, deleted, or revoked, follow these high-level steps to replace it:

1. **Permissions:** Ensure your personal Facebook account is an Admin of the Uppsala Jazz Club Facebook Page.
2. **Meta App:** Log into [Meta for Developers](https://developers.facebook.com/) and ensure you have a Business/Other app set up with the **`pages_read_engagement`** permission enabled under the *"Manage everything on your Page"* use case.
3. **Generate Short-Lived Token:** Go to the **Graph API Explorer** tool, select your app, and click *Get User Access Token*. 
4. **Extend Token:** Take that temporary token to the **Access Token Debugger** tool and click *Extend Access Token* to turn it into a 60-day token.
5. **Extract Permanent Token:** Take the 60-day token back to the Graph API Explorer and run a `GET` request to `me/accounts`. Find the Uppsala Jazz Club entry in the JSON response—the `access_token` listed *inside* that specific block is your **permanent page token**.
6. **Verify:** Paste that final token back into the Access Token Debugger. The **Expires** field must say **"Never"**.
7. **Update GitHub:** Save this new token as `FB_PAGE_ACCESS_TOKEN` in your GitHub repository secrets.

---

### Running the Fetcher Locally
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
4. Run the script from the root directory so the website data is updated properly:
   ```bash
   # Default: fetch upcoming events
   uv run --env-file .env --project fetcher fetcher/fetch_events.py
   
   # Optional: fetch historical events since a date (merges into existing data)
   uv run --env-file .env --project fetcher fetcher/fetch_events.py --since 2024-01-01
   ```

## Local Development

To test the website locally, you must serve it through a local web server (opening the HTML files directly in your browser will prevent the shared header/footer components from loading due to browser security policies).

1. Navigate to the `website/` directory:
   ```bash
   cd website
   ```
2. Start a local Python HTTP server:
   ```bash
   uv run python -m http.server
   ```
3. Open your browser and navigate to `http://localhost:8000`.
