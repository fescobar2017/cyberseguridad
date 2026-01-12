import type { PortResult } from "@/components/port-scanner"
import type { HeaderResult } from "@/components/http-headers"
import type { Vulnerability } from "@/components/vulnerabilities"
import { getCurrentSession } from "@/lib/auth-storage"

export interface ScanRecord {
  id: string
  target: string
  timestamp: number
  userId: string // Added userId to associate scans with users
  ports: PortResult[]
  headers: HeaderResult[]
  vulnerabilities: Vulnerability[]
  geoData?: {
    city: string
    country: string
    countryCode: string
    isp: string
  }
}

const STORAGE_KEY = "cyberscan_history"
const MAX_RECORDS = 50

export function saveScanRecord(record: Omit<ScanRecord, "id" | "timestamp" | "userId">): ScanRecord | null {
  const session = getCurrentSession()
  if (!session) return null // Require auth to save

  const newRecord: ScanRecord = {
    ...record,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    userId: session.userId,
  }

  const allHistory = getAllScanHistory()
  const updatedHistory = [newRecord, ...allHistory].slice(0, MAX_RECORDS * 10) // More capacity for all users

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory))
  } catch (error) {
    console.error("Error saving scan record:", error)
  }

  return newRecord
}

export function getScanHistory(): ScanRecord[] {
  const session = getCurrentSession()
  if (!session) return []

  const allHistory = getAllScanHistory()
  return allHistory.filter((record) => record.userId === session.userId)
}

function getAllScanHistory(): ScanRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch (error) {
    console.error("Error loading scan history:", error)
    return []
  }
}

export function deleteScanRecord(id: string): void {
  const session = getCurrentSession()
  if (!session) return

  const allHistory = getAllScanHistory()
  const filtered = allHistory.filter((record) => !(record.id === id && record.userId === session.userId))

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error("Error deleting scan record:", error)
  }
}

export function clearScanHistory(): void {
  const session = getCurrentSession()
  if (!session) return

  const allHistory = getAllScanHistory()
  const filtered = allHistory.filter((record) => record.userId !== session.userId)

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error("Error clearing scan history:", error)
  }
}

export function getScanById(id: string): ScanRecord | undefined {
  const history = getScanHistory()
  return history.find((record) => record.id === id)
}
