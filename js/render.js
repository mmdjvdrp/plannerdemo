// js/render.js
import { state, save, saveCloud } from "./storage.js";
import { fmtDateLabel, fmtTime, fmtDur, escHtml, getWeekDates, pad, getNow, parseTime } from "./helpers.js";

let liveStopwatchInterval = null;

export function applyTheme(){
  document.body.dataset.theme = state.theme;
  const sel = document.getElementById('theme-select');
  if(sel) sel.value = state.theme;
}

function getCat(id){ 
  return state.cats.find(c => c.id === id) || {name:'موضوع حذف‌شده', color:'#9ca3af'}; 
}

export function renderCats(){
  const sel=document.getElementById('cat-select');
  const mapSel=document.getElementById('map-cat-select');
  const manager=document.getElementById('cat-manager');
  if(!sel || !mapSel || !manager) return;

  const current=sel.value;
  const mapCurrent=mapSel.value;
  sel.innerHTML='';
  mapSel.innerHTML='';
  manager.innerHTML='';
  if(!state.cats.length){
    const o=document.createElement('option');
    o.value=''; o.textContent='اول موضوع بسازید';
    o.disabled=true; o.selected=true;
    sel.appendChild(o);
    const mo=o.cloneNode(true);
    mapSel.appendChild(mo);
    manager.innerHTML='<div class="cat-empty">هنوز موضوعی ندارید.</div>';
    return;
  }
  state.cats.forEach(c=>{
    const o=document.createElement('option');
    o.value=c.id; o.textContent=c.name;
    sel.appendChild(o);
    mapSel.appendChild(o.cloneNode(true));

    const item=document.createElement('div');
    item.className='cat-item';
    item.style.cursor = 'pointer'; // ایجاد قابلیت لمسی/کلیک
    item.style.setProperty('--cat-color', c.color);

    if (c.id === current) {
      item.classList.add('selected');
    }

    item.innerHTML=`
      <span class="cat-swatch"></span>
      <span class="cat-name">${escHtml(c.name)}</span>
      <input class="cat-color-edit" type="color" value="${c.color}" aria-label="تغییر رنگ ${escHtml(c.name)}">
      <button class="cat-delete" type="button" title="حذف موضوع">×</button>
    `;

    // سیستم انتخاب سریع با کلیک مستقیم بر روی موضوع
    item.onclick = (e) => {
      if (e.target.classList.contains('cat-color-edit') || e.target.classList.contains('cat-delete')) {
        return;
      }
      sel.value = c.id;
      mapSel.value = c.id;
      
      const goalCatSel = document.getElementById('goal-cat-select');
      if (goalCatSel) goalCatSel.value = c.id;

      document.querySelectorAll('.cat-item').forEach(el => el.classList.remove('selected'));
      item.classList.add('selected');

      renderActivityMap();
    };

    const colorInput=item.querySelector('.cat-color-edit');
    colorInput.oninput=()=>{
      item.style.setProperty('--cat-color', colorInput.value);
      const swatch = item.querySelector('.cat-swatch');
      if(swatch) swatch.style.background = colorInput.value;
    };
    colorInput.onchange=()=>{
      c.color=colorInput.value;
      item.style.setProperty('--cat-color', c.color);
      save('planner_cats', state.cats);
      saveCloud();
      render();
    };
    item.querySelector('.cat-delete').onclick=(e)=> {
      e.stopPropagation(); // جلوگیری از انتخاب موضوع هنگام فشردن کلید حذف
      window.delCat(c.id);
    };
    manager.appendChild(item);
  });
  if(current && state.cats.some(c=>c.id===current)) sel.value=current;
  if(mapCurrent && state.cats.some(c=>c.id===mapCurrent)) mapSel.value=mapCurrent;
  else mapSel.value=state.cats[0].id;

  // همگام‌سازی منوی ثبت اهداف
  const goalCatSel = document.getElementById('goal-cat-select');
  if (goalCatSel) {
    goalCatSel.innerHTML = sel.innerHTML;
    if (sel.value) goalCatSel.value = sel.value;
  }
}

export function renderWeeklyTimetable() {
  const tl = document.getElementById('timeline');
  const weekDates = getWeekDates(state.curDate);
  if (!tl) return;
  
  let html = `<div class="timetable-grid" style="
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 8px;
    margin-top: 15px;
  ">`;
  
  weekDates.forEach(day => {
    const dayEvs = state.events.filter(e => e.date === day.date);
    const catGroups = {};
    dayEvs.forEach(ev => {
      catGroups[ev.catId] = (catGroups[ev.catId] || 0) + ev.durMins;
    });

    const isCurrent = day.date === state.curDate;
    const borderStyle = isCurrent ? '2px solid var(--accent)' : '1px solid var(--border)';
    
    const [y, m, dNum] = day.date.split('-').map(Number);
    const dt = new Date(y, m - 1, dNum);
    const jsDay = dt.getDay();
    const irDay = (jsDay + 1) % 7;
    
    const hasRoutine = state.routines.some(rt => rt.days.includes(irDay));
    
    let bgStyle = isCurrent ? 'var(--surface2)' : 'var(--surface)';
    if (hasRoutine) {
      bgStyle = isCurrent 
        ? 'repeating-linear-gradient(-45deg, var(--surface2), var(--surface2) 10px, var(--surface3) 10px, var(--surface3) 20px)'
        : 'repeating-linear-gradient(-45deg, var(--surface), var(--surface) 10px, var(--surface2) 10px, var(--surface2) 20px)';
    }
    
    html += `
      <div class="timetable-day-col" style="
        border: ${borderStyle};
        background: ${bgStyle};
        border-radius: 8px;
        padding: 8px;
        min-height: 140px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      ">
        <div style="
          text-align: center;
          font-size: 11px;
          font-weight: 700;
          color: ${isCurrent ? 'var(--accent2)' : 'var(--muted)'};
          border-bottom: 1px solid var(--border2);
          padding-bottom: 4px;
          margin-bottom: 4px;
        ">
          ${day.name} (${day.dayNum})
        </div>
    `;
    
    const catKeys = Object.keys(catGroups);
    if (catKeys.length === 0) {
      html += `<div style="font-size:10px; color:var(--muted); text-align:center; margin-top:20px;">خالی</div>`;
    } else {
      catKeys.forEach(catId => {
        const cat = getCat(catId);
        const mins = catGroups[catId];
        html += `
          <div style="
            background: ${cat.color}18;
            border-right: 3px solid ${cat.color};
            border-radius: 4px;
            padding: 4px 6px;
            font-size: 11px;
            cursor: pointer;
          " onclick="navigateToDay('${day.date}')" title="${cat.name} (کل این روز: ${fmtDur(mins)})">
            <div style="font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${cat.name}</div>
            <div style="font-size:9px; color:var(--muted);">${fmtDur(mins)}</div>
          </div>
        `;
      });
    }
    html += `</div>`;
  });
  
  html += `</div>`;
  tl.innerHTML = html;
}

export function renderTimeline(){
  const tl=document.getElementById('timeline');
  const em=document.getElementById('empty-msg');
  if(!tl || !em) return;

  document.getElementById('tl-date').textContent = fmtDateLabel(state.curDate);

  if (state.activeView === 'weekly') {
    em.style.display = 'none';
    tl.style.display = 'block';
    renderWeeklyTimetable();
    return;
  }

  const dayEvents = state.events.filter(e => e.date === state.curDate);

  if(!dayEvents.length){ em.style.display='block'; tl.style.display='none'; return; }
  em.style.display='none'; tl.style.display='block';
  tl.innerHTML='';

  const groups = {};
  dayEvents.forEach(ev => {
    if(!groups[ev.catId]) groups[ev.catId] = [];
    groups[ev.catId].push(ev);
  });

  const sortedCatIds = Object.keys(groups).sort((a, b) => {
    const minA = Math.min(...groups[a].map(e => e.sMins));
    const minB = Math.min(...groups[b].map(e => e.sMins));
    return minA - minB;
  });

  sortedCatIds.forEach(catId => {
    const cat = getCat(catId);
    const grp = groups[catId].sort((a,b) => a.sMins - b.sMins);
    const totalDur = grp.reduce((sum, e) => sum + e.durMins, 0);

    const details = document.createElement('details');
    details.style.cssText = `
      border: 1px solid var(--border);
      border-radius: 12px;
      margin-bottom: 10px;
      background: var(--surface);
      overflow: hidden;
      box-shadow: 0 2px 6px rgba(0,0,0,0.02);
    `;

    details.innerHTML = `
      <summary style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 11px 14px;
        cursor: pointer;
        list-style: none;
        outline: none;
        border-right: 4px solid ${cat.color};
      ">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="width:10px; height:10px; border-radius:50%; background:${cat.color}; box-shadow:0 0
