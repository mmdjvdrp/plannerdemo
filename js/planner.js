// js/planner.js
import { supabase } from "./supabase.js";
import { state, save, saveCloud, loadCloud } from "./storage.js";
import { getNow, parseTime, pad, getLocalDateStr, fmtDateLabel, fmtTime, isValidTimeRange } from "./helpers.js";
import { render, applyTheme, updateLiveButton } from "./render.js";

function safeBindEvent(id, event, callback) {
  const el = document.getElementById(id);
  if (el) el[event] = callback;
}

// تابع تیک زدن کارها با قابلیت ثبت در تاریخ (برای نقشه ماهانه)
window.toggleTodo = (id) => {
  const t = state.todos.find(x => x.id === id);
  if (t) {
    if (!t.doneDates) t.doneDates = {};
    // تیک زدن بر اساس تاریخ فعلی
    t.doneDates[state.curDate] = !t.doneDates[state.curDate];
    // برای کارهای غیر تکراری، وضعیت کلی را هم آپدیت می‌کنیم
    if(!t.isDaily) t.done = t.doneDates[state.curDate];

    save("planner_todos", state.todos);
    saveCloud();
    render();
  }
};

window.deleteTodo = (id) => { 
  state.todos = state.todos.filter(x => x.id !== id); 
  save("planner_todos", state.todos); saveCloud(); render(); 
};

window.copyPreviousDayEvents = function() {
  const [y, mo, d] = state.curDate.split("-").map(Number);
  const yesterday = new Date(y, mo - 1, d - 1);
  const yStr = yesterday.getFullYear() + "-" + pad(yesterday.getMonth() + 1) + "-" + pad(yesterday.getDate());
  const yEvs = state.events.filter(e => e.date === yStr);
  if (!yEvs.length) return alert("دیروز فعالیتی نبود.");
  yEvs.forEach(e => state.events.push({ ...e, id: "c"+Date.now()+Math.random(), date: state.curDate }));
  save("planner_ev", state.events); saveCloud(); render();
};

window.switchTab = function(tabId) {
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-section").forEach(s => s.classList.remove("active"));
  const btn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
  if(btn) btn.classList.add("active");
  const sec = document.getElementById(tabId);
  if(sec) sec.classList.add("active");
};

// افزودن فعالیت
safeBindEvent("add-btn", "onclick", () => {
  const title = document.getElementById("act-title").value.trim();
  const catId = document.getElementById("cat-select").value;
  const st = document.getElementById("start-time").value;
  const en = document.getElementById("end-time").value;
  if(!catId || !st || !en) return alert("فیلدها را کامل کنید");
  
  const sMins = parseTime(st), eMins = parseTime(en);
  const dur = eMins - sMins;
  if(dur <= 0) return alert("زمان شروع باید قبل از پایان باشد");

  state.events.push({ id: Date.now().toString(), date: state.curDate, title, catId, sMins, eMins, durMins: dur });
  save("planner_ev", state.events); saveCloud(); render();
});

// فعالیت زنده
safeBindEvent("live-btn", "onclick", () => {
  if(!state.liveSession){
    state.liveSession = { title: document.getElementById("act-title").value, catId: document.getElementById("cat-select").value, sMins: parseTime(getNow()), date: state.curDate };
  } else {
    const eMins = parseTime(getNow());
    const dur = eMins - state.liveSession.sMins;
    state.events.push({ ...state.liveSession, id: Date.now().toString(), eMins, durMins: dur > 0 ? dur : 1 });
    state.liveSession = null;
  }
  save("planner_live", state.liveSession); saveCloud(); render(); updateLiveButton();
});

// مدیریت خروج
safeBindEvent("logout-btn", "onclick", async () => {
  await supabase.auth.signOut();
  window.location.href = "./login.html";
});

// شروع برنامه
async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  if(!session) {
    window.location.href = "./login.html";
    return;
  }
  await loadCloud();
  applyTheme();
  render();
  updateLiveButton();
}

init();

document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.onclick = () => switchTab(btn.dataset.tab);
});

safeBindEvent("prev-day", "onclick", () => {
  const [y,m,d] = state.curDate.split("-").map(Number);
  const dt = new Date(y, m-1, d-1);
  state.curDate = dt.getFullYear()+'-'+pad(dt.getMonth()+1)+'-'+pad(dt.getDate());
  render();
});

safeBindEvent("next-day", "onclick", () => {
  const [y,m,d] = state.curDate.split("-").map(Number);
  const dt = new Date(y, m-1, d+1);
  state.curDate = dt.getFullYear()+'-'+pad(dt.getMonth()+1)+'-'+pad(dt.getDate());
  render();
});
