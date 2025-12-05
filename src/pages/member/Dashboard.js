import { auth } from '../../lib/auth'
import { db } from '../../lib/db'

export const MemberDashboard = () => {
  setTimeout(async () => {
    const profileContainer = document.getElementById('member-profile')
    const billsContainer = document.getElementById('member-bills')

    // Get current user
    const user = await auth.getProfile() // This gets from 'profiles' table (auth role)
    const { data: { user: authUser } } = await auth.supabase.auth.getUser()

    if (!authUser) return

    // Get Notifications
    const { data: notifications } = await db.getNotifications(authUser.id)

    // Get Member Details from gym_members
    const { data: member, error: memberError } = await db.getMemberProfile(authUser.id)

    if (memberError || !member) {
      if (profileContainer) {
        profileContainer.innerHTML = `
          <div class="card" style="border-left: 4px solid var(--danger);">
            <h3>Profile Not Linked</h3>
            <p>Your account is not linked to a gym member profile yet. Please contact the admin.</p>
          </div>
        `
      }
      return
    }

    // Check if member has a package
    if (!member.package_name) {
      if (profileContainer) {
        profileContainer.innerHTML = `
          <div class="card" style="max-width: 800px; margin: 0 auto;">
            <h2 style="text-align: center; margin-bottom: 1rem;">Welcome, ${member.full_name}!</h2>
            <p style="text-align: center; color: var(--text-muted); margin-bottom: 2rem;">Please select a membership plan to get started.</p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
              <!-- Monthly -->
              <div class="card" style="border: 1px solid #e2e8f0; text-align: center; cursor: pointer; transition: transform 0.2s;" onclick="selectPlan('Monthly', 50)">
                <h3>Monthly</h3>
                <p style="font-size: 2rem; font-weight: 700; color: var(--primary);">$50</p>
                <p style="color: var(--text-muted);">Billed every month</p>
                <button class="btn btn-primary" style="margin-top: 1rem; width: 100%;">Select</button>
              </div>

              <!-- Quarterly -->
              <div class="card" style="border: 1px solid #e2e8f0; text-align: center; cursor: pointer; transition: transform 0.2s;" onclick="selectPlan('Quarterly', 135)">
                <h3>Quarterly</h3>
                <p style="font-size: 2rem; font-weight: 700; color: var(--primary);">$135</p>
                <p style="color: var(--text-muted);">Save 10%</p>
                <button class="btn btn-primary" style="margin-top: 1rem; width: 100%;">Select</button>
              </div>

              <!-- Yearly -->
              <div class="card" style="border: 1px solid #e2e8f0; text-align: center; cursor: pointer; transition: transform 0.2s;" onclick="selectPlan('Yearly', 500)">
                <h3>Yearly</h3>
                <p style="font-size: 2rem; font-weight: 700; color: var(--primary);">$500</p>
                <p style="color: var(--text-muted);">Save 20%</p>
                <button class="btn btn-primary" style="margin-top: 1rem; width: 100%;">Select</button>
              </div>
            </div>
          </div>
        `

        // Add global handler for plan selection (hacky but works for vanilla)
        window.selectPlan = (plan, amount) => {
          const modal = document.createElement('div')
          modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;
          `
          modal.innerHTML = `
            <div class="card" style="width: 90%; max-width: 400px; position: relative;">
              <h3 style="margin-bottom: 1rem;">Confirm Selection</h3>
              <p>Plan: <strong>${plan}</strong></p>
              <p>Amount: <strong>$${amount}</strong></p>
              
              <div class="input-group" style="margin-top: 1rem;">
                <label for="payment-mode">Payment Mode</label>
                <select id="payment-mode">
                  <option value="Cash" selected>Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                </select>
              </div>

              <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                <button id="cancel-btn" class="btn btn-secondary" style="flex: 1;">Cancel</button>
                <button id="confirm-btn" class="btn btn-primary" style="flex: 1;">Confirm</button>
              </div>
            </div>
          `
          document.body.appendChild(modal)

          document.getElementById('cancel-btn').onclick = () => modal.remove()

          document.getElementById('confirm-btn').onclick = async () => {
            const btn = document.getElementById('confirm-btn')
            btn.textContent = 'Processing...'
            btn.disabled = true

            const paymentMode = document.getElementById('payment-mode').value

            const { error } = await db.updateMember(member.id, {
              package_name: plan,
              amount_due: 0, // Set to 0 since we act as if it's paid immediately via the selected mode
              status: 'active',
              join_date: new Date().toISOString().split('T')[0],
              end_date: new Date(new Date().setMonth(new Date().getMonth() + (plan === 'Monthly' ? 1 : plan === 'Quarterly' ? 3 : 12))).toISOString().split('T')[0],
              payment_mode: paymentMode
            })

            if (error) {
              alert('Error updating plan: ' + error.message)
              btn.disabled = false
              btn.textContent = 'Confirm'
            } else {
              // Generate a Bill automatically
              const { error: billError } = await db.createBill({
                member_id: member.id,
                amount: amount,
                description: `Membership - ${plan}`,
                due_date: new Date().toISOString().split('T')[0],
                status: 'paid', // Assuming immediate payment for self-selection
                payment_mode: paymentMode
              })

              if (billError) {
                alert('Plan updated but Error creating Bill: ' + billError.message)
              } else {
                alert(`Plan selected successfully! Payment Mode: ${paymentMode}`)
              }

              modal.remove()
              window.location.reload()
            }
          }
        }
      }
      return
    }

    // Render Profile & Health Form
    if (profileContainer) {
      // Calculate Expiry (Mock logic if end_date is missing, assume 30 days from join for demo)
      const joinDate = new Date(member.join_date)
      const endDate = member.end_date ? new Date(member.end_date) : new Date(joinDate.setDate(joinDate.getDate() + 30))
      const today = new Date()
      const diffTime = endDate - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      let expiryAlert = ''
      if (diffDays <= 5 && diffDays >= 0) {
        expiryAlert = `
          <div style="background: #fef2f2; border: 1px solid #fca5a5; color: #991b1b; padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.25rem;">⚠️</span>
            <div>
              <strong>Membership Expiring Soon!</strong>
              <p style="font-size: 0.9rem;">Your plan expires in ${diffDays} days. Please renew to avoid interruption.</p>
            </div>
          </div>
        `
      } else if (diffDays < 0) {
        expiryAlert = `
          <div style="background: #fef2f2; border: 1px solid #fca5a5; color: #991b1b; padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
            <strong>Membership Expired!</strong>
            <p style="font-size: 0.9rem;">Your plan expired on ${endDate.toLocaleDateString()}. Please renew immediately.</p>
          </div>
        `
      }

      // Build Notifications HTML
      let notifHtml = ''
      if (notifications && notifications.length > 0) {
        notifHtml = `
          <div style="margin-bottom: 1.5rem;">
            <h4 style="margin-bottom: 0.5rem; color: var(--text-muted);">Notifications</h4>
            ${notifications.map(n => `
              <div class="card" style="padding: 0.75rem 1rem; margin-bottom: 0.5rem; border-left: 4px solid var(--primary); background: #f8fafc;">
                <p style="margin: 0; font-size: 0.9rem;">${n.message}</p>
                <small style="color: var(--text-muted); font-size: 0.75rem;">${new Date(n.created_at).toLocaleDateString()}</small>
              </div>
            `).join('')}
          </div>
        `
      }

      profileContainer.innerHTML = `
        ${expiryAlert}
        ${notifHtml}
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1.5rem;">
            <div>
              <h2 style="margin-bottom: 0.5rem;">${member.full_name}</h2>
              <p style="color: var(--text-muted);">${member.email || authUser.email}</p>
            </div>
            <span style="
              padding: 0.5rem 1rem; 
              border-radius: 999px; 
              font-weight: 600;
              background: ${member.status === 'active' ? '#dcfce7' : '#fee2e2'}; 
              color: ${member.status === 'active' ? '#166534' : '#991b1b'};
            ">
              ${member.status.toUpperCase()}
            </span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
            <div style="background: #f8fafc; padding: 1rem; border-radius: var(--radius-md);">
              <p style="font-size: 0.85rem; color: var(--text-muted);">Package</p>
              <p style="font-weight: 600;">${member.package_name || 'None'}</p>
            </div>
            <div style="background: #f8fafc; padding: 1rem; border-radius: var(--radius-md);">
              <p style="font-size: 0.85rem; color: var(--text-muted);">Valid Until</p>
              <p style="font-weight: 600;">${endDate.toLocaleDateString()}</p>
            </div>
            <div style="background: #f8fafc; padding: 1rem; border-radius: var(--radius-md);">
              <p style="font-size: 0.85rem; color: var(--text-muted);">Amount Due</p>
              <p style="font-weight: 600; color: var(--danger);">$${member.amount_due || '0'}</p>
              ${member.amount_due > 0 ? `<button onclick="payBill(${member.amount_due})" class="btn btn-sm btn-primary" style="margin-top:0.5rem; width:100%; font-size: 0.8rem;">Pay Now</button>` : ''}
            </div>
          </div>

          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 1.5rem;" />
          

          <h3>Health & Personal Details</h3>
          <form id="health-form" style="margin-top: 1rem;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="input-group">
                <label for="age">Age</label>
                <input type="number" id="age" value="${member.age || ''}" placeholder="e.g. 25" />
              </div>
              <div class="input-group">
                <label for="gender">Gender</label>
                <select id="gender">
                  <option value="">Select</option>
                  <option value="Male" ${member.gender === 'Male' ? 'selected' : ''}>Male</option>
                  <option value="Female" ${member.gender === 'Female' ? 'selected' : ''}>Female</option>
                  <option value="Other" ${member.gender === 'Other' ? 'selected' : ''}>Other</option>
                </select>
              </div>
              <div class="input-group">
                <label for="height">Height (cm)</label>
                <input type="number" id="height" value="${member.height || ''}" placeholder="e.g. 175" />
              </div>
              <div class="input-group">
                <label for="weight">Weight (kg)</label>
                <input type="number" id="weight" value="${member.weight || ''}" placeholder="e.g. 70" />
              </div>
              <div class="input-group" style="grid-column: span 2;">
                <label for="conditions">Medical Conditions / Allergies</label>
                <textarea id="conditions" rows="2" placeholder="e.g. Asthma, None">${member.medical_conditions || ''}</textarea>
              </div>
            </div>
            <button type="submit" class="btn btn-primary" style="margin-top: 1rem;">Update Details</button>
          </form>

          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 2rem 0;">

          <h3>My Diet Plan</h3>
          <div class="card" style="background: #f0fdf4; border: 1px solid #bbf7d0; margin-top: 1rem;">
              <p style="white-space: pre-wrap; color: #166534;">${member.diet_plan || 'Standard balanced diet: High protein, moderate carbs, healthy fats. Hydrate well.'}</p>
          </div>
        </div>
      `

      // Handle Form Submit
      const healthForm = document.getElementById('health-form')
      if (healthForm) {
        healthForm.addEventListener('submit', async (e) => {
          e.preventDefault()
          const btn = e.target.querySelector('button')
          btn.textContent = 'Updating...'
          btn.disabled = true

          const updates = {
            age: document.getElementById('age').value,
            gender: document.getElementById('gender').value,
            height: document.getElementById('height').value,
            weight: document.getElementById('weight').value,
            medical_conditions: document.getElementById('conditions').value
          }

          const { error } = await db.updateMember(member.id, updates)

          if (error) {
            alert('Error updating profile: ' + error.message)
          } else {
            alert('Profile updated successfully!')
          }
          btn.textContent = 'Update Details'
          btn.disabled = false
        })
      }
    }

    // Get Bills
    const { data: bills, error: billsError } = await db.getMyBills(member.id)

    if (billsContainer) {
      if (billsError) {
        billsContainer.innerHTML = `<p style="color: red;">Error loading bills.</p>`
      } else if (!bills || bills.length === 0) {
        billsContainer.innerHTML = `<p style="color: var(--text-muted);">No bills found.</p>`
      } else {
        // Show only latest 3 bills on dashboard
        const recentBills = bills.slice(0, 3)
        billsContainer.innerHTML = recentBills.map(bill => `
          <div class="card" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem;">
            <div>
              <p style="font-weight: 600;">${bill.description || 'Bill'}</p>
              <p style="font-size: 0.85rem; color: var(--text-muted);">Due: ${bill.due_date || 'N/A'}</p>
              <p style="font-size: 0.8rem; color: var(--text-muted);">Mode: ${bill.payment_mode || 'N/A'}</p>
            </div>
            <div style="text-align: right;">
              <p style="font-weight: 700; font-size: 1.1rem;">$${bill.amount}</p>
              <span style="
                font-size: 0.75rem; 
                color: ${bill.status === 'paid' ? '#166534' : '#b91c1c'};
              ">
                ${bill.status.toUpperCase()}
              </span>
              <div style="margin-top: 0.5rem;">
                 <button onclick="downloadBill('${encodeURIComponent(JSON.stringify(bill))}')" style="background:none; border:none; cursor:pointer;" title="Download Receipt">🖨️</button>
              </div>
            </div>
          </div>
        `).join('')

        if (bills.length > 3) {
          billsContainer.innerHTML += `<p style="text-align:center; color:var(--text-muted); font-size:0.9rem; margin-top:0.5rem;">+ ${bills.length - 3} older bills (Click 'View Full History')</p>`
        }
      }
    }

    // PDF Generator
    const generatePDF = (bill, memberName) => {
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

    // Pay Bill Logic
    window.payBill = (amount) => {
      const modal = document.createElement('div')
      modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;`
      modal.innerHTML = `
          <div class="card" style="width: 90%; max-width: 400px;">
            <h3>Pay Outstanding Bill</h3>
            <p>Amount Due: <strong>$${amount}</strong></p>
            <div class="input-group" style="margin-top: 1rem;">
              <label>Payment Mode</label>
              <select id="pay-mode"><option value="Cash">Cash</option><option value="UPI">UPI</option><option value="Card">Card</option></select>
            </div>
            <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
              <button id="pay-cancel" class="btn btn-secondary" style="flex: 1;">Cancel</button>
              <button id="pay-confirm" class="btn btn-primary" style="flex: 1;">Pay Now</button>
            </div>
          </div>
        `
      document.body.appendChild(modal)
      document.getElementById('pay-cancel').onclick = () => modal.remove()
      document.getElementById('pay-confirm').onclick = async () => {
        const btn = document.getElementById('pay-confirm'); btn.textContent = 'Processing...'; btn.disabled = true
        const mode = document.getElementById('pay-mode').value

        // 1. Clear Due
        const { error: updateError } = await db.updateMember(member.id, { amount_due: 0 })
        if (updateError) { alert('Error: ' + updateError.message); btn.disabled = false; return }

        // 2. Create Bill
        const billData = {
          member_id: member.id,
          amount: amount,
          description: `Clearance of Dues`,
          due_date: new Date().toISOString().split('T')[0],
          status: 'paid',
          payment_mode: mode,
          payment_date: new Date().toISOString().split('T')[0]
        }
        const { data: newBill, error: billError } = await db.createBill(billData)

        if (billError) { alert('Payment recorded but bill generation failed: ' + billError.message); window.location.reload(); return }

        // 3. Generate PDF
        generatePDF(newBill ? newBill[0] : billData, member.full_name)

        alert('Payment Successful! Receipt downloaded.')
        modal.remove()
        window.location.reload()
      }
    }

    // Attach Download Handlers for existing bills
    window.downloadBill = (billJson) => {
      const bill = JSON.parse(decodeURIComponent(billJson))
      generatePDF(bill, member.full_name)
    }

    // View Bill History Logic
    window.viewBillHistory = async () => {
      const modal = document.createElement('div')
      modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;`

      modal.innerHTML = `
            <div class="card" style="width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
                    <h3>Payment History</h3>
                    <button id="close-history" style="background:none; border:none; font-size:1.5rem; cursor:pointer;">&times;</button>
                </div>
                <div id="history-content">Loading...</div>
            </div>
        `
      document.body.appendChild(modal)

      document.getElementById('close-history').onclick = () => modal.remove()

      // Re-fetch to ensure latest
      const { data: allBills, error } = await db.getMyBills(member.id)

      const content = document.getElementById('history-content')
      if (error) {
        content.innerHTML = `<p style="color:red">Error: ${error.message}</p>`
      } else if (!allBills || allBills.length === 0) {
        content.innerHTML = `<p>No payment history found.</p>`
      } else {
        content.innerHTML = `
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="border-bottom:1px solid #eee; text-align:left;">
                            <th style="padding:0.5rem;">Date</th>
                            <th style="padding:0.5rem;">Description</th>
                            <th style="padding:0.5rem;">Amount</th>
                            <th style="padding:0.5rem;">Mode</th>
                            <th style="padding:0.5rem;">Receipt</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allBills.map(bill => `
                            <tr style="border-bottom:1px solid #f8fafc;">
                                <td style="padding:0.5rem;">${bill.payment_date || bill.created_at.split('T')[0]}</td>
                                <td style="padding:0.5rem;">${bill.description}</td>
                                <td style="padding:0.5rem;">$${bill.amount}</td>
                                <td style="padding:0.5rem;">${bill.payment_mode || '-'}</td>
                                <td style="padding:0.5rem;">
                                    <button onclick="downloadBill('${encodeURIComponent(JSON.stringify(bill))}')" style="background:none; border:none; cursor:pointer;" title="Download">🖨️</button>
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
    <h1 style="margin-bottom: 2rem;">My Dashboard</h1>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
      <!-- Left Column: Profile -->
      <div>
        <h3 style="margin-bottom: 1rem;">My Profile</h3>
        <div id="member-profile">
          <div class="card">Loading profile...</div>
        </div>
      </div>

      <!-- Right Column: Bills -->
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 style="margin: 0;">My Bills</h3>
            <button onclick="viewBillHistory()" class="btn btn-sm btn-secondary" style="font-size: 0.8rem;">View Full History</button>
        </div>
        <div id="member-bills" style="display: flex; flex-direction: column; gap: 1rem;">
          <div class="card">Loading bills...</div>
        </div>
      </div>
    </div>
  `
}
