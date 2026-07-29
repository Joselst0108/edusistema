import './style.css'
import { sb } from './supabase.js'

const app = document.getElementById('app')
let deckTimer = null
let revealObs = null

/* ============ helpers ============ */
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const money = n => '$ ' + Number(n || 0).toLocaleString('es-PE')
const WM = (dark) => `<span class="wm lg${dark ? ' on-dark' : ''}"><span class="a">Edu</span><span class="b">Sistema</span></span>`
const hoyISO = () => new Date().toISOString().slice(0, 10)
const fmtDate = iso => { try { return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) } catch { return '—' } }
const PLANES = [['semillero', '🌱', 'Semillero', '$1.20/al'], ['institucional', '🏫', 'Institucional', '$2.40/al'], ['distrito', '🏛️', 'Distrito', 'a medida']]
const ESTADOS = [['activo', '● Activo'], ['prueba', '◐ En prueba'], ['suspendido', '○ Suspendido']]
function clearTimers(){ if (deckTimer) clearInterval(deckTimer); deckTimer = null }
function initReveals(){
  if (revealObs) revealObs.disconnect()
  revealObs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); revealObs.unobserve(e.target) } }), { threshold: .12 })
  app.querySelectorAll('.rv').forEach(el => revealObs.observe(el))
}
function toast(msg, tipo = 'ok'){
  let wrap = document.getElementById('toasts')
  if (!wrap){ wrap = document.createElement('div'); wrap.id = 'toasts'; wrap.className = 'toast-stack'; document.body.appendChild(wrap) }
  const el = document.createElement('div'); el.className = 'toast ' + tipo; el.textContent = msg
  wrap.appendChild(el); requestAnimationFrame(() => el.classList.add('in'))
  setTimeout(() => { el.classList.remove('in'); setTimeout(() => el.remove(), 350) }, 3600)
}
function route(){
  const h = (location.hash || '').replace(/^#/, '')
  if (h === '/login') return 'login'
  if (h === '/dueno') return 'dueno'
  return 'landing'
}
async function session(){ const { data } = await sb.auth.getSession(); return data.session }

/* ============ router ============ */
async function resolve(){
  clearTimers()
  const r = route()
  if (r === 'dueno'){
    const s = await session()
    if (!s){ location.hash = '#/login'; return }
    const { data: perfil } = await sb.from('perfiles').select('rol,nombre').eq('id', s.user.id).single()
    if (!perfil || perfil.rol !== 'superadmin'){ await sb.auth.signOut(); location.hash = '#/login'; return }
    renderDueno(perfil)
  } else if (r === 'login'){
    const s = await session()
    if (s){ location.hash = '#/dueno'; return }
    renderLogin()
  } else {
    renderLanding()
  }
  initReveals()
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' })
}
addEventListener('hashchange', resolve)
sb.auth.onAuthStateChange((event) => { if (event === 'SIGNED_OUT' && route() === 'dueno') location.hash = '#/' })

/* ============ HEADER / FOOTER ============ */
function headerHTML(active){
  const links = active === 'landing'
    ? `<nav class="nav-links"><a href="#/modulos">Módulos</a><a href="#/roles">Roles</a><a href="#/demo">Demo</a></nav>`
    : ''
  return `<header class="site-header" id="topbar">
    <div class="wrap nav">
      <a class="logo" href="#/"><span class="logo-badge">E</span>${WM(false)}</a>
      ${links}
      <div class="nav-cta">
        <a class="btn btn-ghost btn-sm" href="#/login">Iniciar sesión</a>
        <a class="btn btn-y btn-sm" href="#/demo">Solicitar demo</a>
      </div>
    </div>
  </header>`
}
function footerHTML(){
  return `<footer class="site-footer">
    <div class="wrap">
      <div class="f-grid">
        <div class="f-brand">
          <a class="logo" href="#/" style="margin-bottom:4px"><span class="logo-badge gold">E</span>${WM(true)}</a>
          <p>El sistema operativo del colegio moderno: finanzas, academia, IA y educación financiera en un solo lugar.</p>
        </div>
        <div><h4>Módulos</h4><a href="#/modulos">EduAdmin</a><a href="#/modulos">EduAssist</a><a href="#/modulos">EduIA</a><a href="#/modulos">EduBank</a></div>
        <div><h4>Producto</h4><a href="#/roles">Permisos por rol</a><a href="#/demo">Solicitar demo</a><a href="#/login">Iniciar sesión</a></div>
        <div><h4>Contacto</h4><a href="mailto:hola@edusistema.app">hola@edusistema.app</a><a href="#/demo">WhatsApp</a></div>
      </div>
      <div class="f-bottom">
        <span>© 2026 EduSistema · Hecho para colegios de Latinoamérica 🏫</span>
        <span>Términos · Privacidad · Seguridad de datos</span>
      </div>
    </div>
  </footer>`
}

/* ============ LANDING ============ */
function renderLanding(){
  app.innerHTML = headerHTML('landing') + `
  <div class="wrap hero">
    <div>
      <span class="eyebrow"><span class="dot"></span> Ciclo escolar 2026 · plataforma en vivo</span>
      <h1>Todo tu colegio,<br><span class="hl">en un solo sistema.</span></h1>
      <p class="lead">Finanzas, asistencia, planificación con IA y educación financiera para tus estudiantes. Cuatro módulos que comparten un mismo login, los mismos datos y una sola verdad.</p>
      <div class="cta-row">
        <a class="btn btn-base" href="#/login">Iniciar sesión →</a>
        <a class="btn" href="#/modulos">Ver los 4 módulos ↓</a>
      </div>
      <div class="stats">
        <div class="stat"><b>128</b><span>colegios</span></div>
        <div class="stat"><b>54 210</b><span>estudiantes</span></div>
        <div class="stat"><b>97%</b><span>asistencia prom.</span></div>
      </div>
    </div>
    <div class="deck" id="deck">
      <span class="stk stk1">✏️ Pase de lista en 10 s</span>
      <span class="stk stk2">🪙 +120 monedas hoy</span>
      <div class="deck-head">📋 Panel del colegio — martes 28 de julio <span class="live"><span class="dot"></span>EN VIVO</span></div>
      <div class="deck-tabs">
        <button class="deck-tab on" data-m="admin"><i style="--c:var(--admin)"></i>EduAdmin</button>
        <button class="deck-tab" data-m="assist"><i style="--c:var(--assist)"></i>EduAssist</button>
        <button class="deck-tab" data-m="ia"><i style="--c:var(--ia)"></i>EduIA</button>
        <button class="deck-tab" data-m="bank"><i style="--c:var(--bank)"></i>EduBank</button>
      </div>
      <div class="deck-stage">
        <section class="mod p-admin on" data-m="admin">
          <span class="mod-title">EduAdmin · Caja del mes</span>
          <div class="big-num">$ 42 380 <small>recaudado en julio</small></div>
          <div class="bar-row"><span>3ºA</span><div class="bar"><i style="width:92%"></i></div><span>92%</span></div>
          <div class="bar-row"><span>3ºB</span><div class="bar"><i style="width:78%"></i></div><span>78%</span></div>
          <div class="bar-row"><span>4ºA</span><div class="bar"><i style="width:85%"></i></div><span>85%</span></div>
          <div class="chip-row"><span class="chip">Recordatorios automáticos</span><span class="chip">Recibos PDF</span></div>
        </section>
        <section class="mod" data-m="assist">
          <span class="mod-title">EduAssist · Horario de hoy</span>
          <div class="sched-row"><time>08:00</time><span>Matemática · 3ºB</span><span class="tag-now">AHORA</span></div>
          <div class="sched-row" style="margin-top:8px"><time>09:30</time><span>Ciencia · Lab 2</span><span></span></div>
          <div class="sched-row" style="margin-top:8px"><time>11:00</time><span>Comunicación · 4ºA</span><span></span></div>
          <div class="chip-row" style="margin-top:14px"><span class="chip">Pase de lista offline</span><span class="chip">Boletas listas</span></div>
        </section>
        <section class="mod" data-m="ia">
          <span class="mod-title">EduIA · Generando sesión…</span>
          <div style="background:#fff;border:1.5px solid rgba(14,42,28,.2);border-radius:9px;padding:14px;font-size:.88rem;border-left:6px solid var(--ia)">
            <strong>Sesión · 3ºB</strong><br>Título: Fracciones en la vida diaria<br>Área: Matemática · 90 min<br><br>Inicio: problema real — repartir una pizza…
          </div>
          <div class="chip-row"><span class="chip">📄 Programación</span><span class="chip">📊 Rúbricas</span><span class="chip">🎯 Unidades</span></div>
        </section>
        <section class="mod" data-m="bank">
          <span class="mod-title">EduBank · cuenta de Valeria (3ºB)</span>
          <div style="background:#fff;border:1.5px solid rgba(14,42,28,.2);border-radius:9px;padding:14px">
            <strong>🎯 Meta: laptop nueva</strong>
            <div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:.76rem;margin:8px 0 6px"><span>$ 340 de $ 500</span><span>68%</span></div>
            <div class="bar gold"><i style="width:68%"></i></div>
          </div>
          <div class="chip-row"><span class="chip">Sin dinero real</span><span class="chip">Aprende haciendo</span></div>
        </section>
      </div>
    </div>
  </div>
  <div class="ticker" aria-hidden="true">
    <div class="tk-track">
      <span>🔔 07:45 Ingreso</span><span>✦</span><span>📐 08:00 Matemática</span><span>✦</span><span>🧪 09:30 Ciencia</span><span>✦</span><span>🥪 10:30 Recreo</span><span>✦</span><span>💰 12:30 Caja: 3 pagos</span><span>✦</span><span>🏠 15:15 Salida</span><span>✦</span>
      <span>🔔 07:45 Ingreso</span><span>✦</span><span>📐 08:00 Matemática</span><span>✦</span><span>🧪 09:30 Ciencia</span><span>✦</span><span>🥪 10:30 Recreo</span><span>✦</span><span>💰 12:30 Caja: 3 pagos</span><span>✦</span><span>🏠 15:15 Salida</span><span>✦</span>
    </div>
  </div>
  <section class="band" id="modulos">
    <div class="wrap">
      <div class="sec-head rv"><span class="kicker">Los 4 módulos</span><h2>Un ecosistema, no cuatro apps sueltas</h2><p>Cada módulo resuelve un dolor distinto del colegio — y todos se alimentan de los mismos datos. Una marca, cuatro especialistas.</p></div>
      <div class="bento">
        <article class="bcard b-admin rv"><span class="btag">MÓDULO 01 · FINANZAS</span><img class="mod-lockup" src="/logos/eduadmin.png" alt="EduAdmin" onerror="this.style.display='none'"><p class="sub">La caja del colegio bajo control: pensiones, matrículas, recibos y reportes — sin hojas de cálculo.</p><a class="link-mod" href="#/login">Conocer módulo →</a></article>
        <article class="bcard b-assist rv" style="--d:.1s"><span class="btag">MÓDULO 02 · ACADÉMICO</span><img class="mod-lockup" src="/logos/eduassist.png" alt="EduAssist" onerror="this.style.display='none'"><p class="sub">Horarios, pase de lista y notas en el bolsillo del docente, con boletas listas para la familia.</p><a class="link-mod" href="#/login">Conocer módulo →</a></article>
        <article class="bcard b-ia rv"><span class="btag">MÓDULO 03 · IA DOCENTE</span><img class="mod-lockup" src="/logos/eduia.png" alt="EduIA" onerror="this.style.display='none'"><p class="sub">Sesiones, programaciones y rúbricas generadas con IA, alineadas al currículo y a tu aula real.</p><a class="link-mod" href="#/login">Conocer módulo →</a></article>
        <article class="bcard b-bank rv" style="--d:.1s"><span class="btag">MÓDULO 04 · ED. FINANCIERA</span><img class="mod-lockup" src="/logos/edubank.png" alt="EduBank" onerror="this.style.display='none'"><p class="sub">Un banco-escuela con IA donde los estudiantes ahorran, presupuestan e invierten con monedas virtuales.</p><a class="link-mod" href="#/login">Conocer módulo →</a></article>
      </div>
    </div>
  </section>
  <section class="band" id="roles" style="padding-top:0">
    <div class="wrap">
      <div class="sec-head rv"><span class="kicker">Un solo login</span><h2>Cada quien ve solo lo suyo</h2><p>Un usuario y contraseña para todo. El sistema abre los módulos que le corresponden a cada rol.</p></div>
      <div class="roles">
        <div class="role-card rv">
          <div class="role-row"><span class="role-ico" style="background:rgba(0,94,54,.12)">👑</span><span class="who">Dueño</span><span class="see">Ve todos los colegios y la caja global</span></div>
          <div class="role-row"><span class="role-ico" style="background:rgba(123,193,39,.2)">🧑‍💼</span><span class="who">Administración</span><span class="see">Caja, pensiones y recibos de su colegio</span></div>
          <div class="role-row"><span class="role-ico" style="background:rgba(0,132,194,.14)">🧑‍🏫</span><span class="who">Docente</span><span class="see">Pase de lista, notas y sesiones con IA</span></div>
          <div class="role-row"><span class="role-ico" style="background:rgba(179,113,54,.16)">👪</span><span class="who">Familia</span><span class="see">Notas, asistencia y estado de cuenta de su hijo</span></div>
        </div>
        <div class="rv" style="--d:.1s">
          <h3 style="font-size:1.6rem;margin-bottom:12px">La nota de EduAssist alimenta el reporte de EduAdmin.</h3>
          <p style="color:rgba(14,42,28,.76);font-size:1.02rem">Ese es el valor real de la suite: los datos conectados. La IA de EduIA conoce el contexto del aula, y EduBank premia el esfuerzo que registra el docente. Un solo sistema, una sola verdad.</p>
          <a class="btn btn-base" href="#/login" style="margin-top:20px">Entrar al sistema →</a>
        </div>
      </div>
    </div>
  </section>
  <section class="cta-band" id="demo">
    <div class="wrap cta-grid" style="padding:80px 24px">
      <div class="rv">
        <span class="kicker" style="color:var(--gold)">Demo personalizada</span>
        <h2>Mira tu colegio funcionando <em>antes de decidir.</em></h2>
        <p style="opacity:.85">En 30 minutos cargamos una muestra con tus grados y pensiones reales.</p>
        <ul class="cta-list"><li>Sin tarjeta, sin compromiso</li><li>Con datos de ejemplo de tu propio colegio</li><li>Invita a tu administrador y a un docente</li></ul>
      </div>
      <form class="demo-form rv" id="demoForm" style="--d:.15s">
        <label>Nombre y cargo</label><input type="text" placeholder="Ej. Rosa Mendoza, Directora" required>
        <label>Colegio</label><input type="text" placeholder="Nombre de la institución" required>
        <label>N.º de alumnos</label><select><option>Menos de 200</option><option selected>200 – 500</option><option>500 – 1000</option><option>Más de 1000</option></select>
        <label>Correo</label><input type="email" placeholder="direccion@colegio.edu" required>
        <button class="btn btn-base" type="submit">Quiero mi demo →</button>
        <p class="form-note">🔒 Tus datos solo se usan para coordinar la demo.</p>
      </form>
    </div>
  </section>` + footerHTML()

  const order = ['admin','assist','ia','bank']; let di = 0
  const showMod = m => { app.querySelectorAll('.deck-tab').forEach(b => b.classList.toggle('on', b.dataset.m === m)); app.querySelectorAll('.mod').forEach(p => p.classList.toggle('on', p.dataset.m === m)) }
  const restart = () => { clearInterval(deckTimer); deckTimer = setInterval(() => { di = (di + 1) % 4; showMod(order[di]) }, 5200) }
  const tabs = app.querySelector('.deck-tabs')
  if (tabs) tabs.addEventListener('click', e => { const b = e.target.closest('.deck-tab'); if (!b) return; di = order.indexOf(b.dataset.m); showMod(b.dataset.m); restart() })
  restart()
  addEventListener('scroll', () => { const h = document.getElementById('topbar'); if (h) h.classList.toggle('scrolled', scrollY > 10) })
  const df = document.getElementById('demoForm')
  if (df) df.addEventListener('submit', e => { e.preventDefault(); const b = df.querySelector('button'); b.textContent = '✓ ¡Listo! Te contactamos hoy'; b.style.background = 'var(--base)'; b.style.color = '#fff'; df.querySelectorAll('input,select').forEach(i => i.disabled = true) })
}

/* ============ LOGIN ============ */
function renderLogin(){
  app.innerHTML = headerHTML('login') + `
  <div class="auth-wrap">
    <div class="auth-art">
      <span class="art-stk a1">🔒 RLS activo</span><span class="art-stk a2">👑 superadmin</span>
      <img class="art-logo" src="/logos/edusistema.png" alt="EduSistema" onerror="this.style.display='none'">
      <h2>El sistema operativo<br><em>de tu colegio.</em></h2>
      <p>Entra con tu cuenta y el sistema te abrirá exactamente lo que te corresponde: la caja, el aula, la IA o el banco-escuela.</p>
    </div>
    <div class="auth-form-side">
      <div class="auth-card">
        <a class="logo" href="#/"><span class="logo-badge">E</span>${WM(false)}</a>
        <div class="atag">Acceso · inicia sesión para continuar</div>
        <form id="loginForm">
          <div class="field"><label for="email">Correo</label><input id="email" type="email" placeholder="tu@correo.com" required autocomplete="email"></div>
          <div class="field"><label for="pass">Contraseña</label><input id="pass" type="password" placeholder="••••••••" required autocomplete="current-password"></div>
          <button class="btn btn-base" type="submit" id="loginBtn">Entrar →</button>
        </form>
        <div class="auth-msg" id="authMsg"></div>
        <div class="auth-foot">¿Eres director y aún no tienes cuenta? <a href="#/demo">Solicita una demo</a></div>
      </div>
    </div>
  </div>`
}
async function doLogin(email, password){
  const msg = document.getElementById('authMsg'), btn = document.getElementById('loginBtn')
  const show = (txt, ok) => { msg.textContent = txt; msg.className = 'auth-msg show ' + (ok ? 'ok' : 'err') }
  btn.disabled = true; btn.textContent = '⏳ Entrando…'
  const { error } = await sb.auth.signInWithPassword({ email, password })
  if (error){ btn.disabled = false; btn.textContent = 'Entrar →'; const map = { 'Invalid login credentials': 'Correo o contraseña incorrectos.', 'Email not confirmed': 'Tu correo aún no está confirmado.' }; show('❌ ' + (map[error.message] || error.message), false); return }
  show('✅ Conectado… abriendo tu panel', true); location.hash = '#/dueno'
}

/* ============ PANEL DEL DUEÑO · gestión de colegios ============ */
let D = { perfil: null, colegios: [], alumnos: [], pagos: [], perfiles: [] }
let W = null // wizard state

async function renderDueno(perfil){
  D.perfil = perfil
  app.innerHTML = `
  <div class="app-shell">
    <aside class="side">
      <a class="logo" href="#/"><span class="logo-badge gold">E</span>${WM(true)}</a>
      <a class="nav-i on" href="#/dueno">🏛️ Panel del dueño</a>
      <a class="nav-i" href="#/">🌐 Ver landing</a>
      <div class="side-foot">
        <div class="me"><span class="av">${esc((perfil.nombre || 'J').trim().charAt(0).toUpperCase())}</span><span><span class="mn">${esc(perfil.nombre)}</span><br><span class="mr">👑 Dueño</span></span></div>
        <button class="btn btn-ghost btn-sm" data-action="dueno-logout" style="width:100%;color:#E9F5EE;border-color:rgba(255,255,255,.3)">Cerrar sesión</button>
      </div>
    </aside>
    <main class="main">
      <div class="topbar">
        <div><div class="crumb">edusistema / panel del dueño</div><h1>Hola, ${esc(perfil.nombre)} 👋</h1></div>
        <div class="spacer"></div>
        <button class="btn btn-sm btn-base" data-action="dueno-new">＋ Nuevo colegio</button>
        <button class="btn btn-sm btn-ghost" data-action="dueno-reload">↻ Actualizar</button>
      </div>
      <div id="duenoBody"><div class="empty"><div class="eico">⏳</div><h3>Cargando…</h3></div></div>
    </main>
  </div>`
  await loadDueno()
}

async function loadDueno(){
  const [{ data: colegios }, { data: alumnos }, { data: pagos }, { data: perfiles }] = await Promise.all([
    sb.from('colegios').select('*').order('creado_en', { ascending: false }),
    sb.from('alumnos').select('*'), sb.from('pagos').select('*'),
    sb.from('perfiles').select('id,colegio_id,nombre,rol').eq('rol', 'admin')
  ])
  D.colegios = colegios || []; D.alumnos = alumnos || []; D.pagos = pagos || []; D.perfiles = perfiles || []
  paintDueno()
}

function paintDueno(){
  const body = document.getElementById('duenoBody'); if (!body) return
  const cols = D.colegios
  const totAlum = D.alumnos.length
  const totRec = D.pagos.filter(p => p.estado === 'pagado').reduce((s, p) => s + Number(p.monto || 0), 0)
  const totPend = D.pagos.filter(p => p.estado !== 'pagado').length
  const kpis = `<div class="kpis">
    <div class="kpi k1 rv"><span class="kico">🏫</span><div class="kl">Colegios</div><div class="kv">${cols.length}</div><div class="ks">en la plataforma</div></div>
    <div class="kpi k2 rv" style="--d:.06s"><span class="kico">🧒</span><div class="kl">Alumnos</div><div class="kv">${totAlum}</div><div class="ks">matriculados</div></div>
    <div class="kpi k3 rv" style="--d:.12s"><span class="kico">💰</span><div class="kl">Recaudado</div><div class="kv" style="font-size:1.7rem">${money(totRec)}</div><div class="ks">pagos confirmados</div></div>
    <div class="kpi k4 rv" style="--d:.18s"><span class="kico">⏰</span><div class="kl">Pagos pendientes</div><div class="kv">${totPend}</div><div class="ks">por cobrar</div></div>
  </div>`

  if (cols.length === 0){
    body.innerHTML = kpis + `<div class="empty-state rv">
      <div class="es-ring"><span class="logo-badge gold" style="width:64px;height:64px;font-size:1.8rem;border-radius:14px">E</span></div>
      <h3>Aún no has dado de alta ningún colegio</h3>
      <p>Crea el primero y asígnale su plan y su director. Desde ese momento, su administrador entrará con su propio login y verá únicamente su colegio.</p>
      <button class="btn btn-base pulse-soft" data-action="dueno-new">＋ Crear mi primer colegio</button>
    </div>`
    initReveals(); return
  }

  const cards = cols.map((c, i) => {
    const cAls = D.alumnos.filter(a => a.colegio_id === c.id)
    const cPgs = D.pagos.filter(p => p.colegio_id === c.id)
    const rec = cPgs.filter(p => p.estado === 'pagado').reduce((s, p) => s + Number(p.monto || 0), 0)
    const pend = cPgs.filter(p => p.estado !== 'pagado').length
    const dir = D.perfiles.find(p => p.colegio_id === c.id)
    const st = c.estado || 'prueba'
    return `<article class="ccard rv" style="--d:${Math.min(i * .06, .3)}s">
      <div class="ccard-top">
        <span class="cico">🏫</span>
        <div style="flex:1;min-width:0">
          <h3>${esc(c.nombre)}</h3>
          <span class="cplan">${esc(c.plan || 'semillero')}</span>
          ${c.codigo_modular ? `<span class="cmod">CM ${esc(c.codigo_modular)}</span>` : ''}
        </div>
        <span class="state-chip ${st}">${st === 'activo' ? '● Activo' : st === 'suspendido' ? '○ Suspendido' : '◐ En prueba'}</span>
      </div>
      <div class="cmetrics">
        <div class="cmet"><b>${cAls.length}</b><span>alumnos</span></div>
        <div class="cmet"><b style="color:var(--admin-ink)">${money(rec)}</b><span>recaudado</span></div>
        <div class="cmet ${pend ? 'warn' : ''}"><b>${pend}</b><span>pendientes</span></div>
      </div>
      <div class="ccard-foot">
        <span class="ccard-dir">${dir ? '👤 ' + esc(dir.nombre || 'Director') : '<em>sin director</em>'}</span>
        <span class="ccard-act">
          <button class="btn btn-sm" data-action="dueno-edit" data-id="${c.id}">✏️ Editar</button>
          <button class="btn btn-sm btn-ghost dot-btn" data-action="dueno-menu" data-id="${c.id}" aria-label="Más">⋯</button>
        </span>
      </div>
      <div class="ccard-menu" id="menu-${c.id}">
        <button data-action="dueno-edit" data-id="${c.id}">✏️ Editar ficha</button>
        <button data-action="dueno-toggle" data-id="${c.id}">${st === 'suspendido' ? '▶ Reactivar' : '⏸ Suspender'}</button>
        <button class="danger" data-action="dueno-delete" data-id="${c.id}">🗑 Eliminar colegio</button>
      </div>
    </article>`
  }).join('')
  body.innerHTML = kpis + `<div class="panel-head rv"><h2>Tus colegios</h2><span class="ph-note">${cols.length} registrado(s) · el director de cada uno entra con su propio login</span></div><div class="colegios">${cards}</div>`
  initReveals()
}

/* ---------- wizard ---------- */
function openWizard(mode, id){
  const c = mode === 'editar' ? (D.colegios.find(x => x.id === id) || {}) : {}
  const dir = mode === 'editar' ? D.perfiles.find(p => p.colegio_id === id) : null
  W = { mode, step: 1, colegioId: id || null, data: {
    nombre: c.nombre || '', documento: c.documento || '', codigo_modular: c.codigo_modular || '',
    direccion: c.direccion || '', telefono: c.telefono || '', correo_contacto: c.correo_contacto || '',
    plan: c.plan || 'semillero', estado: c.estado || 'prueba', inicio_contrato: c.inicio_contrato || '', alumnos_contratados: c.alumnos_contratados ?? '',
    dir_nombre: dir ? (dir.nombre || '') : '', dir_email: '', dir_pass: '', dir_skip: false
  }}
  paintWizard()
  document.getElementById('wzModal').classList.add('open')
}
function closeWizard(){ document.getElementById('wzModal').classList.remove('open'); W = null }
function maxStep(){ return W.mode === 'editar' ? 2 : 3 }
function paintWizard(){
  const m = document.getElementById('wzModal')
  if (!m){ // inyectar modal una sola vez
    const node = document.createElement('div'); node.id = 'wzModal'; node.className = 'wz-overlay'
    node.innerHTML = `<div class="wz-back" data-action="wz-close"></div><div class="wz-card"><div class="wz-head"><h3 id="wzTitle">—</h3><button class="wz-x" data-action="wz-close">✕</button></div><div class="wz-stepper" id="wzStepper"></div><div class="wz-body" id="wzBody"></div><div class="wz-foot" id="wzFoot"></div></div>`
    document.body.appendChild(node)
  }
  const total = maxStep()
  document.getElementById('wzTitle').textContent = W.mode === 'editar' ? 'Editar colegio' : 'Nuevo colegio'
  document.getElementById('wzStepper').innerHTML = ['Colegio', 'Plan y contrato', 'Director'].slice(0, total).map((label, i) => {
    const n = i + 1, cls = n < W.step ? 'done' : n === W.step ? 'on' : ''
    return `<div class="wz-node ${cls}"><span class="wz-dot">${n < W.step ? '✓' : n}</span><span class="wz-lbl">${label}</span></div>${n < total ? '<span class="wz-line ' + (n < W.step ? 'fill' : '') + '"></span>' : ''}`
  }).join('')
  document.getElementById('wzBody').innerHTML = wizardPane()
  const foot = document.getElementById('wzFoot')
  foot.innerHTML = `<button class="btn btn-ghost" data-action="wz-close">Cancelar</button><span class="spacer"></span>${W.step > 1 ? '<button class="btn" data-action="wz-back">← Atrás</button>' : ''}<button class="btn btn-base" data-action="wz-next">${W.step === total ? (W.mode === 'editar' ? 'Guardar cambios ✓' : 'Crear colegio ✓') : 'Siguiente →'}</button>`
}
function wizardPane(){
  const d = W.data
  if (W.step === 1){
    return `<div class="wz-pane" data-step="1">
      <div class="f2"><div class="field full"><label>Nombre del colegio *</label><input id="w_nombre" value="${esc(d.nombre)}" placeholder="Ej. Corazón de Santa Maria"></div></div>
      <div class="f2"><div class="field"><label>RUC / documento fiscal</label><input id="w_documento" value="${esc(d.documento)}" placeholder="20123456789"></div><div class="field"><label>Código modular (SIAGIE)</label><input id="w_codigo_modular" value="${esc(d.codigo_modular)}" placeholder="123456"></div></div>
      <div class="field full"><label>Dirección</label><input id="w_direccion" value="${esc(d.direccion)}" placeholder="Av. …"></div>
      <div class="f2"><div class="field"><label>Teléfono</label><input id="w_telefono" value="${esc(d.telefono)}" placeholder="+51 999 …"></div><div class="field"><label>Correo de contacto</label><input id="w_correo_contacto" value="${esc(d.correo_contacto)}" placeholder="direccion@colegio.edu"></div></div>
    </div>`
  }
  if (W.step === 2){
    return `<div class="wz-pane" data-step="2">
      <label class="wz-label">Plan</label>
      <div class="plan-pick">${PLANES.map(([v, ic, nm, pr]) => `<label class="plan-opt ${d.plan === v ? 'sel' : ''}"><input type="radio" name="w_plan" value="${v}" ${d.plan === v ? 'checked' : ''}><span class="po-ic">${ic}</span><span class="po-nm">${nm}</span><span class="po-pr">${pr}</span><span class="po-ck">✓</span></label>`).join('')}</div>
      <label class="wz-label">Estado</label>
      <div class="seg">${ESTADOS.map(([v, l]) => `<label class="seg-opt ${d.estado === v ? 'sel ' + v : ''}"><input type="radio" name="w_estado" value="${v}" ${d.estado === v ? 'checked' : ''}>${l}</label>`).join('')}</div>
      <div class="f2" style="margin-top:18px"><div class="field"><label>Inicio del contrato</label><input id="w_inicio_contrato" type="date" value="${esc(d.inicio_contrato)}"></div><div class="field"><label>Alumnos contratados</label><input id="w_alumnos_contratados" type="number" min="0" value="${esc(d.alumnos_contratados)}" placeholder="300"></div></div>
      ${W.mode === 'editar' ? `<div class="wz-info">👤 Director actual: <strong>${esc(D.perfiles.find(p => p.colegio_id === W.colegioId)?.nombre || '—')}</strong><br><span class="dim">El acceso del director se gestiona desde Supabase → Authentication por ahora.</span></div>` : ''}
    </div>`
  }
  // step 3 (solo crear)
  return `<div class="wz-pane" data-step="3">
    <p class="wz-intro">Este usuario entrará como <strong>director</strong> del colegio y verá <em>solo</em> este colegio. Puedes saltarlo y crearlo después.</p>
    <label class="wz-check"><input type="checkbox" id="w_dir_skip" ${d.dir_skip ? 'checked' : ''}> Saltar este paso (crear el director más tarde)</label>
    <div class="wz-dirbox ${d.dir_skip ? 'off' : ''}">
      <div class="field full"><label>Nombre del director *</label><input id="w_dir_nombre" value="${esc(d.dir_nombre)}" placeholder="Rosa Mendoza"></div>
      <div class="field full"><label>Correo de acceso *</label><input id="w_dir_email" type="email" value="${esc(d.dir_email)}" placeholder="rosa@colegio.edu"></div>
      <div class="field full"><label>Contraseña temporal * <button type="button" class="mini-btn" data-action="wz-randpass">🎲 generar</button></label><input id="w_dir_pass" type="text" value="${esc(d.dir_pass)}" placeholder="mínimo 6 caracteres"></div>
    </div>
    <div class="wz-summary"><strong>Resumen</strong><br>${esc(d.nombre || '—')} · plan <em>${esc(d.plan)}</em> · ${esc(d.estado)}${d.inicio_contrato ? ' · desde ' + fmtDate(d.inicio_contrato) : ''}</div>
  </div>`
}
function readPane(){
  const g = id => { const el = document.getElementById(id); return el ? el.value : undefined }
  const r = name => { const el = document.querySelector(`input[name="${name}"]:checked`); return el ? el.value : undefined }
  if (W.step === 1){ Object.assign(W.data, { nombre: g('w_nombre'), documento: g('w_documento'), codigo_modular: g('w_codigo_modular'), direccion: g('w_direccion'), telefono: g('w_telefono'), correo_contacto: g('w_correo_contacto') }) }
  else if (W.step === 2){ Object.assign(W.data, { plan: r('w_plan') || W.data.plan, estado: r('w_estado') || W.data.estado, inicio_contrato: g('w_inicio_contrato'), alumnos_contratados: g('w_alumnos_contratados') }) }
  else { const sk = document.getElementById('w_dir_skip'); W.data.dir_skip = !!sk && sk.checked; if (!W.data.dir_skip) Object.assign(W.data, { dir_nombre: g('w_dir_nombre'), dir_email: g('w_dir_email'), dir_pass: g('w_dir_pass') }) }
}
function validateStep(){
  const d = W.data
  if (W.step === 1){ if (!d.nombre || !d.nombre.trim()){ toast('El nombre del colegio es obligatorio', 'err'); return false } return true }
  if (W.step === 2) return true
  if (W.step === 3){ if (d.dir_skip) return true; if (!d.dir_nombre || !d.dir_nombre.trim()){ toast('Falta el nombre del director', 'err'); return false } if (!d.dir_email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.dir_email)){ toast('Correo del director inválido', 'err'); return false } if (!d.dir_pass || d.dir_pass.length < 6){ toast('La contraseña debe tener al menos 6 caracteres', 'err'); return false } return true }
  return true
}
function randPass(){ const a = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'; let s = ''; for (let i = 0; i < 10; i++) s += a[Math.floor(Math.random() * a.length)]; return s + '!' }
async function wizardNext(){
  readPane()
  if (!validateStep()) return
  if (W.step < maxStep()){ W.step++; paintWizard(); return }
  // submit
  const btn = document.querySelector('#wzFoot [data-action="wz-next"]'); btn.disabled = true; btn.textContent = '⏳ Guardando…'
  if (W.mode === 'editar'){
    const { error } = await sb.from('colegios').update({
      nombre: W.data.nombre.trim(), documento: W.data.documento || null, codigo_modular: W.data.codigo_modular || null,
      direccion: W.data.direccion || null, telefono: W.data.telefono || null, correo_contacto: W.data.correo_contacto || null,
      plan: W.data.plan, estado: W.data.estado, inicio_contrato: W.data.inicio_contrato || null, alumnos_contratados: Number(W.data.alumnos_contratados) || 0
    }).eq('id', W.colegioId)
    btn.disabled = false
    if (error){ toast('Error: ' + error.message, 'err'); return }
    toast('Colegio actualizado ✓'); closeWizard(); await loadDueno(); return
  }
  // crear vía Edge Function
  const body = {
    colegio: { nombre: W.data.nombre.trim(), documento: W.data.documento, codigo_modular: W.data.codigo_modular, direccion: W.data.direccion, telefono: W.data.telefono, correo_contacto: W.data.correo_contacto, plan: W.data.plan, estado: W.data.estado, inicio_contrato: W.data.inicio_contrato || null, alumnos_contratados: Number(W.data.alumnos_contratados) || 0 },
    director: W.data.dir_skip ? {} : { nombre: W.data.dir_nombre.trim(), email: W.data.dir_email.trim(), password: W.data.dir_pass }
  }
  const { data, error } = await sb.functions.invoke('crear-colegio', { body })
  btn.disabled = false
  if (error){ toast('Error de conexión con el servidor: ' + (error.message || ''), 'err'); return }
  if (data && data.error){ toast('❌ ' + data.error, 'err'); return }
  toast('✅ Colegio creado' + (data && data.directorId ? ' · director listo para entrar' : ''), 'ok')
  closeWizard(); await loadDueno()
}
async function toggleEstado(id){
  const c = D.colegios.find(x => x.id === id); if (!c) return
  const nuevo = (c.estado === 'suspendido') ? 'activo' : 'suspendido'
  const { error } = await sb.from('colegios').update({ estado: nuevo }).eq('id', id)
  if (error){ toast('Error: ' + error.message, 'err'); return }
  toast(nuevo === 'suspendido' ? 'Colegio suspendido' : 'Colegio reactivado'); await loadDueno()
}
async function deleteColegio(id){
  const c = D.colegios.find(x => x.id === id); if (!c) return
  const { count: ca } = await sb.from('alumnos').select('id', { count: 'exact', head: true }).eq('colegio_id', id)
  const { count: cp } = await sb.from('pagos').select('id', { count: 'exact', head: true }).eq('colegio_id', id)
  if ((ca || 0) > 0 || (cp || 0) > 0){ toast('No se puede eliminar: el colegio tiene alumnos o pagos registrados', 'err'); return }
  if (!confirm(`¿Eliminar el colegio "${c.nombre}"? Esta acción no se puede deshacer.`)) return
  const { error } = await sb.from('colegios').delete().eq('id', id)
  if (error){ toast('Error: ' + error.message, 'err'); return }
  toast('Colegio eliminado'); await loadDueno()
}

/* ---------- delegación global ---------- */
document.addEventListener('click', e => {
  // cerrar menús si clic fuera
  const inMenu = e.target.closest('.ccard-menu') || e.target.closest('[data-action="dueno-menu"]')
  if (!inMenu) document.querySelectorAll('.ccard-menu.open').forEach(m => m.classList.remove('open'))
  const el = e.target.closest('[data-action]'); if (!el) return
  const act = el.dataset.action
  if (act === 'dueno-logout') sb.auth.signOut().then(() => { location.hash = '#/' })
  else if (act === 'dueno-reload') loadDueno()
  else if (act === 'dueno-new') openWizard('crear')
  else if (act === 'dueno-edit') openWizard('editar', el.dataset.id)
  else if (act === 'dueno-menu'){ const m = document.getElementById('menu-' + el.dataset.id); document.querySelectorAll('.ccard-menu.open').forEach(x => { if (x !== m) x.classList.remove('open') }); m.classList.toggle('open') }
  else if (act === 'dueno-toggle') toggleEstado(el.dataset.id)
  else if (act === 'dueno-delete') deleteColegio(el.dataset.id)
  else if (act === 'wz-close') closeWizard()
  else if (act === 'wz-back'){ readPane(); W.step--; paintWizard() }
  else if (act === 'wz-next') wizardNext()
  else if (act === 'wz-randpass'){ const i = document.getElementById('w_dir_pass'); if (i){ i.value = randPass(); W.data.dir_pass = i.value } }
})
document.addEventListener('change', e => {
  if (e.target.name === 'w_plan'){ W.data.plan = e.target.value; document.querySelectorAll('.plan-opt').forEach(o => o.classList.toggle('sel', o.querySelector('input').checked)) }
  if (e.target.name === 'w_estado'){ W.data.estado = e.target.value; document.querySelectorAll('.seg-opt').forEach(o => { const v = o.querySelector('input').value; o.classList.toggle('sel', o.querySelector('input').checked); o.classList.toggle(v, o.querySelector('input').checked) }) }
  if (e.target.id === 'w_dir_skip'){ W.data.dir_skip = e.target.checked; const box = document.querySelector('.wz-dirbox'); if (box) box.classList.toggle('off', e.target.checked) }
})
document.addEventListener('submit', e => { if (e.target.id === 'loginForm'){ e.preventDefault(); doLogin(document.getElementById('email').value.trim(), document.getElementById('pass').value) } })

/* ============ arranque ============ */
resolve()