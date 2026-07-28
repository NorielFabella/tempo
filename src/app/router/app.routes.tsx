import { Navigate, type RouteObject } from 'react-router-dom'

import { AppLayout } from '@/app/layouts/AppLayout'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import { ProtectedRoute } from '@/features/auth/guards/ProtectedRoute'
import { PublicRoute } from '@/features/auth/guards/PublicRoute'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { ChatPage } from '@/features/messaging/chat/pages/ChatPage'
import { SettingsPage } from '@/features/settings/pages/SettingsPage'
import { ProfilePage } from '@/features/users/pages/ProfilePage'
import { HomePage } from '@/features/workspaces/pages/HomePage'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Navigate to="/app" replace />,
  },
  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: '/login',
            element: <LoginPage />,
          },
          {
            path: '/register',
            element: <RegisterPage />,
          },
          {
            path: '/forgot-password',
            element: <ForgotPasswordPage />,
          },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/app',
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <HomePage />,
          },
          {
            path: 'chat',
            element: <ChatPage />,
          },
          {
            path: 'profile',
            element: <ProfilePage />,
          },
          {
            path: 'settings',
            element: <SettingsPage />,
          },
        ],
      },
    ],
  },
]
