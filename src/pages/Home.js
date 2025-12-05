export const Home = () => {
    return `
    <div style="text-align: center; padding: 4rem 0;">
      <h1 style="font-size: 3.5rem; background: linear-gradient(to right, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
        Welcome to Gym MS
      </h1>
      <p style="font-size: 1.25rem; color: var(--text-muted); max-width: 600px; margin: 0 auto 2rem;">
        The ultimate solution for managing your gym, members, and billing with ease.
      </p>
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <a href="/login" class="btn btn-primary" data-navigo>Get Started</a>
        <a href="/about" class="btn" style="background: white; box-shadow: var(--shadow-sm);" data-navigo>Learn More</a>
      </div>
    </div>
  `
}
