from __future__ import annotations

import html
import re
import sqlite3
from datetime import date, timedelta
from pathlib import Path
from urllib.parse import parse_qs
from wsgiref.simple_server import make_server

BASE_DIR = Path(__file__).parent
DATABASE = BASE_DIR / "habits.db"
STATIC_DIR = BASE_DIR / "static"


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    with get_db() as db:
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS habits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT DEFAULT ''
            );

            CREATE TABLE IF NOT EXISTS habit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                habit_id INTEGER NOT NULL,
                log_date TEXT NOT NULL,
                completed INTEGER NOT NULL DEFAULT 0,
                UNIQUE(habit_id, log_date),
                FOREIGN KEY(habit_id) REFERENCES habits(id) ON DELETE CASCADE
            );
            """
        )


def parse_post_body(environ: dict) -> dict[str, str]:
    try:
        body_size = int(environ.get("CONTENT_LENGTH", "0") or "0")
    except ValueError:
        body_size = 0
    body = environ["wsgi.input"].read(body_size).decode("utf-8")
    parsed = parse_qs(body)
    return {k: v[0] if v else "" for k, v in parsed.items()}


def list_habits(db: sqlite3.Connection) -> list[sqlite3.Row]:
    return db.execute("SELECT id, name, description FROM habits ORDER BY id DESC").fetchall()


def last_7_dates() -> list[str]:
    today = date.today()
    return [(today - timedelta(days=offset)).isoformat() for offset in range(6, -1, -1)]


def render_index() -> bytes:
    with get_db() as db:
        habits = list_habits(db)
        dates = last_7_dates()
        rows = db.execute(
            """
            SELECT habit_id, log_date, completed
            FROM habit_logs
            WHERE log_date BETWEEN ? AND ?
            """,
            (dates[0], dates[-1]),
        ).fetchall()

    log_map = {(row["habit_id"], row["log_date"]): bool(row["completed"]) for row in rows}
    today = date.today().isoformat()

    habits_html = []
    for habit in habits:
        habit_id = habit["id"]
        checked = "checked" if log_map.get((habit_id, today), False) else ""
        habit_name = html.escape(habit["name"])
        habit_desc = html.escape(habit["description"] or "")
        habits_html.append(
            f"""
            <li>
              <div class=\"habit-row\">
                <label>
                  <input type=\"checkbox\" data-habit-id=\"{habit_id}\" data-log-date=\"{today}\" {checked} />
                  <strong>{habit_name}</strong>
                  <span>{habit_desc}</span>
                </label>
              </div>
              <div class=\"actions\">
                <details>
                  <summary>編集</summary>
                  <form action=\"/habits/{habit_id}/edit\" method=\"post\" class=\"habit-form\">
                    <input type=\"text\" name=\"name\" value=\"{habit_name}\" required />
                    <input type=\"text\" name=\"description\" value=\"{habit_desc}\" />
                    <button type=\"submit\">保存</button>
                  </form>
                </details>
                <form action=\"/habits/{habit_id}/delete\" method=\"post\">
                  <button type=\"submit\" class=\"danger\">削除</button>
                </form>
              </div>
            </li>
            """
        )

    table_rows = []
    for habit in habits:
        habit_name = html.escape(habit["name"])
        cells = []
        for d in dates:
            cells.append("✅" if log_map.get((habit["id"], d), False) else "—")
        table_rows.append(f"<tr><td>{habit_name}</td>" + "".join(f"<td>{c}</td>" for c in cells) + "</tr>")

    habits_section = (
        "<p>まだ習慣がありません。上のフォームから追加してください。</p>"
        if not habits
        else f"<ul class=\"habit-list\">{''.join(habits_html)}</ul>"
    )
    week_section = (
        "<p>習慣を追加すると週間テーブルが表示されます。</p>"
        if not habits
        else (
            "<table><thead><tr><th>習慣</th>"
            + "".join(f"<th>{d[5:]}</th>" for d in dates)
            + "</tr></thead><tbody>"
            + "".join(table_rows)
            + "</tbody></table>"
        )
    )

    html_doc = f"""<!DOCTYPE html>
<html lang=\"ja\">
  <head>
    <meta charset=\"UTF-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
    <title>習慣トラッカー MVP</title>
    <link rel=\"stylesheet\" href=\"/static/style.css\" />
  </head>
  <body>
    <main class=\"container\">
      <header>
        <h1>習慣トラッカー</h1>
        <p>今日: {today}</p>
      </header>
      <section class=\"card\">
        <h2>習慣を追加</h2>
        <form action=\"/habits\" method=\"post\" class=\"habit-form\">
          <input type=\"text\" name=\"name\" placeholder=\"例: 朝10分読書\" required />
          <input type=\"text\" name=\"description\" placeholder=\"補足（任意）\" />
          <button type=\"submit\">追加</button>
        </form>
      </section>
      <section class=\"card\">
        <h2>習慣一覧 / 今日の達成チェック</h2>
        {habits_section}
      </section>
      <section class=\"card\">
        <h2>直近7日間の達成状況</h2>
        {week_section}
      </section>
    </main>
    <script src=\"/static/app.js\"></script>
  </body>
</html>
"""
    return html_doc.encode("utf-8")


def redirect(start_response, location: str):
    start_response("303 See Other", [("Location", location)])
    return [b""]


def serve_static(path: str, start_response):
    file_path = STATIC_DIR / path
    if not file_path.exists() or not file_path.is_file():
        start_response("404 Not Found", [("Content-Type", "text/plain; charset=utf-8")])
        return [b"Not Found"]

    content_type = "text/plain; charset=utf-8"
    if file_path.suffix == ".css":
        content_type = "text/css; charset=utf-8"
    elif file_path.suffix == ".js":
        content_type = "application/javascript; charset=utf-8"

    start_response("200 OK", [("Content-Type", content_type)])
    return [file_path.read_bytes()]


def app(environ, start_response):
    method = environ["REQUEST_METHOD"]
    path = environ.get("PATH_INFO", "/")

    if method == "GET" and path.startswith("/static/"):
        return serve_static(path.removeprefix("/static/"), start_response)

    if method == "GET" and path == "/":
        body = render_index()
        start_response("200 OK", [("Content-Type", "text/html; charset=utf-8")])
        return [body]

    if method == "POST" and path == "/habits":
        form = parse_post_body(environ)
        name = form.get("name", "").strip()
        description = form.get("description", "").strip()
        if name:
            with get_db() as db:
                db.execute("INSERT INTO habits (name, description) VALUES (?, ?)", (name, description))
        return redirect(start_response, "/")

    edit_match = re.fullmatch(r"/habits/(\d+)/edit", path)
    if method == "POST" and edit_match:
        habit_id = int(edit_match.group(1))
        form = parse_post_body(environ)
        name = form.get("name", "").strip()
        description = form.get("description", "").strip()
        if name:
            with get_db() as db:
                db.execute("UPDATE habits SET name = ?, description = ? WHERE id = ?", (name, description, habit_id))
        return redirect(start_response, "/")

    delete_match = re.fullmatch(r"/habits/(\d+)/delete", path)
    if method == "POST" and delete_match:
        habit_id = int(delete_match.group(1))
        with get_db() as db:
            db.execute("DELETE FROM habits WHERE id = ?", (habit_id,))
        return redirect(start_response, "/")

    toggle_match = re.fullmatch(r"/habits/(\d+)/toggle", path)
    if method == "POST" and toggle_match:
        habit_id = int(toggle_match.group(1))
        form = parse_post_body(environ)
        log_date = form.get("log_date", date.today().isoformat())
        completed = 1 if form.get("completed") == "1" else 0
        with get_db() as db:
            db.execute(
                """
                INSERT INTO habit_logs (habit_id, log_date, completed)
                VALUES (?, ?, ?)
                ON CONFLICT(habit_id, log_date)
                DO UPDATE SET completed=excluded.completed
                """,
                (habit_id, log_date, completed),
            )
        start_response("204 No Content", [])
        return [b""]

    start_response("404 Not Found", [("Content-Type", "text/plain; charset=utf-8")])
    return [b"Not Found"]


if __name__ == "__main__":
    init_db()
    port = 5000
    print(f"Serving on http://127.0.0.1:{port}")
    with make_server("0.0.0.0", port, app) as httpd:
        httpd.serve_forever()
