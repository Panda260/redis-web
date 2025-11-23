# Redis Messages Manager

A lightweight browser UI to manage the `messages` hash in Redis. Enter your Redis REST endpoint (for example Upstash or Webdis), authenticate, and edit hash fields directly from GitHub Pages.

## Features
- Connect with URL, port, protocol (http/https), username, and password/token.
- Lists fields from the `messages` hash with inline editing and deletion.
- Add new key/value pairs.
- Search filter plus prefix-based categories (e.g., all `clan.*` fields together).
- Connection info saved locally in the browser.

## How it works
The page sends Redis commands over HTTP using the REST interface. The endpoint must accept JSON bodies like `{ "command": ["HGETALL", "messages"] }` and respond with `{ "result": ... }`.

> **Tip:** Upstash and Webdis both expose compatible HTTP endpoints. Ensure CORS is enabled for GitHub Pages to reach your Redis endpoint. When the site is served over HTTPS, browsers will block HTTP endpoints (mixed content), so prefer https or open the UI locally over http.

## Local development
No build tooling is required—open `index.html` in a modern browser. For local testing against HTTPS endpoints you may need to run a small static server (e.g., `python -m http.server 8000`).

## Nutzung
1. Öffne die Seite (lokal oder via GitHub Pages).
2. Wähle im Dropdown das Protokoll (`http` oder `https`). Der Port-Platzhalter passt sich an (80/443), du kannst aber jeden Port eintragen.
3. Gib Host/URL, Port, Benutzername und Passwort/Token ein. Die Daten bleiben nur in deinem Browser gespeichert.
4. Verbinde dich, warte auf "Connected", und bearbeite dann die Einträge im `messages`-Hash. Kategorien entstehen automatisch über den Präfix vor dem ersten Punkt (z.B. `clan.*`).

> Mixed Content: Wenn die Seite über HTTPS geladen wird, müssen Requests ebenfalls HTTPS nutzen. Für reine HTTP-Endpunkte die Seite lokal oder über eine HTTP-Hosting-URL öffnen.

## Deployment (GitHub Pages)
Eine GitHub-Actions-Workflow-Datei liegt unter `.github/workflows/deploy.yml`. Pushes auf `main` oder `work` bauen und veröffentlichen die statische Seite automatisch als GitHub Pages.

So aktivierst du Pages:
1. Repo zu GitHub pushen.
2. In den Repository-Einstellungen GitHub Pages für die vom Workflow angelegte `github-pages`-Umgebung aktivieren.
3. Die veröffentlichte URL steht im Workflow-Summary.

### Troubleshooting Deployment-404
Wenn `Failed to create deployment (status: 404)` auftaucht:
- Prüfe, ob Pages in den Repository-Einstellungen aktiviert ist.
- Kontrolliere, dass die Umgebung `github-pages` existiert (wird beim ersten Lauf angelegt).
- Workflow nach der Aktivierung erneut ausführen – danach sollte der Deploy ohne Merge-Konflikte durchlaufen.

## Docker Image via GHCR
Das Repository kann als Docker-Image auf GitHub Container Registry (GHCR) gebaut werden. Der Workflow `.github/workflows/ghcr-image.yml` pusht bei Änderungen auf `main` automatisch nach `ghcr.io/<OWNER>/redis-web`.

### Lokales Bauen
```bash
docker build -t ghcr.io/<OWNER>/redis-web:local .
docker run --rm -p 8080:80 ghcr.io/<OWNER>/redis-web:local
```

Die Seite ist danach unter http://localhost:8080 erreichbar.

### Image aus GHCR nutzen
```bash
docker pull ghcr.io/<OWNER>/redis-web:latest
docker run --rm -p 8080:80 ghcr.io/<OWNER>/redis-web:latest
```

Ersetze `<OWNER>` durch den GitHub-Nutzer oder die Organisation des Repositories. Mit Tags aus Branch- oder Release-Namen kannst du auch bestimmte Stände ziehen (siehe Workflow-Definition für die vergebenen Tags).
