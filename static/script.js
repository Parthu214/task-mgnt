
const taskForm = document.querySelector("#task-form");
const taskTitle = document.querySelector("#task-title");
const taskList = document.querySelector("#task-list");
const message = document.querySelector("#message");

async function api(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
    }

    return data;
}

async function loadTasks() {
    try {
        const tasks = await api("/api/tasks");
        taskList.replaceChildren();

        if (tasks.length === 0) {
            taskList.textContent = "No tasks yet. Add your first task!";
            return;
        }

        tasks.forEach(task => {
            const row = document.createElement("div");
            row.className = "task";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = Boolean(task.completed);
            checkbox.setAttribute("aria-label", "Mark task complete");

            const title = document.createElement("span");
            title.className = "task-title";
            title.textContent = task.title;

            if (task.completed) {
                title.classList.add("completed");
            }

            checkbox.addEventListener("change", async () => {
                try {
                    await api(`/api/tasks/${task.id}`, {
                        method: "PUT",
                        body: JSON.stringify({
                            completed: checkbox.checked
                        })
                    });
                    loadTasks();
                } catch (error) {
                    message.textContent = error.message;
                }
            });

            const editButton = document.createElement("button");
            editButton.textContent = "Edit";

            editButton.addEventListener("click", async () => {
                const newTitle = prompt("Edit task:", task.title);
                if (newTitle === null) return;

                if (!newTitle.trim()) {
                    message.textContent = "Task title cannot be empty.";
                    return;
                }

                try {
                    await api(`/api/tasks/${task.id}`, {
                        method: "PUT",
                        body: JSON.stringify({ title: newTitle.trim() })
                    });
                    message.textContent = "Task updated.";
                    loadTasks();
                } catch (error) {
                    message.textContent = error.message;
                }
            });

            const deleteButton = document.createElement("button");
            deleteButton.className = "delete-btn";
            deleteButton.textContent = "Delete";

            deleteButton.addEventListener("click", async () => {
                if (!confirm("Delete this task?")) return;

                try {
                    await api(`/api/tasks/${task.id}`, {
                        method: "DELETE"
                    });
                    message.textContent = "Task deleted.";
                    loadTasks();
                } catch (error) {
                    message.textContent = error.message;
                }
            });

            row.append(checkbox, title, editButton, deleteButton);
            taskList.append(row);
        });
    } catch (error) {
        taskList.textContent = error.message;
    }
}

taskForm.addEventListener("submit", async event => {
    event.preventDefault();

    try {
        await api("/api/tasks", {
            method: "POST",
            body: JSON.stringify({ title: taskTitle.value.trim() })
        });

        taskTitle.value = "";
        message.textContent = "Task added successfully.";
        loadTasks();
    } catch (error) {
        message.textContent = error.message;
    }
});

loadTasks();
