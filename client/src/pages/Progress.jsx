import { useCallback, useEffect, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

function toDateTimeLocalValue(value) {
  try {
    const date = new Date(value)
    const timezoneOffsetMs = date.getTimezoneOffset() * 60000
    const localDate = new Date(date.getTime() - timezoneOffsetMs)
    return localDate.toISOString().slice(0, 16)
  } catch {
    return ''
  }
}

function formatDateTime(value) {
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

function parseOptionalNumber(value) {
  if (value === '' || value === null || value === undefined) return undefined
  const number = Number(value)
  return Number.isFinite(number) ? number : undefined
}

function roundTo1(value) {
  return Math.round(value * 10) / 10
}

export default function Progress() {
  const { token, user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const isTrainer = user?.role === 'TRAINER'
  const isMember = user?.role === 'MEMBER'
  const canCreate = isAdmin || isTrainer
  const canDelete = isAdmin

  const [entries, setEntries] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [memberUserId, setMemberUserId] = useState('')
  const [weight, setWeight] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [bmi, setBmi] = useState('')
  const [notes, setNotes] = useState('')
  const [recordedAt, setRecordedAt] = useState(toDateTimeLocalValue(new Date()))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bmiWeightKg, setBmiWeightKg] = useState('')
  const [bmiHeightCm, setBmiHeightCm] = useState('')
  const [bodyFatSex, setBodyFatSex] = useState('MALE')
  const [bfHeightCm, setBfHeightCm] = useState('')
  const [bfNeckCm, setBfNeckCm] = useState('')
  const [bfWaistCm, setBfWaistCm] = useState('')
  const [bfHipCm, setBfHipCm] = useState('')

  const effectiveMemberId = isMember ? user?.id || '' : memberUserId

  const loadProgress = useCallback(async (targetMemberId = effectiveMemberId) => {
    if (!token) return
    try {
      setLoading(true)
      setError('')
      if (isAdmin) {
        const [progressData, usersData] = await Promise.all([
          api.listAllProgress(token),
          api.listUsers(token),
        ])
        setEntries(progressData.progress || [])
        const memberUsers = (usersData.users || []).filter((u) => u.role === 'MEMBER')
        setMembers(memberUsers)
        return
      }

      if (!targetMemberId) {
        setEntries([])
        return
      }

      const data = await api.listProgressByUserId(token, targetMemberId)
      setEntries(data.progress || [])
    } catch (err) {
      setError(err?.message || 'Failed to load progress entries.')
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [token, isAdmin, effectiveMemberId])

  useEffect(() => {
    loadProgress()
  }, [loadProgress])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!canCreate) return

    const targetMemberId = memberUserId.trim()
    if (!targetMemberId) {
      setError('Member is required.')
      return
    }

    const payload = {
      userId: targetMemberId,
      weight: parseOptionalNumber(weight),
      bodyFat: parseOptionalNumber(bodyFat),
      bmi: parseOptionalNumber(bmi),
      notes: notes.trim() || undefined,
      recordedAt: recordedAt ? new Date(recordedAt).toISOString() : new Date().toISOString(),
    }

    const hasMetricOrNotes =
      payload.weight !== undefined ||
      payload.bodyFat !== undefined ||
      payload.bmi !== undefined ||
      Boolean(payload.notes)

    if (!hasMetricOrNotes) {
      setError('Provide at least one metric or notes.')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')
      setSuccess('')
      await api.createProgress(token, payload)
      setSuccess('Progress entry created.')
      setWeight('')
      setBodyFat('')
      setBmi('')
      setNotes('')
      setRecordedAt(toDateTimeLocalValue(new Date()))
      await loadProgress(targetMemberId)
    } catch (err) {
      setError(err?.message || 'Failed to create progress entry.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (entryId) => {
    if (!canDelete) return
    try {
      setError('')
      setSuccess('')
      await api.deleteProgress(token, entryId)
      setSuccess('Progress entry deleted.')
      await loadProgress()
    } catch (err) {
      setError(err?.message || 'Failed to delete progress entry.')
    }
  }

  const handleLoadByMember = async () => {
    await loadProgress(memberUserId.trim())
  }

  const handleCalculateBmi = () => {
    const weightKg = Number(bmiWeightKg)
    const heightCm = Number(bmiHeightCm)
    if (!Number.isFinite(weightKg) || weightKg <= 0 || !Number.isFinite(heightCm) || heightCm <= 0) {
      setError('Enter valid weight and height for BMI calculation.')
      return
    }

    const heightM = heightCm / 100
    const calculatedBmi = weightKg / (heightM * heightM)
    setBmi(String(roundTo1(calculatedBmi)))
    setError('')
    setSuccess('BMI calculated and added to the form.')
  }

  const handleCalculateBodyFat = () => {
    const heightCm = Number(bfHeightCm)
    const neckCm = Number(bfNeckCm)
    const waistCm = Number(bfWaistCm)
    const hipCm = Number(bfHipCm)

    if (
      !Number.isFinite(heightCm) ||
      !Number.isFinite(neckCm) ||
      !Number.isFinite(waistCm) ||
      heightCm <= 0 ||
      neckCm <= 0 ||
      waistCm <= 0
    ) {
      setError('Enter valid body measurements for body fat calculation.')
      return
    }

    const heightIn = heightCm / 2.54
    const neckIn = neckCm / 2.54
    const waistIn = waistCm / 2.54
    const hipIn = hipCm / 2.54

    let bodyFatPercent
    if (bodyFatSex === 'MALE') {
      const base = waistIn - neckIn
      if (base <= 0) {
        setError('Waist must be greater than neck for male body fat calculation.')
        return
      }
      bodyFatPercent =
        495 / (1.0324 - 0.19077 * Math.log10(base) + 0.15456 * Math.log10(heightIn)) - 450
    } else {
      if (!Number.isFinite(hipCm) || hipCm <= 0) {
        setError('Hip measurement is required for female body fat calculation.')
        return
      }
      const base = waistIn + hipIn - neckIn
      if (base <= 0) {
        setError('Invalid measurements for female body fat calculation.')
        return
      }
      bodyFatPercent =
        495 / (1.29579 - 0.35004 * Math.log10(base) + 0.221 * Math.log10(heightIn)) - 450
    }

    if (!Number.isFinite(bodyFatPercent) || bodyFatPercent <= 0 || bodyFatPercent > 75) {
      setError('Could not calculate body fat. Please recheck measurements.')
      return
    }

    setBodyFat(String(roundTo1(bodyFatPercent)))
    setError('')
    setSuccess('Body fat calculated and added to the form.')
  }

  return (
    <DashboardLayout title="Progress">
      {loading && <p className="text-sm font-semibold uppercase tracking-[0.08em] text-gray-300">Loading progress...</p>}
      {error && <p className="text-sm font-semibold text-[#E21A2C]">{error}</p>}
      {success && <p className="text-sm font-semibold text-green-400">{success}</p>}

      {canCreate && (
        <form onSubmit={handleCreate} className="border border-[#2f2f2f] bg-[#111111] p-5">
          <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Add Progress Entry</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {isAdmin ? (
              <select
                value={memberUserId}
                onChange={(e) => setMemberUserId(e.target.value)}
                className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
              >
                <option value="">Select member</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.email})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Member UUID"
                value={memberUserId}
                onChange={(e) => setMemberUserId(e.target.value)}
                className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
              />
            )}
            <input
              type="datetime-local"
              value={recordedAt}
              onChange={(e) => setRecordedAt(e.target.value)}
              className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
            />
            <input
              type="number"
              step="0.1"
              placeholder="Weight (kg)"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
            />
            <input
              type="number"
              step="0.1"
              placeholder="Body Fat (%)"
              value={bodyFat}
              onChange={(e) => setBodyFat(e.target.value)}
              className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
            />
            <input
              type="number"
              step="0.1"
              placeholder="BMI"
              value={bmi}
              onChange={(e) => setBmi(e.target.value)}
              className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
            />
            <textarea
              placeholder="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-white outline-none focus:border-[#E21A2C] md:col-span-2"
            />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <section className="border border-[#2f2f2f] bg-[#1A1A1A] p-4">
              <h3 className="text-sm font-black uppercase tracking-[0.08em] text-white">BMI Calculator</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input
                  type="number"
                  step="0.1"
                  placeholder="Weight (kg)"
                  value={bmiWeightKg}
                  onChange={(e) => setBmiWeightKg(e.target.value)}
                  className="w-full border border-[#333333] bg-[#111111] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder="Height (cm)"
                  value={bmiHeightCm}
                  onChange={(e) => setBmiHeightCm(e.target.value)}
                  className="w-full border border-[#333333] bg-[#111111] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
                />
                <button
                  type="button"
                  onClick={handleCalculateBmi}
                  className="border border-[#E21A2C] bg-[#111111] px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] text-white"
                >
                  Calculate BMI
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                Uses BMI calculator weight + height only, then fills the BMI field above.
              </p>
            </section>

            <section className="border border-[#2f2f2f] bg-[#1A1A1A] p-4">
              <h3 className="text-sm font-black uppercase tracking-[0.08em] text-white">Body Fat Calculator</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <select
                  value={bodyFatSex}
                  onChange={(e) => setBodyFatSex(e.target.value)}
                  className="w-full border border-[#333333] bg-[#111111] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Height (cm)"
                  value={bfHeightCm}
                  onChange={(e) => setBfHeightCm(e.target.value)}
                  className="w-full border border-[#333333] bg-[#111111] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder="Neck (cm)"
                  value={bfNeckCm}
                  onChange={(e) => setBfNeckCm(e.target.value)}
                  className="w-full border border-[#333333] bg-[#111111] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder="Waist (cm)"
                  value={bfWaistCm}
                  onChange={(e) => setBfWaistCm(e.target.value)}
                  className="w-full border border-[#333333] bg-[#111111] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
                />
                {bodyFatSex === 'FEMALE' && (
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Hip (cm)"
                    value={bfHipCm}
                    onChange={(e) => setBfHipCm(e.target.value)}
                    className="w-full border border-[#333333] bg-[#111111] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
                  />
                )}
                <button
                  type="button"
                  onClick={handleCalculateBodyFat}
                  className="border border-[#E21A2C] bg-[#111111] px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] text-white"
                >
                  Calculate Body Fat
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-400">Uses US Navy formula and fills Body Fat (%) field.</p>
            </section>
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !memberUserId}
            className="mt-4 border border-[#E21A2C] bg-[#E21A2C] px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] text-white disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Create Progress'}
          </button>
        </form>
      )}

      {!isAdmin && !isMember && (
        <section className="border border-[#2f2f2f] bg-[#111111] p-5">
          <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Load Member Progress</h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              placeholder="Member UUID"
              value={memberUserId}
              onChange={(e) => setMemberUserId(e.target.value)}
              className="flex-1 border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
            />
            <button
              type="button"
              onClick={handleLoadByMember}
              disabled={!memberUserId}
              className="border border-[#E21A2C] bg-[#1A1A1A] px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] text-white disabled:opacity-50"
            >
              Load
            </button>
          </div>
        </section>
      )}

      {isMember && (
        <section className="border border-[#2f2f2f] bg-[#111111] p-5">
          <p className="text-sm text-gray-300">Showing your personal progress history.</p>
        </section>
      )}

      <section className="border border-[#2f2f2f] bg-[#111111] p-5">
        <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Progress Entries</h2>
        <div className="mt-4 space-y-3">
          {entries.length === 0 && !loading && (
            <p className="text-sm text-gray-300">No progress entries found.</p>
          )}
          {entries.map((entry) => (
            <div key={entry.id} className="border border-[#2f2f2f] bg-[#1A1A1A] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#E21A2C]">
                Member ID: {entry.userId}
              </p>
              <p className="mt-1 text-sm text-gray-300">Recorded: {formatDateTime(entry.recordedAt)}</p>
              <p className="mt-1 text-sm text-gray-300">Weight: {entry.weight ?? '-'} kg</p>
              <p className="mt-1 text-sm text-gray-300">Body Fat: {entry.bodyFat ?? '-'}%</p>
              <p className="mt-1 text-sm text-gray-300">BMI: {entry.bmi ?? '-'}</p>
              {entry.notes && <p className="mt-1 text-sm text-gray-300">Notes: {entry.notes}</p>}
              {canDelete && (
                <button
                  type="button"
                  onClick={() => handleDelete(entry.id)}
                  className="mt-3 border border-[#E21A2C] px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-white"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </DashboardLayout>
  )
}
