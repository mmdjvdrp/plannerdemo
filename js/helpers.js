// js/helpers.js
export function pad(n){ return String(n).padStart(2,'0'); }

export function getLocalDateStr() {
  const d = new Date();
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

export function escHtml(s){ 
  if(!s) return "";
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); 
}

// سایر توابع پارس زمان حفظ شود...
