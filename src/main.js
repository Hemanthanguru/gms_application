import './style.css'
import Navigo from 'navigo'
import { renderNavbar } from './components/Navbar'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { AdminSignup } from './pages/AdminSignup'
import { MemberSignup } from './pages/MemberSignup'
import { AdminDashboard } from './pages/admin/Dashboard'
import { Members } from './pages/admin/Members'
import { AddMember } from './pages/admin/AddMember'
import { Bills } from './pages/admin/Bills'
import { CreateBill } from './pages/admin/CreateBill'
import { MemberDashboard } from './pages/member/Dashboard'
import { Verified } from './pages/Verified'
import { auth } from './lib/auth'
import { supabase } from './lib/supabase'

const router = new Navigo('/', { hash: true })

const app = document.querySelector('#app')

// Helper to render content
const render = (content, fullPage = false) => {
  if (fullPage) {
    app.innerHTML = content
  } else {
    app.innerHTML = `
      ${renderNavbar()}
      <main class="container fade-in">
        ${content}
      </main>
    `
  }
  router.updatePageLinks()
}

// Global Auth Listener for Email Verification Redirect - REMOVED
// supabase.auth.onAuthStateChange(async (event, session) => {
//   if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
//     // Check if we are already on the verified page to avoid loops
//     if (window.location.hash.includes('verified')) return
//
//     // Check if user is verified
//     const profile = await auth.getProfile()
//     // If profile exists, has verified=0, and email IS confirmed by Supabase
//     if (profile && profile.verified === 0 && session.user.email_confirmed_at) {
//       router.navigate('/verified')
//     }
//   }
// })

// Routes
router
  .on('/', () => {
    render(Home())
  })
  .on('/login', () => {
    render(Login())
  })
  .on('/verified', () => {
    render(Verified(), true) // Render as full page (blank page style)
  })
  .on('/signup/admin', () => {
    render(AdminSignup())
  })
  .on('/signup/member', () => {
    render(MemberSignup())
  })
  .on('/admin/dashboard', async () => {
    const profile = await auth.getProfile()
    if (!profile || profile.role !== 'admin') {
      router.navigate('/login')
      return
    }
    render(AdminDashboard())
  })
  .on('/member/dashboard', async () => {
    const profile = await auth.getProfile()
    if (!profile || profile.role !== 'member') {
      // If admin tries to access, maybe let them? For now strict.
      if (profile?.role === 'admin') {
        // Admin viewing member dashboard? Maybe not needed.
        router.navigate('/admin/dashboard')
        return
      }
      router.navigate('/login')
      return
    }
    render(MemberDashboard())
  })
  .on('/admin/members', async () => {
    const profile = await auth.getProfile()
    if (!profile || profile.role !== 'admin') {
      router.navigate('/login')
      return
    }
    render(Members())
  })
  .on('/admin/members/add', async () => {
    const profile = await auth.getProfile()
    if (!profile || profile.role !== 'admin') {
      router.navigate('/login')
      return
    }
    render(AddMember())
  })
  .on('/admin/bills', async () => {
    const profile = await auth.getProfile()
    if (!profile || profile.role !== 'admin') {
      router.navigate('/login')
      return
    }
    render(Bills())
  })
  .on('/admin/bills/create', async () => {
    const profile = await auth.getProfile()
    if (!profile || profile.role !== 'admin') {
      router.navigate('/login')
      return
    }
    render(CreateBill())
  })
  .resolve()




