export const queryKeys = {
  groups: {
    all: ['groups'] as const,
    lists: () => [...queryKeys.groups.all, 'list'] as const,
    list: (userId: string) => [...queryKeys.groups.lists(), userId] as const,
    details: () => [...queryKeys.groups.all, 'detail'] as const,
    detail: (groupId: string) => [...queryKeys.groups.details(), groupId] as const,
    members: (groupId: string) => [...queryKeys.groups.detail(groupId), 'members'] as const,
  },
  expenses: {
    all: ['expenses'] as const,
    lists: () => [...queryKeys.expenses.all, 'list'] as const,
    list: (groupId: string) => [...queryKeys.expenses.lists(), groupId] as const,
    details: () => [...queryKeys.expenses.all, 'detail'] as const,
    detail: (expenseId: string) => [...queryKeys.expenses.details(), expenseId] as const,
  },
  balances: {
    all: ['balances'] as const,
    raw: (groupId: string) => [...queryKeys.balances.all, 'raw', groupId] as const,
    simplified: (groupId: string) => [...queryKeys.balances.all, 'simplified', groupId] as const,
    net: (groupId: string) => [...queryKeys.balances.all, 'net', groupId] as const,
  },
}

