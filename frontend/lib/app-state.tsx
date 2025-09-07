"use client"

import * as React from "react"

type Section = "dashboard" | "leads" | "email" | "ai" | "settings"

export type LeadStatus = "Sent" | "Pending" | "Failed"
export type Lead = { name: string; email: string; status: LeadStatus }
export type LogEntry = { type: "success" | "error"; message: string; time: string }

type Settings = {
  emailNotifications: boolean
  autoSaveTemplates: boolean
  aiApiKey?: string
}

type AppState = {
  // navigation
  activeSection: Section
  setActiveSection: (s: Section) => void

  // search
  searchQuery: string
  setSearchQuery: (q: string) => void

  // leads
  leads: Lead[]
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>
  clearLeads: () => void

  // logs
  logs: LogEntry[]
  addLog: (entry: LogEntry) => void
  clearLogs: () => void

  // settings
  settings: Settings
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  setAiApiKey: (key: string) => void

  // danger zone
  resetApp: () => void
}

const AppStateContext = React.createContext<AppState | null>(null)

// localStorage keys
const LS = {
  notif: "trinidiumlab:email-notifications",
  autosave: "trinidiumlab:auto-save",
  aiKey: "trinidiumlab:ai-api-key",
}

const initialLeads: Lead[] = [
  { name: "John Doe", email: "john@example.com", status: "Sent" },
  { name: "Jane Smith", email: "jane@example.com", status: "Pending" },
  { name: "Bob Johnson", email: "bob@example.com", status: "Failed" },
  { name: "Alice Brown", email: "alice@example.com", status: "Sent" },
]

const initialLogs: LogEntry[] = [
  { type: "success", message: "Email sent to john@example.com", time: "10:30 AM" },
  { type: "error", message: "Failed to send to invalid@email.com", time: "10:28 AM" },
  { type: "success", message: "Email sent to jane@example.com", time: "10:25 AM" },
]

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [activeSection, setActiveSection] = React.useState<Section>("dashboard")
  const [searchQuery, setSearchQuery] = React.useState("")

  const [leads, setLeads] = React.useState<Lead[]>(initialLeads)
  const [logs, setLogs] = React.useState<LogEntry[]>(initialLogs)

  const [settings, setSettings] = React.useState<Settings>(() => {
    if (typeof window === "undefined") {
      return {
        emailNotifications: true,
        autoSaveTemplates: true,
        aiApiKey: undefined,
      }
    }
    const notif = localStorage.getItem(LS.notif)
    const autosave = localStorage.getItem(LS.autosave)
    const aiKey = localStorage.getItem(LS.aiKey) || undefined
    return {
      emailNotifications: notif ? notif === "true" : true,
      autoSaveTemplates: autosave ? autosave === "true" : true,
      aiApiKey: aiKey,
    }
  })

  // Force dark mode always
  React.useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.add("dark")
    }
  }, [])

  const setSetting = React.useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value }
      if (key === "emailNotifications") localStorage.setItem(LS.notif, String(value))
      if (key === "autoSaveTemplates") localStorage.setItem(LS.autosave, String(value))
      return next
    })
  }, [])

  const setAiApiKey = React.useCallback((key: string) => {
    setSettings((prev) => {
      localStorage.setItem(LS.aiKey, key)
      return { ...prev, aiApiKey: key }
    })
  }, [])

  const clearLeads = React.useCallback(() => setLeads([]), [])
  const addLog = React.useCallback((entry: LogEntry) => setLogs((l) => [entry, ...l]), [])
  const clearLogs = React.useCallback(() => setLogs([]), [])

  const resetApp = React.useCallback(() => {
    // clear localStorage & state back to defaults
    localStorage.removeItem(LS.notif)
    localStorage.removeItem(LS.autosave)
    localStorage.removeItem(LS.aiKey)
    setSettings({
      emailNotifications: true,
      autoSaveTemplates: true,
      aiApiKey: undefined,
    })
    setLeads([])
    setLogs([])
    setSearchQuery("")
    setActiveSection("dashboard")
    // ensure dark is still on
    if (typeof document !== "undefined") {
      document.documentElement.classList.add("dark")
    }
  }, [])

  const value = React.useMemo<AppState>(
    () => ({
      activeSection,
      setActiveSection,
      searchQuery,
      setSearchQuery,
      leads,
      setLeads,
      clearLeads,
      logs,
      addLog,
      clearLogs,
      settings,
      setSetting,
      setAiApiKey,
      resetApp,
    }),
    [activeSection, searchQuery, leads, logs, settings, setAiApiKey, clearLeads, addLog, clearLogs, resetApp],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const ctx = React.useContext(AppStateContext)
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider")
  return ctx
}
