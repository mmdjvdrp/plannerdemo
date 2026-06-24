<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <link rel="manifest" href="./manifest.json">
  <link rel="icon" type="image/png" sizes="32x32" href="./icons/favicon.png">
  <link rel="apple-touch-icon" href="./icons/icon-192.png">
  <meta name="theme-color" content="#111827">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>تقویم روزانه</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="./css/style.css">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<style>
/* بهبود UI روتین‌ها */
.rt-day-btn {
  width: 40px; height: 40px; border-radius: 10px; font-size: 13px; font-weight: 700;
  border: 1px solid var(--border2); background: var(--surface);
  color: var(--muted); cursor: pointer; transition: all 0.2s;
}
.rt-day-btn.active { background: var(--accent); color: white; border-color: var(--accent); }

/* اصلاح نمایش تودوها */
.todo-title.done { text-decoration: line-through; opacity: 0.6; }
.todo-title.recurring { font-weight: 700; color: var(--accent); }

/* مدال راهنما */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: none; align-items: center; justify-content: center; padding: 20px; }
.modal-content { background: var(--surface); padding: 25px; border-radius: 20px; max-width: 400px; width: 100%; text-align: center; }

@media(max-width: 768px) {
  body { padding: 12px 8px; }
  .wrap { padding-bottom: 190px !important; } 
  .header { flex-direction: column; align-items: center; text-align: center; gap: 14px; }
  #date-label { font-size: 13px; padding: 6px 4px; }
  .app-nav-container { position: fixed; bottom: 0; left: 0; right: 0; border-radius: 20px 20px 0 0; z-index: 1000; background: var(--surface); padding: 10px 0; box-shadow: 0 -5px 25px rgba(0,0,0,0.3); }
  .app-nav { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 8px !important; padding: 4px 12px !important; }
}

.tab-section { display: none; animation: fadeIn 0.3s ease; }
.tab-section.active { display: block; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.nav-btn { flex: 1; padding: 12px; background: transparent; border: none; border-radius: 10px; color: var(--muted); font-family: inherit; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; }
.nav-btn.active { background: var(--accent-glow); color: var(--accent); font-weight: 700; }
</style>
</head>
<body>

<div class="wrap">
  <!-- Header -->
  <div class="header">
    <div class="logo">
      <span class="logo-dot"></span> تقویم روزانه
    </div>
    <div class="date-nav">
      <div style="display:flex; align-items:center; gap:8px">
        <span id="welcome-msg" style="font-size:13px; color:var(--muted)"></span>
        <button id="notify-enable-btn" style="padding:6px 12px; border-radius:8px; border:1px solid var(--border2); background:var(--surface2); color:var(--muted); cursor:pointer; font-size:11px;">🔔 اعلان‌ها</button>
        <button id="logout-btn" style="padding:6px 14px; border-radius:8px; border:1px solid var(--border2); background:var(--surface2); color:var(--muted); cursor:pointer; font-size:12px;">خروج</button>
      </div>
      <button id="prev-day">&#8249;</button>
      <div id="date-label"></div>
      <button id="next-day">&#8250;</button>
      <button class="btn-today" id="btn-today">امروز</button>
    </div>
  </div>

  <div class="app-nav-container">
    <nav class="app-nav">
      <button class="nav-btn active" data-tab="tab-timeline">📅 تایم‌لاین</button>
      <button class="nav-btn" data-tab="tab-habits">✔️ کارها</button>
      <button class="nav-btn" data-tab="tab-journal">📖 دفترچه</button>
      <button class="nav-btn" data-tab="tab-add">⚙️ مدیریت</button>
      <button class="nav-btn" data-tab="tab-reports">📊 گزارش</button>
      <button class="nav-btn" data-tab="tab-settings">🛠️ تنظیمات</button>
    </nav>
  </div>

  <div class="tab-container">
    <div id="tab-timeline" class="tab-section active">
      <div class="card"><div class="card-title">تایم‌لاین &mdash; <span id="tl-date"></span></div><div id="timeline"></div></div>
    </div>

    <div id="tab-habits" class="tab-section">
      <div class="card"><div class="card-title">کارهای روزانه</div><input type="text" id="todo-input" placeholder="افزودن کار..."><div id="todo-list"></div></div>
      <div class="card"><div class="card-title">عادت‌ها</div><div id="habit-list"></div></div>
    </div>

    <div id="tab-journal" class="tab-section">
      <div class="card"><div class="card-title">حال و هوا</div><div id="mood-emojis"></div></div>
      <div class="card"><textarea id="journal-textarea" style="width:100%; height:150px;"></textarea><button id="save-journal-btn" class="btn-primary">ذخیره</button></div>
    </div>

    <div id="tab-add" class="tab-section">
      <div class="card">
        <div class="card-title">مدیریت روتین‌ها</div>
        <div id="rt-days-selector" style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;">
          <button type="button" class="rt-day-btn" data-day="0">ش</button>
          <button type="button" class="rt-day-btn" data-day="1">ی</button>
          <button type="button" class="rt-day-btn" data-day="2">د</button>
          <button type="button" class="rt-day-btn" data-day="3">س</button>
          <button type="button" class="rt-day-btn" data-day="4">چ</button>
          <button type="button" class="rt-day-btn" data-day="5">پ</button>
          <button type="button" class="rt-day-btn" data-day="6">ج</button>
        </div>
        <div id="rt-list"></div>
      </div>
    </div>

    <div id="tab-reports" class="tab-section">
      <div class="card"><canvas id="report-chart"></canvas><div id="report-grid"></div></div>
    </div>

    <div id="tab-settings" class="tab-section">
      <div class="card">
        <div class="card-title">تنظیمات</div>
        <select id="setting-theme-select"><option value="auto">خودکار</option><option value="dark">تیره</option><option value="light">روشن</option></select>
      </div>
    </div>
  </div>
</div>

<!-- مدال راهنما -->
<div class="modal-overlay" id="tutorial-modal">
  <div class="modal-content">
    <h3>خوش آمدید!</h3>
    <p>برای شروع کافیست فعالیت‌های خود را ثبت کنید...</p>
    <button class="btn-primary" onclick="document.getElementById('tutorial-modal').style.display='none'">متوجه شدم</button>
  </div>
</div>

<script type="module" src="./js/planner.js"></script>
</body>
</html>
