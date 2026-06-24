// js/render.js
import { state, save, saveCloud } from "./storage.js";
import { fmtDateLabel, fmtTime, fmtDur, escHtml, pad, getNow } from "./helpers.js";

export function renderHabitsAndTodos() {
  const todoList = document.getElementById('todo-list');
  const habitList = document.getElementById('habit-list');
  if(!todoList || !habitList) return;

  // نمایش تودوها: تودوهای روز جاری + تودوهای تکرار شونده
  todoList.innerHTML = state.todos.length ? '' : '<div style="color:var(--muted); font-size:12px;">کاری ثبت نشده</div>';
  
  state.todos.forEach(t => {
    // تودوی تکرار شونده اگر انجام شده باشد، فقط خط‌خورده می‌شود ولی ناپدید نمی‌شود
    const isDone = t.isDaily ? (t.doneDates && t.doneDates[state.curDate]) : t.done;
    
    todoList.innerHTML += `
      <div class="todo-item" style="gap: 8px;">
        <input type="checkbox" class="todo-checkbox" ${isDone ? 'checked' : ''} onchange="toggleTodo('${t.id}')">
        <span class="todo-title ${isDone ? 'done' : ''} ${t.isDaily ? 'recurring' : ''}">
          ${escHtml(t.title)} ${t.isDaily ? '🔁' : ''}
        </span>
        <button class="btn-del" style="width:24px; height:24px;" onclick="deleteTodo('${t.id}')">✕</button>
      </div>`;
  });

  // لیست عادت‌ها (بدون تغییرات ساختاری در رندر)
  habitList.innerHTML = state.habits.length ? '' : '<div style="color:var(--muted); font-size:12px;">عادتی ثبت نشده</div>';
  // ... (سایر کدهای رندر عادت‌ها حفظ شود)
}

// تابع کمکی برای رندر کردن لیست روتین‌ها (با دکمه‌های بزرگ)
export function renderRoutines() {
  const list = document.getElementById('rt-list');
  if(!list) return;
  list.innerHTML = state.routines.map(rt => `
    <div style="background:var(--surface2); padding:10px; border-radius:10px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
      <div><strong>${escHtml(rt.title)}</strong><br><small style="color:var(--muted)">${rt.startTime} - ${rt.endTime}</small></div>
      <button class="btn-del" onclick="delRoutine('${rt.id}')">✕</button>
    </div>
  `).join('');
}

export function render() {
  renderCats();
  renderTimeline();
  renderHabitsAndTodos();
  renderRoutines();
  renderGoals();
  // ... (سایر توابع رندر)
}
