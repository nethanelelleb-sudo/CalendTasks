const API_URL = "http://localhost:3000/tasks";
let allTasks = [];
let savedTasksByDate = {};

const navNotes = document.getElementById("nav-notes");
const navCalendar = document.getElementById("nav-calendar");
const notesView = document.getElementById("notes-view");
const calendarView = document.getElementById("calendar-view");

const topBarTitle = document.getElementById("top-bar-title");
const topLoginBtn = document.getElementById("top-login-btn");
const topLogoutBtn = document.getElementById("top-logout-btn");
const userProfile = document.getElementById("user-profile");
const userNameDisplay = document.getElementById("user-name-display");

const notesGrid = document.getElementById("notes-grid");
const createNoteForm = document.getElementById("create-note-form");
const noteCategoryInput = document.getElementById("note-category");
const noteTextInput = document.getElementById("note-text");
const noteDateInput = document.getElementById("note-date");
const noteTimeInput = document.getElementById("note-time");

const toggleMonthBtn = document.getElementById("toggle-month");
const toggleWeekBtn = document.getElementById("toggle-week");
const monthGridContainer = document.getElementById("month-grid-container");
const weekGridContainer = document.getElementById("week-grid-container");
const calendarDays = document.getElementById("calendar-days");
const prevBtn = document.getElementById("prev-time");
const nextBtn = document.getElementById("next-time");
const monthSelect = document.getElementById("month-select");
const yearSelect = document.getElementById("year-select");

const modal = document.getElementById("todo-modal");
const closeModalBtn = document.getElementById("close-modal");
const modalDateTitle = document.getElementById("modal-date-title");
const addTaskForm = document.getElementById("add-task-form");
const newTaskInput = document.getElementById("new-task-input");
const newTaskTime = document.getElementById("new-task-time");

let currentDate = new Date();
let displayedMonth = currentDate.getMonth();
let displayedYear = currentDate.getFullYear();
let selectedDate = null;
let currentViewMode = "month";
let displayedWeekStart = new Date();
displayedWeekStart.setDate(currentDate.getDate() - currentDate.getDay());
let modalTimePicker;

const authModal = document.getElementById("auth-modal");
const closeAuthBtn = document.getElementById("close-auth-modal");
const tabLogin = document.getElementById("tab-login");
const tabSignup = document.getElementById("tab-signup");
const authForm = document.getElementById("auth-form");
const nameGroup = document.getElementById("name-group");
const authName = document.getElementById("auth-name");
const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");
const authSubmitBtn = document.getElementById("auth-submit-btn");

let isLoginMode = true;

function isAuthenticated() {
  return localStorage.getItem("calendtasks_token") !== null;
}

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("calendtasks_token")}`,
  };
}

function checkAuthUI() {
  if (isAuthenticated()) {
    if (topLoginBtn) topLoginBtn.classList.add("hidden");
    if (userProfile) userProfile.classList.remove("hidden");
    if (userNameDisplay)
      userNameDisplay.textContent =
        localStorage.getItem("calendtasks_name") || "User";
    loadTasksFromServer();
  } else {
    if (userProfile) userProfile.classList.add("hidden");
    if (topLoginBtn) topLoginBtn.classList.remove("hidden");
    allTasks = [];
    savedTasksByDate = {};
    renderNotesGrid();
    refreshCalendarView();
  }
}

if (noteDateInput) {
  noteDateInput.addEventListener("click", (e) => {
    if (!isAuthenticated()) {
      e.preventDefault();
      authModal.classList.remove("hidden");
    }
  });
}

if (noteTimeInput) {
  noteTimeInput.addEventListener("click", (e) => {
    if (!isAuthenticated()) {
      e.preventDefault();
      authModal.classList.remove("hidden");
    }
  });
}

if (topLoginBtn) {
  topLoginBtn.addEventListener("click", () => authModal.classList.remove("hidden"));
}

if (tabLogin) {
  tabLogin.addEventListener("click", () => {
    isLoginMode = true;
    tabLogin.classList.add("active-tab");
    tabSignup.classList.remove("active-tab");
    if (nameGroup) nameGroup.classList.add("hidden");
    if (authName) authName.removeAttribute("required");
    if (authSubmitBtn) authSubmitBtn.textContent = "Unlock Features";
  });
}

if (tabSignup) {
  tabSignup.addEventListener("click", () => {
    isLoginMode = false;
    tabSignup.classList.add("active-tab");
    tabLogin.classList.remove("active-tab");
    if (nameGroup) nameGroup.classList.remove("hidden");
    if (authName) authName.setAttribute("required", "true");
    if (authSubmitBtn) authSubmitBtn.textContent = "Create Account";
  });
}

if (authForm) {
  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const endpoint = isLoginMode
      ? "http://localhost:3000/login"
      : "http://localhost:3000/signup";

    const bodyData = { email: authEmail.value, password: authPassword.value };
    if (!isLoginMode) bodyData.name = authName.value;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("calendtasks_token", data.token);
        if (data.name) localStorage.setItem("calendtasks_name", data.name);

        authModal.classList.add("hidden");
        authEmail.value = "";
        authPassword.value = "";
        if (authName) authName.value = "";
        checkAuthUI();
      } else {
        alert("🔒 Error : " + data.message);
      }
    } catch (error) {
      console.error("Auth error", error);
    }
  });
}

if (closeAuthBtn) {
  closeAuthBtn.addEventListener("click", () => authModal.classList.add("hidden"));
}

if (topLogoutBtn) {
  topLogoutBtn.addEventListener("click", () => {
    localStorage.removeItem("calendtasks_token");
    localStorage.removeItem("calendtasks_name");
    checkAuthUI();
  });
}

navNotes.addEventListener("click", () => {
  navNotes.classList.add("active");
  navCalendar.classList.remove("active");
  notesView.classList.add("active-view");
  calendarView.classList.remove("active-view");
  if (topBarTitle) topBarTitle.textContent = "Master List";
  renderNotesGrid();
});

navCalendar.addEventListener("click", () => {
  navCalendar.classList.add("active");
  navNotes.classList.remove("active");
  calendarView.classList.add("active-view");
  notesView.classList.remove("active-view");
  if (topBarTitle) topBarTitle.textContent = "Schedule";
  refreshCalendarView();
});

toggleMonthBtn.addEventListener("click", () => {
  currentViewMode = "month";
  let midWeek = new Date(displayedWeekStart);
  midWeek.setDate(midWeek.getDate() + 3);
  displayedMonth = midWeek.getMonth();
  displayedYear = midWeek.getFullYear();
  toggleMonthBtn.classList.add("active-toggle");
  toggleWeekBtn.classList.remove("active-toggle");
  monthGridContainer.classList.add("active-pane");
  weekGridContainer.classList.remove("active-pane");
  refreshCalendarView();
});

toggleWeekBtn.addEventListener("click", () => {
  currentViewMode = "week";
  let baseDate = new Date(displayedYear, displayedMonth, 1);
  if (
    displayedMonth === currentDate.getMonth() &&
    displayedYear === currentDate.getFullYear()
  ) {
    baseDate = new Date();
  }
  displayedWeekStart = new Date(baseDate);
  displayedWeekStart.setDate(
    displayedWeekStart.getDate() - displayedWeekStart.getDay(),
  );
  toggleWeekBtn.classList.add("active-toggle");
  toggleMonthBtn.classList.remove("active-toggle");
  weekGridContainer.classList.add("active-pane");
  monthGridContainer.classList.remove("active-pane");
  refreshCalendarView();
});

function refreshCalendarView() {
  if (currentViewMode === "month") renderMonthView();
  else renderWeekView();
}

async function loadTasksFromServer() {
  if (!isAuthenticated()) return;
  try {
    const response = await fetch(API_URL, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error("Unauthorized");
    allTasks = await response.json();
    savedTasksByDate = {};
    allTasks.forEach((task) => {
      if (task.date) {
        if (!savedTasksByDate[task.date]) savedTasksByDate[task.date] = [];
        savedTasksByDate[task.date].push(task);
      }
    });
    if (notesView.classList.contains("active-view")) renderNotesGrid();
    if (calendarView.classList.contains("active-view")) {
      refreshCalendarView();
      if (!modal.classList.contains("hidden")) renderModalTasks();
    }
  } catch (error) {
    console.error("Error loading tasks:", error);
  }
}

async function toggleTaskCompletion(taskId, currentStatus) {
  try {
    const res = await fetch(`${API_URL}/${taskId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ completed: !currentStatus }),
    });
    if (res.ok) await loadTasksFromServer();
  } catch (e) {
    console.error("Error updating status:", e);
  }
}

async function deleteTask(taskId) {
  try {
    const res = await fetch(`${API_URL}/${taskId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (res.ok) await loadTasksFromServer();
  } catch (e) {
    console.error("Error deleting task:", e);
  }
}

window.editTaskText = async function (taskId, currentText) {
  const newText = prompt("Edit task text:", currentText);
  if (newText && newText.trim() !== "") {
    try {
      const res = await fetch(`${API_URL}/${taskId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ text: newText.trim() }),
      });
      if (res.ok) await loadTasksFromServer();
    } catch (e) {
      console.error("Error editing text:", e);
    }
  }
};

function renderNotesGrid() {
  notesGrid.innerHTML = "";
  if (!isAuthenticated()) {
    notesGrid.innerHTML = `<div style="text-align:center; width:100%; color:#94a3b8; padding: 40px;">Please Log In to see and create tasks.</div>`;
    return;
  }

  const groupedTasks = {};
  allTasks.forEach((task) => {
    const cat = task.category || "General";
    if (!groupedTasks[cat]) groupedTasks[cat] = [];
    groupedTasks[cat].push(task);
  });

  for (const [category, tasks] of Object.entries(groupedTasks)) {
    const card = document.createElement("div");
    card.className = "note-card";
    let displayTitle = category;
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(category)) {
      const dateParts = category.split("-");
      displayTitle = new Date(
        dateParts[0],
        dateParts[1] - 1,
        dateParts[2],
      ).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
    
    card.innerHTML = `<h3 class="card-title">${displayTitle}</h3>`;
    const ul = document.createElement("ul");
    ul.className = "card-task-list";

    tasks.forEach((task) => {
      const li = document.createElement("li");
      li.className = `task-item ${task.completed ? "completed-task" : ""}`;
      
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "custom-checkbox";
      checkbox.checked = task.completed;
      checkbox.addEventListener("change", () =>
        toggleTaskCompletion(task._id, task.completed),
      );
      
      const spanText = document.createElement("span");
      spanText.className = "task-text";
      spanText.textContent = task.text;

      const contentDiv = document.createElement("div");
      contentDiv.style.display = "flex";
      contentDiv.style.alignItems = "center";
      contentDiv.style.flex = "1";
      contentDiv.appendChild(checkbox);
      contentDiv.appendChild(spanText);
      li.appendChild(contentDiv);

      if (task.date && !task.completed) {
        const dateBadge = document.createElement("span");
        dateBadge.className = "task-date-badge";
        dateBadge.innerHTML = `<i class="fa-regular fa-calendar"></i> ${task.date.substring(5).replace("-", "/")}`;
        li.appendChild(dateBadge);
      }
      
      if (task.time && !task.completed) {
        const timeBadge = document.createElement("span");
        timeBadge.className = "task-time-badge";
        const icon = task.recurrence
          ? `<i class="fa-solid fa-arrows-rotate"></i> `
          : `<i class="fa-regular fa-clock"></i> `;
        timeBadge.innerHTML = `${icon} ${task.time}`;
        li.appendChild(timeBadge);
      }

      const actions = document.createElement("div");
      actions.className = "task-actions";
      const safeText = task.text.replace(/'/g, "\\'");
      actions.innerHTML = `
        <button class="action-btn" onclick="editTaskText('${task._id}', '${safeText}')"><i class="fa-solid fa-pen"></i></button>
        <button class="action-btn" onclick="deleteTask('${task._id}')"><i class="fa-solid fa-trash"></i></button>
      `;
      li.appendChild(actions);
      ul.appendChild(li);
    });
    
    card.appendChild(ul);

    const inlineForm = document.createElement("form");
    inlineForm.className = "inline-add-form";
    inlineForm.innerHTML = `<input type="text" placeholder="+ Add item..." required class="inline-item-input" autocomplete="off"><button type="submit" class="inline-add-btn"><i class="fa-solid fa-plus"></i></button>`;

    inlineForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!isAuthenticated()) {
        authModal.classList.remove("hidden");
        return;
      }
      const inputField = inlineForm.querySelector(".inline-item-input");
      const itemText = inputField.value.trim();
      if (!itemText) return;
      const internalDate = /^\d{4}-\d{2}-\d{2}$/.test(category)
        ? category
        : null;
      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            text: itemText,
            category: category,
            date: internalDate,
          }),
        });
        if (res.ok) {
          inputField.value = "";
          await loadTasksFromServer();
        }
      } catch (error) {
        console.error("Error adding inline item:", error);
      }
    });
    
    card.appendChild(inlineForm);
    notesGrid.appendChild(card);
  }
}

createNoteForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!isAuthenticated()) {
    authModal.classList.remove("hidden");
    return;
  }

  const text = noteTextInput.value.trim();
  const date = noteDateInput.value || null;
  const time = noteTimeInput.value || null;
  let category = noteCategoryInput.value.trim();

  if (!text) return;
  if (!category) category = date ? date : "General";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ text, category, date, time }),
    });
    if (res.ok) {
      noteTextInput.value = "";
      noteCategoryInput.value = "";
      noteDateInput.value = "";
      noteTimeInput.value = "";
      document
        .querySelectorAll(".date-chip")
        .forEach((c) => c.classList.remove("active-chip"));
      await loadTasksFromServer();
    }
  } catch (error) {
    console.error("Error creating note:", error);
  }
});

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const hebrewFormatter = new Intl.DateTimeFormat("en-US-u-ca-hebrew", {
  day: "numeric",
  month: "short",
});

const holidaysCache = {};

async function fetchHolidays(year) {
  if (holidaysCache[year]) return holidaysCache[year];
  try {
    const res = await fetch(
      `https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&mod=on&year=${year}`,
    );
    const data = await res.json();
    const map = {};
    if (data.items) {
      data.items.forEach((item) => {
        if (item.category === "holiday") {
          if (!map[item.date]) map[item.date] = [];
          map[item.date].push(item.title);
        }
      });
    }
    holidaysCache[year] = map;
    return map;
  } catch (e) {
    return {};
  }
}

function initSelectors() {
  monthSelect.innerHTML = "";
  yearSelect.innerHTML = "";
  monthNames.forEach((m, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = m;
    monthSelect.appendChild(opt);
  });
  for (
    let i = currentDate.getFullYear() - 50;
    i <= currentDate.getFullYear() + 50;
    i++
  ) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = i;
    yearSelect.appendChild(opt);
  }
  
  monthSelect.addEventListener("change", (e) => {
    displayedMonth = parseInt(e.target.value);
    if (currentViewMode === "week") {
      displayedWeekStart = new Date(displayedYear, displayedMonth, 1);
      displayedWeekStart.setDate(
        displayedWeekStart.getDate() - displayedWeekStart.getDay(),
      );
    }
    refreshCalendarView();
  });
  
  yearSelect.addEventListener("change", (e) => {
    displayedYear = parseInt(e.target.value);
    if (currentViewMode === "week") {
      displayedWeekStart = new Date(displayedYear, displayedMonth, 1);
      displayedWeekStart.setDate(
        displayedWeekStart.getDate() - displayedWeekStart.getDay(),
      );
    }
    refreshCalendarView();
  });
}

async function renderMonthView() {
  monthSelect.value = displayedMonth;
  yearSelect.value = displayedYear;
  const holidaysMap = await fetchHolidays(displayedYear);
  const firstDayIndex = new Date(displayedYear, displayedMonth, 1).getDay();
  const daysInMonth = new Date(displayedYear, displayedMonth + 1, 0).getDate();
  const prevMonthDays = new Date(displayedYear, displayedMonth, 0).getDate();

  calendarDays.innerHTML = "";
  for (let i = firstDayIndex; i > 0; i--)
    createDayCell(
      prevMonthDays - i + 1,
      "other-month",
      displayedMonth - 1,
      holidaysMap,
    );
  for (let i = 1; i <= daysInMonth; i++) {
    let ext =
      i === currentDate.getDate() &&
      displayedMonth === currentDate.getMonth() &&
      displayedYear === currentDate.getFullYear()
        ? "current-day"
        : "";
    createDayCell(i, ext, displayedMonth, holidaysMap);
  }
  const rem = 42 - (firstDayIndex + daysInMonth);
  for (let i = 1; i <= rem; i++)
    createDayCell(i, "other-month", displayedMonth + 1, holidaysMap);
}

function createDayCell(dayNumber, extraClass, relativeMonth, holidaysMap) {
  const dayCell = document.createElement("div");
  dayCell.className = `day-cell ${extraClass}`;
  let actMonth = relativeMonth,
    actYear = displayedYear;
  if (actMonth < 0) {
    actMonth = 11;
    actYear--;
  }
  if (actMonth > 11) {
    actMonth = 0;
    actYear++;
  }

  const formattedDate = `${actYear}-${String(actMonth + 1).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
  dayCell.dataset.date = formattedDate;

  const topDiv = document.createElement("div");
  topDiv.style.display = "flex";
  topDiv.style.justifyContent = "space-between";
  
  const daySpan = document.createElement("span");
  daySpan.textContent = dayNumber;
  daySpan.style.fontWeight = "700";
  topDiv.appendChild(daySpan);
  
  const hebrewSpan = document.createElement("span");
  hebrewSpan.className = "hebrew-date";
  hebrewSpan.textContent = hebrewFormatter.format(
    new Date(actYear, actMonth, dayNumber),
  );
  topDiv.appendChild(hebrewSpan);
  dayCell.appendChild(topDiv);

  if (holidaysMap && holidaysMap[formattedDate]) {
    const holSpan = document.createElement("span");
    holSpan.className = "holiday-tag";
    holSpan.textContent = holidaysMap[formattedDate][0];
    dayCell.appendChild(holSpan);
    dayCell.classList.add("is-holiday");
  }

  const dayTasks = allTasks.filter((t) => {
    if (!t.date) return false;
    if (t.date === formattedDate) return true;
    if (t.date > formattedDate) return false;
    if (t.recurrence === "daily") return true;
    if (t.recurrence === "weekly")
      return new Date(t.date).getDay() === new Date(formattedDate).getDay();
    if (t.recurrence === "monthly")
      return t.date.substring(8) === formattedDate.substring(8);
    return false;
  });

  const tasksCont = document.createElement("div");
  tasksCont.className = "cell-tasks-container";
  const sortedTasks = dayTasks.sort((a, b) =>
    (a.time || "24:00").localeCompare(b.time || "24:00"),
  );
  
  sortedTasks.slice(0, 3).forEach((t) => {
    const b = document.createElement("div");
    b.className = "cell-task-badge";
    const icon = t.recurrence
      ? `<i class="fa-solid fa-arrows-rotate" style="font-size:0.6rem; opacity:0.8;"></i> `
      : "";
    b.innerHTML = t.time
      ? `${icon}<span class="badge-time">${t.time}</span> ${t.text}`
      : `${icon}${t.text}`;
    if (t.completed) {
      b.style.opacity = "0.4";
      b.style.textDecoration = "line-through";
    }
    tasksCont.appendChild(b);
  });
  dayCell.appendChild(tasksCont);

  if (extraClass !== "other-month") {
    dayCell.addEventListener("click", () => {
      openModalForDate(formattedDate, null);
    });
  }
  calendarDays.appendChild(dayCell);
}

function renderWeekView() {
  let midWeek = new Date(displayedWeekStart);
  midWeek.setDate(midWeek.getDate() + 3);
  displayedMonth = midWeek.getMonth();
  displayedYear = midWeek.getFullYear();
  monthSelect.value = displayedMonth;
  yearSelect.value = displayedYear;

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  let html = `<div class="week-grid"><div class="time-col"><div class="day-col-header" style="height:48px; border-bottom:1px solid var(--border)"></div>`;

  for (let h = 8; h <= 20; h++) {
    html += `<div class="time-slot">${h}:00</div>`;
  }
  html += `</div>`;

  for (let i = 0; i < 7; i++) {
    let d = new Date(displayedWeekStart);
    d.setDate(d.getDate() + i);
    let dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    let isToday =
      dateStr ===
      `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;

    html += `<div class="day-col ${isToday ? "current-day" : ""}" data-date="${dateStr}">`;
    html += `<div class="day-col-header" style="cursor:pointer;" onclick="openModalForDate('${dateStr}', null)">${dayNames[i]}<span>${d.getDate()}</span></div>`;

    for (let h = 8; h <= 20; h++) {
      const currentHourStr = `${String(h).padStart(2, "0")}:00`;
      html += `<div class="time-slot" style="position:relative; cursor:pointer;" onclick="openModalForDate('${dateStr}', '${currentHourStr}')">`;

      const weekDayTasks = allTasks.filter((t) => {
        if (!t.date) return false;
        if (t.date === dateStr) return true;
        if (t.date > dateStr) return false;
        if (t.recurrence === "daily") return true;
        if (t.recurrence === "weekly")
          return new Date(t.date).getDay() === new Date(dateStr).getDay();
        if (t.recurrence === "monthly")
          return t.date.substring(8) === dateStr.substring(8);
        return false;
      });

      weekDayTasks.forEach((t) => {
        if (t.time && t.time.startsWith(String(h).padStart(2, "0"))) {
          const icon = t.recurrence
            ? `<i class="fa-solid fa-arrows-rotate" style="font-size:0.6rem;"></i> `
            : "";
          html += `<div class="cell-task-badge" style="position:absolute; top:2px; left:4px; right:4px; z-index:5; box-shadow:0 2px 4px rgba(0,0,0,0.1)" onclick="event.stopPropagation(); openModalForDate('${dateStr}', '${currentHourStr}')">
                      ${icon}<span class="badge-time">${t.time}</span> ${t.text}
                    </div>`;
        }
      });
      html += `</div>`;
    }
    html += `</div>`;
  }
  html += `</div>`;
  weekGridContainer.innerHTML = html;
}

window.openModalForDate = function (dateStr, timeStr = null) {
  if (!isAuthenticated()) {
    authModal.classList.remove("hidden");
    return;
  }

  selectedDate = dateStr;
  const parts = dateStr.split("-");
  modalDateTitle.textContent = new Date(
    parts[0],
    parts[1] - 1,
    parts[2],
  ).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (timeStr && modalTimePicker) {
    modalTimePicker.setDate(timeStr);
  } else if (modalTimePicker) {
    modalTimePicker.clear();
  }

  renderModalTasks();
  modal.classList.remove("hidden");
  setTimeout(() => newTaskInput.focus(), 100);
};

prevBtn.addEventListener("click", () => {
  if (currentViewMode === "month") {
    displayedMonth--;
    if (displayedMonth < 0) {
      displayedMonth = 11;
      displayedYear--;
      initSelectors();
    }
  } else {
    displayedWeekStart.setDate(displayedWeekStart.getDate() - 7);
  }
  refreshCalendarView();
});

nextBtn.addEventListener("click", () => {
  if (currentViewMode === "month") {
    displayedMonth++;
    if (displayedMonth > 11) {
      displayedMonth = 0;
      displayedYear++;
      initSelectors();
    }
  } else {
    displayedWeekStart.setDate(displayedWeekStart.getDate() + 7);
  }
  refreshCalendarView();
});

function renderModalTasks() {
  const taskList = document.getElementById("task-list");
  taskList.innerHTML = "";

  const dayTasks = allTasks
    .filter((t) => {
      if (!t.date) return false;
      if (t.date === selectedDate) return true;
      if (t.date > selectedDate) return false;
      if (t.recurrence === "daily") return true;
      if (t.recurrence === "weekly")
        return new Date(t.date).getDay() === new Date(selectedDate).getDay();
      if (t.recurrence === "monthly")
        return t.date.substring(8) === selectedDate.substring(8);
      return false;
    })
    .sort((a, b) => (a.time || "24:00").localeCompare(b.time || "24:00"));

  if (dayTasks.length === 0) {
    taskList.innerHTML = `<li style="color:#94a3b8; font-style:italic; padding:10px 0;">No schedule for this day.</li>`;
  } else {
    dayTasks.forEach((task) => {
      const li = document.createElement("li");
      li.className = `task-item ${task.completed ? "completed-task" : ""}`;
      
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "custom-checkbox";
      checkbox.checked = task.completed;
      checkbox.addEventListener("change", () =>
        toggleTaskCompletion(task._id, task.completed),
      );
      
      const spanText = document.createElement("span");
      spanText.className = "task-text";
      spanText.textContent = task.text;

      const contentDiv = document.createElement("div");
      contentDiv.style.display = "flex";
      contentDiv.style.alignItems = "center";
      contentDiv.style.flex = "1";
      contentDiv.appendChild(checkbox);
      contentDiv.appendChild(spanText);
      li.appendChild(contentDiv);

      if (task.time && !task.completed) {
        const timeBadge = document.createElement("span");
        timeBadge.className = "task-time-badge";
        const icon = task.recurrence
          ? `<i class="fa-solid fa-arrows-rotate"></i> `
          : `<i class="fa-regular fa-clock"></i> `;
        timeBadge.innerHTML = `${icon} ${task.time}`;
        li.appendChild(timeBadge);
      }

      const actions = document.createElement("div");
      actions.className = "task-actions";
      const safeText = task.text.replace(/'/g, "\\'");
      actions.innerHTML = `
        <button class="action-btn" onclick="editTaskText('${task._id}', '${safeText}')"><i class="fa-solid fa-pen"></i></button>
        <button class="action-btn" onclick="deleteTask('${task._id}')"><i class="fa-solid fa-trash"></i></button>
      `;
      li.appendChild(actions);
      taskList.appendChild(li);
    });
  }
}

closeModalBtn.addEventListener("click", () => modal.classList.add("hidden"));

modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.classList.add("hidden");
});

addTaskForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = newTaskInput.value.trim();
  const time = newTaskTime.value || null;
  const recurrenceEl = document.getElementById("new-task-recurrence");
  const recurrence = recurrenceEl ? recurrenceEl.value || null : null;
  const category = selectedDate;
  if (!text) return;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        text,
        category,
        date: selectedDate,
        time,
        recurrence,
      }),
    });
    if (res.ok) {
      newTaskInput.value = "";
      newTaskTime.value = "";
      if (recurrenceEl) recurrenceEl.value = "";
      await loadTasksFromServer();
    }
  } catch (e) {
    console.error("Error adding calendar event:", e);
  }
});

document.querySelectorAll(".date-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    if (!isAuthenticated()) {
      authModal.classList.remove("hidden");
      return;
    }
    if (chip.classList.contains("active-chip")) {
      chip.classList.remove("active-chip");
      noteDateInput.value = "";
      return;
    }
    document
      .querySelectorAll(".date-chip")
      .forEach((c) => c.classList.remove("active-chip"));

    const daysToAdd = parseInt(chip.dataset.days);
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysToAdd);

    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
    const dd = String(targetDate.getDate()).padStart(2, "0");

    noteDateInput.value = `${yyyy}-${mm}-${dd}`;
    chip.classList.add("active-chip");
  });
});

async function startApp() {
  initSelectors();
  checkAuthUI();

  const timeConfig = {
    enableTime: true,
    noCalendar: true,
    dateFormat: "H:i",
    time_24hr: true,
    minuteIncrement: 15,
    onOpen: function (selectedDates, dateStr, instance) {
      if (!isAuthenticated()) {
        instance.close();
        authModal.classList.remove("hidden");
      }
    },
  };
  
  if (document.getElementById("note-time")) {
    flatpickr("#note-time", timeConfig);
  }
  
  if (document.getElementById("new-task-time")) {
    modalTimePicker = flatpickr("#new-task-time", timeConfig);
  }
}

startApp();
