import { supabase } from "./supabase.js";
import { loadCloud } from "./storage.js";
import { render } from "./ui.js";

// مدیریت جریان احراز هویت با Supabase به عنوان مرجع اصلی برنامه
supabase.auth.onAuthStateChange(async (event, session) => {
  const user = session?.user;
  if (!user) {
    // جلوگیری از ریدایرکت مکرر در صورت وجود توکن بازیابی رمز عبور در آدرس بار
    if (!window.location.hash.includes("type=recovery") && !window.location.search.includes("type=recovery")) {
      window.location.href = "./login.html";
    }
    return;
  }
  await loadCloud();
  render();
});
