var selectedLang      = "es";
var selectedInterval  = 0;
var selectedWordCount = 3;
var autoClose         = false;
var sources           = { wikipedia: true, trends: true, itunes: true, random: true, custom: false };

// ── Grupos de botones ──────────────────────────────────────────────────────
function setupGroup(groupId, btnClass, onSelect) {
  var group = document.getElementById(groupId);
  if (!group) return;
  group.addEventListener('click', function(e) {
    var btn = e.target;
    while (btn && btn !== group) {
      if (btn.classList.contains(btnClass)) break;
      btn = btn.parentElement;
    }
    if (!btn || !btn.classList.contains(btnClass)) return;
    group.querySelectorAll('.' + btnClass).forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    onSelect(btn.getAttribute('data-val'));
  });
}

function setupTimeGroups() {
  ['timeGroup', 'timeGroup2'].forEach(function(id) {
    setupGroup(id, 'opt-btn', function(val) {
      selectedInterval = parseInt(val);
      var otherId = (id === 'timeGroup') ? 'timeGroup2' : 'timeGroup';
      var other = document.getElementById(otherId);
      if (other) other.querySelectorAll('.opt-btn').forEach(function(b) { b.classList.remove('active'); });
    });
  });
}

setupGroup('langGroup', 'opt-btn', function(val) { selectedLang = val; });
setupGroup('wordGroup', 'word-btn', function(val) { selectedWordCount = parseInt(val); });
setupTimeGroups();

// ── Fuentes: toggle individual ─────────────────────────────────────────────
document.getElementById('sourcesGrid').addEventListener('click', function(e) {
  var btn = e.target;
  while (btn && btn !== this) {
    if (btn.classList.contains('source-btn')) break;
    btn = btn.parentElement;
  }
  if (!btn || !btn.classList.contains('source-btn')) return;

  var src    = btn.getAttribute('data-source');
  var active = btn.classList.toggle('active');
  sources[src] = active;

  // Mostrar/ocultar textarea de lista propia
  if (src === 'custom') {
    document.getElementById('customArea').classList.toggle('visible', active);
  }

  // Asegurar que al menos una fuente esté activa
  var anyActive = Object.values(sources).some(Boolean);
  if (!anyActive) {
    sources[src] = true;
    btn.classList.add('active');
  }
});

// ── Checkbox cierre automático ─────────────────────────────────────────────
var autoCloseRow = document.getElementById('autoCloseRow');
autoCloseRow.addEventListener('click', function() {
  autoClose = !autoClose;
  autoCloseRow.classList.toggle('checked', autoClose);
});

// ── Vista previa ───────────────────────────────────────────────────────────
document.getElementById('btnPreview').addEventListener('click', function() {
  var preview = document.getElementById('preview');
  preview.innerHTML = '<i style="color:#555">Generando ejemplo...</i>';
  browser.runtime.sendMessage({
    action: 'getPreview',
    lang: selectedLang,
    wordCount: selectedWordCount,
    sources: sources
  });
});

browser.runtime.onMessage.addListener(function(msg) {
  if (msg.action === 'previewResult') {
    document.getElementById('preview').innerHTML = 'Buscaría: <b>"' + msg.query + '"</b>';
  }
});

// ── Cargar config guardada ─────────────────────────────────────────────────
browser.storage.local.get(['engine','interval','lang','autoClose','wordCount','sources','customWords']).then(function(data) {
  if (data.engine) document.getElementById('engine').value = data.engine;

  if (data.lang) {
    selectedLang = data.lang;
    document.querySelectorAll('#langGroup .opt-btn').forEach(function(b) {
      b.classList.toggle('active', b.getAttribute('data-val') === data.lang);
    });
  } else {
    var def = document.querySelector('#langGroup .opt-btn[data-val="es"]');
    if (def) def.classList.add('active');
  }

  var wc = data.wordCount || 3;
  selectedWordCount = wc;
  document.querySelectorAll('#wordGroup .word-btn').forEach(function(b) {
    b.classList.toggle('active', parseInt(b.getAttribute('data-val')) === wc);
  });

  if (data.interval) {
    selectedInterval = data.interval;
    document.querySelectorAll('#timeGroup .opt-btn, #timeGroup2 .opt-btn').forEach(function(b) {
      b.classList.toggle('active', parseInt(b.getAttribute('data-val')) === data.interval);
    });
  } else {
    var defTime = document.querySelector('.opt-btn[data-val="0"]');
    if (defTime) defTime.classList.add('active');
  }

  if (data.sources) {
    sources = data.sources;
    document.querySelectorAll('.source-btn').forEach(function(btn) {
      var src = btn.getAttribute('data-source');
      btn.classList.toggle('active', !!sources[src]);
    });
    if (sources.custom) {
      document.getElementById('customArea').classList.add('visible');
    }
  }

  if (data.customWords) {
    document.getElementById('customWords').value = data.customWords;
  }

  if (data.autoClose) {
    autoClose = true;
    autoCloseRow.classList.add('checked');
  }
});

// ── Cancelar ───────────────────────────────────────────────────────────────
document.getElementById('btnCancel').addEventListener('click', function() { window.close(); });

// ── Guardar ────────────────────────────────────────────────────────────────
document.getElementById('btnSave').addEventListener('click', function() {
  var engine      = document.getElementById('engine').value;
  var customWords = document.getElementById('customWords').value;

  browser.storage.local.set({
    engine: engine, lang: selectedLang, interval: selectedInterval,
    autoClose: autoClose, wordCount: selectedWordCount,
    sources: sources, customWords: customWords
  }).then(function() {
    browser.storage.local.get(['enabled']).then(function(data) {
      if (data.enabled) {
        browser.runtime.sendMessage({
          action: 'start', interval: selectedInterval, engine: engine,
          lang: selectedLang, autoClose: autoClose, wordCount: selectedWordCount,
          sources: sources, customWords: customWords
        });
      }
    });
    var toast = document.getElementById('toast');
    toast.classList.add('show');
    setTimeout(function() { toast.classList.remove('show'); window.close(); }, 1200);
  });
});
