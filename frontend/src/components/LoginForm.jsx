import React, { useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { apiInstance } from '../App';

export default function LoginForm({ onLoginSuccess }) {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [formData, setFormData] = useState({
    userID: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    const ALLOWED_PREFIXES = ['OR', 'SLC', 'ADM', 'DEV', 'ADV', 'LC'];
    const hasValidPrefix = ALLOWED_PREFIXES.some((prefix) =>
      formData.userID.trim().toUpperCase().startsWith(prefix)
    );

    if (!hasValidPrefix) {
      toast.error(`User ID must start with a role prefix (${ALLOWED_PREFIXES.join(', ')})`);
      return;
    }

    if (formData.userID.length > 25) {
      toast.error('User ID must not exceed 25 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${apiInstance}/auth/login`, formData, {
        headers: { 'Content-Type': 'application/json' },
      });

      const data = response.data;

      // Store in auth store
      login(data.user, data.token);

      toast.success(data.message || 'Logged in successfully!');

      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }

      // Navigate to HomePage
      navigate('/');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Something went wrong';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-md">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Sign In
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Enter your credentials to access your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="userID"
              className="block text-sm font-medium text-gray-700"
            >
              User ID
            </label>
            <input
              id="userID"
              type="text"
              name="userID"
              placeholder="e.g., SLC12345 or OR12346"
              maxLength={25}
              value={formData.userID}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed transition duration-150"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}