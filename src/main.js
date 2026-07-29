import './style.css'
import { sb } from './supabase.js'

const app = document.getElementById('app')
let deckTimer = null
let revealObs = null

/* ============ utilidades ============ */
const money = n => '$ ' + Number(n || 0).toLocaleString('es-PE')
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const WM = (dark) => `<span class="wm lg${dark ? ' on-dark' : ''}"><span class="a">Edu</span><span class="b">Sistema</span></span>`
function clearTimers(){ if (deckTimer) clearInterval(deckTimer); deckTimer = null }
function initReveals(){
  if (revealObs) revealObs.disconnect()
  revealObs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); revealObs.unobserve(e.target) } }), { threshold: .12 })
  app.querySelectorAll('.rv').forEach(el => revealObs.observe(el))
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
      <div class="sec-head rv">
        <span class="kicker">Los 4 módulos</span>
        <h2>Un ecosistema, no cuatro apps sueltas</h2>
        <p>Cada módulo resuelve un dolor distinto del colegio — y todos se alimentan de los mismos datos. Una marca, cuatro especialistas.</p>
      </div>
      <div class="bento">
        <article class="bcard b-admin rv">
          <span class="btag">MÓDULO 01 · FINANZAS</span>
          <img class="mod-lockup" src="/logos/eduadmin.png" alt="EduAdmin — administración escolar inteligente" onerror="this.style.display='none'">
          <p class="sub">La caja del colegio bajo control: pensiones, matrículas, recibos y reportes — sin hojas de cálculo.</p>
          <a class="link-mod" href="#/login">Conocer módulo →</a>
        </article>
        <article class="bcard b-assist rv" style="--d:.1s">
          <span class="btag">MÓDULO 02 · ACADÉMICO</span>
          <img class="mod-lockup" src="/logos/eduassist.png" alt="EduAssist — asistencia y calificaciones" onerror="this.style.display='none'">
          <p class="sub">Horarios, pase de lista y notas en el bolsillo del docente, con boletas listas para la familia.</p>
          <a class="link-mod" href="#/login">Conocer módulo →</a>
        </article>
        <article class="bcard b-ia rv">
          <span class="btag">MÓDULO 03 · IA DOCENTE</span>
          <img class="mod-lockup" src="/logos/eduia.png" alt="EduIA — inteligencia artificial educativa" onerror="this.style.display='none'">
          <p class="sub">Sesiones, programaciones y rúbricas generadas con IA, alineadas al currículo y a tu aula real.</p>
          <a class="link-mod" href="#/login">Conocer módulo →</a>
        </article>
        <article class="bcard b-bank rv" style="--d:.1s">
          <span class="btag">MÓDULO 04 · ED. FINANCIERA</span>
          <img class="mod-lockup" src="/logos/edubank.png" alt="EduBank — gestión financiera escolar" onerror="this.style.display='none'">
          <p class="sub">Un banco-escuela con IA donde los estudiantes ahorran, presupuestan e invierten con monedas virtuales.</p>
          <a class="link-mod" href="#/login">Conocer módulo →</a>
        </article>
      </div>
    </div>
  </section>

  <section class="band" id="roles" style="padding-top:0">
    <div class="wrap">
      <div class="sec-head rv">
        <span class="kicker">Un solo login</span>
        <h2>Cada quien ve solo lo suyo</h2>
        <p>Un usuario y contraseña para todo. El sistema abre los módulos que le corresponden a cada rol.</p>
      </div>
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
        <ul class="cta-list">
          <li>Sin tarjeta, sin compromiso</li>
          <li>Con datos de ejemplo de tu propio colegio</li>
          <li>Invita a tu administrador y a un docente</li>
        </ul>
      </div>
      <form class="demo-form rv" id="demoForm" style="--d:.15s">
        <label>Nombre y cargo</label>
        <input type="text" placeholder="Ej. Rosa Mendoza, Directora" required>
        <label>Colegio</label>
        <input type="text" placeholder="Nombre de la institución" required>
        <label>N.º de alumnos</label>
        <select><option>Menos de 200</option><option selected>200 – 500</option><option>500 – 1000</option><option>Más de 1000</option></select>
        <label>Correo</label>
        <input type="email" placeholder="direccion@colegio.edu" required>
        <button class="btn btn-base" type="submit">Quiero mi demo →</button>
        <p class="form-note">🔒 Tus datos solo se usan para coordinar la demo.</p>
      </form>
    </div>
  </section>
  ` + footerHTML()

  const order = ['admin','assist','ia','bank']; let di = 0
  const showMod = m => {
    app.querySelectorAll('.deck-tab').forEach(b => b.classList.toggle('on', b.dataset.m === m))
    app.querySelectorAll('.mod').forEach(p => p.classList.toggle('on', p.dataset.m === m))
  }
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
      <span class="art-stk a1">🔒 RLS activo</span>
      <span class="art-stk a2">👑 superadmin</span>
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
  const msg = document.getElementById('authMsg')
  const btn = document.getElementById('loginBtn')
  const show = (txt, ok) => { msg.textContent = txt; msg.className = 'auth-msg show ' + (ok ? 'ok' : 'err') }
  btn.disabled = true; btn.textContent = '⏳ Entrando…'
  const { error } = await sb.auth.signInWithPassword({ email, password })
  if (error){
    btn.disabled = false; btn.textContent = 'Entrar →'
    const map = { 'Invalid login credentials': 'Correo o contraseña incorrectos.', 'Email not confirmed': 'Tu correo aún no está confirmado.' }
    show('❌ ' + (map[error.message] || error.message), false)
    return
  }
  show('✅ Conectado… abriendo tu panel', true)
  location.hash = '#/dueno'
}

/* ============ PANEL DEL DUEÑO ============ */
async function renderDueno(perfil){
  app.innerHTML = `
  <div class="app-shell">
    <aside class="side">
      <a class="logo" href="#/"><span class="logo-badge gold">E</span>${WM(true)}</a>
      <a class="nav-i on" href="#/dueno">🏛️ Panel del dueño</a>
      <a class="nav-i" href="#/">🌐 Ver landing</a>
      <div class="side-foot">
        <div class="me">
          <span class="av">${esc((perfil.nombre || 'J').trim().charAt(0).toUpperCase())}</span>
          <span><span class="mn">${esc(perfil.nombre)}</span><br><span class="mr">👑 Dueño</span></span>
        </div>
        <button class="btn btn-ghost btn-sm" data-action="logout" style="width:100%;color:#E9F5EE;border-color:rgba(255,255,255,.3)">Cerrar sesión</button>
      </div>
    </aside>
    <main class="main">
      <div class="topbar">
        <div>
          <div class="crumb">edusistema / panel del dueño</div>
          <h1>Hola, ${esc(perfil.nombre)} 👋</h1>
        </div>
        <div class="spacer"></div>
        <button class="btn btn-sm" data-action="seed">🌱 Sembrar datos de demo</button>
        <button class="btn btn-sm btn-ghost" data-action="reload">↻ Actualizar</button>
      </div>
      <div id="panelBody"><div class="empty"><div class="eico">⏳</div><h3>Cargando tus colegios…</h3></div></div>
    </main>
  </div>`
  await paintPanel()
}

async function paintPanel(){
  const body = document.getElementById('panelBody')
  if (!body) return
  const [{ data: colegios }, { data: alumnos }, { data: pagos }] = await Promise.all([
    sb.from('colegios').select('*'),
    sb.from('alumnos').select('*'),
    sb.from('pagos').select('*')
  ])
  const cols = colegios || [], als = alumnos || [], pgs = pagos || []
  const nameOf = id => (als.find(a => a.id === id) || {}).nombre || '—'

  const totAlum = als.length
  const totRecaudado = pgs.filter(p => p.estado === 'pagado').reduce((s, p) => s + Number(p.monto || 0), 0)
  const totPend = pgs.filter(p => p.estado !== 'pagado').length

  const kpis = `
    <div class="kpis">
      <div class="kpi k1 rv"><span class="kico">🏫</span><div class="kl">Colegios</div><div class="kv">${cols.length}</div><div class="ks">en la plataforma</div></div>
      <div class="kpi k2 rv" style="--d:.06s"><span class="kico">🧒</span><div class="kl">Alumnos</div><div class="kv">${totAlum}</div><div class="ks">matriculados</div></div>
      <div class="kpi k3 rv" style="--d:.12s"><span class="kico">💰</span><div class="kl">Recaudado</div><div class="kv" style="font-size:1.7rem">${money(totRecaudado)}</div><div class="ks">pagos confirmados</div></div>
      <div class="kpi k4 rv" style="--d:.18s"><span class="kico">⏰</span><div class="kl">Pagos pendientes</div><div class="kv">${totPend}</div><div class="ks">por cobrar</div></div>
    </div>`

  let cards
  if (cols.length === 0){
    cards = `<div class="empty rv"><div class="eico">🏫</div><h3>Aún no hay colegios</h3><p>Crea tu primer colegio en Supabase (tabla <code>colegios</code>) o siembra datos de demo para verlo cobrar vida.</p><button class="btn btn-base" data-action="seed">🌱 Sembrar datos de demo</button></div>`
  } else {
    cards = `<div class="panel-head rv"><h2>Tus colegios</h2><span class="ph-note">toca "Ver caja" para desplegar los pagos</span></div>
    <div class="colegios">` + cols.map((c, i) => {
      const cAls = als.filter(a => a.colegio_id === c.id)
      const cPgs = pgs.filter(p => p.colegio_id === c.id)
      const recaudado = cPgs.filter(p => p.estado === 'pagado').reduce((s, p) => s + Number(p.monto || 0), 0)
      const pend = cPgs.filter(p => p.estado !== 'pagado').length
      const txs = cPgs.slice(0, 30).map(p => `
        <div class="tx">
          <span><span class="who">${esc(nameOf(p.alumno_id))}</span> <span class="pill ${p.estado}">${p.estado}</span><br><span class="meta">${esc(p.concepto || 'pensión')} · ${esc(p.metodo || '—')}</span></span>
          <span class="amt ${p.estado === 'pagado' ? 'plus' : 'minus'}">${p.estado === 'pagado' ? '+' : '−'}${money(p.monto)}</span>
        </div>`).join('') || `<div class="tx"><span class="meta">Sin pagos registrados todavía.</span></div>`
      return `
      <article class="ccard rv" style="--d:${Math.min(i * .06, .3)}s" data-colegio="${c.id}">
        <div class="ccard-top">
          <span class="cico">🏫</span>
          <div><h3>${esc(c.nombre)}</h3><span class="cplan">plan ${esc(c.plan || 'semillero')}</span></div>
          <button class="btn btn-sm copen" data-action="toggle-caja">Ver caja ▾</button>
        </div>
        <div class="cmetrics">
          <div class="cmet"><b>${cAls.length}</b><span>alumnos</span></div>
          <div class="cmet"><b style="color:var(--admin-ink)">${money(recaudado)}</b><span>recaudado</span></div>
          <div class="cmet ${pend ? 'warn' : ''}"><b>${pend}</b><span>pendientes</span></div>
        </div>
        <div class="caja-detail">${txs}</div>
      </article>`
    }).join('') + `</div>`
  }

  body.innerHTML = kpis + cards
  initReveals()
}

async function seedDemo(){
  const { data: cols } = await sb.from('colegios').select('*').limit(1)
  if (!cols || !cols.length){ alert('Crea primero un colegio en la tabla "colegios" de Supabase.'); return }
  const colegio = cols[0]
  const { data: ya } = await sb.from('alumnos').select('id').eq('colegio_id', colegio.id).limit(1)
  if (ya && ya.length && !confirm('Ya hay alumnos de demo en "' + colegio.nombre + '". ¿Añadir otro lote?')) return

  const nombres = ['Lucía Ramos','Mateo Guerra','Valeria Soto','Diego Paredes','Sofía Medina','Bruno Quispe']
  const grados = ['3º','3º','4º','4º','5º','5º']
  const secs = ['A','B','A','B','A','B']
  const rows = nombres.map((n, i) => ({ colegio_id: colegio.id, nombre: n, grado: grados[i], seccion: secs[i], pension_mensual: 180, estado: 'activo' }))
  const { data: ins, error } = await sb.from('alumnos').insert(rows).select('id,nombre')
  if (error){ alert('Error al sembrar alumnos: ' + error.message); return }

  const pagos = []
  ins.forEach((a, i) => {
    pagos.push({ colegio_id: colegio.id, alumno_id: a.id, concepto: 'pensión julio', monto: 180, metodo: ['efectivo','yape','tarjeta','transferencia'][i % 4], estado: 'pagado' })
    if (i % 2 === 0) pagos.push({ colegio_id: colegio.id, alumno_id: a.id, concepto: 'pensión agosto', monto: 180, metodo: '—', estado: i % 4 === 0 ? 'vencido' : 'pendiente' })
  })
  const { error: e2 } = await sb.from('pagos').insert(pagos)
  if (e2){ alert('Alumnos creados, pero error en pagos: ' + e2.message) }
  await paintPanel()
}

/* ============ delegación global ============ */
app.addEventListener('click', e => {
  const el = e.target.closest('[data-action]')
  if (!el) return
  const act = el.dataset.action
  if (act === 'logout') sb.auth.signOut().then(() => { location.hash = '#/' })
  if (act === 'reload') paintPanel()
  if (act === 'seed') seedDemo()
  if (act === 'toggle-caja'){
    const card = el.closest('.ccard')
    const open = card.classList.toggle('open')
    el.textContent = open ? 'Ocultar caja ▴' : 'Ver caja ▾'
  }
})
app.addEventListener('submit', e => {
  if (e.target.id === 'loginForm'){
    e.preventDefault()
    doLogin(document.getElementById('email').value.trim(), document.getElementById('pass').value)
  }
})

/* ============ arranque ============ */
resolve()