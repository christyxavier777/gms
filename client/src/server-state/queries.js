import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import { queryKeys } from './queryKeys'

export function useMembershipPlansQuery() {
  return useQuery({
    queryKey: queryKeys.membershipPlans,
    queryFn: () => api.listMembershipPlans(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useAccessibleMembersQuery(token, { enabled = true, search = '', limit = 100 } = {}) {
  return useQuery({
    queryKey: queryKeys.accessibleMembersList(search, limit),
    queryFn: () => api.listAccessibleMembers(token, search, limit),
    enabled: Boolean(token) && enabled,
  })
}

export function useAdminDashboardQuery(token) {
  return useQuery({
    queryKey: queryKeys.dashboard.admin,
    queryFn: () => api.getAdminDashboard(token),
    enabled: Boolean(token),
  })
}

export function useTrainerDashboardQuery(token, limit = 8) {
  return useQuery({
    queryKey: queryKeys.dashboard.trainer(limit),
    queryFn: () => api.getTrainerDashboard(token, limit),
    enabled: Boolean(token),
  })
}

export function useMemberDashboardQuery(token, limit = 8) {
  return useQuery({
    queryKey: queryKeys.dashboard.member(limit),
    queryFn: () => api.getMemberDashboard(token, limit),
    enabled: Boolean(token),
  })
}

export function useSessionsQuery(token) {
  return useQuery({
    queryKey: queryKeys.sessions,
    queryFn: () => api.listMySessions(token),
    enabled: Boolean(token),
  })
}

export function useScheduleWorkspaceQuery(token) {
  return useQuery({
    queryKey: queryKeys.schedule.workspace,
    queryFn: () => api.getScheduleWorkspace(token),
    enabled: Boolean(token),
  })
}

export function useWorkoutPlansQuery(token) {
  return useQuery({
    queryKey: queryKeys.workoutPlans,
    queryFn: () => api.listWorkoutPlans(token),
    enabled: Boolean(token),
  })
}

export function useDietPlansQuery(token) {
  return useQuery({
    queryKey: queryKeys.dietPlans,
    queryFn: () => api.listDietPlans(token),
    enabled: Boolean(token),
  })
}

export function useSubscriptionsQuery(token, params, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.subscriptions.list(params),
    queryFn: () => api.listSubscriptions(token, params),
    enabled: Boolean(token) && enabled,
  })
}

export function useMySubscriptionQuery(token, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.subscriptions.me,
    queryFn: () => api.getMySubscription(token),
    enabled: Boolean(token) && enabled,
  })
}

export function usePaymentsQuery(token, params, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.payments.list(params),
    queryFn: () => api.listPayments(token, params),
    enabled: Boolean(token) && enabled,
  })
}

export function useAllProgressQuery(token, params, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.progress.list(params),
    queryFn: () => api.listAllProgress(token, params),
    enabled: Boolean(token) && enabled,
  })
}

export function useMemberProgressQuery(token, memberId, params, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.progress.member(memberId, params),
    queryFn: () => api.listProgressByUserId(token, memberId, params),
    enabled: Boolean(token) && Boolean(memberId) && enabled,
  })
}
