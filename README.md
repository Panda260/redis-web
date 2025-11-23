# Redis Messages Manager

A lightweight browser UI to manage the `messages` hash in Redis. Enter your Redis REST endpoint (for example Upstash or Webdis), authenticate, and edit hash fields directly from GitHub Pages.

## Features
- Connect with URL, port, username, and password/token.
- Lists fields from the `messages` hash with inline editing and deletion.
- Add new key/value pairs.
- Search filter plus prefix-based categories (e.g., all `clan.*` fields together).
- Connection info saved locally in the browser.

## How it works
The page sends Redis commands over HTTP using the REST interface. The endpoint must accept JSON bodies like `{ "command": ["HGETALL", "messages"] }` and respond with `{ "result": ... }`.

> **Tip:** Upstash and Webdis both expose compatible HTTP endpoints. Ensure CORS is enabled for GitHub Pages to reach your Redis endpoint.

## Local development
No build tooling is required—open `index.html` in a modern browser. For local testing against HTTPS endpoints you may need to run a small static server (e.g., `python -m http.server 8000`).

## Deployment (GitHub Pages)
A GitHub Actions workflow is included at `.github/workflows/deploy.yml`. On pushes to `main` or `work` it uploads the repository contents and deploys them to GitHub Pages.

To enable Pages:
1. Push the repository to GitHub.
2. In the repository settings, enable GitHub Pages for the `github-pages` environment created by the workflow.
3. The published site will load from the URL printed in the workflow summary.
