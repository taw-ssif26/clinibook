'use client'
import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { doctorApi } from '@/lib/api'
import type { Doctor, DoctorPublicProfile } from '@/types'

export function useDoctors() {
  const [doctors, setDoctors] = useState<DoctorPublicProfile[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await doctorApi.list()
      setDoctors(res.data)
    } catch { toast.error('Failed to load doctors') }
    finally { setIsLoading(false) }
  }, [])

  return { doctors, isLoading, fetchAll }
}
