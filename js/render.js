// js/render.js
import { state, save, saveCloud } from "./storage.js";
import { fmtDateLabel, fmtTime, fmtDur, escHtml, pad, getNow, parseTime } from "./helpers.js";

let liveStopwatchInterval = null;
let reportChartInstance = null;

export function applyTheme(){
  let activeTheme = state.theme;
  if (activeTheme === 'auto') activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.body.dataset.theme = activeTheme;
  document.documentElement.style.setProperty('--accent', state.accentColor);
  
  const navStyle = state.mobileNavStyle || 'grid';
  document.body.setAttribute('data-nav-style', navStyle);
}

// اصلاح بخش نمایش تودوها و عادت‌ها
export function renderHabitsAndTodos() {
  const todoList = document.getElementById('todo-list');
  const habitList = document.getElementById('habit-list');
  if(!todoList || !habitList) return;

  const todaysTodos = state.todos; 
  todoList.innerHTML = todaysTodos.length ? '' : '<div style="color:var(--muted); font-size:12px;">کاری ثبت نشده</div>';
  
  todaysTodos.forEach(t => {
    const isDone = t.isDaily ? (t.doneDates && t.doneDates[state.curDate]) : t.done;
    todoList.innerHTML += `
      <div class="todo-item" style="display:flex; align-items:center; justify-content:space-between; padding:8px; border-bottom:1px solid var(--border2); opacity: ${isDone ? '0.6' : '1'}">
        <div style="display:flex; align-items:center; gap:8px;">
          <input type="checkbox" ${isDone ? 'checked' : ''} onchange="toggleTodo('${t.id}')">
          <span style="${isDone ? 'text-decoration:line-through;' : ''}">${escHtml(t.title)} ${t.isDaily ? '🔁' : ''}</span>
        </div>
        <button class="btn-del" onclick="deleteTodo('${t.id}')">✕</button>
      </div>`;
  });

  // بخش عادت‌ها
  habitList.innerHTML = state.habits.length ? '' : '<div style="color:var(--muted); font-size:12px;">عادتی ثبت نشده</div>';
  state.habits.forEach(h => {
    habitList.innerHTML += `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:8px;">
        <span>${escHtml(h.title)}</span>
        <button class="btn-del" onclick="deleteHabit('${h.id}')">✕</button>
      </div>`;
  });
}

// اصلاح روتین‌ها - طراحی بزرگتر و یوزر فرندلی
export function renderRoutines() {
  const list = document.getElementById('rt-list');
  if(!list) return;
  list.innerHTML = state.routines.map(rt => `
    <div style="background:var(--surface2); padding:10px; border-radius:12px; margin-bottom:8px; border-right:4px solid var(--accent);">
      <div style="font-weight:bold;">${escHtml(rt.title)}</div>
      <div style="font-size:11px;">${rt.startTime} - ${rt.endTime}</div>
    </div>
  `).join('');
}

// بقیه توابع ثابت ...
export function render(){
  applyTheme();
  renderHabitsAndTodos();
  renderRoutines();
  // ... سایر توابع رندر
}
