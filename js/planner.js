// js/planner.js
import { supabase } from "./supabase.js";
import { state, save, saveCloud, loadCloud } from "./storage.js";
import { getNow, parseTime, pad, getLocalDateStr, fmtDateLabel, fmtTime } from "./helpers.js";
import { render, applyTheme, updateLiveButton } from "./render.js";

function safeBindEvent(id, event, callback) {
  const el = document.getElementById(id);
  if (el) {
    el[event] = callback;
  }
}

// ساخت سیستم اعلانات حبابی (Toast) درون برنامه‌ای شیک
window.showToast = function(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.style.cssText = `
    background: var(--surface);
    color: var(--text);
    border: 1px solid var(--border2);
    border-right: 4px solid var(--accent);
    padding: 10px 18px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    box-shadow: 0 4px 15px rgba(0,0,0,0.35);
    display: flex;
    align-items: center;
    gap: 8px;
    pointer-events: auto;
    animation: toastSlideIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
  `;
  
  if (type === 'success') toast.style.borderRightColor = '#10b981';
  if (type === 'error') toast.style.borderRightColor = '#ef4444';
  if (type === 'warning') toast.style.borderRightColor = '#f59e0b';
  
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'toastSlideOut 0.3s ease forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
};

// انیمیشن کوچک حرکت منو در شروع برنامه برای آگاهی کاربر از قابلیت اسکرول افقی
function triggerNavPeekAnimation() {
  const nav = document.querySelector(".app-nav");
  if (nav && state.mobileNavStyle === 'scroll') {
    setTimeout(() => {
      nav.scrollTo({ left: 60, behavior: "smooth" });
      setTimeout(() => {
        nav.scrollTo({ left: 0, behavior: "smooth" });
      }, 450);
    }, 1200);
  }
}

// متغیرها و توابع راهنمای گام به گام تعاملی
state.tutorialStep = 0;
const tutorialSteps = [
  {
    title: "🎯 به تقویم روزانه خوش آمدید!",
    desc: "این برنامه هوشمند به شما کمک می‌کند تا فعالیت‌ها، اهداف، عادت‌ها، و حالات روحی خود را به سادگی مدیریت و تحلیل کنید. بیایید با هم یک گشت کوتاه در برنامه بزنیم تا سریع‌تر مسلط شوید."
  },
  {
    title: "🛠️ ساخت دسته‌بندی و شکلک‌های متحرک",
    desc: "در تب <b>مدیریت</b> می‌توانید موضوعات خود را با رنگ دلخواه بسازید. همچنین با زدن روی دکمه 🖼️ گالری در مدیریت، می‌توانید از بین ۲۰۰ اموجی متحرک سه بعدی (WebM) اختصاصی، شکلک زیبایی برای دسته‌هایتان قرار دهید!"
  },
  {
    title: "⏱️ ثبت فعالیت‌ها و سیستم زنده",
    desc: "شما می‌توانید فعالیت‌ها را به صورت دستی یا به صورت کاملاً زنده ثبت کنید. سیستم ثبت زنده به <b>تایمر هوشمند پومودورو</b> مجهز است. زمان لحظه‌ای تایمر زنده برای راحتی شما، بر روی عنوان سربرگ مرورگر (Tab Title) نیز نوشته می‌شود."
  },
  {
    title: "✔️ تودوهای ماندگار و عادت‌ها",
    desc: "تودوهای یک‌بار مصرفی که امروز تکمیل نکنید، به طور خودکار به فردا منتقل می‌شوند (Rollover) تا کارهای معوقه فراموش نشوند! عادت‌های ۷ روزه خود را نیز می‌توانید با یک کلیک ساده کنترل کنید."
  },
  {
    title: "📊 نمودارها و تحلیل زمانی",
    desc: "در تب <b>گزارش‌ها</b> زمان‌های سپری شده هر فعالیت را در ۳ قالب خطی، دایره‌ای یا ستونی فیلتر کرده و الگوهای تمرکزی را در نقشه حرارتی ماهانه ارزیابی کنید."
  }
];

window.openTutorial = function() {
  state.tutorialStep = 0;
  showTutorialStep();
  const modal = document.getElementById("tutorial-modal");
  if (modal) modal.style.display = "flex";
};

window.nextTutorialStep = function() {
  if (state.tutorialStep < tutorialSteps.length - 1) {
    state.tutorialStep++;
    showTutorialStep();
  } else {
    closeTutorial();
  }
};

window.prevTutorialStep = function() {
  if (state.tutorialStep > 0) {
    state.tutorialStep--;
    showTutorialStep();
  }
};

window.closeTutorial = function() {
  const modal = document.getElementById("tutorial-modal");
  if (modal) modal.style.display = "none";
  localStorage.setItem("planner_tutorial_seen", "true");
};

function showTutorialStep() {
  const step = tutorialSteps[state.tutorialStep];
  const titleEl = document.getElementById("tutorial-step-title");
  const descEl = document.getElementById("tutorial-step-desc");
  const prevBtn = document.getElementById("tutorial-prev");
  const nextBtn = document.getElementById("tutorial-next");
  const dotsEl = document.getElementById("tutorial-dots");
  
  if (titleEl) titleEl.innerHTML = step.title;
  if (descEl) descEl.innerHTML = step.desc;
  
  if (prevBtn) {
    prevBtn.style.visibility = state.tutorialStep === 0 ? "hidden" : "visible";
  }
  if (nextBtn) {
    nextBtn.textContent = state.tutorialStep === tutorialSteps.length - 1 ? "فهمیدم، شروع کار!" : "بعدی ›";
  }
  
  if (dotsEl) {
    dotsEl.innerHTML = tutorialSteps.map((_, i) => `
      <span style="
        width: 8px; height: 8px; border-radius: 50%;
        background: ${i === state.tutorialStep ? 'var(--accent)' : 'var(--border2)'};
        transition: background 0.2s;
      "></span>
    `).join('');
  }
}

// پیاده‌سازی متغیرهای صفحه گالری سوپابیس
state.galleryPage = 0;
state.galleryPageSize = 30;
state.currentSelectingPresetIdx = null;
state.currentSelectingCatId = null;

// باز کردن گالری اموجی‌های متحرک برای خلق‌وخو
window.openEmojiGallery = function(idx) {
  state.currentSelectingPresetIdx = idx;
  state.currentSelectingCatId = null;
  state.galleryPage = 0;
  const modal = document.getElementById("emoji-gallery-modal");
  if (modal) {
    modal.style.display = "flex";
    renderGalleryGrid();
  }
};

// باز کردن گالری اموجی‌های متحرک برای شکلک دسته‌بندی (موضوعات)
window.openCatEmojiPicker = function(catId) {
  state.currentSelectingCatId = catId;
  state.currentSelectingPresetIdx = null;
  state.galleryPage = 0;
  const modal = document.getElementById("emoji-gallery-modal");
  if (modal) {
    modal.style.display = "flex";
    renderGalleryGrid();
  }
};

// رندر کردن گالری ۲۰۰ تایی اموجی‌ها با قابلیت صفحه‌بندی هوشمند
window.renderGalleryGrid = function() {
  const grid = document.getElementById("gallery-grid");
  const label = document.getElementById("gallery-range-label");
  if (!grid || !label) return;

  grid.innerHTML = '';
  const start = state.galleryPage * state.galleryPageSize + 1;
  const end = Math.min(start + state.galleryPageSize - 1, 200);

  label.textContent = `نمایش شکلک‌های ${start} تا ${end} (از مجموع ۲۰۰)`;

  for (let i = start; i <= end; i++) {
    const numStr = String(i).padStart(3, '0');
    const fileUrl = `https://ipureiqnhgatigewbggj.supabase.co/storage/v1/object/public/emojis/${numStr}.webm`;

    const item = document.createElement('div');
    item.style.cssText = `
      aspect-ratio: 1;
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
      transition: all 0.2s;
    `;

    item.onmouseenter = () => { item.style.borderColor = 'var(--accent)'; item.style.transform = 'scale(1.05)'; };
    item.onmouseleave = () => { item.style.borderColor = 'var(--border)'; item.style.transform = 'none'; };

    item.innerHTML = `
      <video src="${fileUrl}" autoplay loop muted playsinline style="width:85%; height:85%; object-fit:cover; pointer-events:none; border-radius:50%;"></video>
      <span style="position:absolute; bottom:2px; font-size:8px; color:var(--muted); font-family:monospace; background:rgba(0,0,0,0.35); padding:0 3px; border-radius:3px;">${numStr}</span>
    `;

    item.onclick = () => {
      if (state.currentSelectingPresetIdx !== null && state.currentSelectingPresetIdx !== undefined) {
        const idx = state.currentSelectingPresetIdx;
        state.moodPresets[idx].type = 'webm';
        state.moodPresets[idx].value = fileUrl;
        save("planner_mood_presets", state.moodPresets);
        saveCloud();
        render();
        window.showToast("شکلک خلق و خو بروزرسانی شد.", "success");
      } else if (state.currentSelectingCatId) {
        const catId = state.currentSelectingCatId;
        const cat = state.cats.find(c => c.id === catId);
        if (cat) {
          cat.emoji = fileUrl;
          save("planner_cats", state.cats);
          saveCloud();
          render();
          window.showToast("شکلک دسته‌بندی بروزرسانی شد.", "success");
        }
      }
      
      state.currentSelectingPresetIdx = null;
      state.currentSelectingCatId = null;
      document.getElementById("emoji-gallery-modal").style.display = "none";
    };

    grid.appendChild(item);
  }
};

// رویدادهای مدال گالری سوپابیس
safeBindEvent("close-gallery-modal", "onclick", () => {
  document.getElementById("emoji-gallery-modal").style.display = "none";
  state.currentSelectingPresetIdx = null;
  state.currentSelectingCatId = null;
});

safeBindEvent("gallery-prev", "onclick", () => {
  if (state.galleryPage > 0) {
    state.galleryPage--;
    renderGalleryGrid();
  }
});

safeBindEvent("gallery-next", "onclick", () => {
  const maxPages = Math.ceil(200 / state.galleryPageSize);
  if (state.galleryPage + 1 < maxPages) {
    state.galleryPage++;
    renderGalleryGrid();
  }
});

// مدیریت تغییر تب‌ها
window.switchTab = function(tabId) {
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-section").forEach(s => s.classList.remove("active"));
  document.querySelector(`.nav-btn[data-tab="${tabId}"]`)?.classList.add("active");
  const targetSec = document.getElementById(tabId);
  if (targetSec) {
    targetSec.classList.add("active");
  }
};

document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    switchTab(btn.getAttribute("data-tab"));
  });
});

// مدیریت تاریخ روزانه
safeBindEvent("prev-day", "onclick", () => { shiftDay(-1); });
safeBindEvent("next-day", "onclick", () => { shiftDay(1); });
safeBindEvent("btn-today", "onclick", () => { state.curDate = getLocalDateStr(); render(); });

function shiftDay(n){
  const [y,mo,d] = state.curDate.split("-").map(Number);
  const dt = new Date(y, mo - 1, d + n);
  state.curDate = dt.getFullYear() + "-" + pad(dt.getMonth() + 1) + "-" + pad(dt.getDate());
  render();
}

safeBindEvent("map-prev", "onclick", () => {
  const [y,mo] = state.mapMonth.split("-").map(Number);
  const dt = new Date(y, mo - 2, 1); 
  state.mapMonth = dt.getFullYear() + "-" + pad(dt.getMonth() + 1); 
  render();
});

safeBindEvent("map-next", "onclick", () => {
  const [y,mo] = state.mapMonth.split("-").map(Number);
  const dt = new Date(y, mo, 1); 
  state.mapMonth = dt.getFullYear() + "-" + pad(dt.getMonth() + 1); 
  render();
});

safeBindEvent("map-cat-select", "onchange", () => { render(); });

// رویداد سوییچ روشن/خاموش یکپارچه‌سازی و گروه‌بندی کارهای هم‌موضوع در تایم‌لاین
safeBindEvent("timeline-group-toggle", "onchange", (e) => {
  state.groupTimelinePref = e.target.checked;
  save("planner_group_timeline_pref", state.groupTimelinePref);
  saveCloud();
  render();
});

// چک‌باکس انتخاب همه موضوعات در بخش گزارش‌ها
safeBindEvent("report-select-all", "onchange", (e) => {
  if (e.target.checked) {
    state.selectedReportCats = state.cats.map(c => c.id);
  } else {
    state.selectedReportCats = [];
  }
  save("planner_selected_report_cats", state.selectedReportCats);
  saveCloud();
  render();
});

// رویدادهای تغییر تم و تغییر رنگ دلخواه از تب تنظیمات
safeBindEvent("setting-theme-select", "onchange", (e) => {
  state.theme = e.target.value; 
  save("planner_theme", state.theme); 
  saveCloud(); 
  applyTheme();
  window.showToast("تم برنامه تغییر یافت.", "success");
});

safeBindEvent("setting-accent-picker", "onchange", (e) => {
  state.accentColor = e.target.value; 
  save("planner_accent", state.accentColor); 
  saveCloud(); 
  applyTheme();
  window.showToast("رنگ شاخص برنامه تغییر یافت.", "success");
});

// رویداد جدید تغییر استایل ناوبری گوشی در تنظیمات
safeBindEvent("setting-mobile-nav", "on
