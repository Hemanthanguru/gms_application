import { db } from '../../lib/db'

export const Members = () => {
  // Fetch members when the component loads
  setTimeout(async () => {
    const tableBody = document.getElementById('members-table-body')
    if (tableBody) {
      tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading...</td></tr>'

      const { data: members, error } = await db.getMembers()

      if (error) {
        tableBody.innerHTML = `<tr><td colspan="6" style="color: red; text-align: center;">Error: ${error.message}</td></tr>`
        return
      }

      if (members.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No members found.</td></tr>'
        return
      }

      tableBody.innerHTML = members.map(member => `
        <tr>
          <td>
            <div style="font-weight: 600;">${member.full_name}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">${member.email || ''}</div>
          </td>
          <td>${member.phone || '-'}</td>
          <td>${member.package_name || '-'}</td>
          <td>
            <span style="
              padding: 0.25rem 0.5rem; 
              border-radius: 999px; 
              font-size: 0.85rem; 
              background: ${member.status === 'active' ? '#dcfce7' : '#fee2e2'}; 
              color: ${member.status === 'active' ? '#166534' : '#991b1b'};
            ">
              ${member.status}
            </span>
          </td>
          <td>${member.join_date}</td>
          <td>
            <button class="btn-icon" onclick="openEditModal('${member.id}', '${member.full_name}', '${member.diet_plan || ''}', '${member.status}', '${member.age || ''}', '${member.gender || ''}', '${member.height || ''}', '${member.weight || ''}')" title="Edit Details">✏️</button>
            <button class="btn-icon" onclick="viewMemberBills('${member.id}', '${member.full_name}')" title="View Bill History">📜</button>
          </td>
        </tr>
      `).join('')
    }
  }, 0)

  // Modal Logic
  window.openEditModal = (memberId, name, diet, status, age, gender, height, weight) => {
    const modal = document.getElementById('edit-modal')
    document.getElementById('edit-member-id').value = memberId
    document.getElementById('edit-member-name').textContent = name
    document.getElementById('edit-diet').value = diet === 'null' || diet === 'undefined' ? '' : diet
    document.getElementById('edit-status').value = status
    document.getElementById('edit-age').value = age === 'null' || age === 'undefined' ? '' : age
    document.getElementById('edit-gender').value = gender === 'null' || gender === 'undefined' ? '' : gender
    document.getElementById('edit-height').value = height === 'null' || height === 'undefined' ? '' : height
    document.getElementById('edit-weight').value = weight === 'null' || weight === 'undefined' ? '' : weight
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
    const height = document.getElementById('edit-height').value
    const weight = document.getElementById('edit-weight').value
    const btn = document.getElementById('save-btn')

    btn.textContent = 'Saving...'
    btn.disabled = true

    const { error } = await db.updateMember(id, {
      diet_plan: diet,
      status: status,
      age: age === '' ? null : age,
      gender: gender === '' ? null : gender,
      height: height === '' ? null : height,
      weight: weight === '' ? null : weight
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

  // View Bills Logic
  window.viewMemberBills = async (memberId, memberName) => {
    // 1. Create Modal
    const modalId = 'bills-history-modal'
    let modal = document.getElementById(modalId)

    if (!modal) {
      modal = document.createElement('div')
      modal.id = modalId
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;
        display: none;
      `
      document.body.appendChild(modal)
    }

    modal.style.display = 'flex'
    modal.innerHTML = `
      <div class="card" style="width: 90%; max-width: 700px; max-height: 80vh; overflow-y: auto; position: relative;">
          <button id="close-history-btn" style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
          <h3 style="margin-bottom: 1.5rem;">Bill History: ${memberName}</h3>
          <div id="history-content">Loading...</div>
      </div>
    `

    document.getElementById('close-history-btn').onclick = () => {
      modal.style.display = 'none'
    }

    // 2. Fetch Bills
    const { data: bills, error } = await db.getMyBills(memberId)

    const content = document.getElementById('history-content')

    if (error) {
      content.innerHTML = `<p style="color:red">Error loading bills: ${error.message}</p>`
      return
    }

    if (!bills || bills.length === 0) {
      content.innerHTML = `<p>No bills found for this member.</p>`
      return
    }

    // 3. Render Table
    content.innerHTML = `
      <table style="width:100%; border-collapse:collapse;">
          <thead>
              <tr style="border-bottom:1px solid #eee; text-align:left;">
                  <th style="padding:0.5rem;">Date</th>
                  <th style="padding:0.5rem;">Description</th>
                  <th style="padding:0.5rem;">Amount</th>
                  <th style="padding:0.5rem;">Status</th>
                  <th style="padding:0.5rem;">Mode</th>
                  <th style="padding:0.5rem;">Receipt</th>
              </tr>
          </thead>
          <tbody>
              ${bills.map(bill => `
                  <tr style="border-bottom:1px solid #f8fafc;">
                      <td style="padding:0.5rem;">${bill.payment_date || bill.created_at.split('T')[0]}</td>
                      <td style="padding:0.5rem;">${bill.description}</td>
                      <td style="padding:0.5rem;">$${bill.amount}</td>
                      <td style="padding:0.5rem;">
                        <span style="
                          padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem;
                          background: ${bill.status === 'paid' ? '#dcfce7' : '#fee2e2'};
                          color: ${bill.status === 'paid' ? '#166534' : '#991b1b'};
                        ">
                          ${bill.status.toUpperCase()}
                        </span>
                      </td>
                      <td style="padding:0.5rem;">${bill.payment_mode || '-'}</td>
                      <td style="padding:0.5rem;">
                          ${bill.status === 'paid'
        ? `<button onclick="downloadMemberBill('${encodeURIComponent(JSON.stringify(bill))}', '${memberName}')" style="background:none; border:none; cursor:pointer;" title="Download Receipt">🖨️ PDF</button>`
        : '<span style="color:#ccc;">-</span>'
      }
                      </td>
                  </tr>
              `).join('')}
          </tbody>
      </table>
    `
  }

  // 4. PDF Generation Helper
  window.downloadMemberBill = (billJson, memberName) => {
    const bill = JSON.parse(decodeURIComponent(billJson))

    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF()
      doc.setFontSize(22); doc.setTextColor(40, 40, 40); doc.text("GYM MASTER", 105, 20, null, null, "center")
      doc.setFontSize(12); doc.setTextColor(100, 100, 100); doc.text("Official Payment Receipt", 105, 30, null, null, "center")
      doc.setLineWidth(0.5); doc.line(20, 35, 190, 35)

      let y = 50; const lineHeight = 10
      doc.setFontSize(12); doc.setTextColor(0, 0, 0)

      doc.text(`Receipt ID: ${bill.id ? bill.id.slice(0, 8).toUpperCase() : 'PENDING'}`, 20, y)
      doc.text(`Date: ${bill.payment_date || new Date().toISOString().split('T')[0]}`, 140, y); y += lineHeight * 1.5
      doc.text(`Member Name: ${memberName}`, 20, y); y += lineHeight
      doc.text(`Description: ${bill.description || 'Membership Payment'}`, 20, y); y += lineHeight
      doc.text(`Payment Mode: ${bill.payment_mode || 'Cash'}`, 20, y); y += lineHeight * 2

      doc.setFillColor(240, 240, 240); doc.rect(20, y - 8, 170, 20, 'F')
      doc.setFontSize(16); doc.text(`Total Amount Paid: $${bill.amount}`, 105, y + 5, null, null, "center")

      y += 40; doc.setFontSize(10); doc.setTextColor(150, 150, 150)
      doc.text("Thank you for training with us!", 105, y, null, null, "center")
      doc.save(`Receipt_${memberName}_${bill.payment_date || 'New'}.pdf`)
    })
  }

  return `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <h1>Members Management</h1>
      <a href="/admin/members/add" data-navigo class="btn btn-primary">+ Add Member</a>
    </div>

    <div class="card" style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="text-align: left; border-bottom: 2px solid #e2e8f0;">
            <th style="padding: 1rem;">Name</th>
            <th style="padding: 1rem;">Phone</th>
            <th style="padding: 1rem;">Package</th>
            <th style="padding: 1rem;">Status</th>
            <th style="padding: 1rem;">Joined</th>
            <th style="padding: 1rem;">Actions</th>
          </tr>
        </thead>
        <tbody id="members-table-body">
          <!-- Data will be populated here -->
        </tbody>
      </table>
    </div>

    <!-- Edit Modal -->
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
                <div class="input-group">
                    <label for="edit-height">Height (cm)</label>
                    <input type="number" id="edit-height" placeholder="cm">
                </div>
                <div class="input-group">
                    <label for="edit-weight">Weight (kg)</label>
                    <input type="number" id="edit-weight" placeholder="kg">
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
