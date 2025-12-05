import { db } from '../../lib/db'

export const Bills = () => {
  setTimeout(async () => {
    const tableBody = document.getElementById('bills-table-body')
    if (tableBody) {
      tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Loading...</td></tr>'

      const { data: bills, error } = await db.getBills()

      if (error) {
        tableBody.innerHTML = `<tr><td colspan="8" style="color: red; text-align: center;">Error: ${error.message}</td></tr>`
        return
      }

      if (bills.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No bills found.</td></tr>'
        return
      }

      tableBody.innerHTML = bills.map(bill => `
        <tr>
          <td>
            <div style="font-weight: 600;">${bill.gym_members?.full_name || 'Unknown'}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">ID: ${bill.id.slice(0, 8)}</div>
          </td>
          <td>${bill.workout_type || '-'}</td>
          <td>${bill.membership_duration || '-'}</td>
          <td>$${bill.amount}</td>
          <td>
            <span style="
              padding: 0.25rem 0.5rem; 
              border-radius: 999px; 
              font-size: 0.85rem; 
              background: ${bill.status === 'paid' ? '#dcfce7' : '#fee2e2'}; 
              color: ${bill.status === 'paid' ? '#166534' : '#991b1b'};
            ">
              ${bill.status.toUpperCase()}
            </span>
          </td>
          <td>${bill.payment_mode ? bill.payment_mode.replace('_', ' ') : '-'}</td>
          <td>${bill.payment_date || '-'}</td>
          <td>
            <button class="btn-icon download-btn" data-bill='${JSON.stringify(bill).replace(/'/g, "&#39;")}' title="Download Receipt">🖨️</button>
          </td>
        </tr>
      `).join('')

      // Attach event listeners to buttons
      document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const bill = JSON.parse(e.target.dataset.bill)
          generatePDF(bill)
        })
      })
    }
  }, 0)

  const generatePDF = (bill) => {
    // Dynamic import to avoid load issues if not ready
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF()

      // Header
      doc.setFontSize(22)
      doc.setTextColor(40, 40, 40)
      doc.text("GYM MASTER", 105, 20, null, null, "center")

      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.text("Official Payment Receipt", 105, 30, null, null, "center")

      // Line
      doc.setLineWidth(0.5)
      doc.line(20, 35, 190, 35)

      // Details
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)

      let y = 50
      const lineHeight = 10

      doc.text(`Receipt ID: ${bill.id.slice(0, 8).toUpperCase()}`, 20, y)
      doc.text(`Date: ${bill.payment_date || new Date().toISOString().split('T')[0]}`, 140, y)
      y += lineHeight * 1.5

      doc.text(`Member Name: ${bill.gym_members?.full_name || 'Unknown'}`, 20, y)
      y += lineHeight

      doc.text(`Payment Mode: ${bill.payment_mode || 'Cash'}`, 20, y)
      y += lineHeight * 2

      // Amount Box
      doc.setFillColor(240, 240, 240)
      doc.rect(20, y - 8, 170, 20, 'F')
      doc.setFontSize(16)
      doc.text(`Total Amount Paid: $${bill.amount}`, 105, y + 5, null, null, "center")

      // Footer
      y += 40
      doc.setFontSize(10)
      doc.setTextColor(150, 150, 150)
      doc.text("Thank you for training with us!", 105, y, null, null, "center")
      doc.text("This is a computer generated receipt.", 105, y + 6, null, null, "center")

      doc.save(`Receipt_${bill.gym_members?.full_name || 'Member'}_${bill.payment_date}.pdf`)
    })
  }

  return `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <h1>Billing & Receipts</h1>
      <a href="/admin/bills/create" data-navigo class="btn btn-primary">+ Create Receipt</a>
    </div>

    <div class="card" style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; min-width: 800px;">
        <thead>
          <tr style="text-align: left; border-bottom: 2px solid #e2e8f0;">
            <th style="padding: 1rem;">Member / Bill ID</th>
            <th style="padding: 1rem;">Type</th>
            <th style="padding: 1rem;">Duration</th>
            <th style="padding: 1rem;">Amount</th>
            <th style="padding: 1rem;">Status</th>
            <th style="padding: 1rem;">Mode</th>
            <th style="padding: 1rem;">Paid Date</th>
            <th style="padding: 1rem;">Actions</th>
          </tr>
        </thead>
        <tbody id="bills-table-body">
          <!-- Data will be populated here -->
        </tbody>
      </table>
    </div>
  `
}
