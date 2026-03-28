export const queryKeys = {
  membershipPlans: ['membership-plans'],
  accessibleMembers: ['accessible-members'],
  accessibleMembersList: (search = '', limit = 100) => ['accessible-members', search, limit],
  workoutPlans: ['workout-plans'],
  dietPlans: ['diet-plans'],
  sessions: ['sessions'],
  dashboard: {
    all: ['dashboard'],
    admin: ['dashboard', 'admin'],
    trainer: (limit = 8) => ['dashboard', 'trainer', limit],
    member: (limit = 8) => ['dashboard', 'member', limit],
  },
  schedule: {
    all: ['schedule'],
    workspace: ['schedule', 'workspace'],
  },
  subscriptions: {
    all: ['subscriptions'],
    list: (params) => ['subscriptions', 'list', params],
    me: ['subscriptions', 'me'],
  },
  payments: {
    all: ['payments'],
    list: (params) => ['payments', 'list', params],
  },
  progress: {
    all: ['progress'],
    list: (params) => ['progress', 'list', params],
    member: (memberId, params) => ['progress', 'member', memberId, params],
  },
}
