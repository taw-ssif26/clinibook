'use client'
import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { availabilityApi } from '@/lib/api'
import type { DoctorAvailability, AvailabilityException, TimeSlot } from '@/types'

export function useAvailability() {
  const [availability, setAvailability] = useState<DoctorAvailability[]>([])
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([])
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchMine = useCallback(async () => {
    setIsLoading(true)
    try {
      const [av, ex] = await Promise.all([availabilityApi.getMine(), availabilityApi.getMyExceptions()])
      setAvailability(av.data)
      setExceptions(ex.data)
    } catch { toast.error('Failed to load schedule') }
    finally { setIsLoading(false) }
  }, [])

  const fetchSlots = useCallback(async (doctorId: string, date: string) => {
    setIsLoading(true)
    try {
      const res = await availabilityApi.getSlots(doctorId, date)
      setSlots(res.data)
    } catch { toast.error('Failed to load slots') }
    finally { setIsLoading(false) }
  }, [])

  const setSchedule = async (data: object[]) => {
    const res = await availabilityApi.setMine(data)
    setAvailability(res.data)
    toast.success('Schedule saved')
  }

  const addException = async (data: object) => {
    const res = await availabilityApi.addException(data)
    setExceptions(p => [...p, res.data])
    toast.success('Exception added')
  }

  return { availability, exceptions, slots, isLoading, fetchMine, fetchSlots, setSchedule, addException }
}
