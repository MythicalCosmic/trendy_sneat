export function authMiddleware(to, from, next) {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  
  const isAuthRoute = to.path === '/login'
  
  if (isAuthRoute && token) {
    // If user is logged in and tries to access login, redirect to dashboard
    next('/dashboard')
  } else if (!isAuthRoute && !token) {
    // If user is not logged in and tries to access protected route, redirect to login
    next('/login')
  } else {
    // Otherwise, allow navigation
    next()
  }
}
