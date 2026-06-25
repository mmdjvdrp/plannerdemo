// js/storage.js
import { supabase } from "./supabase.js";

function pad(n){ return String(n).padStart(2,'0'); }
function getLocalDateStr() {
  const d = new Date();
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

export function load(k, def){
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : def;
  } catch(e) {
    return def;
  }
}

export function save(k, v){
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch(e) {}
}

export const state = {
  events: load('planner_ev', []),
  cats: load('planner_cats', []),
  routines: load('planner_routines', []), 
  goals: load('planner_goals', []),
  todos: load('planner_todos', []), 
  habits: load('planner_habits', []), 
  habitLogs: load('planner_habitLogs', {}), 
  moods: load('planner_moods', {}), 
  liveSession: load('planner_live', null),
  theme: load('planner_theme', 'auto'),
  accentColor: load('planner_accent', '#7c5cfc'), 
  calendarPref: load('planner_calendar_pref', 'jalali'), 
  timeFormatPref: load('planner_time_format_pref', 'hour-min'), 
  weekStartPref: load('planner_week_start_pref', 'sat'), 
  chartTypePref: load('planner_chart_type_pref', 'doughnut'), 
  groupTimelinePref: load('planner_group_timeline_pref', true), 
  selectedReportCats: load('planner_selected_report_cats', []), 
  mobileNavStyle: load('planner_mobile_nav_style', 'grid'),
  pomodoroWorkPref: load('planner_pomo_work_pref', 25),
  pomodoroBreakPref: load('planner_pomo_break_pref', 5),
  moodPresets: load('planner_mood_presets', [
    { level: '1', type: 'text', value: '🤩', label: 'بسیار عالی' },
    { level: '2', type: 'text', value: '😊', label: 'خوب و آرام' },
    { level: '3', type: 'text', value: '😐', label: 'معمولی و تخت' },
    { level: '4', type: 'text', value: '😔', label: 'دلگیر و غمگین' },
    { level: '5', type: 'text', value: '😡', label: 'عصبانی یا کلافه' }
  ]),
  curDate: getLocalDateStr(),
  mapMonth: getLocalDateStr().slice(0, 7),
  editingEventId: null,
  activeView: 'daily',
  selectedRtDays: [],
  activeTagFilter: null
};

export async function saveCloud(){
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if(!user) return;
    
    await supabase.from("planner_data").upsert({
      user_id: user.id,
      data: { ...state }
    }, { onConflict: 'user_id' });
  } catch (err) { console.error("Error saving to cloud", err); }
}

export async function loadCloud(){
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if(!user) return;
    const { data } = await supabase.from("planner_data").select("data").eq("user_id", user.id).maybeSingle();
    
    if(data && data.data){
      Object.assign(state, data.data);
      // بروزرسانی LocalStorage
      Object.keys(data.data).forEach(key => {
        save('planner_' + key, data.data[key]);
      });
    }
  } catch (err) { console.error("Error loading cloud data", err); }
}
