import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import OutreachDashboard from './OutreachDashboard';
import SlcDashboard from './SlcDashboard';
import AdvocateDashboard from './AdvocateDashboard';

const HomePage = () => {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();

  // Helper to retrieve role from user object or decode from JWT token payload
  const getRole = () => {
    if (user?.roles) return user.roles;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.roles) return payload.roles;
      } catch {
        // ignore parse error
      }
    }
    return 'OR';
  };

  const role = getRole();

  // Default portal based on role
  const [activePortal, setActivePortal] = useState(
    role === 'ADV' ? 'advocate' : role === 'SLC' ? 'slc' : 'outreach'
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeColor = (r) => {
    switch (r) {
      case 'ADM':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DEV':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'ADV':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'SLC':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'LC':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'OR':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const canAccessOutreach = role === 'OR' || role === 'ADM' || role === 'DEV';
  const canAccessSlc = role === 'SLC' || role === 'ADM' || role === 'DEV';
  const hasDualAccess = (role === 'ADM' || role === 'DEV');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
              activePortal === 'advocate' ? 'bg-amber-600' : activePortal === 'slc' ? 'bg-cyan-600' : 'bg-indigo-600'
            }`}>
              {activePortal === 'advocate' ? 'ADV' : activePortal === 'slc' ? 'SLC' : 'OR'}
            </span>
            <span className="font-bold text-lg text-gray-900 tracking-tight hidden sm:inline">
              {activePortal === 'advocate'
                ? 'Advocate Portal'
                : activePortal === 'slc'
                ? 'Socio-Legal Counselling Portal'
                : 'Project OutReach Portal'}
            </span>

            {/* Portal Switcher for Admins / Devs */}
            {hasDualAccess && (
              <div className="ml-4 flex items-center bg-gray-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActivePortal('outreach')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    activePortal === 'outreach'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  OutReach
                </button>
                <button
                  type="button"
                  onClick={() => setActivePortal('slc')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    activePortal === 'slc'
                      ? 'bg-white text-cyan-700 shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Socio-Legal
                </button>
                <button
                  type="button"
                  onClick={() => setActivePortal('advocate')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    activePortal === 'advocate'
                      ? 'bg-white text-amber-700 shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Advocate
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="h-9 w-9 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold flex items-center justify-center text-sm shadow-xs">
                {(user?.userName || user?.userID || 'U').charAt(0).toUpperCase()}
              </div>

              <div className="flex flex-col items-start text-left">
                <span className="font-semibold text-gray-900 text-sm leading-tight tracking-tight">
                  {user?.userName || 'User Name'}
                </span>
                <span className="text-xs text-gray-500 font-medium leading-tight mt-0.5">
                  {user?.userID || 'User ID'}
                </span>
              </div>

              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getRoleBadgeColor(
                  role
                )}`}
              >
                {role}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-lg bg-red-600 px-3.5 py-1.5 text-sm font-medium text-white shadow-xs hover:bg-red-500 transition cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {role === 'ADV' || activePortal === 'advocate' ? (
          <AdvocateDashboard />
        ) : activePortal === 'slc' && canAccessSlc ? (
          <SlcDashboard />
        ) : activePortal === 'outreach' && canAccessOutreach ? (
          <OutreachDashboard />
        ) : canAccessSlc ? (
          <SlcDashboard />
        ) : canAccessOutreach ? (
          <OutreachDashboard />
        ) : (
          <div className="max-w-lg mx-auto mt-16 p-8 bg-white rounded-2xl border border-gray-200 shadow-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <h2 className="text-xl font-bold text-gray-900">Access Restricted</h2>
            <p className="text-sm text-gray-600">
              Your account does not have authorization for this portal.
            </p>
            <div className="rounded-lg bg-gray-50 p-3 border border-gray-200 text-xs text-gray-500">
              Your current role is: <span className="font-semibold text-gray-800">{role}</span>
            </div>
            <button
              onClick={handleLogout}
              className="mt-4 inline-block rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition cursor-pointer"
            >
              Switch Account / Logout
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;
