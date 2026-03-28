export function getServerStateErrorMessage(error, fallbackMessage) {
  return error?.message || fallbackMessage
}

export function getCombinedServerStateError(queries, fallbackMessage) {
  const firstError = queries.find((query) => query?.error)?.error
  return firstError ? getServerStateErrorMessage(firstError, fallbackMessage) : ''
}
