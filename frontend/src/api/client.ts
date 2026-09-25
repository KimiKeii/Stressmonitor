import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export type StressLevel = 'non_stress' | 'mild_stress' | 'stress'

export interface StudentUser {
  id: number
  name?: string | null
  patient_code: string | null
  course?: string | null
  college?: string | null
  age?: number | null
  stress_classifications?: StressClassification[]
}

export interface StressClassification {
  id: number
  student_id: number
  stress_level: StressLevel
  feature_vector: Record<string, number> | null
  source: 'rule_based' | 'svm'
  classified_at: string
}

export interface CounselorNote {
  id: number
  student_id: number
  counselor_id: number
  note: string
  recommendation: string | null
  created_at: string
  counselor?: { id: number; name: string }
}
