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
  document.documentElement.style.setProperty('--accent-glow', `color-mix(in srgb, ${state.accentColor} 25%, transparent)`);
  
  const navStyle = state.mobileNavStyle || 'grid';
  document.body.setAttribute('data-nav-style', navStyle);

  const wrap = document.querySelector('.wrap');
  if (wrap && window.innerWidth <= 768) {
    if (navStyle === 'grid') {
      wrap.style.setProperty('padding-bottom', '190px', 'important');
    } else {
      wrap.style.setProperty('padding-bottom', '150px', 'important');
    }
  }

  if(document.getElementById('setting-theme-select')) document.getElementById('setting-theme-select').value = state.theme;
  if(document.getElementById('setting-accent-picker')) document.getElementById('setting-accent-picker').value = state.accentColor;
  if(document.getElementById('setting-mobile-nav')) document.getElementById('setting-mobile-nav').value = navStyle;
}

export function renderCats(){
  const sel=document.getElementById('cat-select');
  const mapSel=document.getElementById('map-cat-select');
  const manager=document.getElementById('cat-manager');
  const goalSel=document.getElementById('goal-cat-select');
  if(!sel || !mapSel || !manager) return;

  const currentVal = sel.value;
  const currentMapVal = mapSel.value;
  sel.innerHTML=''; mapSel.innerHTML=''; manager.innerHTML='';
  if (goalSel) goalSel.innerHTML = '';
  
  // گزینه‌های ویژه نقشه ماهانه
  mapSel.innerHTML = `
    <option value="mood_tracker">حالت روحی روزانه (خلق‌و‌خو) 🤩</option>
    <option value="todo_tracker">رهگیری کارهای انجام شده (To-Do) ✅</option>
  `;

  if(!state.cats.length){
    sel.innerHTML='<option disabled selected>اول موضوع بسازید</option>';
    manager.innerHTML='<div style="color:var(--muted); font-size:12px;">هنوز موضوعی ندارید.</div>';
  } else {
    state.cats.forEach(c=>{
      const emoji = c.emoji || '📅';
      const isUrl = emoji.startsWith('http');
      const displayEmoji = isUrl ? '🎥' : emoji;

      const o=document.createElement('option'); o.value=c.id; o.textContent=`${displayEmoji} ${c.name}`;
      sel.appendChild(o); mapSel.appendChild(o.cloneNode(true));
      if (goalSel) goalSel.appendChild(o.cloneNode(true));

      const item=document.createElement('div');
      item.className='cat-item'; item.style.setProperty('--cat-color', c.color);
      item.style.gridTemplateColumns = "20px 28px 1fr 34px 34px 34px"; 
      
      if (c.id === currentVal) item.classList.add('selected');

      const emojiHtml = isUrl 
        ? `<video src="${emoji}" autoplay loop muted playsinline style="width:24px; height:24px; object-fit:cover; border-radius:50%; pointer-events:none;"></video>`
        : `<span style="font-size:15px; text-align:center;">${emoji}</span>`;

      item.innerHTML=`
        <span class="cat-swatch"></span>
        <div style="display:flex; align-items:center; justify-content:center; width:24px; height:24px; overflow:hidden; border-radius:50%;">${emojiHtml}</div>
        <span class="cat-name">${escHtml(c.name)}</span>
        <button class="cat-emoji-edit" type="button" onclick="event.stopPropagation(); window.openCatEmojiPicker('${c.id}')" style="width:32px; height:32px; border:1px solid var(--border2); border-radius:8px; background:var(--surface3); color:var(--muted); cursor:pointer;" title="انتخاب شکلک متحرک">🖼️</button>
        <input class="cat-color-edit" type="color" value="${c.color}">
        <button class="cat-delete" type="button">✕</button>
      `;
      
      item.querySelector('.cat-color-edit').onchange=(e)=>{
        c.color=e.target.value; save('planner_cats', state.cats); saveCloud(); render();
      };
      item.querySelector('.cat-delete').onclick=(e)=>{ e.stopPropagation(); window.delCat(c.id); };
      
      item.onclick=(e)=>{ 
        if(e.target.tagName!=='INPUT' && e.target.tagName!=='BUTTON'){ 
          sel.value=c.id; mapSel.value=c.id; 
          document.querySelectorAll('.cat-item').forEach(el => el.classList.remove('selected'));
          item.classList.add('selected');
        }
      };
      manager.appendChild(item);
    });
  }
  
  if (currentMapVal) mapSel.value = currentMapVal;
  else mapSel.value = 'mood_tracker';
}

window.toggleTagFilter = function(tag) {
  state.activeTagFilter = (state.activeTagFilter === tag) ? null : tag;
  renderTimeline();
};

export function renderTimeline(){
  const tl=document.getElementById('timeline');
  const em=document.getElementById('empty-msg');
  if(!tl || !em) return;

  const activeFilterLabel = state.activeTagFilter 
    ? ` <span style="font-size:11px; background:var(--accent-glow); color:var(--accent); padding:2px 8px; border-radius:6px; cursor:pointer;" onclick="window.toggleTagFilter('${state.activeTagFilter}')">فیلتر: ${state.activeTagFilter} ✕</span>`
    : '';

  document.getElementById('tl-date').innerHTML = fmtDateLabel(state.curDate) + activeFilterLabel;
  
  let dayEvents = state.events.filter(e => e.date === state.curDate);
  if (state.activeTagFilter) dayEvents = dayEvents.filter(e => (e.tags || []).includes(state.activeTagFilter));

  if(!dayEvents.length){ 
    em.style.display='block'; tl.style.display='none'; 
    em.innerHTML = `<div class="empty-icon">📅</div>هنوز فعالیتی ثبت نشده<button onclick="window.copyPreviousDayEvents()" class="btn-live" style="width:auto; margin:12px auto; display:block; font-size:11px;">📋 کپی از دیروز</button>`;
    return; 
  }
  
  em.style.display='none'; tl.style.display='block'; tl.innerHTML='';

  if (state.groupTimelinePref) {
    const groups = {};
    dayEvents.forEach(ev => {
      if(!groups[ev.catId]) groups[ev.catId] = [];
      groups[ev.catId].push(ev);
    });

    Object.keys(groups).sort((a, b) => Math.min(...groups[a].map(e => e.sMins)) - Math.min(...groups[b].map(e => e.sMins))).forEach(catId => {
      const cat = state.cats.find(c => c.id === catId) || {name: 'حذف شده', color: '#999', emoji: '📅'};
      const grp = groups[catId].sort((a,b) => a.sMins - b.sMins);
      const totalDur = grp.reduce((sum, e) => sum + e.durMins, 0);

      const details = document.createElement('details');
      details.className = 'tl-group-details';
      details.innerHTML = `
        <summary style="padding:11px; cursor:pointer; list-style:none; border-right:4px solid ${cat.color}; background:var(--surface); border-radius:10px; margin-bottom:8px;">
          <div style="font-size:13px; font-weight:700;">${cat.emoji || '📅'} ${escHtml(cat.name)}</div>
          <div style="font-size:11px; color:var(--muted);">${grp.length} فعالیت - مجموعاً ${fmtDur(totalDur)}</div>
        </summary>
        <div style="padding:0 10px 10px 10px;">
          ${grp.map(ev => `<div class="tl-item" style="--ic:${cat.color}; margin-bottom:5px;">
            <div class="tl-info"><div class="tl-title">${escHtml(ev.title || cat.name)}</div><div class="tl-meta">${fmtTime(ev.sMins)} تا ${fmtTime(ev.eMins)} (${fmtDur(ev.durMins)})</div></div>
            <div style="display:flex; gap:5px;"><button onclick="editEv('${ev.id}')">✏️</button><button onclick="delEv('${ev.id}')">✕</button></div>
          </div>`).join('')}
        </div>`;
      tl.appendChild(details);
    });
  } else {
    dayEvents.sort((a,b) => a.sMins - b.sMins).forEach(ev => {
      const cat = state.cats.find(c => c.id === ev.catId) || {name: 'حذف شده', color: '#999', emoji: '📅'};
      tl.innerHTML += `<div class="tl-item" style="--ic:${cat.color}">
        <div class="tl-info"><div class="tl-title">${escHtml(ev.title || cat.name)}</div><div class="tl-meta">${cat.emoji || '📅'} ${fmtTime(ev.sMins)} تا ${fmtTime(ev.eMins)} (${fmtDur(ev.durMins)})</div></div>
        <button class="btn-del" onclick="editEv('${ev.id}')">✏️</button><button class="btn-del" onclick="delEv('${ev.id}')">✕</button>
      </div>`;
    });
  }
}

export function renderReport(){
  const grid = document.getElementById('report-grid');
  const ctx = document.getElementById('report-chart');
  if(!grid || !ctx) return;
  const daysRange = parseInt(document.getElementById('report-days').value) || 7;
  const [y,mo,d]=state.curDate.split('-').map(Number);
  const ref=new Date(y,mo-1,d);
  const from=new Date(ref); from.setDate(from.getDate() - (daysRange - 1));
  const week = state.events.filter(e => {
    const [ey,em,ed] = e.date.split('-').map(Number);
    const dt = new Date(ey,em-1,ed); return dt >= from && dt <= ref;
  });
  const sums={}; let total=0;
  week.forEach(e=>{ sums[e.catId]=(sums[e.catId]||0)+e.durMins; total+=e.durMins; });
  if (reportChartInstance) reportChartInstance.destroy();
  const labels = []; const data = []; const bgColors = []; grid.innerHTML='';
  Object.keys(sums).forEach(catId => {
    const cat = state.cats.find(c => c.id === catId) || {name: 'حذف شده', color: '#999'};
    labels.push(cat.name); data.push(sums[catId]); bgColors.push(cat.color);
    const pct = total > 0 ? Math.round((sums[catId] / total) * 100) : 0;
    grid.innerHTML += `<div class="report-item-interactive" style="--cat-color:${cat.color}">
      <div style="display:flex; justify-content:space-between; font-size:12px;"><span>${cat.name}</span><span>${fmtDur(sums[catId])} (${pct}%)</span></div>
      <div class="prog-bg" style="margin-top:5px;"><div class="prog-fill" style="background:${cat.color}; width:${pct}%"></div></div>
    </div>`;
  });
  reportChartInstance = new Chart(ctx, { type: state.chartTypePref || 'doughnut', data: { labels, datasets: [{ data, backgroundColor: bgColors, borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false } });
}

export function renderActivityMap(){
  const map=document.getElementById('activity-map');
  const sel=document.getElementById('map-cat-select');
  const label=document.getElementById('map-month-label');
  const tooltipDetail = document.getElementById('map-tooltip-detail');
  if(!map || !sel || !label) return;

  const [y,mo]=state.mapMonth.split('-').map(Number);
  label.textContent = `${y}/${mo}`;
  map.innerHTML='';

  const daysInMonth=new Date(y, mo, 0).getDate();
  const firstDay=new Date(y, mo-1, 1).getDay();
  const startOffset=(firstDay+1)%7; 
  for(let i=0; i<startOffset; i++) map.innerHTML += `<div class="map-day" style="background:transparent; border:none;"></div>`;

  const selectedValue = sel.value;

  for(let day=1; day<=daysInMonth; day++){
    const dateStr = `${y}-${pad(mo)}-${pad(day)}`;
    const dayCell = document.createElement('div');
    dayCell.className = 'map-day';
    dayCell.innerHTML = `<span class="map-day-num">${day}</span>`;

    if (selectedValue === 'mood_tracker') {
      const dayMood = state.moods[dateStr];
      if (dayMood && dayMood.mood) {
        const p = state.moodPresets.find(x => String(x.level) === String(dayMood.mood));
        if (p && p.type === 'webm') dayCell.innerHTML += `<video src="${p.value}" autoplay loop muted playsinline style="width:100%; height:100%; object-fit:cover; position:absolute;"></video>`;
        else if (p) dayCell.innerHTML += `<span style="font-size:20px; z-index:1;">${p.value}</span>`;
      }
    } else if (selectedValue === 'todo_tracker') {
      // منطق جدید: اگر در این روز حداقل یک To-Do انجام شده باشد
      const isDone = state.todos.some(t => t.doneDates && t.doneDates[dateStr] === true);
      if(isDone) dayCell.innerHTML += `<div class="map-dot" style="background:var(--accent); width:10px; height:10px;"></div>`;
    } else {
      const mins = state.events.filter(e => e.date === dateStr && e.catId === selectedValue).reduce((s, e) => s + e.durMins, 0);
      if(mins > 0) dayCell.innerHTML += `<div class="map-dot" style="background:var(--accent); width:8px; height:8px;"></div>`;
    }
    map.appendChild(dayCell);
  }
}

export function renderHabitsAndTodos() {
  const todoList = document.getElementById('todo-list');
  const habitList = document.getElementById('habit-list');
  if(!todoList || !habitList) return;

  const todaysTodos = state.todos.filter(t => t.date === state.curDate || t.isDaily);
  todoList.innerHTML = todaysTodos.length ? '' : '<div style="color:var(--muted); font-size:12px;">کاری نیست</div>';
  todaysTodos.forEach(t => {
    const isChecked = t.isDaily ? (t.doneDates && t.doneDates[state.curDate]) : t.done;
    todoList.innerHTML += `<div class="todo-item">
      <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleTodo('${t.id}')">
      <span class="todo-title ${isChecked ? 'done' : ''}">${escHtml(t.title)}</span>
      <button onclick="deleteTodo('${t.id}')">✕</button>
    </div>`;
  });

  habitList.innerHTML = state.habits.length ? '' : '<div style="color:var(--muted); font-size:12px;">عادتی نیست</div>';
  state.habits.forEach(h => {
    habitList.innerHTML += `<div class="habit-item"><strong>${escHtml(h.title)}</strong><button onclick="deleteHabit('${h.id}')">✕</button></div>`;
  });
}

export function render() {
  applyTheme();
  renderCats();
  renderTimeline();
  renderReport();
  renderActivityMap();
  renderHabitsAndTodos();
}

export function updateLiveButton() {
  const btn = document.getElementById("live-btn");
  if(!btn) return;
  if(state.liveSession) {
    btn.textContent = "⏹ توقف فعالیت";
    btn.classList.add("is-running");
  } else {
    btn.textContent = "شروع فعالیت زنده";
    btn.classList.remove("is-running");
  }
}
