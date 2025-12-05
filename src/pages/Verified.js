import { auth } from '../lib/auth'
import { supabase } from '../lib/supabase'

export const Verified = () => {
  setTimeout(async () => {
    const container = document.getElementById('verified-container')
    const idDisplay = document.getElementById('admin-id-display')
    const idLabel = document.getElementById('id-label')
    const btn = document.getElementById('dashboard-btn')
    const loadingSpinner = document.getElementById('loading-spinner')

    // Check session
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      if (container) container.innerHTML = '<p style="color: red;">No active session found. Please login via the link in your email.</p>'
      return
    }

    // Update verified status to 1
    const user = session.user
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ verified: 1 })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating verified status:', updateError)
    }

    // Retry logic to fetch profile (in case trigger is slow)
    let profile = null
    let retries = 5
    while (retries > 0 && !profile) {
      profile = await auth.getProfile()
      if (!profile) await new Promise(r => setTimeout(r, 1000))
      retries--
    }

    if (loadingSpinner) loadingSpinner.style.display = 'none'

    if (profile) {
      const id = profile.unique_id || 'Error'
      const isAdmin = profile.role === 'admin'

      // Only show ID prominently if it's an Admin (as requested)
      if (isAdmin) {
        if (idLabel) idLabel.textContent = 'Your Admin ID'
        if (idDisplay) {
          idDisplay.style.display = 'block'
          idDisplay.textContent = id
        }
      } else {
        if (idLabel) idLabel.textContent = 'Registration Complete'
        if (idDisplay) {
          idDisplay.style.fontSize = '1.2rem'
          idDisplay.style.color = 'var(--text-main)'
          idDisplay.textContent = 'Welcome to the club!'
          idDisplay.style.display = 'block'
        }
      }

      if (btn) {
        btn.textContent = 'Go to Login'
        btn.style.display = 'inline-block'
        btn.onclick = async () => {
          await auth.signOut()
          window.location.href = '/#/login'
        }
      }
    } else {
      if (idDisplay) idDisplay.innerHTML = '<span style="color: red; font-size: 1rem;">Could not load Profile. Please contact support.</span>'
    }

  }, 1000)

  return `
    <div id="verified-container" style="
      height: 100vh; 
      display: flex; 
      flex-direction: column; 
      justify-content: center; 
      align-items: center; 
      text-align: center; 
      background: white;
    ">
      <div style="
        padding: 3rem; 
        border-radius: var(--radius-lg); 
        box-shadow: var(--shadow-lg); 
        max-width: 500px;
        width: 90%;
      ">
        <div style="font-size: 4rem; margin-bottom: 1rem;">✅</div>
        <h1 style="margin-bottom: 1rem; color: var(--success);">Mail Verified</h1>
        <p style="color: var(--text-muted); margin-bottom: 2rem;">Your email has been successfully verified.</p>
        
        <div id="loading-spinner" style="margin-bottom: 1rem; color: var(--primary);">Loading details...</div>

        <div style="background: #f8fafc; padding: 1.5rem; border-radius: var(--radius-md); margin-bottom: 2rem;">
          <p id="id-label" style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">Processing...</p>
          <p id="admin-id-display" style="font-size: 2rem; font-weight: 700; color: var(--primary); letter-spacing: 1px; display: none;"></p>
        </div>

        <button id="dashboard-btn" class="btn btn-primary" style="display: none; width: 100%;">Go to Login</button>
      </div>
    </div>
  `
}
