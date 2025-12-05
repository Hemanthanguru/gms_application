import { db } from '../../lib/db'
import { supabase } from '../../lib/supabase'

export const AdminDashboard = () => {
  setTimeout(async () => {
    // 1. Fetch Data in Parallel with cache-busting (if needed) or just ensure fresh call
    // We are already calling DB directly, so it should be fresh. 
    // The issue might be the router not re-mounting the component or Supabase caching.

    const [statsRes, recentMembersRes, recentBillsRes] = await Promise.all([
      db.getDashboardStats(),
      db.getRecentMembers(),
      db.getRecentBills()
    ])

    const { revenue, pendingBills, totalMembers, error: statsError } = statsRes
    const { data: members, error: membersError } = recentMembersRes
    const { data: bills, error: billsError } = recentBillsRes

    if (statsError || membersError || billsError) {
      console.error('Error fetching dashboard data', statsError, membersError, billsError)
      const container = document.querySelector('.container')
      if (container) {
        container.innerHTML += `<div class="card" style="border-left: 4px solid red; margin-top: 1rem;">
          <h3>Error Loading Data</h3>
          <p>Please ensure you have run the "optimize_stats.sql" script in Supabase.</p>
        </div>`
      }
      return
    }

    // 3. Update Stats UI
    const memberCountEl = document.getElementById('stat-members')
    const revenueEl = document.getElementById('stat-revenue')
    const pendingBillsEl = document.getElementById('stat-pending')

    if (memberCountEl) memberCountEl.textContent = totalMembers
    if (revenueEl) revenueEl.textContent = `$${Number(revenue).toLocaleString()}`
    if (pendingBillsEl) pendingBillsEl.textContent = pendingBills

    // 4. Render Recent Members Table
    const recentMembersEl = document.getElementById('recent-members')
    if (recentMembersEl && members) {
      if (members.length === 0) {
        recentMembersEl.innerHTML = '<p style="color: var(--text-muted);">No members yet.</p>'
      } else {
        recentMembersEl.innerHTML = `
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="text-align: left; border-bottom: 1px solid #e2e8f0;">
                <th style="padding: 0.5rem;">Name</th>
                <th style="padding: 0.5rem;">Package</th>
                <th style="padding: 0.5rem;">Status</th>
                <th style="padding: 0.5rem;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${members.map(m => `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 0.75rem 0.5rem;">${m.full_name}</td>
                  <td style="padding: 0.75rem 0.5rem;">${m.package_name || '-'}</td>
                  <td style="padding: 0.75rem 0.5rem;">
                    <span style="font-size: 0.8rem; padding: 0.2rem 0.5rem; border-radius: 999px; background: ${m.status === 'active' ? '#dcfce7' : '#fee2e2'}; color: ${m.status === 'active' ? '#166534' : '#991b1b'};">
                      ${m.status}
                    </span>
                  </td>
                  <td style="padding: 0.75rem 0.5rem;">
                    <button class="btn-icon" onclick="openEditModal('${m.id}', '${m.full_name}', '${m.diet_plan || ''}', '${m.status}', '${m.age || ''}', '${m.gender || ''}')" title="Edit Details">✏️</button>
                    <button class="btn-icon" onclick="viewMemberBills('${m.id}', '${m.full_name}')" title="View Bill History">📜</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div style="margin-top: 1rem; text-align: center;">
            <a href="/admin/members" data-navigo style="color: var(--primary); font-weight: 500; font-size: 0.9rem;">View All Members →</a>
          </div>
        `
      }
    }

    // ... (rest of render logic) ...

    // Modal Logic (Copied from Members.js for consistency)
    window.openEditModal = (memberId, name, diet, status, age, gender) => {
      const modal = document.getElementById('edit-modal')
      document.getElementById('edit-member-id').value = memberId
      document.getElementById('edit-member-name').textContent = name
      document.getElementById('edit-diet').value = diet === 'null' || diet === 'undefined' ? '' : diet
      document.getElementById('edit-status').value = status
      document.getElementById('edit-age').value = age === 'null' || age === 'undefined' ? '' : age
      document.getElementById('edit-gender').value = gender === 'null' || gender === 'undefined' ? '' : gender
      modal.style.display = 'flex'
    }

    window.closeEditModal = () => {
      document.getElementById('edit-modal').style.display = 'none'
    }

    window.saveMemberChanges = async () => {
      const id = document.getElementById('edit-member-id').value
      const diet = document.getElementById('edit-diet').value
      const status = document.getElementById('edit-status').value
      const age = document.getElementById('edit-age').value
      const gender = document.getElementById('edit-gender').value
      const btn = document.getElementById('save-btn')

      btn.textContent = 'Saving...'
      btn.disabled = true

      const { error } = await db.updateMember(id, {
        diet_plan: diet,
        status: status,
        age: age,
        gender: gender
      })

      if (error) {
        alert('Error updating member: ' + error.message)
      } else {
        alert('Member updated successfully!')
        window.location.reload()
      }
      btn.textContent = 'Save Changes'
      btn.disabled = false
    }

    window.viewMemberBills = async (memberId, memberName) => {
      const modal = document.createElement('div')
      modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;`

      modal.innerHTML = `
            <div class="card" style="width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
                    <h3>Bill History: ${memberName}</h3>
                    <button id="close-history" style="background:none; border:none; font-size:1.5rem; cursor:pointer;">&times;</button>
                </div>
                <div id="history-content">Loading...</div>
            </div>
        `
      document.body.appendChild(modal)

      document.getElementById('close-history').onclick = () => modal.remove()

      const { data: bills, error } = await db.getMyBills(memberId)

      const content = document.getElementById('history-content')
      if (error) {
        content.innerHTML = `<p style="color:red">Error: ${error.message}</p>`
      } else if (!bills || bills.length === 0) {
        content.innerHTML = `<p>No bills found for this member.</p>`
      } else {
        content.innerHTML = `
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="border-bottom:1px solid #eee; text-align:left;">
                            <th style="padding:0.5rem;">Date</th>
                            <th style="padding:0.5rem;">Description</th>
                            <th style="padding:0.5rem;">Amount</th>
                            <th style="padding:0.5rem;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bills.map(bill => `
                            <tr style="border-bottom:1px solid #f8fafc;">
                                <td style="padding:0.5rem;">${bill.payment_date || bill.created_at.split('T')[0]}</td>
                                <td style="padding:0.5rem;">${bill.description}</td>
                                <td style="padding:0.5rem;">$${bill.amount}</td>
                                <td style="padding:0.5rem;">
                                    <span style="color:${bill.status === 'paid' ? 'green' : 'red'}">${bill.status}</span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `
      }
    }

  }, 0)

  return `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <h1>Admin Dashboard</h1>
      <div style="display: flex; gap: 1rem; align-items: center;">
        <button id="run-expiry-check" class="btn btn-primary" style="font-size: 0.85rem;">Run Daily Expiry Check</button>
        <div id="admin-profile-card" class="card" style="padding: 0.75rem 1.5rem; min-width: 250px;">
          Loading Profile...
        </div>
      </div>
    </div>
    
    <!-- Stats Cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 3rem;">
      <a href="/admin/members" data-navigo class="card" style="text-decoration: none; color: inherit; cursor: pointer; transition: transform 0.2s;">
        <h3>Total Members</h3>
        <p id="stat-members" style="font-size: 2.5rem; font-weight: 700; color: var(--primary);">Loading...</p>
        <p style="color: var(--text-muted);">Active in Community</p>
      </a>
      <div class="card">
        <h3>Total Revenue</h3>
        <p id="stat-revenue" style="font-size: 2.5rem; font-weight: 700; color: var(--success);">Loading...</p>
        <p style="color: var(--text-muted);">All Time Collected</p>
      </div>
      <a href="/admin/bills" data-navigo class="card" style="text-decoration: none; color: inherit; cursor: pointer; transition: transform 0.2s;">
        <h3>Pending Bills</h3>
        <p id="stat-pending" style="font-size: 2.5rem; font-weight: 700; color: var(--danger);">Loading...</p>
        <p style="color: var(--text-muted);">Unpaid Invoices</p>
      </a>
    </div>

    <!-- Detailed Sections -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 2rem;">
      
      <!-- Recent Members -->
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3>Recent Members</h3>
          <a href="/admin/members/add" data-navigo class="btn btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">+ Add New</a>
        </div>
        <div class="card" id="recent-members">
          Loading members...
        </div>
      </div>

      <!-- Recent Bills -->
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3>Recent Bills</h3>
          <a href="/admin/bills/create" data-navigo class="btn btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">+ Create Bill</a>
        </div>
        <div class="card" id="recent-bills">
          Loading bills...
        </div>
      </div>

    </div>

    <!-- Edit Modal (Hidden by default) -->
    <div id="edit-modal" style="
        display: none; 
        position: fixed; 
        top: 0; left: 0; 
        width: 100%; height: 100%; 
        background: rgba(0,0,0,0.5); 
        justify-content: center; 
        align-items: center; 
        z-index: 1000;
    ">
        <div class="card" style="width: 90%; max-width: 500px; position: relative;">
            <button onclick="closeEditModal()" style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
            <h2 id="edit-member-name" style="margin-bottom: 1.5rem;">Edit Member</h2>
            <input type="hidden" id="edit-member-id">
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="input-group">
                    <label for="edit-status">Status</label>
                    <select id="edit-status">
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="expired">Expired</option>
                    </select>
                </div>
                <div class="input-group">
                    <label for="edit-gender">Gender</label>
                    <select id="edit-gender">
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="input-group">
                    <label for="edit-age">Age</label>
                    <input type="number" id="edit-age" placeholder="Age">
                </div>
            </div>

            <div class="input-group" style="margin-top: 1rem;">
                <label for="edit-diet">Diet Plan</label>
                <textarea id="edit-diet" rows="4" placeholder="Enter diet plan..."></textarea>
            </div>

            <button id="save-btn" class="btn btn-primary" onclick="saveMemberChanges()" style="width: 100%; margin-top: 1.5rem;">Save Changes</button>
        </div>
    </div>
  `
}
