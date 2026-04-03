const configuredApiUrl = import.meta.env.VITE_API_URL?.trim() || ''
const API_URL = configuredApiUrl.replace(/\/+$/, '') || (import.meta.env.DEV ? 'http://localhost:4000' : '')

function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    searchParams.set(key, String(value))
  })

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

async function request(path, options = {}) {
  const { headers = {}, ...rest } = options
  let response

  try {
    response = await fetch(`${API_URL}${path}`, {
      credentials: 'include',
      headers,
      ...rest,
    })
  } catch (cause) {
    const target = API_URL || 'the API server'
    const message = import.meta.env.DEV
      ? `Could not reach ${target}. Make sure the backend is running and try again.`
      : 'Could not reach the server. Check your connection and try again.'
    const error = new Error(message)
    error.code = 'NETWORK_ERROR'
    error.cause = cause
    throw error
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message =
      data?.error?.message || data?.message || `Request failed with status ${response.status}`
    const error = new Error(message)
    const retryAfterHeader = response.headers.get('Retry-After')
    const rateLimitResetHeader = response.headers.get('X-RateLimit-Reset')
    error.status = response.status
    error.code = data?.error?.code || null
    error.details = data?.error?.details || null
    error.retryAfter = retryAfterHeader ? Number(retryAfterHeader) : null
    error.rateLimitResetAt = rateLimitResetHeader ? Number(rateLimitResetHeader) : null
    throw error
  }

  return data
}

function authHeaders(token) {
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

export const api = {
  login: (credentials) =>
    request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    }),

  logout: () =>
    request('/auth/logout', {
      method: 'POST',
    }),

  register: (userData) =>
    request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    }),

  listMembershipPlans: () =>
    request('/membership-plans', {
      method: 'GET',
    }),

  me: (token) =>
    request('/me', {
      method: 'GET',
      headers: authHeaders(token),
    }),

  listMySessions: (token) =>
    request('/me/sessions', {
      method: 'GET',
      headers: authHeaders(token),
    }),

  revokeOtherSessions: (token) =>
    request('/me/sessions/revoke-others', {
      method: 'POST',
      headers: authHeaders(token),
    }),

  revokeAllSessions: (token) =>
    request('/me/sessions/revoke-all', {
      method: 'POST',
      headers: authHeaders(token),
    }),

  getAdminDashboard: (token) =>
    request('/dashboard/admin', {
      method: 'GET',
      headers: authHeaders(token),
    }),

  getTrainerDashboard: (token, limit = 5) =>
    request(`/dashboard/trainer?limit=${limit}`, {
      method: 'GET',
      headers: authHeaders(token),
    }),

  getMemberDashboard: (token, limit = 5) =>
    request(`/dashboard/member?limit=${limit}`, {
      method: 'GET',
      headers: authHeaders(token),
    }),

  getScheduleWorkspace: (token) =>
    request('/schedule', {
      method: 'GET',
      headers: authHeaders(token),
    }),

  createScheduleSession: (token, payload) =>
    request('/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(token),
      },
      body: JSON.stringify(payload),
    }),

  bookScheduleSession: (token, sessionId) =>
    request(`/schedule/${sessionId}/book`, {
      method: 'POST',
      headers: authHeaders(token),
    }),

  updateScheduleBookingStatus: (token, bookingId, status) =>
    request(`/schedule/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(token),
      },
      body: JSON.stringify({ status }),
    }),

  listWorkoutPlans: (token) =>
    request('/workout-plans', {
      method: 'GET',
      headers: authHeaders(token),
    }),

  createWorkoutPlan: (token, payload) =>
    request('/workout-plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(token),
      },
      body: JSON.stringify(payload),
    }),

  assignWorkoutPlan: (token, planId, memberId) =>
    request(`/workout-plans/${planId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(token),
      },
      body: JSON.stringify({ memberId }),
    }),

  deleteWorkoutPlan: (token, planId) =>
    request(`/workout-plans/${planId}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    }),

  listDietPlans: (token) =>
    request('/diet-plans', {
      method: 'GET',
      headers: authHeaders(token),
    }),

  createDietPlan: (token, payload) =>
    request('/diet-plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(token),
      },
      body: JSON.stringify(payload),
    }),

  assignDietPlan: (token, planId, memberId) =>
    request(`/diet-plans/${planId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(token),
      },
      body: JSON.stringify({ memberId }),
    }),

  deleteDietPlan: (token, planId) =>
    request(`/diet-plans/${planId}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    }),

  listUsers: (token, params = {}) =>
    request(`/users${buildQueryString(params)}`, {
      method: 'GET',
      headers: authHeaders(token),
    }),

  listAccessibleMembers: (token, search = '', limit = 100) =>
    request(`/users/members/available?search=${encodeURIComponent(search)}&limit=${limit}`, {
      method: 'GET',
      headers: authHeaders(token),
    }),

  listSubscriptions: (token, params = {}) =>
    request(`/subscriptions${buildQueryString(params)}`, {
      method: 'GET',
      headers: authHeaders(token),
    }),

  createSubscription: (token, payload) =>
    request('/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(token),
      },
      body: JSON.stringify(payload),
    }),

  createOnboardingSubscription: (token, payload) =>
    request('/me/subscription/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(token),
      },
      body: JSON.stringify(payload),
    }),

  cancelSubscription: (token, subscriptionId) =>
    request(`/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: authHeaders(token),
    }),

  getMySubscription: (token) =>
    request('/me/subscription', {
      method: 'GET',
      headers: authHeaders(token),
    }),

  listMySubscriptions: (token) =>
    request('/me/subscriptions', {
      method: 'GET',
      headers: authHeaders(token),
    }),

  createProgress: (token, payload) =>
    request('/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(token),
      },
      body: JSON.stringify(payload),
    }),

  listAllProgress: (token, params = {}) =>
    request(`/progress${buildQueryString(params)}`, {
      method: 'GET',
      headers: authHeaders(token),
    }),

  listProgressByUserId: (token, userId, params = {}) =>
    request(`/progress/${userId}${buildQueryString(params)}`, {
      method: 'GET',
      headers: authHeaders(token),
    }),

  deleteProgress: (token, progressId) =>
    request(`/progress/${progressId}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    }),

  createUpiPayment: (token, payload) =>
    request('/payments/upi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify(payload),
    }),

  createRazorpayOrder: (token, payload) =>
    request('/payments/razorpay/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify(payload),
    }),

  verifyRazorpayPayment: (token, payload) =>
    request('/payments/razorpay/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify(payload),
    }),

  listPayments: (token, params = {}) =>
    request(`/payments${buildQueryString(params)}`, {
      method: 'GET',
      headers: authHeaders(token),
    }),

  updatePaymentStatus: (token, paymentId, status, verificationNotes) =>
    request(`/payments/${paymentId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({
        status,
        ...(verificationNotes ? { verificationNotes } : {}),
      }),
    }),
}
