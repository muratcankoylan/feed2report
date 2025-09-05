# Feed2Brain

> This is incredible. A one‑click feed → report flow that extracts a post, formulates a research question, runs web search, reasons and returns a report in seconds.
>
> 1- Click on the button on the feed and add a query
> 2- groq/compound-mini extracts the post from the url
> 3- kimi-k2-instruct creates the research query
> 4- groq/compound searches the web and uses reasoning to create a VERY good answr in seconds
>
> Any scenario that needs fresh information + on‑the‑fly computation delivered in a single API call.

A one‑click feed → report system for LinkedIn: capture a post, shape a research query, and get a high‑quality answer in seconds. Built with FastAPI + Groq models.

## Quick start

1) Create a virtual env and install deps

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

2) Set environment variables

Create a `.env` file:

```
GROQ_API_KEY=sk_...
```

3) Run the API (LinkedIn pipeline)

```bash
python app2.py
# open http://127.0.0.1:8001/
```

The homepage shows an “endless notebook” UI that loads reports from `/reports`.

## How it works

- Browser extension injects a "Save + Analyze" button on LinkedIn posts (see `extension/`)
- When clicked, it sends `{ url, note }` to the local API
- The server pipeline (`app2.py`) does:
  - `groq/compound-mini` → extracts `post_text` from the given URL
  - `moonshotai/kimi-k2-instruct` → builds a single concise research `query`
  - `groq/compound` → searches + reasons to produce a concise, high‑quality answer
  - Saves `{ timestamp, post_url, user_note, post_text, query, compound_answer }` to `data/reports.jsonl`

## API

- `POST /trigger`

Request body:

```json
{
  "url": "https://www.linkedin.com/feed/update/urn:li:activity:...",
  "note": "analyze the company and founders"
}
```

- `GET /reports` → returns an array of saved reports (JSON)
- `GET /` → minimal notebook UI

## Notes

- Requires a Groq API key (`GROQ_API_KEY`) in `.env`
- Data is persisted as JSONL at `data/reports.jsonl`
- If the UI says “Loading…”, ensure the server is running on 8001 and hard refresh (Cmd+Shift+R)

## Repo

- GitHub: https://github.com/muratcankoylan/Feed2Brain

## License

MIT
