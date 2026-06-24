import { auth, db, ref, set } from "./firebase.js";
import { events, cats, save, saveCloud } from "./storage.js";
import { render } from "./ui.js";

export function createEvent({ title, cat, start, end }){
  if(!title || !start || !end){
    return false;
  }
  const ev = {
    id: Date.now().toString(),
    title,
    cat,
    start,
    end
  };
  events.push(ev);
  save("events", events);
  saveCloud();
  render();
  return true;
}

export function delEv(id){
  const i = events.findIndex(e => e.id === id);
  if(i === -1) return;
  events.splice(i, 1);
  save("events", events);
  saveCloud();
  render();
}

export function delCat(name){
  const i = cats.findIndex(c => c.name === name);
  if(i === -1) return;
  cats.splice(i, 1);
  save("cats", cats);
  saveCloud();
  render();
}

export function clearEventForm(){
  const titleEl = document.getElementById("ev-title");
  const startEl = document.getElementById("ev-start");
  const endEl = document.getElementById("ev-end");
  if (titleEl) titleEl.value = "";
  if (startEl) startEl.value = "";
  if (endEl) endEl.value = "";
}
