import { auth } from '../lib/auth'

export const renderNavbar = () => {
  // We can't make this async easily because it returns a string immediately.
  // So we'll use a simple hack: check localStorage or rely on page reload state.
  // Ideally, we'd use a reactive store. For now, we'll just show generic links 
  // and let the router handle protection, OR we can try to read the session.

  // A better approach for Vanilla JS:
  // We'll render a placeholder and update it after a microtask.

  setTimeout(async () => {
    const navLinks = document.getElementById('nav-links')
    if (navLinks) {
      const { data: { session } } = await auth.supabase.auth.getSession()
      if (session) {
        const profile = await auth.getProfile()
        if (profile?.role === 'admin') {
          navLinks.innerHTML = `
            <a href="/admin/dashboard" data-navigo style="font-weight: 500; color: var(--text-muted);">Dashboard</a>
            <a href="/admin/members" data-navigo style="font-weight: 500; color: var(--text-muted);">Members</a>
            <a href="/admin/bills" data-navigo style="font-weight: 500; color: var(--text-muted);">Bills</a>
            <button id="logout-btn" class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.9rem;">Logout</button>
          `
        } else {
          navLinks.innerHTML = `
            <a href="/member/dashboard" data-navigo style="font-weight: 500; color: var(--text-muted);">Dashboard</a>
            <button id="logout-btn" class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.9rem;">Logout</button>
          `
        }

        document.getElementById('logout-btn').addEventListener('click', async () => {
          await auth.signOut()
          window.location.href = '/'
          window.location.reload()
        })
      } else {
        navLinks.innerHTML = `
          <a href="/" data-navigo style="font-weight: 500; color: var(--text-muted);">Home</a>
          <a href="/login" data-navigo class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.9rem;">Login</a>
        `
      }
    }
  }, 0)

  return `
    <nav style="background: white; border-bottom: 1px solid #e2e8f0; padding: 1rem 0; margin-bottom: 2rem;">
      <div class="container" style="display: flex; justify-content: space-between; align-items: center;">
        <a href="/" data-navigo style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">
          Gym<span style="color: var(--text-main);">Master</span>
        </a>
        <div id="nav-links" style="display: flex; gap: 1.5rem; align-items: center;">
          <!-- Links will be injected here -->
          <a href="/" data-navigo style="font-weight: 500; color: var(--text-muted);">Home</a>
          <a href="/login" data-navigo class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.9rem;">Login</a>
        </div>
      </div>
    </nav>
  `
}
