export const todayStr  = () => new Date().toISOString().slice(0, 10);
export const fmtDate   = d => new Date(d+"T00:00:00").toLocaleDateString("en-SG",{weekday:"short",day:"numeric",month:"short"});
export const fmtMonth  = d => new Date(d+"T00:00:00").toLocaleDateString("en-SG",{month:"long",year:"numeric"});
export const fmtShort  = d => new Date(d+"T00:00:00").toLocaleDateString("en-SG",{day:"numeric",month:"short"});

export const startOfWeek = d => {
  const dt = new Date(d+"T00:00:00");
  dt.setDate(dt.getDate()-dt.getDay());
  return dt.toISOString().slice(0,10);
};
export const addDays = (d,n) => {
  const dt = new Date(d+"T00:00:00");
  dt.setDate(dt.getDate()+n);
  return dt.toISOString().slice(0,10);
};
export const weekDays  = s => Array.from({length:7},(_,i)=>addDays(s,i));
export const monthDays = ym => {
  const [y,m] = ym.split("-").map(Number);
  return Array.from({length:new Date(y,m,0).getDate()},(_,i)=>`${ym}-${String(i+1).padStart(2,"0")}`);
};

export const fuzzyMatch = (text,query) => {
  const t = text.toLowerCase().replace(/\s+/g," ").trim();
  const q = query.toLowerCase().replace(/\s+/g," ").trim();
  if (!q) return true;
  if (t.includes(q)) return true;
  return q.split(" ").filter(Boolean).every(w=>t.includes(w));
};

export const totals = entries => entries.reduce(
  (a,e)=>({cal:a.cal+(e.cal||0),pro:a.pro+(e.pro||0),carb:a.carb+(e.carb||0),fat:a.fat+(e.fat||0)}),
  {cal:0,pro:0,carb:0,fat:0}
);

export const haptic = (style="light") => {
  if (navigator?.vibrate) navigator.vibrate(style==="light"?10:style==="medium"?20:40);
};

export const MEAL_TYPES = ["Breakfast","Lunch","Dinner","Snack"];
export const PROFILE_KEY = "nutrisg_profile_v2";
export const ACCENT_KEY  = "nutrisg_accent_v1";
export const DARK_KEY    = "nutrisg_dark_v1";
export const GOAL_KEY    = "nutrisg_goal_v1";
export const WATER_KEY   = "nutrisg_water_v1";

export const ACCENTS = [
  {name:"Green",  value:"#34c759"},
  {name:"Blue",   value:"#007aff"},
  {name:"Purple", value:"#af52de"},
  {name:"Orange", value:"#ff9500"},
  {name:"Pink",   value:"#ff2d55"},
  {name:"Teal",   value:"#5ac8fa"},
];
