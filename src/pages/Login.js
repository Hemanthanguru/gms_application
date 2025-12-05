import { auth } from '../lib/auth'

export const Login = () => {
  setTimeout(() => {
    const form = document.getElementById('login-form')
    const roleSelect = document.getElementById('role-select')
    const emailInput = document.getElementById('email')
    const emailLabel = document.getElementById('email-label')

    if (roleSelect) {
      roleSelect.addEventListener('change', (e) => {
        if (e.target.value === 'admin') {
          emailLabel.textContent = 'Admin ID or Email'
          emailInput.placeholder = 'ADM-XXXX or admin@gym.com'
        } else {
          emailLabel.textContent = 'Email'
          emailInput.placeholder = 'member@gym.com'
          // Clear any previous value to avoid confusion
          emailInput.value = ''
        }
      })
    }

    // Check Connection on Load
    const checkConnection = async () => {
      const statusEl = document.getElementById('connection-status')
      if (!statusEl) return

      statusEl.textContent = 'Checking connection...'
      statusEl.style.color = 'var(--text-muted)'

      try {
        const { error } = await auth.supabase.from('profiles').select('count', { count: 'exact', head: true })
        if (error && error.code !== 'PGRST116' && error.code !== '406') { // Ignore some expected errors if table empty/RLS
          // If we get a response, we are connected, even if it's an RLS error.
          // Network error would throw or return a specific error.
          if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
            throw error
          }
        }
        statusEl.textContent = '● System Online'
        statusEl.style.color = 'var(--success)'
      } catch (err) {
        console.error('Connection check failed:', err)
        statusEl.innerHTML = '● <b>System Offline</b> (Check Internet/Supabase Status)'
        statusEl.style.color = 'var(--danger)'
      }
    }
    checkConnection()

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault()
        const email = emailInput.value
        const password = document.getElementById('password').value
        const errorMsg = document.getElementById('error-msg')
        const btn = form.querySelector('button')

        btn.disabled = true
        btn.textContent = 'Signing In...'
        errorMsg.textContent = ''
        errorMsg.style.color = 'var(--danger)'

        // Basic validation to prevent unnecessary network requests
        if (!email.includes('@') && !email.toUpperCase().startsWith('ADM-')) {
          errorMsg.textContent = 'Please enter a valid email address.'
          btn.disabled = false
          btn.textContent = 'Sign In'
          return
        }

        try {
          // Add a timeout race to detect hangs (increased to 45s for slow networks)
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out. Check your network.')), 45000)
          )

          console.log('Attempting login for:', email)
          const signInPromise = auth.signIn(email, password)

          // Log the raw result from auth.signIn
          signInPromise.then(res => console.log('Raw Auth Result:', res)).catch(err => console.error('Raw Auth Error:', err))

          const { data, error } = await Promise.race([signInPromise, timeoutPromise])
          console.log('Login response:', { data, error })

          if (error) {
            console.error('Login Error Object:', JSON.stringify(error, null, 2))
            errorMsg.textContent = error.message || 'Authentication failed'
            if (error.message?.includes('Load failed') || error.message?.includes('fetch')) {
              errorMsg.textContent += ' (Network Error)'
            }
            btn.disabled = false
            btn.textContent = 'Sign In'
          } else {
            // Redirect based on role
            const profile = await auth.getProfile()
            console.log('Fetched Profile for Redirection:', profile)

            if (!profile) {
              console.error('Profile fetch failed. Defaulting to member dashboard.')
              alert('Warning: Could not fetch user profile. You may have limited access.')
              window.location.hash = '/member/dashboard'
              return
            }

            // Verify role matches selection
            const selectedRole = roleSelect.value
            console.log(`Selected Role: ${selectedRole}, Actual Role: ${profile.role}`)

            if (profile.role === 'admin') {
              console.log('Redirecting to Admin Dashboard')
              window.location.hash = '/admin/dashboard'
            } else {
              if (selectedRole === 'admin') {
                alert('Notice: This account is registered as a MEMBER, not an ADMIN. Redirecting to Member Dashboard.')
              }
              console.log('Redirecting to Member Dashboard')
              window.location.hash = '/member/dashboard'
            }
          }
        } catch (err) {
          console.error('Unexpected Login Error:', err)

          if (err.name === 'AuthRetryableFetchError' || err.message?.includes('NetworkError')) {
            alert('Network is slow, but we are trying to connect. Please wait a moment and try again.')
          }

          errorMsg.textContent = err.message
          btn.disabled = false
          btn.textContent = 'Sign In'
        }
      })
    }
  }, 0)

  return `
    <div style="max-width: 400px; margin: 2rem auto;">
      <div class="card">
        <h2 style="text-align: center;">Login</h2>
        <p style="text-align: center; color: var(--text-muted); margin-bottom: 1.5rem;">Enter your credentials to access your account.</p>
        
        <form id="login-form">
          <div class="input-group">
            <label for="role-select">I am a...</label>
            <select id="role-select" style="background: #f8fafc;">
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div class="input-group">
            <label id="email-label" for="email">Email</label>
            <input type="text" id="email" placeholder="member@gym.com" required>
          </div>
          <div class="input-group">
            <label for="password">Password</label>
            <input type="password" id="password" placeholder="••••••••" required>
          </div>
          <p id="error-msg" style="color: var(--danger); font-size: 0.9rem; margin-bottom: 1rem;"></p>
          <button type="submit" class="btn btn-primary" style="width: 100%;">Sign In</button>
        </form>
        
        <div style="margin-top: 1.5rem; text-align: center; font-size: 0.9rem;">
          <p>New Member? <a href="/signup/member" data-navigo style="color: var(--primary); font-weight: 600;">Join Now</a></p>
          <p style="margin-top: 0.5rem;">Are you an Admin? <a href="/signup/admin" data-navigo style="color: var(--primary); font-weight: 600;">Register here</a></p>
          <div id="connection-status" style="margin-top: 1rem; font-size: 0.8rem; color: var(--text-muted);">Checking connection...</div>
        </div>
      </div>
    </div>
  `
}
