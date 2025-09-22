// Get DOM elements
const taskInput = document.getElementById("taskInput");
const taskDate = document.getElementById("taskDate");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");
const searchInput = document.getElementById("searchInput");
const taskStats = document.getElementById("taskStats");
const toggleThemeBtn = document.getElementById("toggleTheme");

// Load tasks from localStorage or empty array
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// Save tasks to localStorage
const saveTasks = () => localStorage.setItem("tasks", JSON.stringify(tasks));

// Update task stats
const updateStats = () => {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  taskStats.textContent = `${total} tasks total • ${completed} completed`;
};

// Render tasks with search filter and date sorting
const renderTasks = () => {
  taskList.innerHTML = "";
  const searchTerm = searchInput.value.toLowerCase();

  // Filter and sort tasks
  let filteredTasks = tasks
    .filter(task => task.text.toLowerCase().includes(searchTerm))
    .sort((a, b) => new Date(a.date || "9999-12-31") - new Date(b.date || "9999-12-31"));

  filteredTasks.forEach(task => {
    const li = document.createElement("li");
    if (task.completed) li.classList.add("completed");

    const span = document.createElement("span");
    span.textContent = task.text;

    const dateSpan = document.createElement("span");
    dateSpan.className = "task-date";
    dateSpan.textContent = task.date || "";
    if (task.date) {
      const today = new Date().toISOString().split("T")[0];
      if (task.date < today) dateSpan.classList.add("overdue");
      else dateSpan.classList.add("upcoming");
    }

    const btnContainer = document.createElement("div");
    btnContainer.className = "task-buttons";

    // Complete button
    const completeBtn = document.createElement("button");
    completeBtn.textContent = "✔";
    completeBtn.className = "complete";
    completeBtn.onclick = () => toggleTask(task.id);

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "✖";
    deleteBtn.className = "delete";
    deleteBtn.onclick = () => deleteTask(task.id);

    btnContainer.appendChild(dateSpan);
    btnContainer.appendChild(completeBtn);
    btnContainer.appendChild(deleteBtn);

    li.appendChild(span);
    li.appendChild(btnContainer);
    taskList.appendChild(li);
  });

  updateStats();
};

// Add task
addTaskBtn.addEventListener("click", () => {
  const text = taskInput.value.trim();
  const date = taskDate.value;
  if (!text) return;

  // Generate unique ID
  const id = Date.now() + Math.random().toString(16).slice(2);
  tasks.push({ id, text, date, completed: false });

  saveTasks();
  renderTasks();

  taskInput.value = "";
  taskDate.value = "";
});

// Add task with Enter key
taskInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addTaskBtn.click();
});

// Search/filter tasks
searchInput.addEventListener("input", renderTasks);

// Toggle task complete
const toggleTask = (id) => {
  const task = tasks.find(t => t.id === id);
  if (task) task.completed = !task.completed;
  saveTasks();
  renderTasks();
};

// Delete task
const deleteTask = (id) => {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
};

// Toggle dark/light mode
toggleThemeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  toggleThemeBtn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
});

// Initial render
renderTasks();
