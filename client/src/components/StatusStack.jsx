import StatusBanner from './StatusBanner'

export default function StatusStack({ id, errorMessage, successMessage }) {
  return (
    <>
      {errorMessage && <StatusBanner id={id ? `${id}-error` : undefined} message={errorMessage} />}
      {successMessage && (
        <StatusBanner id={id ? `${id}-success` : undefined} variant="success" message={successMessage} />
      )}
    </>
  )
}
