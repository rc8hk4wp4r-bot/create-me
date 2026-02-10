from __future__ import annotations

import sqlite3
from datetime import date, timedelta
from pathlib import Path

from flask import Flask, g, redirect, render_template, request, url_for

BASE_DIR = Path(__file__).parent
DATABASE = BASE_DIR / "habits.db"

app = Flask(__name__)


def get_db() -> sqlite3.Connection:
    if "db" not in g:
        conn = sqlite3.connect(DATABASE)
        conn.row_factory = sqlite3.Row
        g.db = conn
    return g.db


@app.teardown_appcontext
def close_db(_error: Exception | None) -> None:
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db() -> None:
    db = get_db()
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
    db.commit()


def list_habits() -> list[sqlite3.Row]:
    db = get_db()
    return db.execute("SELECT id, name, description FROM habits ORDER BY id DESC").fetchall()


def last_7_dates() -> list[str]:
    today = date.today()
    return [(today - timedelta(days=offset)).isoformat() for offset in range(6, -1, -1)]


@app.route("/")
def index():
    habits = list_habits()
    dates = last_7_dates()

    db = get_db()
    rows = db.execute(
        """
        SELECT habit_id, log_date, completed
        FROM habit_logs
        WHERE log_date BETWEEN ? AND ?
        """,
        (dates[0], dates[-1]),
    ).fetchall()

    log_map = {(row["habit_id"], row["log_date"]): bool(row["completed"]) for row in rows}
    return render_template("index.html", habits=habits, dates=dates, log_map=log_map, today=date.today().isoformat())


@app.route("/habits", methods=["POST"])
def create_habit():
    name = request.form.get("name", "").strip()
    description = request.form.get("description", "").strip()
    if name:
        db = get_db()
        db.execute("INSERT INTO habits (name, description) VALUES (?, ?)", (name, description))
        db.commit()
    return redirect(url_for("index"))


@app.route("/habits/<int:habit_id>/edit", methods=["POST"])
def edit_habit(habit_id: int):
    name = request.form.get("name", "").strip()
    description = request.form.get("description", "").strip()
    if name:
        db = get_db()
        db.execute(
            "UPDATE habits SET name = ?, description = ? WHERE id = ?",
            (name, description, habit_id),
        )
        db.commit()
    return redirect(url_for("index"))


@app.route("/habits/<int:habit_id>/delete", methods=["POST"])
def delete_habit(habit_id: int):
    db = get_db()
    db.execute("DELETE FROM habits WHERE id = ?", (habit_id,))
    db.commit()
    return redirect(url_for("index"))


@app.route("/habits/<int:habit_id>/toggle", methods=["POST"])
def toggle_habit(habit_id: int):
    target_date = request.form.get("log_date", date.today().isoformat())
    completed = 1 if request.form.get("completed") == "1" else 0

    db = get_db()
    db.execute(
        """
        INSERT INTO habit_logs (habit_id, log_date, completed)
        VALUES (?, ?, ?)
        ON CONFLICT(habit_id, log_date)
        DO UPDATE SET completed=excluded.completed
        """,
        (habit_id, target_date, completed),
    )
    db.commit()
    return ("", 204)


if __name__ == "__main__":
    with app.app_context():
        init_db()
    app.run(debug=True)
