import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getServerStateErrorMessage } from './errors'

function resolveMessage(messageOrFactory, payload, fallbackMessage) {
  if (typeof messageOrFactory === 'function') {
    return messageOrFactory(payload)
  }

  return messageOrFactory || fallbackMessage
}

export function useServerActionMutation({
  actionStatus,
  mutationFn,
  getActionKey,
  getSuccessMessage,
  getErrorMessage,
  invalidate,
  optimisticUpdate,
  clearSuccessOnMutate = true,
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      actionStatus.clearError()
      if (clearSuccessOnMutate) {
        actionStatus.clearSuccess()
      }

      if (getActionKey) {
        actionStatus.setActionKey(getActionKey(variables))
      }

      if (!optimisticUpdate) {
        return null
      }

      const context = await optimisticUpdate({ queryClient, variables })
      return context ?? null
    },
    onError: (error, variables, context) => {
      if (context?.rollback) {
        context.rollback()
      }

      const fallbackMessage = resolveMessage(getErrorMessage, { error, variables, context }, 'Request failed.')
      actionStatus.showError(getServerStateErrorMessage(error, fallbackMessage))
    },
    onSuccess: async (data, variables, context) => {
      if (invalidate) {
        await invalidate({ queryClient, data, variables, context })
      }

      const successMessage = resolveMessage(getSuccessMessage, { data, variables, context }, '')
      if (successMessage) {
        actionStatus.showSuccess(successMessage)
      }
    },
    onSettled: () => {
      actionStatus.setActionKey('')
    },
  })
}
