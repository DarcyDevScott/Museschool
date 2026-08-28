# Museschool MCP server

Lets Claude read and change your Museschool plan while you talk to it normally.

MCP runs the opposite way round from an embedded chatbot. Nothing is added
*inside* the web app, and there is no API key and no per-message cost. Instead
this server hands your own data to whichever Claude you already use, so you can
say "this week fell apart, my daughter was ill and I've done nothing since
Tuesday" and have tomorrow's plan actually reflect it.

## What Claude can do

| Tool | What it does |
|---|---|
| `get_overview` | Plan, keystones, attachment reading, scores, streak, completion |
| `get_day` | One day's tasks, notes and check-in |
| `get_recent` | The last N days of completion, mood, energy and journal — what is *actually* happening |
| `search_tasks` | Find real tasks in the library to add |
| `adjust_plan` | Leave a note, ease a day, add or drop a task, refocus the drills |
| `list_adjustments` | What is already in force |
| `remove_adjustment` | Undo one |
| `add_journal_entry` | Write something into the journal you read back |

It **never rewrites the plan itself**. Every change is a separate, dated,
attributed adjustment carrying the reason — visible under **You → Changes** in
the app, and undoable there with one tap. Your answers, your log and the
generated twelve weeks are read-only to it.

## Setting it up

The server works on one backup file, which is also how the app gets data in and
out. Save one from **You → Backup** and put it somewhere both can reach —
your iCloud Drive folder is a good choice.

```bash
npm install          # once, in the repo
```

**Claude Desktop** — add to `claude_desktop_config.json`
(macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "museschool": {
      "command": "node",
      "args": ["/absolute/path/to/Museschool/mcp/server.mjs"],
      "env": {
        "MUSESCHOOL_FILE": "~/Library/Mobile Documents/com~apple~CloudDocs/backup.json"
      }
    }
  }
}
```

**Claude Code** — same shape in `.mcp.json`, or:

```bash
claude mcp add museschool -e MUSESCHOOL_FILE=/path/to/museschool-backup.json \
  -- node /absolute/path/to/Museschool/mcp/server.mjs
```

Restart the client. Ask *"what does my Museschool plan say for today?"* to check.

## Getting changes back into the app

The server writes to the file. How the app picks that up depends where you are:

- **Desktop Chrome or Edge** — turn on *Keep a file updated automatically* and
  point it at the same file. Reload the app and the changes are there.
- **iPhone** — open **You → Backup → Restore from a file** and pick it. One tap,
  but manual: Safari cannot read a file on its own, and there is no server in
  this design to poll.

One caveat worth knowing: if the app's auto-save and this server both write the
same file, the last writer wins. In practice make changes in one place at a
time, or reload the app after a conversation before doing more in it.

## What it is not

It is not an LLM and holds no key — it exposes your data to a Claude you are
already talking to. It cannot see anything except the file you point it at, and
it runs on your machine.
