import { db } from '../../lib/db'

export const CreateBill = () => {
  setTimeout(async () => {
    // Populate member select dropdown
    const memberSelect = document.getElementById('member-select')
    if (memberSelect) {
      const { data: members } = await db.getMembers()
      if (members) {
        memberSelect.innerHTML = members.map(m => `<option value="${m.id}">${m.full_name}</option>`).join('')
      }
    }

    const form = document.getElementById('create-bill-form')
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault()
        const btn = form.querySelector('button[type="submit"]')
        btn.disabled = true
        btn.textContent = 'Creating...'

        const billData = {
          member_id: document.getElementById('member-select').value,
          amount: document.getElementById('amount').value,
          description: document.getElementById('description').value,
          due_date: document.getElementById('due-date').value,
          status: document.getElementById('status').value, // Now selectable
          payment_mode: document.getElementById('payment-mode').value,
          payment_date: document.getElementById('payment-date').value || null,
          membership_duration: document.getElementById('duration').value,
          workout_type: document.getElementById('workout-type').value
        }

        const { error } = await db.createBill(billData)

        if (error) {
          alert('Error creating bill: ' + error.message)
          btn.disabled = false
          btn.textContent = 'Create Bill'
        } else {
          alert('Bill created successfully!')
          window.location.href = '/#/admin/bills'
        }
      })
    }
  }, 0)

  return `
    <div style="margin-bottom: 2rem;">
      <a href="/admin/bills" data-navigo style="color: var(--text-muted); display: flex; align-items: center; gap: 0.5rem;">
        ← Back to Bills
      </a>
    </div>

    <div class="card" style="max-width: 800px; margin: 0 auto;">
      <h2>Create New Bill / Receipt</h2>
      <form id="create-bill-form" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 2rem;">
        
        <div class="input-group" style="grid-column: span 2;">
          <label for="member-select">Select Member</label>
          <select id="member-select" required>
            <option value="">Loading members...</option>
          </select>
        </div>

        <div class="input-group">
          <label for="amount">Total Amount ($)</label>
          <input type="number" id="amount" placeholder="0.00" required>
        </div>

        <div class="input-group">
          <label for="description">Description</label>
          <input type="text" id="description" placeholder="e.g. Monthly Subscription" required>
        </div>

        <div class="input-group">
          <label for="workout-type">Workout Type</label>
          <select id="workout-type" required>
            <option value="Gym">Gym</option>
            <option value="Cardio">Cardio</option>
            <option value="Gym + Cardio">Gym + Cardio</option>
            <option value="Zumba">Zumba</option>
            <option value="Crossfit">Crossfit</option>
          </select>
        </div>

        <div class="input-group">
          <label for="duration">Membership Duration</label>
          <select id="duration" required>
            <option value="1 Month">1 Month</option>
            <option value="3 Months">3 Months</option>
            <option value="6 Months">6 Months</option>
            <option value="1 Year">1 Year</option>
          </select>
        </div>

        <div class="input-group">
          <label for="status">Payment Status</label>
          <select id="status" required>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        <div class="input-group">
          <label for="payment-mode">Payment Mode</label>
          <select id="payment-mode">
            <option value="">Select Mode (if paid)</option>
            <option value="cash">Cash</option>
            <option value="online">Online (UPI/NetBanking)</option>
            <option value="credit_card">Credit Card</option>
            <option value="debit_card">Debit Card</option>
          </select>
        </div>

        <div class="input-group">
          <label for="payment-date">Payment Date</label>
          <input type="date" id="payment-date">
        </div>

        <div class="input-group">
          <label for="due-date">Due Date</label>
          <input type="date" id="due-date" required>
        </div>

        <div style="grid-column: span 2; display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem;">
          <a href="/admin/bills" data-navigo class="btn" style="background: #f1f5f9;">Cancel</a>
          <button type="submit" class="btn btn-primary">Generate Bill</button>
        </div>

      </form>
    </div>
  `
}
