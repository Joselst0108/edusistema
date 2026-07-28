import { sb } from './supabase.js'

const form = document.getElementById('login')
const out  = document.getElementById('out')

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  out.textContent = '⏳ Entrando…'

  const email    = document.getElementById('email').value
  const password = document.getElementById('pass').value

  // 1) Supabase verifica correo + contraseña
  const { data, error } = await sb.auth.signInWithPassword({ email, password })
  if (error) { out.textContent = '❌ ' + error.message; return }

  // 2) Leemos TU fila de perfiles (rol + nombre)
  const { data: perfil, error: e2 } = await sb
    .from('perfiles')
    .select('rol, nombre')
    .eq('id', data.user.id)
    .single()
  if (e2) { out.textContent = '❌ perfil: ' + e2.message; return }

  // 3) Latido verde
  const corona = perfil.rol === 'superadmin' ? '👑 ' : ''
  out.textContent = `✅ CONECTADO\n${corona}${perfil.nombre}\nrol: ${perfil.rol}`
})