import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

function shouldRetryRequest(failureCount, error) {
  const status = Number(error?.status)

  if ([400, 401, 403, 404, 409, 422, 429].includes(status)) {
    return false
  }

  return failureCount < 2
}

const appQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: shouldRetryRequest,
    },
    mutations: {
      retry: false,
    },
  },
})

export function AppQueryProvider({ children }) {
  return <QueryClientProvider client={appQueryClient}>{children}</QueryClientProvider>
}
