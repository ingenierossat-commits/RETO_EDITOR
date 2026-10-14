/* RETO · EDITOR  v1.0
   Editor del contenido de EL RETO DEL SABER. Guarda todo en Firebase (Realtime Database,
   proyecto listify-16b5d, nodo "reto_editor") y genera el fichero contenido.h para el firmware. */

const firebaseConfig = {
  apiKey: "AIzaSyChMXx5ZcleAo5oqzPvo1K_Af_wgQkh-LQ",
  authDomain: "listify-16b5d.firebaseapp.com",
  databaseURL: "https://listify-16b5d-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "listify-16b5d",
  storageBucket: "listify-16b5d.firebasestorage.app",
  messagingSenderId: "238610923350",
  appId: "1:238610923350:web:cd5c2c3fb23b5c0afba0f7"
};

const RAIZ = 'reto_editor';
const TIPOS = [['acierto', 'Acierto'], ['fallo', 'Fallo'], ['tiempo', 'Tiempo'], ['chupito', 'Chupito']];
const AYUDA = {
  acierto: 'Miranda las dice cuando alguien acierta (solo a veces, para no saturar).',
  fallo: 'Miranda las dice cuando alguien falla. Aquí va el troleo.',
  tiempo: 'Cuando se agota el tiempo para responder.',
  chupito: 'Después de «Pito, pito, toma chupito».'
};
const RESERVADOS = ['sabias', 'admin', 'final'];
const MAX_TEMAS = 32, MAX_PREG_TEMA = 128;
const VACIO = () => ({ frases: {}, sabias: {}, cartas: {}, temas: {}, preguntas: {} });

let D = VACIO(), cargado = false, conectado = false;
const S = { tab: 'frases', ft: 'acierto', sn: '', tt: '' };
let db = null;

/* ---------- utilidades ---------- */
const $ = id => document.getElementById(id);
const E = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let _c = 0;
const nid = () => Date.now().toString(36).padStart(9, '0') + (_c++ % 1296).toString(36).padStart(2, '0') + Math.random().toString(36).slice(2, 4);
const limpia = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
function canon(o) {
  if (o === null || typeof o !== 'object') return o;
  const r = {};
  Object.keys(o).sort().forEach(k => {
    const v = canon(o[k]);
    if (v === undefined || (v !== null && typeof v === 'object' && !Object.keys(v).length)) return;
    r[k] = v;
  });
  return r;
}
const hash = o => JSON.stringify(canon(o));
function toast(t) { const e = $('toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('on'), 2200); }
function slugDe(n) {
  return String(n).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
}
const claves = o => Object.keys(o || {}).sort();
function descargar(nombre, texto, tipo) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([texto], { type: tipo || 'text/plain' }));
  a.download = nombre; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

/* ---------- datos (Firebase) ---------- */
function setLocal(path, val) {
  const p = path.split('/'); let o = D;
  for (let i = 0; i < p.length - 1; i++) { if (typeof o[p[i]] !== 'object' || o[p[i]] === null) o[p[i]] = {}; o = o[p[i]]; }
  if (val === null) delete o[p[p.length - 1]]; else o[p[p.length - 1]] = val;
}
function W(upd) {
  Object.keys(upd).forEach(k => setLocal(k, upd[k]));
  if (db) db.ref(RAIZ).update(upd).catch(e => toast('Error al guardar: ' + e.message));
}
function iniciaDB() {
  firebase.initializeApp(firebaseConfig);
  db = firebase.database();
  db.ref('.info/connected').on('value', s => { conectado = !!s.val(); estado(); });
  db.ref(RAIZ).on('value', s => {
    const v = s.val() || {}, n = VACIO();
    Object.keys(n).forEach(k => { n[k] = v[k] || {}; });
    const primera = !cargado; cargado = true;
    if (primera || hash(n) !== hash(D)) { D = n; render(); }
  }, e => { toast('Sin permiso en Firebase: ' + e.message); $('app').innerHTML = '<div class="card err">No se puede leer el nodo <code>' + RAIZ + '</code>. Añade su regla en Realtime Database (ver instrucciones).</div>'; });
}
function estado() { const e = $('st'); e.className = conectado ? 'on' : ''; e.lastChild.textContent = conectado ? 'conectado' : 'sin conexión'; }

/* ---------- generador de contenido.h ---------- */
// Texto seguro para C y para el JSON del módulo: sin comillas dobles, barras ni saltos.
function cs(s) { return limpia(String(s).replace(/[“”"]/g, "'").replace(/\\/g, '/').replace(/[\u2028\u2029]/g, ' ')); }
const qc = s => '"' + cs(s) + '"';
function listaTemas(d) { return claves(d.temas).sort((a, b) => (d.temas[a].o || 0) - (d.temas[b].o || 0) || (a < b ? -1 : 1)); }
function generar(d) {
  const err = [], avi = [], st = {};
  const fr = {};
  TIPOS.forEach(([t, n]) => {
    fr[t] = claves(d.frases[t]).map(k => cs(d.frases[t][k])).filter(Boolean);
    st['f_' + t] = fr[t].length;
    if (fr[t].length < 3) avi.push('Frases de ' + n + ': solo ' + fr[t].length + '. Con menos de 3 se repetirán mucho (se usarán las de serie si no hay ninguna).');
  });
  // ¿Sabías que?
  const sab = claves(d.sabias).map(k => d.sabias[k]).filter(x => x && cs(x.t)).sort((a, b) => (a.n || 1) - (b.n || 1));
  const niv = [0, 0, 0, 0, 0, 0]; sab.forEach(x => { niv[Math.min(5, Math.max(1, x.n || 1))]++; });
  st.sab = sab.length; st.niv = niv;
  if (!sab.length) err.push('No hay ningún «¿Sabías que?».');
  const rangos = [['Fácil', 1, 2], ['Medio', 2, 4], ['Difícil', 4, 5]];
  rangos.forEach(([n, lo, hi]) => { let c = 0; for (let i = lo; i <= hi; i++) c += niv[i]; if (sab.length && c < 5) avi.push('Nivel «' + n + '» (niveles ' + lo + '–' + hi + '): solo ' + c + ' tarjetas; si no hay ninguna, el juego usa todas.'); });
  // Tarjetas especiales
  const esp = claves(d.cartas).map(k => d.cartas[k]).filter(x => x && cs(x.t));
  const chu = esp.filter(x => x.k === 'chupito'), mov = esp.filter(x => x.k === 'mover');
  st.chu = chu.length; st.mov = mov.length;
  if (!chu.length) avi.push('No hay tarjetas «Pito, pito, chupito».');
  if (!mov.length) avi.push('No hay tarjetas «Muévete».');
  // Temas y preguntas
  const ts = listaTemas(d);
  if (!ts.length) err.push('No hay ningún tema.');
  if (ts.length > MAX_TEMAS) err.push('Hay ' + ts.length + ' temas; el máximo es ' + MAX_TEMAS + '.');
  const pre = []; st.temas = [];
  ts.forEach((s, i) => {
    const t = d.temas[s];
    if (!/^[a-z0-9]{1,20}$/.test(s) || RESERVADOS.indexOf(s) >= 0) err.push('Tema «' + t.n + '»: etiqueta «' + s + '» no válida.');
    if (!cs(t.n)) err.push('Hay un tema sin nombre (' + s + ').');
    let c = 0;
    claves(d.preguntas[s]).forEach(k => {
      const q = d.preguntas[s][k];
      if (!q) return;
      const ops = [q.a, q.b, q.c].map(cs);
      if (!cs(q.q) || ops.some(o => !o)) { err.push('Tema «' + t.n + '»: hay una pregunta incompleta («' + cs(q.q).slice(0, 40) + '…»).'); return; }
      if (!(q.k === 0 || q.k === 1 || q.k === 2)) { err.push('Tema «' + t.n + '»: pregunta sin respuesta correcta marcada («' + cs(q.q).slice(0, 40) + '…»).'); return; }
      if (new Set(ops.map(o => o.toLowerCase())).size < 3) avi.push('Tema «' + t.n + '»: opciones repetidas en «' + cs(q.q).slice(0, 40) + '…».');
      c++; if (c <= MAX_PREG_TEMA) pre.push({ i, q: cs(q.q), o: ops, k: q.k });
    });
    st.temas.push({ s, n: cs(t.n), c });
    if (c === 0) avi.push('Tema «' + t.n + '» sin preguntas: su tarjeta no hará nada.');
    else if (c < 5) avi.push('Tema «' + t.n + '»: solo ' + c + ' preguntas (se repetirán pronto).');
    if (c > MAX_PREG_TEMA) avi.push('Tema «' + t.n + '»: ' + c + ' preguntas; el módulo solo usa ' + MAX_PREG_TEMA + ' por tema. Sobran ' + (c - MAX_PREG_TEMA) + '.');
  });
  st.preg = pre.length;
  if (!pre.length) err.push('No hay ninguna pregunta de tema (la meta necesita al menos una).');
  // duplicados
  const vistos = {}; let dup = 0;
  pre.forEach(p => { const k = p.q.toLowerCase(); if (vistos[k]) dup++; vistos[k] = 1; });
  if (dup) avi.push(dup + ' pregunta(s) de tema repetida(s) (mismo enunciado).');
  const frasesJS = 'var FRASES=' + JSON.stringify({ acierto: fr.acierto, fallo: fr.fallo, tiempo: fr.tiempo, chupito: fr.chupito, temas: ts.map(s => cs(d.temas[s].n)) }) + ';';
  if (frasesJS.indexOf(')rawliteral"') >= 0) err.push('Alguna frase contiene «)rawliteral"» y rompería el fichero.');

  const L = [];
  const fecha = new Date().toLocaleString('es-ES');
  L.push('/*', '  contenido.h · contenido de EL RETO DEL SABER', '  GENERADO por RETO·EDITOR el ' + fecha + '. NO lo edites a mano: cámbialo en el editor y vuelve a generarlo.',
    '  Sustituye a cartas.h y preguntas.h. Va en la misma carpeta que el .ino y pagina.h.', '',
    '  ' + pre.length + ' preguntas de tema en ' + ts.length + ' temas · ' + sab.length + ' "Sabias que" · ' + chu.length + ' chupito · ' + mov.length + ' muevete',
    '  frases de Miranda: acierto ' + fr.acierto.length + ' · fallo ' + fr.fallo.length + ' · tiempo ' + fr.tiempo.length + ' · chupito ' + fr.chupito.length,
    '  Etiquetas NFC de tema: http://192.168.4.1/t/<etiqueta>', '*/', '#pragma once', '#include <stdint.h>', '',
    '#define T_SABIAS  0', '#define T_CHUPITO 1', '#define T_MOVER   2', '',
    'struct Carta {', '  uint8_t     tipo;', '  uint8_t     nivel;', '  bool        verdad;', '  const char* txt;', '  bool        pasa;', '};', '',
    'const Carta CARTAS[] = {', '  // ---- ¿Sabías que…? (V/F) ----');
  sab.forEach(x => L.push('  { T_SABIAS, ' + Math.min(5, Math.max(1, x.n || 1)) + ', ' + (x.v ? 'true' : 'false') + ', ' + qc(x.t) + ' },'));
  L.push('', '  // ---- PITO, PITO, CHUPITO ----');
  chu.forEach(x => L.push('  { T_CHUPITO, 1, false, ' + qc(x.t) + (x.p ? ', true' : '') + ' },'));
  L.push('', '  // ---- MUEVETE ----');
  mov.forEach(x => L.push('  { T_MOVER, 1, false, ' + qc(x.t) + (x.p ? ', true' : '') + ' },'));
  L.push('};', 'const uint16_t N_CARTAS = sizeof(CARTAS) / sizeof(CARTAS[0]);', '');
  L.push('#define N_TEMAS ' + ts.length);
  L.push('const char* const TEMA_SLUG[N_TEMAS] = { ' + ts.map(s => '"' + s + '"').join(', ') + ' };');
  L.push('const char* const TEMA_NOM[N_TEMAS]  = { ' + ts.map(s => qc(d.temas[s].n)).join(', ') + ' };', '');
  L.push('struct Pregunta {', '  uint8_t     tema;', '  const char* txt;', '  const char* op[3];', '  uint8_t     ok;', '};', '', 'const Pregunta PREGUNTAS[] = {');
  let cur = -1;
  pre.forEach(p => {
    if (p.i !== cur) { cur = p.i; L.push('  // ---- ' + cs(d.temas[ts[p.i]].n) + ' ----'); }
    L.push('  { ' + p.i + ', ' + qc(p.q) + ', { ' + p.o.map(qc).join(', ') + ' }, ' + p.k + ' },');
  });
  L.push('};', 'const uint16_t N_PREGUNTAS = sizeof(PREGUNTAS) / sizeof(PREGUNTAS[0]);', '');
  L.push('// Frases de Miranda y nombres de tema: el módulo las sirve en /frases.js y la página las usa.');
  L.push('const char FRASES_JS[] PROGMEM = R"rawliteral(' + frasesJS + ')rawliteral";', '');
  const texto = L.join('\n');
  st.bytes = new Blob([texto]).size;
  if (st.bytes > 700000) avi.push('El fichero ocupa ' + Math.round(st.bytes / 1024) + ' KB. Si al compilar falta espacio, elige en Herramientas un esquema de partición con más memoria de programa.');
  return { texto, err, avi, st, ts };
}

/* ---------- vistas ---------- */
const TABS = [['frases', '💬', 'Frases'], ['sabias', '❓', 'Sabías'], ['temas', '📚', 'Temas'], ['cartas', '🃏', 'Tarjetas'], ['generar', '⚙️', 'Generar']];
function render() {
  const sy = window.scrollY;
  $('nav').innerHTML = TABS.map(t => '<button class="' + (S.tab === t[0] ? 'on' : '') + '" data-a="tab" data-v="' + t[0] + '"><span>' + t[1] + '</span>' + t[2] + '</button>').join('');
  if (!cargado) { $('app').innerHTML = '<div class="card">Cargando…</div>'; return; }
  const v = { frases: vFrases, sabias: vSabias, temas: vTemas, cartas: vCartas, generar: vGenerar }[S.tab];
  $('app').innerHTML = v();
  window.scrollTo(0, sy);
}
function vFrases() {
  const t = S.ft, L = D.frases[t] || {}, ids = claves(L);
  let h = '<h2>Frases de Miranda</h2><div class="seg">' + TIPOS.map(x => '<button class="b ' + (x[0] === t ? 'on' : '') + '" data-a="ft" data-v="' + x[0] + '">' + x[1] + ' · ' + claves(D.frases[x[0]]).length + '</button>').join('') + '</div>';
  h += '<p class="hint">' + AYUDA[t] + ' <code>{n}</code> = nombre del jugador. Si la frase no lleva <code>{n}</code>, Miranda dice el nombre justo después, con la consecuencia ("Juan avanza una casilla").</p>';
  h += '<div class="card"><input type="text" id="nf" placeholder="Nueva frase…" autocomplete="off" data-enter="addf"><div class="row" style="margin-top:8px"><button class="b" data-a="ins">{n}</button><button class="b p" data-a="addf">Añadir</button><button class="b" data-a="bulk" data-v="frases">Pegar varias</button></div></div>';
  h += '<div class="card">' + (ids.length ? ids.map(k => '<div class="it"><div class="grow"><input type="text" value="' + E(L[k]) + '" data-p="frases/' + t + '/' + k + '" data-ty="s"></div><button class="b s" data-a="say" title="Escuchar">🔊</button><button class="b s d" data-a="del" data-p="frases/' + t + '/' + k + '" title="Borrar">✕</button></div>').join('') : '<p class="hint">Aún no hay frases. Si no hay ninguna, el juego usa las de serie.</p>') + '</div>';
  return h;
}
function vSabias() {
  const f = S.sn, ids = claves(D.sabias).filter(k => !f || String(D.sabias[k].n) === f);
  const cnt = [0, 0, 0, 0, 0, 0]; claves(D.sabias).forEach(k => cnt[D.sabias[k].n || 1]++);
  let h = '<h2>¿Sabías que…? (verdadero / falso)</h2><p class="hint">Escribe la afirmación SIN «¿Sabías que» ni signos: <i>el pulpo tiene tres corazones</i>. Niveles: Fácil = 1–2 · Medio = 2–4 · Difícil = 4–5 (se elige al crear la partida).</p>';
  h += '<div class="card"><textarea id="ns" placeholder="la miel casi nunca se estropea" data-enter="adds"></textarea><div class="row" style="margin-top:8px"><select id="nsv" style="width:auto"><option value="true">Verdadero</option><option value="false">Falso</option></select><select id="nsn" style="width:auto">' + [1, 2, 3, 4, 5].map(n => '<option value="' + n + '"' + (n === 2 ? ' selected' : '') + '>Nivel ' + n + '</option>').join('') + '</select><button class="b p" data-a="adds">Añadir</button><button class="b" data-a="bulk" data-v="sabias">Pegar varias</button></div></div>';
  h += '<div class="seg"><button class="b ' + (!f ? 'on' : '') + '" data-a="sn" data-v="">Todos · ' + claves(D.sabias).length + '</button>' + [1, 2, 3, 4, 5].map(n => '<button class="b ' + (f === String(n) ? 'on' : '') + '" data-a="sn" data-v="' + n + '">N' + n + ' · ' + cnt[n] + '</button>').join('') + '</div>';
  h += '<div class="card">' + (ids.length ? ids.map(k => { const x = D.sabias[k]; return '<div class="it"><div class="grow"><input type="text" value="' + E(x.t) + '" data-p="sabias/' + k + '/t" data-ty="s"><div class="row" style="margin-top:6px"><select style="width:auto" data-p="sabias/' + k + '/v" data-ty="tf"><option value="true"' + (x.v ? ' selected' : '') + '>Verdadero</option><option value="false"' + (!x.v ? ' selected' : '') + '>Falso</option></select><select style="width:auto" data-p="sabias/' + k + '/n" data-ty="n">' + [1, 2, 3, 4, 5].map(n => '<option value="' + n + '"' + (x.n === n ? ' selected' : '') + '>Nivel ' + n + '</option>').join('') + '</select></div></div><button class="b s d" data-a="del" data-p="sabias/' + k + '">✕</button></div>'; }).join('') : '<p class="hint">Sin tarjetas en este filtro.</p>') + '</div>';
  return h;
}
function vTemas() { return S.tt && D.temas[S.tt] ? vTema(S.tt) : vListaTemas(); }
function vListaTemas() {
  const ts = listaTemas(D);
  let h = '<h2>Temas (' + ts.length + ')</h2><p class="hint">Cada tema tiene su etiqueta NFC: <code>http://192.168.4.1/t/etiqueta</code>. La etiqueta se fija al crear el tema y no cambia si renombras el tema (para no invalidar las tarjetas ya grabadas).</p>';
  h += '<div class="card"><div class="row"><div class="grow"><input type="text" id="nt" placeholder="Nombre del nuevo tema (p. ej. Literatura)" autocomplete="off" data-enter="addt"></div><button class="b p" data-a="addt">Crear</button></div></div>';
  ts.forEach(s => { const c = claves(D.preguntas[s]).length; h += '<div class="tema" data-a="open" data-v="' + s + '"><div class="grow"><b>' + E(D.temas[s].n) + '</b><span class="n">/t/' + s + '</span></div><span class="tg ' + (c ? '' : 'f') + '">' + c + ' preguntas</span><span>›</span></div>'; });
  return h;
}
function vTema(s) {
  const t = D.temas[s], L = D.preguntas[s] || {}, ids = claves(L);
  let h = '<h2><span data-a="open" data-v="" style="cursor:pointer">‹ Temas</span></h2>';
  h += '<div class="card"><div class="row"><div class="grow"><input type="text" value="' + E(t.n) + '" data-p="temas/' + s + '/n" data-ty="s" aria-label="Nombre del tema"></div><button class="b d" data-a="delt" data-v="' + s + '">Borrar tema</button></div><p class="hint" style="margin-bottom:0">Etiqueta NFC: <code>http://192.168.4.1/t/' + s + '</code></p></div>';
  h += '<h2>Nueva pregunta</h2><div class="card"><textarea id="nq" placeholder="¿En qué año llegó Colón a América?"></textarea>';
  h += '<input type="text" id="nqa" placeholder="✔ Respuesta correcta" style="margin-top:8px"><input type="text" id="nqb" placeholder="✘ Incorrecta 1" style="margin-top:8px"><input type="text" id="nqc" placeholder="✘ Incorrecta 2" style="margin-top:8px" data-enter="addq">';
  h += '<div class="row" style="margin-top:8px"><button class="b p" data-a="addq" data-v="' + s + '">Añadir pregunta</button><button class="b" data-a="bulk" data-v="preg:' + s + '">Pegar varias</button></div><p class="hint" style="margin-bottom:0">El módulo baraja el orden de las opciones al mostrarlas.</p></div>';
  h += '<h2>Preguntas (' + ids.length + ')</h2>' + (ids.length > 8 ? '<input type="text" id="bq" placeholder="Buscar en este tema…" style="margin-bottom:10px">' : '');
  h += '<div class="card" id="lq">' + (ids.length ? ids.map(k => { const q = L[k]; return '<div class="it" data-t="' + E((q.q + ' ' + q.a + ' ' + q.b + ' ' + q.c).toLowerCase()) + '"><div class="grow"><textarea data-p="preguntas/' + s + '/' + k + '/q" data-ty="s" style="min-height:52px">' + E(q.q) + '</textarea>' + ['a', 'b', 'c'].map((o, i) => '<div class="opt"><input type="radio" name="r' + k + '" value="' + i + '"' + (q.k === i ? ' checked' : '') + ' data-p="preguntas/' + s + '/' + k + '/k" data-ty="n" aria-label="Es la correcta"><input type="text" value="' + E(q[o]) + '" data-p="preguntas/' + s + '/' + k + '/' + o + '" data-ty="s"></div>').join('') + '</div><button class="b s d" data-a="del" data-p="preguntas/' + s + '/' + k + '">✕</button></div>'; }).join('') : '<p class="hint">Este tema aún no tiene preguntas.</p>') + '</div>';
  return h;
}
function vCartas() {
  const sec = (k, tit, ayuda) => {
    const ids = claves(D.cartas).filter(i => D.cartas[i].k === k);
    return '<h2>' + tit + ' (' + ids.length + ')</h2><p class="hint">' + ayuda + '</p><div class="card"><input type="text" id="nc_' + k + '" placeholder="Texto de la tarjeta…" data-enter="addc" data-v="' + k + '"><div class="row" style="margin-top:8px"><label class="row" style="gap:6px"><input type="checkbox" id="np_' + k + '" style="width:22px;height:22px;accent-color:var(--ac)"> pasa el turno</label><button class="b p" data-a="addc" data-v="' + k + '">Añadir</button><button class="b" data-a="bulk" data-v="car:' + k + '">Pegar varias</button></div></div><div class="card">' +
      (ids.length ? ids.map(i => { const x = D.cartas[i]; return '<div class="it"><div class="grow"><input type="text" value="' + E(x.t) + '" data-p="cartas/' + i + '/t" data-ty="s"><label class="row" style="gap:6px;margin-top:6px"><input type="checkbox"' + (x.p ? ' checked' : '') + ' data-p="cartas/' + i + '/p" data-ty="b" style="width:22px;height:22px;accent-color:var(--ac)"> pasa el turno</label></div><button class="b s d" data-a="del" data-p="cartas/' + i + '">✕</button></div>'; }).join('') : '<p class="hint">Sin tarjetas.</p>') + '</div>';
  };
  return sec('chupito', 'Pito, pito, chupito', 'Frases en 3.ª persona (nunca «tú»: sale en todos los móviles). <code>$S</code> = jugador señalado por la flecha · <code>$A</code> = jugador activo. Sin alcohol se retiran del mazo.') +
    sec('mover', 'Muévete', 'Avanza / retrocede casillas, en 3.ª persona. «Pasa el turno» = tras la tarjeta juega el siguiente (los retrocesos suelen pasarlo).');
}
function vGenerar() {
  const g = generar(D), st = g.st;
  let h = '<h2>Resumen</h2><div class="card"><table><tr><td>Frases de Miranda</td><td class="r">acierto ' + st.f_acierto + ' · fallo ' + st.f_fallo + ' · tiempo ' + st.f_tiempo + ' · chupito ' + st.f_chupito + '</td></tr>' +
    '<tr><td>¿Sabías que?</td><td class="r">' + st.sab + ' (N1 ' + st.niv[1] + ' · N2 ' + st.niv[2] + ' · N3 ' + st.niv[3] + ' · N4 ' + st.niv[4] + ' · N5 ' + st.niv[5] + ')</td></tr>' +
    '<tr><td>Tarjetas chupito / muévete</td><td class="r">' + st.chu + ' / ' + st.mov + '</td></tr>' +
    '<tr><td>Preguntas de tema</td><td class="r">' + st.preg + ' en ' + g.ts.length + ' temas</td></tr>' +
    '<tr><td>Tamaño del fichero</td><td class="r">' + Math.round(st.bytes / 1024) + ' KB</td></tr></table></div>';
  if (g.err.length) h += '<div class="card"><b class="err">Hay que corregir (' + g.err.length + ')</b><ul class="v">' + g.err.slice(0, 20).map(x => '<li class="err">' + E(x) + '</li>').join('') + '</ul></div>';
  if (g.avi.length) h += '<div class="card"><b class="wrn">Avisos (' + g.avi.length + ')</b><ul class="v">' + g.avi.slice(0, 30).map(x => '<li class="wrn">' + E(x) + '</li>').join('') + '</ul></div>';
  if (!g.err.length && !g.avi.length) h += '<div class="card okc">Todo en orden.</div>';
  h += '<div class="row"><button class="b p grow" data-a="gen"' + (g.err.length ? ' disabled' : '') + '>Generar y descargar contenido.h</button><button class="b" data-a="copiar"' + (g.err.length ? ' disabled' : '') + '>Copiar</button></div>';
  h += '<p class="hint">Copia <code>contenido.h</code> a la carpeta del sketch junto a <code>pagina.h</code> y el <code>.ino</code> (firmware v0.32 o posterior), borra <code>cartas.h</code> y <code>preguntas.h</code> y recompila.</p>';
  h += '<h2>Temas y etiquetas NFC</h2><div class="card"><table>' + g.st.temas.map(t => '<tr><td>' + E(t.n) + '</td><td class="r">' + t.c + ' preg.</td><td class="mono">/t/' + t.s + '</td></tr>').join('') + '</table><p class="hint" style="margin-bottom:0">Resto de etiquetas: <code>/t/sabias</code> (tarjeta «?») · <code>/t/admin</code> (administrador) · <code>/t/final</code> (meta) · <code>/</code> (entrada). Todas con prefijo <code>http://192.168.4.1</code>.</p></div>';
  h += '<h2>Datos</h2><div class="card"><div class="row"><button class="b" data-a="backup">Descargar copia (JSON)</button><button class="b" data-a="restaurar">Restaurar copia…</button><button class="b" data-a="seed">Cargar contenido actual del juego</button></div><input type="file" id="fr" accept=".json,application/json" style="display:none"><p class="hint" style="margin-bottom:0">Los datos viven en Firebase (<code>' + RAIZ + '</code>). «Cargar contenido actual» añade las frases, tarjetas y 30 preguntas de la v0.30 como punto de partida.</p></div>';
  h += '<h2>Vista previa</h2><pre>' + E(g.texto.split('\n').slice(0, 40).join('\n')) + '\n…</pre>';
  return h;
}

/* ---------- alta por lotes ---------- */
const BULK = {
  frases: { tit: 'Pegar frases', ayuda: 'Una frase por línea.' },
  sabias: { tit: 'Pegar «¿Sabías que?»', ayuda: 'Una por línea: <code>afirmación | V | nivel</code> (V o F; nivel 1–5, por defecto 2).' },
  preg: { tit: 'Pegar preguntas', ayuda: 'Una por línea: <code>pregunta | correcta | incorrecta | incorrecta</code>' },
  car: { tit: 'Pegar tarjetas', ayuda: 'Una por línea: <code>texto</code> o <code>texto | pasa</code> si pasa el turno.' }
};
function parseBulk(kind, ctx, txt) {
  const lines = txt.split('\n').map(limpia).filter(Boolean), out = [], malas = [];
  const ex = {};
  lines.forEach(l => {
    const p = l.split('|').map(limpia);
    if (kind === 'frases') { out.push({ t: p[0] }); return; }
    if (kind === 'sabias') {
      const v = (p[1] || '').toLowerCase();
      if (!p[0] || !/^(v|f|verdadero|falso|true|false|si|sí|no)$/.test(v)) { malas.push(l); return; }
      const n = Math.min(5, Math.max(1, parseInt(p[2], 10) || 2));
      out.push({ t: p[0], v: /^(v|verdadero|true|si|sí)$/.test(v), n }); return;
    }
    if (kind === 'preg') {
      if (p.length < 4 || p.slice(0, 4).some(x => !x)) { malas.push(l); return; }
      out.push({ q: p[0], a: p[1], b: p[2], c: p[3], k: 0 }); return;
    }
    if (kind === 'car') { if (!p[0]) return; out.push({ t: p[0], p: /^pasa/i.test(p[1] || '') }); }
  });
  return { out, malas };
}
function abrirBulk(v) {
  const [kind, ctx] = v.split(':'), B = BULK[kind];
  $('mbox').innerHTML = '<h2>' + B.tit + '</h2><p class="hint">' + B.ayuda + '</p><textarea id="bt" style="min-height:200px" placeholder="…"></textarea><p class="hint" id="bi"></p><div class="row"><button class="b p" data-a="bulkok" data-v="' + v + '">Añadir</button><button class="b" data-a="mclose">Cancelar</button></div>';
  $('modal').classList.add('on'); $('bt').focus();
}
function bulkOk(v) {
  const [kind, ctx] = v.split(':'), r = parseBulk(kind, ctx, $('bt').value), upd = {};
  let dup = 0, n = 0;
  const yaT = new Set(), add = (path, val, key) => { upd[path] = val; n++; };
  if (kind === 'frases') { claves(D.frases[S.ft]).forEach(k => yaT.add(D.frases[S.ft][k].toLowerCase())); r.out.forEach(x => { const k = x.t.toLowerCase(); if (yaT.has(k)) { dup++; return; } yaT.add(k); add('frases/' + S.ft + '/' + nid(), cs(x.t)); }); }
  if (kind === 'sabias') { claves(D.sabias).forEach(k => yaT.add(D.sabias[k].t.toLowerCase())); r.out.forEach(x => { const k = x.t.toLowerCase(); if (yaT.has(k)) { dup++; return; } yaT.add(k); add('sabias/' + nid(), { t: cs(x.t), v: x.v, n: x.n }); }); }
  if (kind === 'preg') { claves(D.preguntas[ctx]).forEach(k => yaT.add(D.preguntas[ctx][k].q.toLowerCase())); r.out.forEach(x => { const k = x.q.toLowerCase(); if (yaT.has(k)) { dup++; return; } yaT.add(k); add('preguntas/' + ctx + '/' + nid(), { q: cs(x.q), a: cs(x.a), b: cs(x.b), c: cs(x.c), k: 0 }); }); }
  if (kind === 'car') { claves(D.cartas).forEach(k => yaT.add(D.cartas[k].t.toLowerCase())); r.out.forEach(x => { const k = x.t.toLowerCase(); if (yaT.has(k)) { dup++; return; } yaT.add(k); add('cartas/' + nid(), { k: ctx, t: cs(x.t), p: x.p }); }); }
  if (!n) { $('bi').innerHTML = '<span class="err">Nada que añadir' + (r.malas.length ? ' · ' + r.malas.length + ' línea(s) con formato incorrecto' : '') + (dup ? ' · ' + dup + ' repetida(s)' : '') + '.</span>'; return; }
  W(upd); cerrarModal(); render();
  toast(n + ' añadidas' + (dup ? ' · ' + dup + ' repetidas omitidas' : '') + (r.malas.length ? ' · ' + r.malas.length + ' con error' : ''));
}
function cerrarModal() { $('modal').classList.remove('on'); }

/* ---------- acciones ---------- */
const ACC = {
  tab: b => { S.tab = b.dataset.v; if (S.tab === 'temas') S.tt = ''; render(); window.scrollTo(0, 0); },
  ft: b => { S.ft = b.dataset.v; render(); },
  sn: b => { S.sn = b.dataset.v; render(); },
  ins: () => { const i = $('nf'); const p = i.selectionStart == null ? i.value.length : i.selectionStart; i.value = i.value.slice(0, p) + '{n}' + i.value.slice(p); i.focus(); i.setSelectionRange(p + 3, p + 3); },
  addf: () => { const t = cs($('nf').value); if (!t) return toast('Escribe la frase'); if (claves(D.frases[S.ft]).some(k => D.frases[S.ft][k].toLowerCase() === t.toLowerCase())) return toast('Ya existe esa frase'); W({ ['frases/' + S.ft + '/' + nid()]: t }); render(); const i = $('nf'); if (i) i.focus(); },
  say: b => { const v = b.closest('.it').querySelector('input').value.replace(/\{n\}/g, 'Juan'); try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(v); u.lang = 'es-ES'; u.rate = 1.05; speechSynthesis.speak(u); } catch (e) { toast('Este navegador no tiene voz'); } },
  del: b => { W({ [b.dataset.p]: null }); render(); },
  adds: () => { const t = cs($('ns').value); if (!t) return toast('Escribe la afirmación'); if (claves(D.sabias).some(k => D.sabias[k].t.toLowerCase() === t.toLowerCase())) return toast('Ya existe'); W({ ['sabias/' + nid()]: { t, v: $('nsv').value === 'true', n: Number($('nsn').value) } }); const n = $('nsn').value, v = $('nsv').value; render(); $('nsn').value = n; $('nsv').value = v; $('ns').focus(); },
  addt: () => {
    const n = cs($('nt').value); if (!n) return toast('Escribe el nombre');
    if (claves(D.temas).length >= MAX_TEMAS) return toast('Máximo ' + MAX_TEMAS + ' temas');
    let s = slugDe(n) || 'tema', b = s, i = 2; while (D.temas[s] || RESERVADOS.indexOf(s) >= 0) s = b.slice(0, 17) + i++;
    W({ ['temas/' + s]: { n, o: Date.now() } }); S.tt = s; render();
  },
  open: b => { S.tt = b.dataset.v; render(); window.scrollTo(0, 0); },
  delt: b => { const s = b.dataset.v, c = claves(D.preguntas[s]).length; if (!confirm('¿Borrar el tema «' + D.temas[s].n + '» y sus ' + c + ' preguntas? Su etiqueta NFC dejará de funcionar.')) return; W({ ['temas/' + s]: null, ['preguntas/' + s]: null }); S.tt = ''; render(); },
  addq: b => {
    const s = b ? b.dataset.v : S.tt, q = cs($('nq').value), a = cs($('nqa').value), bb = cs($('nqb').value), c = cs($('nqc').value);
    if (!q || !a || !bb || !c) return toast('Faltan campos');
    W({ ['preguntas/' + s + '/' + nid()]: { q, a, b: bb, c, k: 0 } }); render(); $('nq').focus(); toast('Pregunta añadida');
  },
  addc: b => { const k = b.dataset.v, t = cs($('nc_' + k).value); if (!t) return toast('Escribe el texto'); W({ ['cartas/' + nid()]: { k, t, p: $('np_' + k).checked } }); render(); $('nc_' + k).focus(); },
  bulk: b => abrirBulk(b.dataset.v), bulkok: b => bulkOk(b.dataset.v), mclose: cerrarModal,
  gen: () => { const g = generar(D); if (g.err.length) return; descargar('contenido.h', g.texto); toast('contenido.h generado'); },
  copiar: async () => { const g = generar(D); try { await navigator.clipboard.writeText(g.texto); toast('Copiado'); } catch (e) { toast('No se pudo copiar; usa Descargar'); } },
  backup: () => descargar('reto_editor_copia_' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(canon(D), null, 1), 'application/json'),
  restaurar: () => $('fr').click(),
  seed: () => {
    if (claves(D.sabias).length + claves(D.temas).length + claves(D.cartas).length && !confirm('Ya hay contenido. Se AÑADIRÁ el contenido de la v0.30 a lo que hay (puede duplicar). ¿Continuar?')) return;
    const u = {};
    Object.keys(SEED.frases).forEach(t => SEED.frases[t].forEach(x => { u['frases/' + t + '/' + nid()] = x; }));
    SEED.sabias.forEach(x => { u['sabias/' + nid()] = x; });
    SEED.cartas.forEach(x => { u['cartas/' + nid()] = x; });
    let o = Date.now(); SEED.temas.forEach(t => { if (!D.temas[t.s]) u['temas/' + t.s] = { n: t.n, o: o++ }; });
    SEED.preguntas.forEach(p => { u['preguntas/' + p.s + '/' + nid()] = { q: p.q, a: p.o[0], b: p.o[1], c: p.o[2], k: p.c }; });
    W(u); render(); toast('Contenido inicial cargado');
  }
};
document.addEventListener('click', e => {
  const b = e.target.closest('[data-a]'); if (!b || e.target.closest('input,select,textarea')) return;
  const f = ACC[b.dataset.a]; if (f) f(b, e);
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'fr' && t.files[0]) {
    const r = new FileReader();
    r.onload = () => { try { const o = JSON.parse(r.result), n = VACIO(); Object.keys(n).forEach(k => { n[k] = o[k] || {}; }); if (!confirm('Esto SUSTITUYE todo el contenido actual por la copia. ¿Seguro?')) return; D = n; db.ref(RAIZ).set(canon(n)); render(); toast('Copia restaurada'); } catch (x) { toast('Fichero no válido'); } };
    r.readAsText(t.files[0]); t.value = ''; return;
  }
  if (!t.dataset || !t.dataset.p) return;
  const ty = t.dataset.ty; let v;
  if (ty === 'b') v = t.checked; else if (ty === 'n') v = Number(t.value); else if (ty === 'tf') v = t.value === 'true'; else v = cs(t.value);
  if (ty === 's' && !v) { toast('No puede quedar vacío'); render(); return; }
  W({ [t.dataset.p]: v });
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || e.shiftKey || !e.target.dataset || !e.target.dataset.enter) return;
  if (e.target.tagName === 'TEXTAREA' && e.target.id !== 'ns') return;
  e.preventDefault();
  const a = e.target.dataset.enter, f = ACC[a]; if (f) f({ dataset: { v: e.target.dataset.v || S.tt } });
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'bq') { const q = t.value.toLowerCase(); document.querySelectorAll('#lq .it').forEach(x => { x.style.display = x.dataset.t.indexOf(q) >= 0 ? '' : 'none'; }); }
  if (t.id === 'bt') { const [kind, ctx] = document.querySelector('[data-a=bulkok]').dataset.v.split(':'), r = parseBulk(kind, ctx, t.value); $('bi').innerHTML = r.out.length + ' válidas' + (r.malas.length ? ' · <span class="err">' + r.malas.length + ' con formato incorrecto</span>' : ''); }
});
$('modal').addEventListener('click', e => { if (e.target.id === 'modal') cerrarModal(); });

/* ---------- arranque ---------- */
if (typeof firebase !== 'undefined') iniciaDB(); else { cargado = true; $('app').innerHTML = '<div class="card err">No se ha podido cargar Firebase. Comprueba la conexión.</div>'; }
render();
