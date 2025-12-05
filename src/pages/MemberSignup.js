import { auth } from '../lib/auth'

export const MemberSignup = () => {
  setTimeout(() => {
    const form = document.getElementById('member-signup-form')
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault()
        const fullName = document.getElementById('fullname').value
        const email = document.getElementById('email').value
        const password = document.getElementById('password').value
        const errorMsg = document.getElementById('error-msg')
        const btn = form.querySelector('button')

        btn.disabled = true
        btn.textContent = 'Creating Account...'
        errorMsg.textContent = ''

        const { data, error } = await auth.signUpMember(email, password, fullName)

        if (error) {
          errorMsg.textContent = error.message
          btn.disabled = false
          btn.textContent = 'Create Account'
        } else {
          alert('Registration Successful! You can now login.')
          window.location.href = '/#/login'
        }
      })
    }
  }, 0)

  return `
    <div style="max-width: 450px; margin: 2rem auto;">
      <div class="card">
        <h2 style="text-align: center;">Member Registration</h2>
        <p style="text-align: center; color: var(--text-muted); margin-bottom: 1.5rem;">Join our gym today!</p>
        
        <form id="member-signup-form">
          <div class="input-group">
            <label for="fullname">Full Name</label>
            <input type="text" id="fullname" placeholder="John Doe" required>
          </div>
          <div class="input-group">
            <label for="email">Email</label>
            <input type="email" id="email" placeholder="you@example.com" required>
          </div>
          <div class="input-group">
            <label for="password">Password</label>
            <input type="password" id="password" placeholder="••••••••" required minlength="6">
          </div>
          
          <p id="error-msg" style="color: var(--danger); font-size: 0.9rem; margin-bottom: 1rem;"></p>
          <button type="submit" class="btn btn-primary" style="width: 100%;">Create Account</button>
        </form>
        
        <div style="margin-top: 1.5rem; text-align: center; font-size: 0.9rem;">
          <p>Already have an account? <a href="/login" data-navigo style="color: var(--primary); font-weight: 600;">Login here</a></p>
        </div>
      </div>
    </div>
  `
}
