import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

const HomePage = () => {
  const { user, token, logout } = useAuthStore()
  const navigate = useNavigate()

  // Helper to retrieve role from user object or decode from JWT token payload
  const getRole = () => {
    if (user?.roles) return user.roles
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        if (payload.roles) return payload.roles
      } catch {
        // ignore parse error
      }
    }
    return 'OR'
  }

  const role = getRole()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getRoleBadgeColor = (r) => {
    switch (r) {
      case 'ADM':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'DEV':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'ADV':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'SLC':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200'
      case 'LC':
        return 'bg-teal-100 text-teal-800 border-teal-200'
      case 'OR':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-gray-100 text-center space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">home page</h1>

        <div className="rounded-xl bg-gray-50 p-4 border border-gray-200 space-y-2">
          <p className="text-sm text-gray-600">
            Logged in as: <span className="font-semibold text-gray-900">{user?.userID || 'User'}</span>
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="text-xs text-gray-500 font-medium">Role:</span>
            <span
              className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold border ${getRoleBadgeColor(
                role
              )}`}
            >
              {role}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-red-500 transition cursor-pointer"
        >
          Logout
        </button>
      </div>
    </div>
  )
}

export default HomePage
