import { useState } from 'react'

export function useActionStatus() {
  const [actionKey, setActionKey] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const clearError = () => setErrorMessage('')
  const clearSuccess = () => setSuccessMessage('')

  const clearMessages = () => {
    clearError()
    clearSuccess()
  }

  const showError = (message) => {
    setErrorMessage(message)
    setSuccessMessage('')
  }

  const showSuccess = (message) => {
    setSuccessMessage(message)
    setErrorMessage('')
  }

  return {
    actionKey,
    errorMessage,
    successMessage,
    setActionKey,
    setErrorMessage,
    setSuccessMessage,
    clearError,
    clearSuccess,
    clearMessages,
    showError,
    showSuccess,
  }
}
