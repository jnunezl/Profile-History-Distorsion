// ── Palabras aleatorias genéricas ──────────────────────────────────────────
const RANDOM_WORDS = {
  es: ["sol","mar","fuego","tierra","viento","luna","río","bosque","ciudad","montaña",
       "tiempo","amor","sueño","vida","noche","día","cielo","agua","música","arte",
       "ciencia","historia","viaje","color","luz","sombra","sabor","sonido","forma","poder"],
  en: ["sun","sea","fire","earth","wind","moon","river","forest","city","mountain",
       "time","love","dream","life","night","day","sky","water","music","art",
       "science","history","journey","color","light","shadow","flavor","sound","shape","power"],
  fr: ["soleil","mer","feu","terre","vent","lune","rivière","forêt","ville","montagne",
       "temps","amour","rêve","vie","nuit","jour","ciel","eau","musique","art",
       "science","histoire","voyage","couleur","lumière","ombre","saveur","son","forme","pouvoir"],
  de: ["Sonne","Meer","Feuer","Erde","Wind","Mond","Fluss","Wald","Stadt","Berg",
       "Zeit","Liebe","Traum","Leben","Nacht","Tag","Himmel","Wasser","Musik","Kunst",
       "Wissenschaft","Geschichte","Reise","Farbe","Licht","Schatten","Geschmack","Klang","Form","Kraft"],
  zh: ["太阳","大海","火焰","大地","风","月亮","河流","森林","城市","山脉",
       "时间","爱情","梦想","生命","夜晚","白天","天空","水","音乐","艺术",
       "科学","历史","旅行","颜色","光","影","味道","声音","形状","力量"],
  pt: ["sol","mar","fogo","terra","vento","lua","rio","floresta","cidade","montanha",
       "tempo","amor","sonho","vida","noite","dia","céu","água","música","arte",
       "ciência","história","viagem","cor","luz","sombra","sabor","som","forma","poder"],
  it: ["sole","mare","fuoco","terra","vento","luna","fiume","foresta","città","montagna",
       "tempo","amore","sogno","vita","notte","giorno","cielo","acqua","musica","arte",
       "scienza","storia","viaggio","colore","luce","ombra","sapore","suono","forma","potere"],
  ru: ["солнце","море","огонь","земля","ветер","луна","река","лес","город","гора",
       "время","любовь","мечта","жизнь","ночь","день","небо","вода","музыка","искусство",
       "наука","история","путешествие","цвет","свет","тень","вкус","звук","форма","сила"]
};

// Mapas de configuración por idioma
const WIKI_LANG  = { es:"es", en:"en", fr:"fr", de:"de", zh:"zh", pt:"pt", it:"it", ru:"ru" };
const TRENDS_GEO = { es:"ES", en:"US", fr:"FR", de:"DE", zh:"TW", pt:"BR", it:"IT", ru:"RU" };
const TRENDS_HL  = { es:"es", en:"en", fr:"fr", de:"de", zh:"zh-TW", pt:"pt-BR", it:"it", ru:"ru" };
const ITUNES_CC  = { es:"es", en:"us", fr:"fr", de:"de", zh:"cn", pt:"br", it:"it", ru:"ru" };

const ENGINES = {
  google:     "https://www.google.com/search?q=",
  bing:       "https://www.bing.com/search?q=",
  duckduckgo: "https://duckduckgo.com/?q=",
  yandex:     "https://yandex.com/search/?text="
};

const TIME_OPTIONS = [
  { value: 1,    label: "1 segundo"   },
  { value: 2,    label: "2 segundos"  },
  { value: 5,    label: "5 segundos"  },
  { value: 10,   label: "10 segundos" },
  { value: 30,   label: "30 segundos" },
  { value: 60,   label: "1 minuto"    },
  { value: 120,  label: "2 minutos"   },
  { value: 300,  label: "5 minutos"   },
  { value: 600,  label: "10 minutos"  },
  { value: 1800, label: "30 minutos"  },
];

// ── Caché de fuentes externas ──────────────────────────────────────────────
let cache = { trends: { es: [], en: [], ts: 0 }, itunes: { es: [], en: [], ts: 0 } };
const TTL = 30 * 60 * 1000; // 30 min

// ── Fuente 1: Wikipedia ────────────────────────────────────────────────────
async function fromWikipedia(lang) {
  const l = WIKI_LANG[lang] || "es";
  try {
    const res  = await fetch(`https://${l}.wikipedia.org/api/rest_v1/page/random/summary`);
    const data = await res.json();
    if (data && data.title) return data.title;
  } catch(e) {}
  return null;
}

// ── Fuente 2: Google Trends RSS ────────────────────────────────────────────
async function loadTrends(lang) {
  const now = Date.now();
  if (cache.trends[lang] && cache.trends[lang].length > 0 && (now - cache.trends.ts) < TTL) return;
  if (!cache.trends[lang]) cache.trends[lang] = [];
  const geo = TRENDS_GEO[lang] || "ES";
  const hl  = TRENDS_HL[lang]  || "es";
  try {
    const rssUrl = `https://trends.google.com/trending/rss?geo=${geo}&hl=${hl}`;
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
    const res    = await fetch(apiUrl);
    const data   = await res.json();
    if (data.status === "ok" && data.items && data.items.length > 0) {
      cache.trends[lang] = data.items.map(i => i.title).filter(Boolean);
      cache.trends.ts    = now;
    }
  } catch(e) {}
}

async function fromTrends(lang) {
  const available = Object.keys(TRENDS_GEO);
  const l = (lang === "all") ? available[Math.floor(Math.random()*available.length)] : lang;
  await loadTrends(l);
  if (cache.trends[l].length > 0) {
    return cache.trends[l][Math.floor(Math.random() * cache.trends[l].length)];
  }
  return null;
}

// ── Fuente 3: Palabras aleatorias ──────────────────────────────────────────
function fromRandom(lang) {
  const langs   = (lang === "all") ? Object.keys(RANDOM_WORDS) : [lang];
  const l       = langs[Math.floor(Math.random() * langs.length)];
  const pool    = RANDOM_WORDS[l] || RANDOM_WORDS.es;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Fuente 4: Lista propia ─────────────────────────────────────────────────
async function fromCustom() {
  const data = await browser.storage.local.get(["customWords"]);
  const list = (data.customWords || "").split("\n").map(w => w.trim()).filter(Boolean);
  if (list.length > 0) return list[Math.floor(Math.random() * list.length)];
  return null;
}

// ── Fuente 5: iTunes Charts ────────────────────────────────────────────────
async function loadItunes(lang) {
  const now = Date.now();
  if (cache.itunes[lang] && cache.itunes[lang].length > 0 && (now - cache.itunes.ts) < TTL) return;
  if (!cache.itunes[lang]) cache.itunes[lang] = [];
  const country = ITUNES_CC[lang] || "es";
  try {
    const url  = `https://itunes.apple.com/${country}/rss/topsongs/limit=25/json`;
    const res  = await fetch(url);
    const data = await res.json();
    const entries = data.feed && data.feed.entry;
    if (entries && entries.length > 0) {
      cache.itunes[lang] = entries.map(e => e["im:name"] && e["im:name"].label).filter(Boolean);
      cache.itunes.ts    = now;
    }
  } catch(e) {}
}

async function fromItunes(lang) {
  const l = (lang === "both") ? (Math.random() < 0.5 ? "es" : "en") : lang;
  await loadItunes(l);
  if (cache.itunes[l].length > 0) {
    return cache.itunes[l][Math.floor(Math.random() * cache.itunes[l].length)];
  }
  return null;
}

// ── Selector de fuente aleatoria entre las activas ─────────────────────────
async function getTermFromSource(source, lang) {
  switch(source) {
    case "wikipedia": return await fromWikipedia(lang);
    case "trends":    return await fromTrends(lang);
    case "random":    return fromRandom(lang);
    case "custom":    return await fromCustom();
    case "itunes":    return await fromItunes(lang);
    default:          return fromRandom(lang);
  }
}

async function buildQuery(lang, wordCount, sources) {
  const activeSources = Object.keys(sources).filter(k => sources[k]);
  if (activeSources.length === 0) activeSources.push("random");

  const allLangs  = Object.keys(RANDOM_WORDS);
  const terms = [];
  const promises = [];

  for (let i = 0; i < wordCount; i++) {
    const src  = activeSources[Math.floor(Math.random() * activeSources.length)];
    const l    = (lang === "all") ? allLangs[Math.floor(Math.random()*allLangs.length)] : lang;
    promises.push(getTermFromSource(src, l));
  }

  const results = await Promise.all(promises);
  results.forEach(t => { if (t) terms.push(t); });

  // Fallback si alguno falló
  while (terms.length < wordCount) {
    terms.push(fromRandom(lang));
  }

  return terms.join(" ");
}

// ── Motor principal ────────────────────────────────────────────────────────
// Intervalo aleatorio: entre 3 y 24 segundos
function getEffectiveInterval(interval) {
  if (interval === 0) return Math.floor(Math.random() * (24 - 3 + 1)) + 3;
  return interval;
}

let secondsTimer = null;
let lastTabId    = null;

function updateIcon(enabled, intervalSeconds) {
  const opt   = TIME_OPTIONS.find(o => o.value === intervalSeconds);
  const label = (intervalSeconds === 0) ? "3-24 seg aleatorio" : (opt ? opt.label : "?");
  const icon  = enabled
    ? { "48": "icon_active.png",   "96": "icon_active.png"   }
    : { "48": "icon_inactive.png", "96": "icon_inactive.png" };
  browser.browserAction.setIcon({ path: icon });
  browser.browserAction.setTitle({ title: enabled
    ? `Random Search · ACTIVO (cada ${label})`
    : "Random Search · Inactivo — clic para activar" });
}

async function openSearch() {
  const data = await browser.storage.local.get(["engine","enabled","lang","autoClose","wordCount","sources","activeTab","customWords"]);
  if (!data.enabled) return;
  const eng       = data.engine    || "google";
  const lang      = data.lang      || "es";
  const wc        = data.wordCount || 2;
  const sources   = data.sources   || { wikipedia: true, trends: true, random: true, custom: true, itunes: true };
  const activeTab = (data.activeTab === undefined) ? false : !!data.activeTab;
  const query     = await buildQuery(lang, wc, sources);
  const url       = ENGINES[eng] + encodeURIComponent(query);

  if (data.autoClose && lastTabId !== null) {
    browser.tabs.remove(lastTabId).catch(() => {});
    lastTabId = null;
  }
  browser.tabs.create({ url, active: activeTab }).then(tab => { lastTabId = tab.id; });
}

function startTimer(intervalSeconds) {
  stopTimer();
  if (intervalSeconds === 0 || intervalSeconds < 60) {
    function tick() {
      openSearch();
      const next = getEffectiveInterval(intervalSeconds) * 1000;
      secondsTimer = setTimeout(tick, next);
    }
    const first = getEffectiveInterval(intervalSeconds) * 1000;
    secondsTimer = setTimeout(tick, first);
  } else {
    const minutes = intervalSeconds / 60;
    browser.alarms.create("randomSearch", { delayInMinutes: minutes, periodInMinutes: minutes });
  }
}

function stopTimer() {
  if (secondsTimer !== null) { clearTimeout(secondsTimer); secondsTimer = null; }
  browser.alarms.clear("randomSearch");
  lastTabId = null;
}

browser.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === "randomSearch") openSearch();
});

browser.browserAction.onClicked.addListener(() => {
  browser.storage.local.get(["enabled","interval"]).then(data => {
    const wasEnabled = !!data.enabled;
    const interval   = data.interval || 300;
    if (wasEnabled) {
      stopTimer();
      browser.storage.local.set({ enabled: false });
      updateIcon(false, interval);
    } else {
      startTimer(interval);
      browser.storage.local.set({ enabled: true });
      updateIcon(true, interval);
    }
  });
});

browser.runtime.onMessage.addListener((msg) => {
  if (msg.action === "start") {
    startTimer(msg.interval);
    browser.storage.local.set({
      enabled: true, interval: msg.interval, engine: msg.engine,
      lang: msg.lang, autoClose: msg.autoClose, wordCount: msg.wordCount,
      sources: msg.sources, customWords: msg.customWords, activeTab: msg.activeTab
    });
    updateIcon(true, msg.interval);
  }
  if (msg.action === "stop") {
    stopTimer();
    browser.storage.local.set({ enabled: false });
    browser.storage.local.get(["interval"]).then(d => updateIcon(false, d.interval || 300));
  }
  if (msg.action === "searchNow") {
    browser.storage.local.get(["engine","lang","wordCount","sources"]).then(async data => {
      const sources = data.sources || { wikipedia:true, trends:true, random:true, custom:true, itunes:true };
      const query   = await buildQuery(data.lang||"es", data.wordCount||3, sources);
      browser.tabs.create({ url: ENGINES[data.engine||"google"] + encodeURIComponent(query), active: true });
    });
  }
  if (msg.action === "getPreview") {
    buildQuery(msg.lang, msg.wordCount, msg.sources).then(query => {
      browser.runtime.sendMessage({ action: "previewResult", query });
    });
  }
});

browser.contextMenus.create({ id: "openSettings",  title: "⚙ Configuración", contexts: ["browser_action"] });
browser.contextMenus.create({ id: "searchNowMenu", title: "⚡ Buscar ahora",  contexts: ["browser_action"] });
browser.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "openSettings") {
    browser.tabs.create({ url: browser.runtime.getURL("settings.html") });
  }
  if (info.menuItemId === "searchNowMenu") {
    browser.storage.local.get(["engine","lang","wordCount","sources"]).then(async data => {
      const sources = data.sources || { wikipedia:true, trends:true, random:true, custom:true, itunes:true };
      const query   = await buildQuery(data.lang||"es", data.wordCount||3, sources);
      browser.tabs.create({ url: ENGINES[data.engine||"google"] + encodeURIComponent(query), active: true });
    });
  }
});

browser.storage.local.get(["enabled","interval"]).then(data => {
  const interval = (data.interval === undefined) ? 0 : data.interval;
  if (data.enabled) startTimer(interval);
  updateIcon(!!data.enabled, interval);
});
