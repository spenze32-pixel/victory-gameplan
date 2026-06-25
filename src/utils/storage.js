const STORAGE_KEY='victory_gameplan_sessions_v2';
export function getSessions(){try{const d=localStorage.getItem(STORAGE_KEY);if(!d)return[];const p=JSON.parse(d);return Array.isArray(p)?p:[];}catch{return[];}}
export function saveSessions(s){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(s));}catch(e){console.error(e);}}
export function addSession(s){const ss=getSessions();ss.unshift(s);saveSessions(ss);}
export function updateSession(id,u){const ss=getSessions();const i=ss.findIndex(s=>s.id===id);if(i!==-1){ss[i]={...u,updatedAt:new Date().toISOString()};saveSessions(ss);}}
export function deleteSession(id){saveSessions(getSessions().filter(s=>s.id!==id));}
export function getSessionById(id){return getSessions().find(s=>s.id===id)||null;}
export function generateId(){return Date.now()+'-'+Math.random().toString(36).slice(2,9);}