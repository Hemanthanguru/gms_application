import { auth } from '../../lib/auth'

export const AddMember = () => {
  setTimeout(() => {
    const form = document.getElementById('add-member-form')
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault()
        const btn = form.querySelector('button[type="submit"]')
        btn.disabled = true
        btn.textContent = 'Creating Account...'

        const memberData = {
          full_name: document.getElementById('fullname').value,
          email: document.getElementById('email').value,
          password: document.getElementById('password').value, // New
          phone: document.getElementById('phone').value,
          age: document.getElementById('age').value || null,
          gender: document.getElementById('gender').value || null,
          height: document.getElementById('height').value || null, // New
          weight: document.getElementById('weight').value || null, // New
          package_name: document.getElementById('package').value,
          amount_due: document.getElementById('amount').value,
          status: 'active',
          join_date: new Date().toISOString().split('T')[0]
        }

        // Use the Auth helper to create the user + profile + gym_member
        const { error } = await auth.createMemberByAdmin(memberData)

        if (error) {
          alert('Error adding member: ' + error.message)
          btn.disabled = false
          btn.textContent = 'Add Member'
        } else {
          alert('Member account created successfully! They can now login.')
          window.location.hash = '/admin/members'
        }
      })
    }
  }, 0)

  return `
    <div style="margin-bottom: 2rem;">
      <a href="/admin/members" data-navigo style="color: var(--text-muted); display: flex; align-items: center; gap: 0.5rem;">
        ← Back to Members
      </a>
    </div>

    <div class="card" style="max-width: 800px; margin: 0 auto;">
      <h2>Add New Member</h2>
      <p style="color: var(--text-muted); margin-bottom: 2rem;">Create a login-enabled account for a new member.</p>

      <form id="add-member-form" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
        
        <div class="input-group" style="grid-column: span 2;">
          <label for="fullname">Full Name *</label>
          <input type="text" id="fullname" required placeholder="Jane Doe">
        </div>

        <div class="input-group">
          <label for="email">Email * (Login ID)</label>
          <input type="email" id="email" required placeholder="jane@example.com">
        </div>

        <div class="input-group">
          <label for="password">Password *</label>
          <input type="text" id="password" required minlength="6" placeholder="Default Password (e.g. 123456)">
          <small style="color: var(--text-muted);">Member can change this later.</small>
        </div>

        <div class="input-group">
          <label for="phone">Phone Number</label>
          <input type="tel" id="phone" placeholder="+1 234 567 890">
        </div>

        <div class="input-group">
          <label for="age">Age</label>
          <input type="number" id="age" placeholder="e.g. 25">
        </div>

        <div class="input-group">
          <label for="gender">Gender</label>
          <select id="gender">
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div class="input-group">
          <label for="height">Height (cm)</label>
          <input type="number" id="height" placeholder="175">
        </div>

        <div class="input-group">
          <label for="weight">Weight (kg)</label>
          <input type="number" id="weight" placeholder="70">
        </div>

        <div class="input-group">
          <label for="package">Membership Package</label>
          <select id="package">
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Yearly">Yearly</option>
            <option value="Personal Training">Personal Training</option>
          </select>
        </div>

        <div class="input-group">
          <label for="amount">Initial Payment Due</label>
          <input type="number" id="amount" placeholder="0.00">
        </div>

        <div style="grid-column: span 2; display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem;">
          <a href="/admin/members" data-navigo class="btn" style="background: #f1f5f9;">Cancel</a>
          <button type="submit" class="btn btn-primary">Create Account</button>
        </div>

      </form>
    </div>
  `
}
