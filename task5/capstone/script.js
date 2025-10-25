/* Advanced Weather App — Sunny & Rainy days visual */
const apiKey = window.__OWM_API_KEY__ || "37a12fda382291b85c7f20a4b0f16965";
const els = {
  cityInput: document.getElementById('cityInput'),
  searchBtn: document.getElementById('searchBtn'),
  locationBtn: document.getElementById('locationBtn'),
  unitToggle: document.getElementById('unitToggle'),
  alert: document.getElementById('alert'),
  currentCard: document.getElementById('current'),
  currentSkel: document.querySelector('.current-skel'),
  currentInner: document.querySelector('.current-inner'),
  place: document.getElementById('place'),
  time: document.getElementById('time'),
  icon: document.getElementById('icon'),
  temp: document.getElementById('temp'),
  desc: document.getElementById('desc'),
  feels: document.getElementById('feels'),
  humidity: document.getElementById('humidity'),
  wind: document.getElementById('wind'),
  pressure: document.getElementById('pressure'),
  sunrise: document.getElementById('sunrise'),
  sunset: document.getElementById('sunset'),
  forecast: document.getElementById('forecast'),
  forecastTpl: document.getElementById('forecastItemTpl')
};

let state = { units: 'metric', lastCoords: null };

const weatherMap = {
  Clear: { emoji: '☀️', bg: 'linear-gradient(135deg,#fceabb,#f8b500)' },
  Rain: { emoji: '🌧️', bg: 'linear-gradient(135deg,#314755,#26a0da)' },
  Clouds: { emoji: '☁️', bg: 'linear-gradient(135deg,#757f9a,#d7dde8)' },
  Snow: { emoji: '❄️', bg: 'linear-gradient(135deg,#83a4d4,#b6fbff)' },
  Thunderstorm: { emoji: '⛈️', bg: 'linear-gradient(135deg,#232526,#414345)' },
  Mist: { emoji: '🌫️', bg: 'linear-gradient(135deg,#606c88,#3f4c6b)' }
};

const qs = (s, el = document) => el.querySelector(s);
const fmtTime = (ts, tzSec) => { const d = new Date((ts + tzSec) * 1000); return d.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit'}); };
const fmtDate = (ts, tzSec) => { const d = new Date((ts + tzSec) * 1000); return d.toLocaleDateString([], { weekday:'short', month:'short', day:'numeric'}); };
const unitSymbol = () => state.units==='metric'?'°C':'°F';
const speedUnit = () => state.units==='metric'?'m/s':'mph';

function showAlert(msg){ els.alert.textContent=msg; els.alert.classList.remove('hidden'); }
function hideAlert(){ els.alert.classList.add('hidden'); els.alert.textContent=''; }
function showLoading(){ els.currentSkel.classList.remove('hidden'); els.currentInner.classList.add('hidden'); }
function showCurrent(){ els.currentSkel.classList.add('hidden'); els.currentInner.classList.remove('hidden'); }

function setTheme(main, isDay){
  const w = weatherMap[main] || { emoji:'❓', bg:'radial-gradient(1200px 800px at 20% 10%, #203a72 0%, #0b1020 50%, #080a14 100%)' };
  document.body.style.background = w.bg;
}

async function fetchJSON(url){
  const res = await fetch(url);
  if(!res.ok){ const text = await res.text().catch(()=>''); throw new Error('Request failed: '+res.status+' '+text); }
  return res.json();
}

function buildWeatherUrl(queryParams){
  return `https://api.openweathermap.org/data/2.5/weather?${new URLSearchParams({...queryParams, appid:apiKey, units:state.units})}`;
}
function buildForecastUrl(queryParams){
  return `https://api.openweathermap.org/data/2.5/forecast?${new URLSearchParams({...queryParams, appid:apiKey, units:state.units})}`;
}

els.searchBtn.addEventListener('click', ()=>{ const city=els.cityInput.value.trim(); if(!city)return; searchByCity(city); });
els.cityInput.addEventListener('keydown',(e)=>{ if(e.key==='Enter') els.searchBtn.click(); });
els.locationBtn.addEventListener('click', ()=>{
  if(!navigator.geolocation) return showAlert('Geolocation not supported');
  hideAlert();
  navigator.geolocation.getCurrentPosition(({coords})=>{ const {latitude:lat, longitude:lon}=coords; state.lastCoords={lat,lon}; loadWeather({lat,lon}); },
  ()=>showAlert('Location access denied'), { enableHighAccuracy:true, timeout:10000, maximumAge:60000 });
});
els.unitToggle.addEventListener('click', ()=>{
  state.units = state.units==='metric'?'imperial':'metric';
  els.unitToggle.textContent = state.units==='metric'?'°C':'°F';
  if(state.lastCoords) loadWeather(state.lastCoords);
  else if(els.place.textContent && els.place.textContent!=='—') searchByCity(els.place.textContent);
});

async function searchByCity(city){
  try{ hideAlert(); showLoading(); const url=buildWeatherUrl({q:city}); const data=await fetchJSON(url); const {coord:{lat,lon}}=data; state.lastCoords={lat,lon}; renderCurrent(data);
  const fData=await fetchJSON(buildForecastUrl({lat,lon})); renderForecast(fData); }catch(err){ showAlert(err.message); }finally{ showCurrent(); }
}

async function loadWeather({lat,lon}){
  try{ hideAlert(); showLoading(); const data=await fetchJSON(buildWeatherUrl({lat,lon})); renderCurrent(data);
  const fData=await fetchJSON(buildForecastUrl({lat,lon})); renderForecast(fData); }catch(err){ showAlert(err.message); }finally{ showCurrent(); }
}

function renderCurrent(data){
  const { name, sys:{country,sunrise,sunset}, timezone } = data;
  const { temp, feels_like, humidity, pressure } = data.main;
  const { speed } = data.wind;
  const { main, description, icon } = data.weather[0];
  const isDay = icon.endsWith('d');
  els.place.textContent = `${name}, ${country}`;
  els.time.textContent = fmtDate(data.dt, timezone)+' • '+fmtTime(data.dt, timezone);
  els.icon.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
  els.icon.alt = description;
  els.temp.textContent = Math.round(temp);
  qs('.unit').textContent = unitSymbol();
  els.desc.textContent = description;
  els.feels.textContent = Math.round(feels_like)+unitSymbol();
  els.humidity.textContent = humidity+'%';
  els.wind.textContent = speed+' '+speedUnit();
  els.pressure.textContent = pressure+' hPa';
  els.sunrise.textContent = fmtTime(sunrise, timezone);
  els.sunset.textContent = fmtTime(sunset, timezone);
  setTheme(main,isDay);
}

function groupDailyFrom3h(list){
  const byDay=new Map();
  for(const item of list){
    const day=new Date(item.dt*1000).toISOString().slice(0,10);
    if(!byDay.has(day)) byDay.set(day,[]);
    byDay.get(day).push(item);
  }
  const days=[];
  for(const [day,items] of byDay){
    let min=Infinity,max=-Infinity,pick=items[0];
    for(const it of items){ const t=it.main.temp; if(t<min) min=t; if(t>max) max=t;
      const h=new Date(it.dt*1000).getHours(); if(Math.abs(h-12)<Math.abs(new Date(pick.dt*1000).getHours()-12)) pick=it; }
    days.push({day,min,max,icon:pick.weather[0].icon,main:pick.weather[0].main,desc:pick.weather[0].description});
  }
  const todayISO = new Date().toISOString().slice(0,10);
  return days.filter(d=>d.day>todayISO).slice(0,5);
}

function renderForecast(fData){
  const days=groupDailyFrom3h(fData.list);
  els.forecast.innerHTML='';
  for(const d of days){
    const node=els.forecastTpl.content.firstElementChild.cloneNode(true);
    const dt=new Date(d.day+'T00:00:00');
    node.querySelector('.f-day').textContent=dt.toLocaleDateString([], { weekday:'short' });
    node.querySelector('.f-icon').src=`https://openweathermap.org/img/wn/${d.icon}@2x.png`;
    node.querySelector('.f-icon').alt = d.main;
    node.querySelector('.max').textContent=Math.round(d.max)+'°';
    node.querySelector('.min').textContent=Math.round(d.min)+'°';
    els.forecast.appendChild(node);
  }
}

(function init(){ searchByCity('Hyderabad'); })();

