// js/planner.js
// ... (سایر کدها)

window.toggleTodo = (id) => {
  const t = state.todos.find(x => x.id === id);
  if (t) {
    if (t.isDaily) {
      t.doneDates = t.doneDates || {};
      t.doneDates[state.curDate] = !t.doneDates[state.curDate];
    } else {
      t.done = !t.done;
    }
    save("planner_todos", state.todos);
    saveCloud();
    render(); // حالا تودو ناپدید نمی‌شود، فقط استایل می‌گیرد
  }
};

window.deleteTodo = (id) => { 
  state.todos = state.todos.filter(x => x.id !== id); 
  save("planner_todos", state.todos); 
  saveCloud(); 
  render(); 
};

// مدیریت روزهای روتین در پنل
const rtDays = document.querySelectorAll('.rt-day-btn');
rtDays.forEach(btn => {
  btn.onclick = () => {
    btn.classList.toggle('active');
    const day = btn.getAttribute('data-day');
    if(btn.classList.contains('active')) {
      if(!state.selectedRtDays.includes(day)) state.selectedRtDays.push(day);
    } else {
      state.selectedRtDays = state.selectedRtDays.filter(d => d !== day);
    }
  };
});
