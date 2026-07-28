import { routes } from '@/app/router/app.routes'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'

const router = createBrowserRouter(routes)

export function AppRouter() {
  return <RouterProvider router={router} />
}
