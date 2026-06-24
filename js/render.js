// js/render.js
import { state, save, saveCloud } from "./storage.js";
import { fmtDateLabel, fmtTime, fmtDur, escHtml, pad, getNow, parseTime } from "./helpers.js";

// ... [سایر بخش‌های کد که تغییر نکرده‌اند حفظ شود] ...

export function renderCats(){
  const sel = document.getElementById('cat-select');
  const manager = document.getElementById('cat-manager');
  if(!sel || !manager) return;

  const currentVal = sel.value;
  sel.innerHTML = '';
  manager.innerHTML = '';
  
  if(!state.cats.length){
    sel.innerHTML = '<option disabled selected>اول موضوع بسازید</option>';
    return;
  }
  
  state.cats.forEach(c => {
    // اصلاح نحوه خواندن ایموجی/لینک
    const emoji = c.emoji || '📅';
    const isUrl = emoji.startsWith('http');
    const displayEmoji = isUrl ? '🎥' : emoji;

    // آپشن‌های سلکت
    const o = document.createElement('option'); 
    o.value = c.id; 
    o.textContent = `${displayEmoji} ${c.name}`;
    sel.appendChild(o);

    // مدیریت لیست در تب مدیریت
    const item = document.createElement('div');
    item.className = 'cat-item'; 
    item.style.setProperty('--cat-color', c.color);
    
    // رندر ایموجی در لیست (اصلاح نمایش ایموجی‌های WebM)
    const emojiHtml = isUrl 
      ? `<video src="${emoji}" autoplay loop muted playsinline style="width:24px; height:24px; object-fit:cover; border-radius:50%; pointer-events:none;"></video>`
      : `<span style="font-size:16px;">${emoji}</span>`;

    item.innerHTML = `
      <span class="cat-swatch"></span>
      <div class="cat-emoji-preview">${emojiHtml}</div>
      <span class="cat-name">${escHtml(c.name)}</span>
      <button type="button" class="btn-icon" onclick="window.openCatEmojiPicker('${c.id}')" style="width:30px; height:30px; font-size:14px;">🖼️</button>
      <input class="cat-color-edit" type="color" value="${c.color}">
      <button class="cat-delete" type="button">✕</button>
    `;
    
    // ذخیره تغییرات رنگ
    item.querySelector('.cat-color-edit').onchange = (e) => {
      c.color = e.target.value; 
      save('planner_cats', state.cats); 
      saveCloud(); 
      render();
    };
    
    item.querySelector('.cat-delete').onclick = (e) => { e.stopPropagation(); window.delCat(c.id); };
    manager.appendChild(item);
  });
  
  if (currentVal && state.cats.some(c => c.id === currentVal)) sel.value = currentVal;
}

// ... [بقیه توابع renderTimeline, renderReport و غیره] ...

// تابع جدید برای اطمینان از اعمال تغییرات ایموجی
export function updateCatEmoji(catId, newEmojiValue) {
  const cat = state.cats.find(c => c.id === catId);
  if (cat) {
    cat.emoji = newEmojiValue;
    save('planner_cats', state.cats);
    saveCloud();
    render(); // رندر مجدد برای اعمال تغییرات در همه بخش‌ها
  }
}

// ...
