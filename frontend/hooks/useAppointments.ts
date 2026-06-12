'use client'
import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { appointmentApi } from '@/lib/api'
import type { Appointment } from '@/types'

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchMine = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await appointmentApi.my()
      setAppointments(res.data)
    } catch { toast.error('Failed to load appointments') }
    finally { setIsLoading(false) }
  }, [])

  const cancel = async (id: string, reason?: string) => {
    await appointmentApi.cancel(id, reason)
    toast.success('Appointment cancelled')
    setAppointments(p => p.map(a => a.id === id ? { ...a, status: 'cancelled' } : a))
  }

  const reschedule = async (id: string, newDate: string, newStartTime: string) => {
    const res = await appointmentApi.reschedule(id, { new_date: newDate, new_start_time: newStartTime })
    toast.success('Appointment rescheduled')
    return res.data as Appointment
  }

  return { appointments, isLoading, fetchMine, cancel, reschedule }
}
