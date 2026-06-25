// js/render.js
import { state, save, saveCloud } from "./storage.js";
import { fmtDateLabel, fmtTime, fmtDur, escHtml, pad } from "./helpers.js";

let reportChartInstance = null;

export function applyTheme(){
  let activeTheme = state.theme;
  if (activeTheme === 'auto') activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.body.dataset.theme = activeTheme;
  document.documentElement.style.setProperty('--accent', state.accentColor);
  document.documentElement.style.setProperty('--accent-glow', `color-mix(in srgb, ${state.accentColor} 25%, transparent)`);
  document.body.setAttribute('data-nav-style', state.mobileNavStyle || 'grid');
}

export function renderCats(){
  const sel=document.getElementById('cat-select');
  const mapSel=document.getElementById('map-cat-select');
  const manager=document.getElementById('cat-manager');
  if(!sel || !mapSel || !manager) return;

  const currentMapVal = mapSel.value;
  sel.innerHTML=''; mapSel.innerHTML=''; manager.innerHTML='';
  
  // گزینه‌های ویژه در نقشه
  mapSel.innerHTML = `
    <option value="mood_tracker">وضعیت روحی (خلق‌و‌خو) 🤩</option>
    <option value="todo_tracker">تکمیل کارها (To-Do) ✅</option>
  `;

  state.cats.forEach(c=>{
    const o=document.createElement('option'); o.value=c.id; o.textContent=c.name;
    sel.appendChild(o); mapSel.appendChild(o.cloneNode(true));
    
    const item=document.createElement('div');
    item.className='cat-item'; item.style.setProperty('--cat-color', c.color);
    item.innerHTML=`<span class="cat-swatch"></span><span class="cat-name">${escHtml(c.name)}</span><button class="cat-delete" onclick="window.delCat('${c.id}')">✕</button>`;
    manager.appendChild(item);
  });
  if (currentMapVal) mapSel.value = currentMapVal;
}

export function renderTimeline(){
  const tl=document.getElementById('timeline');
  if(!tl) return;
  const dayEvents = state.events.filter(e => e.date === state.curDate);
  tl.innerHTML = dayEvents.length ? '' : 'رویدادی نیست';
  dayEvents.forEach(ev => {
    tl.innerHTML += `<div class="tl-item">...${escHtml(ev.title)}</div>`; // خلاصه شده برای اختصار
  });
}

export function renderActivityMap(){
  const map=document.getElementById('activity-map');
  const sel=document.getElementById('map-cat-select');
  const label=document.getElementById('map-month-label');
  if(!map || !sel || !label) return;

  const [y, mo] = state.mapMonth.split('-').map(Number);
  label.textContent = `${y}/${mo}`;
  map.innerHTML='';

  const daysInMonth = new Date(y, mo, 0).getDate();
  const selectedValue = sel.value;

  for(let day=1; day<=daysInMonth; day++){
    const dateStr = `${y}-${pad(mo)}-${pad(day)}`;
    const dayCell = document.createElement('div');
    dayCell.className = 'map-day';
    dayCell.innerHTML = `<span class="map-day-num">${day}</span>`;

    let active = false;
    if (selectedValue === 'mood_tracker') {
      active = !!state.moods[dateStr];
    } else if (selectedValue === 'todo_tracker') {
      // چک کردن اینکه آیا در این روز حدقلاً یک To-Do تیک خورده یا نه
      active = state.todos.some(t => t.doneDates && t.doneDates[dateStr] === true);
    } else {
      active = state.events.some(e => e.date === dateStr && e.catId === selectedValue);
    }

    if(active) {
      dayCell.innerHTML += `<div class="map-dot" style="background:var(--accent)"></div>`;
    }
    map.appendChild(dayCell);
  }
}

export function renderHabitsAndTodos() {
  const todoList = document.getElementById('todo-list');
  if(!todoList) return;
  const todaysTodos = state.todos.filter(t => t.date === state.curDate || t.isDaily);
  todoList.innerHTML = '';
  todaysTodos.forEach(t => {
    const isChecked = t.doneDates && t.doneDates[state.curDate];
    todoList.innerHTML += `
      <div class="todo-item">
        <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="window.toggleTodo('${t.id}')">
        <span>${escHtml(t.title)}</span>
      </div>`;
  });
}

export function render(){
  renderCats();
  renderTimeline();
  renderActivityMap();
  renderHabitsAndTodos();
}

export function updateLiveButton(){ /* کد قبلی شما */ }
