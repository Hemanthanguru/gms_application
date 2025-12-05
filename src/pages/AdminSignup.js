import { auth } from '../lib/auth'

export const AdminSignup = () => {
  setTimeout(() => {
    const form = document.getElementById('admin-signup-form')
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault()
        const fullName = document.getElementById('fullname').value
        const email = document.getElementById('email').value
        const password = document.getElementById('password').value
        const secretKey = document.getElementById('secret-key').value
        const errorMsg = document.getElementById('error-msg')
        const btn = form.querySelector('button')

        btn.disabled = true
        btn.textContent = 'Creating Account...'
        errorMsg.textContent = ''

        let data, error
        try {
          const res = await auth.signUpAdmin(email, password, fullName, secretKey)
          data = res.data
          error = res.error
        } catch (err) {
          console.error('Signup Exception:', err)
          error = { message: err.message || 'Network error occurred' }
        }

        console.log('Signup response:', { data, error })

        if (error) {
          if (error.name === 'AuthRetryableFetchError' || error.message?.includes('NetworkError')) {
            alert('Network issue detected. Please check your email or try logging in.')
            window.location.href = '/#/login'
            return
          }
          errorMsg.textContent = error.message
          btn.disabled = false
          btn.textContent = 'Create Admin Account'
        } else {
          // Signup successful.
          btn.textContent = 'Generating Admin ID...'

          // Poll for profile creation (Increased to 15 attempts with longer wait)
          let attempts = 0
          const maxAttempts = 15
          let adminId = null

          const pollProfile = async () => {
            if (attempts >= maxAttempts) return null
            attempts++

            // Wait 1.5s between checks
            await new Promise(r => setTimeout(r, 1500))

            // Use a direct query that bypasses some cache if possible, or just standard select
            // We select by ID which is indexed.
            const { data: profile, error: profileError } = await auth.supabase
              .from('profiles')
              .select('unique_id')
              .eq('id', data.user.id)
              .single()

            if (profileError) {
              console.log('Polling error (expected if not ready):', profileError.message)
            }

            return profile ? profile.unique_id : null
          }

          while (!adminId && attempts < maxAttempts) {
            console.log(`Polling attempt ${attempts}/${maxAttempts}...`)
            adminId = await pollProfile()
          }

          if (adminId) {
            // Create Popup Modal
            const modal = document.createElement('div')
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 9999;
             `
            modal.innerHTML = `
                <div class="card" style="width: 90%; max-width: 450px; text-align: center; animation: slideIn 0.3s ease-out;">
                    <div style="width: 60px; height: 60px; background: #dcfce7; color: #166534; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 1.5rem;">✓</div>
                    <h2 style="margin-bottom: 0.5rem;">Account Created!</h2>
                    <p style="color: var(--text-muted);">Here is your unique Admin Login ID.</p>
                    
                    <div style="background: #f1f5f9; border: 2px dashed var(--primary); padding: 1.5rem; margin: 1.5rem 0; border-radius: var(--radius-md);">
                        <p style="margin:0; color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">Admin ID</p>
                        <p style="font-size: 2.5rem; font-weight: 800; margin: 0.5rem 0; color: var(--primary); letter-spacing: 2px; font-family: monospace;">${adminId}</p>
                        <button onclick="navigator.clipboard.writeText('${adminId}'); this.textContent='Copied!'" style="background:none; border:1px solid #cbd5e1; padding: 4px 8px; border-radius:4px; cursor:pointer; font-size:0.8rem;">Copy ID</button>
                    </div>

                    <p style="margin-bottom: 1.5rem; font-size: 0.9rem; color: var(--danger);">⚠️ Please save this ID. You can use it to login.</p>
                    <a href="/#/login" class="btn btn-primary" style="width: 100%; display: inline-block; text-decoration: none;">Go to Login</a>
                </div>
             `
            document.body.appendChild(modal)
          } else {
            // Fallback if polling fails
            alert('Registration Successful! Your Admin ID has been generated in the database, but we could not fetch it due to a network delay. Please check your database or try logging in with your Email.')
            window.location.href = '/#/login'
          }
        }
      })
    }
  }, 0)

  return `
    <div style="max-width: 450px; margin: 2rem auto;">
      <div class="card">
        <h2 style="text-align: center;">Admin Registration</h2>
        <p style="text-align: center; color: var(--text-muted); margin-bottom: 1.5rem;">Secure access for gym management.</p>
        
        <form id="admin-signup-form">
          <div class="input-group">
            <label for="fullname">Full Name</label>
            <input type="text" id="fullname" placeholder="John Doe" required>
          </div>
          <div class="input-group">
            <label for="email">Email</label>
            <input type="email" id="email" placeholder="admin@gym.com" required>
          </div>
          <div class="input-group">
            <label for="password">Password</label>
            <input type="password" id="password" placeholder="••••••••" required minlength="6">
          </div>
          <div class="input-group">
            <label for="secret-key" style="color: var(--primary);">Admin Special Key</label>
            <input type="password" id="secret-key" placeholder="Enter the special key provided to you" required>
            <small style="color: var(--text-muted);">Required to verify admin status.</small>
          </div>
          
          <p id="error-msg" style="color: var(--danger); font-size: 0.9rem; margin-bottom: 1rem;"></p>
          <button type="submit" class="btn btn-primary" style="width: 100%;">Create Admin Account</button>
        </form>
        
        <div style="margin-top: 1.5rem; text-align: center; font-size: 0.9rem;">
          <p>Already have an account? <a href="/login" data-navigo style="color: var(--primary); font-weight: 600;">Login here</a></p>
        </div>
      </div>
    </div>
  `
}
