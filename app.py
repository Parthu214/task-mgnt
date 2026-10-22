
from flask import Flask, render_template, request, jsonify
import sqlite3

app = Flask(__name__)
DATABASE = "tasks.db"


def get_db():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_db():
    with get_db() as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                completed INTEGER DEFAULT 0
            )
        """)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    with get_db() as db:
        tasks = db.execute(
            "SELECT * FROM tasks ORDER BY id DESC"
        ).fetchall()
    return jsonify([dict(task) for task in tasks])


@app.route("/api/tasks", methods=["POST"])
def add_task():
    data = request.get_json(silent=True) or {}
    title = str(data.get("title", "")).strip()

    if not title:
        return jsonify({"error": "Task title is required"}), 400

    if len(title) > 200:
        return jsonify({"error": "Task title is too long"}), 400

    with get_db() as db:
        cursor = db.execute(
            "INSERT INTO tasks (title) VALUES (?)",
            (title,)
        )
        task_id = cursor.lastrowid

    return jsonify({
        "id": task_id,
        "title": title,
        "completed": 0
    }), 201


@app.route("/api/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    data = request.get_json(silent=True) or {}

    with get_db() as db:
        task = db.execute(
            "SELECT * FROM tasks WHERE id = ?", (task_id,)
        ).fetchone()

        if task is None:
            return jsonify({"error": "Task not found"}), 404

        if "completed" in data:
            completed = 1 if data["completed"] else 0
            db.execute(
                "UPDATE tasks SET completed = ? WHERE id = ?",
                (completed, task_id)
            )

        if "title" in data:
            title = str(data["title"]).strip()
            if not title or len(title) > 200:
                return jsonify({"error": "Invalid task title"}), 400

            db.execute(
                "UPDATE tasks SET title = ? WHERE id = ?",
                (title, task_id)
            )

        updated = db.execute(
            "SELECT * FROM tasks WHERE id = ?", (task_id,)
        ).fetchone()

    return jsonify(dict(updated))


@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    with get_db() as db:
        cursor = db.execute(
            "DELETE FROM tasks WHERE id = ?", (task_id,)
        )

        if cursor.rowcount == 0:
            return jsonify({"error": "Task not found"}), 404

    return jsonify({"message": "Task deleted"})


if __name__ == "__main__":
    initialize_db()
    app.run(debug=True)
