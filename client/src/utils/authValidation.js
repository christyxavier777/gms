const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const passwordHasUppercase = /[A-Z]/
const passwordHasLowercase = /[a-z]/
const passwordHasDigit = /\d/

export const passwordRuleText =
  'Use at least 8 characters with uppercase, lowercase, and a number.'

export function isValidEmail(value) {
  return emailPattern.test(String(value || '').trim())
}

export function isStrongPassword(value) {
  const password = String(value || '')
  return (
    password.length >= 8 &&
    passwordHasUppercase.test(password) &&
    passwordHasLowercase.test(password) &&
    passwordHasDigit.test(password)
  )
}

export function getPasswordChecklist(value) {
  const password = String(value || '')
  return [
    {
      key: 'length',
      label: 'At least 8 characters',
      met: password.length >= 8,
    },
    {
      key: 'uppercase',
      label: 'One uppercase letter',
      met: passwordHasUppercase.test(password),
    },
    {
      key: 'lowercase',
      label: 'One lowercase letter',
      met: passwordHasLowercase.test(password),
    },
    {
      key: 'digit',
      label: 'One number',
      met: passwordHasDigit.test(password),
    },
  ]
}

export function getPasswordStrength(value) {
  const checklist = getPasswordChecklist(value)
  const metCount = checklist.filter((rule) => rule.met).length

  if (metCount <= 1) {
    return { label: 'Weak', tone: 'text-[#ff7b88]' }
  }

  if (metCount <= 3) {
    return { label: 'Medium', tone: 'text-yellow-300' }
  }

  return { label: 'Strong', tone: 'text-emerald-300' }
}
