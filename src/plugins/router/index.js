import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'
import { authMiddleware } from '@/middleware/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default function (app) {
  app.use(router)
}
router.beforeEach(authMiddleware)
export { router }
