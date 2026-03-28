import { queryKeys } from './queryKeys'

export async function invalidateDashboardQueries(queryClient) {
  await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
}

export async function invalidatePlansQueries(queryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.workoutPlans }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dietPlans }),
    queryClient.invalidateQueries({ queryKey: queryKeys.accessibleMembers }),
    invalidateDashboardQueries(queryClient),
  ])
}

export async function invalidateSubscriptionsQueries(queryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.membershipPlans }),
    queryClient.invalidateQueries({ queryKey: queryKeys.accessibleMembers }),
    queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.payments.all }),
    invalidateDashboardQueries(queryClient),
  ])
}

export async function invalidatePaymentsQueries(queryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.payments.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.me }),
    invalidateDashboardQueries(queryClient),
  ])
}

export async function invalidateProgressQueries(queryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.progress.all }),
    invalidateDashboardQueries(queryClient),
  ])
}

export async function invalidateScheduleQueries(queryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.schedule.all }),
    invalidateDashboardQueries(queryClient),
  ])
}
