const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options)
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message =
      data?.error?.message || data?.message || `Request failed with status ${response.status}`
    const error = new Error(message)
    error.status = response.status
    error.code = data?.error?.code || null
    error.details = data?.error?.details || null
    throw error
  }

  return data
}

export const api = {
  login: (credentials) =>
    request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    }),

  register: (userData) =>
    request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    }),

  me: (token) =>
    request('/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }),

  getAdminDashboard: (token) =>
    request('/dashboard/admin', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }),

  getTrainerDashboard: (token, limit = 5) =>
    request(`/dashboard/trainer?limit=${limit}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }),

  getMemberDashboard: (token, limit = 5) =>
    request(`/dashboard/member?limit=${limit}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }),

  listWorkoutPlans: (token) =>
    request('/workout-plans', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }),

  createWorkoutPlan: (token, payload) =>
    request('/workout-plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }),

  assignWorkoutPlan: (token, planId, memberId) =>
    request(`/workout-plans/${planId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ memberId }),
    }),

  listDietPlans: (token) =>
    request('/diet-plans', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }),

  createDietPlan: (token, payload) =>
    request('/diet-plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }),

  assignDietPlan: (token, planId, memberId) =>
    request(`/diet-plans/${planId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ memberId }),
    }),

  listUsers: (token, page = 1, pageSize = 100) =>
    request(`/users?page=${page}&pageSize=${pageSize}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }),

  listSubscriptions: (token) =>
    request('/subscriptions', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }),

  createSubscription: (token, payload) =>
    request('/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }),

  cancelSubscription: (token, subscriptionId) =>
    request(`/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  getMySubscription: (token) =>
    request('/me/subscription', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }),
}
