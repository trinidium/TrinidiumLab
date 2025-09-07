"use client"

import * as React from "react"
import { useAppState, type Lead } from "@/lib/app-state"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Upload,
  Play,
  Pause,
  Download,
  Trash2,
  CheckCircle,
  XCircle,
  Users,
  Mail,
  TrendingUp,
  Clock,
  Brain,
  FileText,
  SettingsIcon,
  Wand2,
  RotateCcw,
  Shield,
  Loader2,
} from "lucide-react"

export function DashboardContent() {
  const { toast } = useToast()
  const {
    activeSection,
    setActiveSection,
    searchQuery,
    leads,
    setLeads,
    clearLeads,
    logs,
    settings,
    setSetting,
    setAiApiKey,
    resetApp,
    addLog,
  } = useAppState()

  // local UI states
  const [isSending, setIsSending] = React.useState(false)
  const [isAIMode, setIsAIMode] = React.useState(true)

  // AI settings
  const [aiKeyInput, setAiKeyInput] = React.useState(settings.aiApiKey ?? "")
  const [aiPrompt, setAiPrompt] = React.useState("")
  const [aiTone, setAiTone] = React.useState("creative")
  const aiPromptRef = React.useRef<HTMLTextAreaElement | null>(null)
  const [aiTab, setAiTab] = React.useState<"prompt" | "preview">("prompt")
  const [aiPreview, setAiPreview] = React.useState<{ subject: string; body: string } | null>(null)

  // Template mode editor
  const [subject, setSubject] = React.useState("")
  const [templateBody, setTemplateBody] = React.useState("")
  const subjectRef = React.useRef<HTMLInputElement | null>(null)
  const bodyRef = React.useRef<HTMLTextAreaElement | null>(null)
  const [lastFocused, setLastFocused] = React.useState<"subject" | "body">("body")

  // Sending engine config
  const [delaySeconds, setDelaySeconds] = React.useState<number>(10)
  const [dailyLimit, setDailyLimit] = React.useState<number>(200)

  const [gmailCredentials, setGmailCredentials] = React.useState<{
    client_id?: string
    client_secret?: string
    project_id?: string
  } | null>(null)

  const [isAuthenticating, setIsAuthenticating] = React.useState(false)

  const gmailJsonInputRef = React.useRef<HTMLInputElement | null>(null)

  // refs to avoid stale closures in timers
  const isSendingRef = React.useRef(isSending)
  const leadsRef = React.useRef(leads)
  const delayRef = React.useRef(delaySeconds)
  const limitRef = React.useRef(dailyLimit)
  React.useEffect(() => {
    isSendingRef.current = isSending
  }, [isSending])
  React.useEffect(() => {
    leadsRef.current = leads
  }, [leads])
  React.useEffect(() => {
    delayRef.current = delaySeconds
  }, [delaySeconds])
  React.useEffect(() => {
    limitRef.current = dailyLimit
  }, [dailyLimit])

  // File upload
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  // Derived metrics
  const sentCount = React.useMemo(() => leads.filter((l) => l.status === "Sent").length, [leads])
  const failedCount = React.useMemo(() => leads.filter((l) => l.status === "Failed").length, [leads])
  const processedCount = sentCount + failedCount
  const totalTarget = Math.min(dailyLimit, leads.length)
  const remainingToTarget = Math.max(0, totalTarget - processedCount)
  const successRate = processedCount > 0 ? (sentCount / processedCount) * 100 : 0
  const progressPct = totalTarget > 0 ? (processedCount / totalTarget) * 100 : 0

  function formatETA(secondsTotal: number) {
    const h = Math.floor(secondsTotal / 3600)
    const m = Math.floor((secondsTotal % 3600) / 60)
    const s = Math.max(0, Math.floor(secondsTotal % 60))
    if (h > 0) return `${h}h ${m}m`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }
  const etaSeconds = remainingToTarget * delaySeconds

  const stats = [
    { title: "Total Leads", value: String(leads.length), icon: Users, change: "" },
    { title: "Emails Sent Today", value: String(sentCount), icon: Mail, change: "" },
    { title: "Success Rate", value: `${successRate.toFixed(1)}%`, icon: TrendingUp, change: "" },
    {
      title: "Queue Status",
      value: isSending ? "Active" : "Paused",
      icon: Clock,
      change: isSending ? "Running" : "Stopped",
    },
  ]

  const filteredLeads = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return leads
    return leads.filter((l) => l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q))
  }, [leads, searchQuery])

  const handleClearLeads = () => {
    if (!leads.length) {
      toast({ title: "No leads to clear", description: "Your leads list is already empty." })
      return
    }
    if (confirm("Clear all uploaded leads? This cannot be undone.")) {
      clearLeads()
      toast({ title: "Leads cleared", description: "All leads have been removed." })
    }
  }

  const handleSaveAiKey = () => {
    if (!aiKeyInput.trim()) {
      toast({ title: "AI API Key required", description: "Please enter a valid API key.", variant: "destructive" })
      return
    }
    setAiApiKey(aiKeyInput.trim())
    toast({ title: "AI API Key saved", description: "Your AI API key has been stored locally." })
  }

  const handleResetApp = () => {
    if (confirm("Reset application? This will clear leads, logs, and settings.")) {
      setIsSending(false) // stop engine if running
      resetApp()
      toast({ title: "Application reset", description: "All data has been cleared and settings restored." })
    }
  }

  const reopenTerms = () => {
    try {
      localStorage.removeItem("trinidiumlab:tnc:2025-08")
    } catch {}
    window.dispatchEvent(new Event("trinidiumlab:open-tnc"))
  }

  const reopenPrivacy = () => {
    try {
      localStorage.removeItem("trinidiumlab:privacy:2025-08")
    } catch {}
    window.dispatchEvent(new Event("trinidiumlab:open-privacy"))
  }

  // Minimal CSV parser for name,email headers
  function parseCsvToLeads(text: string): Lead[] {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
    if (lines.length < 2) return []
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
    const nameIdx = headers.findIndex((h) => h === "name")
    const emailIdx = headers.findIndex((h) => h === "email")
    if (nameIdx === -1 || emailIdx === -1) return []

    const out: Lead[] = []
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",")
      const name = (cols[nameIdx] || "").trim()
      const email = (cols[emailIdx] || "").trim()
      if (!name || !email) continue
      out.push({ name, email, status: "Pending" })
    }
    return out
  }

  const onChooseFile = () => fileInputRef.current?.click()

  const onChooseGmailJson = () => gmailJsonInputRef.current?.click()

  const onGmailJsonSelected: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith(".json")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JSON file containing Gmail API credentials.",
        variant: "destructive",
      })
      return
    }

    try {
      const text = await file.text()
      const credentialsData = JSON.parse(text)

      if (!credentialsData.installed && !credentialsData.web) {
        toast({
          title: "Invalid credentials file",
          description:
            "JSON file must contain 'installed' or 'web' credentials. Please upload a valid credentials.json file.",
          variant: "destructive",
        })
        return
      }

      // Extract credentials from either installed or web app format
      const creds = credentialsData.installed || credentialsData.web
      setGmailCredentials({
        client_id: creds.client_id,
        client_secret: creds.client_secret,
        project_id: creds.project_id,
      })

      toast({
        title: "Gmail credentials loaded",
        description: "Successfully loaded Gmail API credentials from JSON file.",
      })
    } catch (error) {
      toast({
        title: "Failed to parse JSON",
        description: "Please ensure the file contains valid JSON format.",
        variant: "destructive",
      })
    }

    // Clear the input
    if (gmailJsonInputRef.current) {
      gmailJsonInputRef.current.value = ""
    }
  }

  const onFileSelected: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const newLeads = parseCsvToLeads(text)
      if (newLeads.length === 0) {
        toast({
          title: "No valid leads found",
          description: "CSV must have 'name' and 'email' columns with valid data.",
          variant: "destructive",
        })
        return
      }
      setLeads(newLeads)
      toast({ title: "Leads uploaded", description: `Successfully imported ${newLeads.length} leads.` })
    } catch (error) {
      toast({ title: "Upload failed", description: "Could not read the CSV file.", variant: "destructive" })
    }

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Variable insertion helpers (AI + Template modes)
  function insertAtCaret(
    target: HTMLTextAreaElement | HTMLInputElement | null,
    get: () => string,
    set: (v: string) => void,
    token: string,
  ) {
    if (!target) {
      set(get() + token)
      return
    }
    const current = get()
    const start = target.selectionStart ?? current.length
    const end = target.selectionEnd ?? current.length
    const next = current.slice(0, start) + token + current.slice(end)
    set(next)
    requestAnimationFrame(() => {
      target.focus()
      const pos = start + token.length
      try {
        target.setSelectionRange(pos, pos)
      } catch {}
    })
  }

  function insertVariable(token: string) {
    if (isAIMode) {
      insertAtCaret(aiPromptRef.current, () => aiPrompt, setAiPrompt, token)
    } else {
      if (lastFocused === "subject") {
        insertAtCaret(subjectRef.current, () => subject, setSubject, token)
      } else {
        insertAtCaret(bodyRef.current, () => templateBody, setTemplateBody, token)
      }
    }
  }

  function onVariableKeyDown(e: React.KeyboardEvent, token: string) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      insertVariable(token)
    }
  }

  // Real-time sending engine
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current as any)
      timerRef.current = null
    }
  }

  const scheduleNext = () => {
    clearTimer()
    const delay = Math.max(1, delayRef.current) * 1000
    timerRef.current = setTimeout(tick, delay)
  }

  const tick = () => {
    // guard checks
    const currentLeads = leadsRef.current
    const limit = limitRef.current
    const processed = currentLeads.filter((l) => l.status !== "Pending").length
    const target = Math.min(limit, currentLeads.length)
    if (!isSendingRef.current || target === 0) {
      setIsSending(false)
      clearTimer()
      return
    }
    if (processed >= target) {
      setIsSending(false)
      clearTimer()
      toast({ title: "Daily limit reached", description: `Processed ${target} leads.` })
      return
    }

    // find next pending lead and update status
    const time = new Date().toLocaleTimeString()
    let updatedEmail = ""
    let success = true

    setLeads((prev) => {
      const idx = prev.findIndex((l) => l.status === "Pending")
      if (idx === -1) return prev
      const lead = prev[idx]
      updatedEmail = lead.email
      // simple success rate: 90% success
      success = Math.random() < 0.9
      const next: Lead = { ...lead, status: success ? "Sent" : "Failed" }
      const copy = [...prev]
      copy[idx] = next
      return copy
    })

    // log after state update
    if (updatedEmail) {
      addLog({
        type: success ? "success" : "error",
        message: success ? `Email sent to ${updatedEmail}` : `Failed to send to ${updatedEmail}`,
        time,
      })
    }

    // re-evaluate stop conditions and schedule next
    const afterLeads = leadsRef.current
    const afterProcessed = afterLeads.filter((l) => l.status !== "Pending").length
    const afterTarget = Math.min(limitRef.current, afterLeads.length)
    const hasPending = afterLeads.some((l) => l.status === "Pending")
    if (!isSendingRef.current) {
      clearTimer()
      return
    }
    if (afterProcessed >= afterTarget) {
      setIsSending(false)
      clearTimer()
      toast({ title: "Queue complete", description: `Processed ${afterProcessed} leads.` })
      return
    }
    if (!hasPending) {
      setIsSending(false)
      clearTimer()
      toast({ title: "No more pending leads", description: "All leads have been processed." })
      return
    }
    scheduleNext()
  }

  // Start/pause button handler
  const toggleSending = () => {
    if (isSending) {
      setIsSending(false)
      clearTimer()
      return
    }
    const target = Math.min(dailyLimit, leads.length)
    const hasPending = leads.some((l) => l.status === "Pending")

    if (dailyLimit <= 0) {
      toast({
        title: "Set a daily limit",
        description: "Please set Daily Sending Limit to a value greater than 0.",
        variant: "destructive",
      })
      const el = document.getElementById("daily-limit") as HTMLInputElement | null
      el?.focus()
      el?.select?.()
      return
    }

    if (target === 0 || !hasPending) {
      toast({
        title: "Upload leads to start",
        description: "No pending leads found. Please upload a CSV to begin.",
      })
      setActiveSection("leads" as any)
      setTimeout(() => {
        fileInputRef.current?.click()
      }, 250)
      return
    }

    setIsSending(true)
    tick()
  }

  // Cleanup on unmount
  React.useEffect(() => {
    return () => clearTimer()
  }, [])

  React.useEffect(() => {
    if (isSending && leads.length === 0) {
      setIsSending(false)
      clearTimer()
    }
  }, [isSending, leads.length])

  // -------------------------
  // Real-time Email Preview helpers
  // -------------------------
  function deriveCompanyFromEmail(email: string | undefined) {
    if (!email || !email.includes("@")) return "Acme"
    const domain = email.split("@")[1] || ""
    const parts = domain.split(".").filter(Boolean)
    if (parts.length === 0) return "Acme"
    const sld = parts[0]
    return sld.slice(0, 1).toUpperCase() + sld.slice(1)
  }

  const sampleLead = leads[0]
  const sampleVars = {
    name: sampleLead?.name || "John Doe",
    email: sampleLead?.email || "john@example.com",
    company: deriveCompanyFromEmail(sampleLead?.email),
  }

  function replaceVariables(text: string, vars: { name: string; email: string; company: string }) {
    if (!text) return ""
    return text.replace(/\{(name|email|company)\}/gi, (_, key: string) => {
      const k = key.toLowerCase() as keyof typeof vars
      return vars[k] ?? ""
    })
  }

  function buildAiEmailFromPrompt(
    prompt: string,
    vars: { name: string; email: string; company: string },
    tone: string,
  ) {
    const cleaned = replaceVariables(prompt || "", vars).trim()
    const politeGreeting = tone === "professional" ? "Hello" : tone === "casual" ? "Hey" : "Hi"
    const signOff = tone === "professional" ? "Best regards," : tone === "casual" ? "Cheers," : "Kind regards,"

    // Subject heuristics
    let subject = `Hello ${vars.name}`
    if (/follow.?up/i.test(cleaned)) subject = `Quick follow-up for ${vars.name}`
    else if (/intro(duc|)\w*/i.test(cleaned)) subject = `Introduction — ${vars.name}`
    else if (/demo|trial|show/i.test(cleaned)) subject = `A quick idea for ${vars.company}`
    else if (/opportunit|meet|call|chat/i.test(cleaned)) subject = `Connecting with ${vars.name} at ${vars.company}`

    // Body composition using the prompt as guidance (not verbatim)
    const topic =
      cleaned.length > 0
        ? `regarding ${cleaned.slice(0, 160)}${cleaned.length > 160 ? "..." : ""}`
        : "about a quick idea"
    const styleLine =
      tone === "professional"
        ? `I'm reaching out ${topic}.`
        : tone === "casual"
          ? `Wanted to reach out ${topic}.`
          : `I'm reaching out ${topic} that I believe could be helpful.`
    const valueLine =
      tone === "professional"
        ? `We help teams like ${vars.company} improve workflows and results without adding overhead.`
        : tone === "casual"
          ? `We help folks at ${vars.company} save time and get better results.`
          : `We help teams at ${vars.company} streamline work and improve outcomes.`
    const askLine =
      tone === "professional"
        ? `Would you be open to a brief call this week to explore fit?`
        : tone === "casual"
          ? `Open to a quick chat this week?`
          : `Would you be open to a short call to see if this makes sense?`

    const body = `${politeGreeting} ${vars.name},

${styleLine}
${valueLine}

${askLine}

${signOff}
Your Name`

    return { subject, body }
  }

  const previewSubject = replaceVariables(subject, sampleVars)
  const previewBody = replaceVariables(templateBody, sampleVars)

  // AI actions
  const generateAiPreview = () => {
    const out = buildAiEmailFromPrompt(aiPrompt, sampleVars, aiTone)
    setAiPreview(out)
    setAiTab("preview")
  }

  const resetAiPreview = () => {
    setAiPreview(null)
    setAiTab("prompt")
  }

  const authenticateGmail = async () => {
    if (!gmailCredentials) {
      toast({
        title: "No credentials found",
        description: "Please upload Gmail API credentials first.",
        variant: "destructive",
      })
      return
    }

    setIsAuthenticating(true)
    try {
      const response = await fetch("/api/gmail/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentials: gmailCredentials }),
      })

      const data = await response.json()

      if (data.success && data.authUrl) {
        // Open OAuth2 URL in new window
        window.open(data.authUrl, "gmail-auth", "width=500,height=600")

        // Listen for the callback
        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return

          if (event.data.type === "GMAIL_AUTH_SUCCESS" && event.data.token) {
            // setGmailToken(event.data.token) // No longer setting token directly
            toast({
              title: "Gmail authenticated",
              description: "Successfully connected to Gmail API.",
            })
            window.removeEventListener("message", handleMessage)
          }
        }

        window.addEventListener("message", handleMessage)
      } else {
        throw new Error(data.error || "Failed to generate auth URL")
      }
    } catch (error) {
      toast({
        title: "Authentication failed",
        description: "Failed to authenticate with Gmail API.",
        variant: "destructive",
      })
    } finally {
      setIsAuthenticating(false)
    }
  }

  const removeGmailCredentials = async () => {
    try {
      // TODO: Call API to remove credentials from database
      // await fetch('/api/gmail/credentials', { method: 'DELETE' })

      setGmailCredentials(null)
      toast({
        title: "Gmail credentials removed",
        description: "Successfully removed Gmail API credentials.",
      })
    } catch (error) {
      toast({
        title: "Failed to remove credentials",
        description: "An error occurred while removing credentials.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeSection} onValueChange={(v) => setActiveSection(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-slate-800/50 border border-slate-700/50">
          <TabsTrigger
            value="dashboard"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-purple-600/20"
          >
            Dashboard
          </TabsTrigger>
          <TabsTrigger
            value="leads"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-purple-600/20"
          >
            Lead Management
          </TabsTrigger>
          <TabsTrigger
            value="email"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-purple-600/20"
          >
            Email Sending
          </TabsTrigger>
          <TabsTrigger
            value="ai"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-purple-600/20"
          >
            AI Personalization
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-purple-600/20"
          >
            Settings
          </TabsTrigger>
        </TabsList>

        {/* DASHBOARD */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white">Welcome</h2>
              <p className="text-slate-400">Here's what's happening with your email campaigns today.</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">{stat.title}</CardTitle>
                  <stat.icon className="h-4 w-4 text-slate-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Processing Progress</CardTitle>
                <CardDescription className="text-slate-400">Current batch processing status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Leads Processed</span>
                    <span className="text-white">
                      {processedCount} / {totalTarget}
                    </span>
                  </div>
                  <Progress value={progressPct} className="h-2" />
                </div>
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Estimated completion: {formatETA(etaSeconds)}</span>
                  <span>{progressPct.toFixed(0)}% complete</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
                <CardDescription className="text-slate-400">Latest email sending logs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {logs.slice(0, 3).map((log, index) => (
                    <div key={index} className="flex items-center gap-3">
                      {log.type === "success" ? (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-white">{log.message}</p>
                        <p className="text-xs text-slate-500">{log.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* LEADS */}
        <TabsContent value="leads" className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white">Lead Management</h2>
              <p className="text-slate-400">Upload and manage your email leads</p>
            </div>
            <Button variant="destructive" size="sm" onClick={handleClearLeads}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Leads
            </Button>
          </div>

          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Upload CSV File</CardTitle>
              <CardDescription className="text-slate-400">
                Upload a CSV file with columns: name, email, company (optional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={onFileSelected}
                aria-hidden="true"
              />
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <p className="text-white mb-2">Drop your CSV file here, or click to browse</p>
                <p className="text-sm text-slate-400">Only CSV files are accepted (max 10MB)</p>
                <Button
                  onClick={onChooseFile}
                  className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  Choose File
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Uploaded Leads</CardTitle>
              <CardDescription className="text-slate-400">
                {filteredLeads.length} of {leads.length} showing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-400">Name</th>
                      <th className="text-left py-3 px-4 text-slate-400">Email</th>
                      <th className="text-left py-3 px-4 text-slate-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead, index) => (
                      <tr key={index} className="border-b border-slate-700/50">
                        <td className="py-3 px-4 text-white">{lead.name}</td>
                        <td className="py-3 px-4 text-slate-300">{lead.email}</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              lead.status === "Sent"
                                ? "default"
                                : lead.status === "Pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                            className={
                              lead.status === "Sent"
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : lead.status === "Pending"
                                  ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                  : "bg-red-500/20 text-red-400 border-red-500/30"
                            }
                          >
                            {lead.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {!filteredLeads.length && (
                      <tr>
                        <td colSpan={3} className="py-6 px-4 text-center text-slate-400">
                          No leads match your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EMAIL */}
        <TabsContent value="email" className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-white">Email Sending</h2>
            <p className="text-slate-400">Configure and monitor your email campaigns</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Sending Configuration</CardTitle>
                <CardDescription className="text-slate-400">Set your email sending parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="daily-limit" className="text-slate-300">
                    Daily Sending Limit
                  </Label>
                  <Input
                    id="daily-limit"
                    type="number"
                    min={0}
                    step={1}
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(Math.max(0, Number(e.target.value) || 0))}
                    className="select-text bg-slate-700/50 border-slate-600 text-white w-40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delay-seconds" className="text-slate-300">
                    Delay Between Emails (seconds)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="delay-seconds"
                      type="number"
                      min={1}
                      step={1}
                      value={delaySeconds}
                      onChange={(e) => setDelaySeconds(Math.max(1, Number(e.target.value) || 1))}
                      className="select-text bg-slate-700/50 border-slate-600 text-white w-32"
                    />
                    <span className="text-slate-400 text-sm">seconds</span>
                  </div>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  onClick={toggleSending}
                >
                  {isSending ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause Sending
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Sending
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Sending Progress</CardTitle>
                <CardDescription className="text-slate-400">Real-time sending status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white">Progress</span>
                    <span className="text-white">
                      {processedCount} / {totalTarget}
                    </span>
                  </div>
                  <Progress value={progressPct} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-green-400">{sentCount}</p>
                    <p className="text-xs text-white">Sent</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-red-400">{failedCount}</p>
                    <p className="text-xs text-white">Failed</p>
                  </div>
                </div>
                <div className="text-xs text-slate-400 text-center">
                  Next email every {delaySeconds}s • ETA: {formatETA(etaSeconds)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Real-time Logs</CardTitle>
                <CardDescription className="text-slate-400">Monitor email sending activity</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  Download Sent
                </Button>
                <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  Download Errors
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 rounded bg-slate-700/30">
                    {log.type === "success" ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm text-white">{log.message}</p>
                    </div>
                    <span className="text-xs text-slate-400">{log.time}</span>
                  </div>
                ))}
                {!logs.length && <div className="text-sm text-slate-400 p-2">No logs to display.</div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI */}
        <TabsContent value="ai" className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-white">AI Personalization</h2>
            <p className="text-slate-400">Create personalized email templates with AI or custom templates</p>
          </div>

          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Template Mode</CardTitle>
              <CardDescription className="text-slate-400">
                Choose between AI-generated or custom templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch id="ai-mode" checked={isAIMode} onCheckedChange={setIsAIMode} />
                <Label htmlFor="ai-mode" className="text-slate-300">
                  {isAIMode ? "AI Mode" : "Template Mode"}
                </Label>
                {isAIMode ? (
                  <Brain className="h-4 w-4 text-blue-400" />
                ) : (
                  <FileText className="h-4 w-4 text-purple-400" />
                )}
              </div>
            </CardContent>
          </Card>

          {isAIMode ? (
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-400" />
                  AI Personalization
                </CardTitle>
                <CardDescription className="text-slate-400">Guide the AI and preview generated content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs value={aiTab} onValueChange={(v) => setAiTab(v as "prompt" | "preview")} className="w-full">
                  <TabsList className="bg-slate-800/60 border border-slate-700/60">
                    <TabsTrigger value="prompt">Prompt</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                  <TabsContent value="prompt" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ai-prompt" className="text-slate-300">
                        AI Prompt Template
                      </Label>
                      <Textarea
                        id="ai-prompt"
                        ref={aiPromptRef}
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Write a personalized email to {name} from {company} about our new product..."
                        className="select-text text-white min-h-[100px] border-slate-600 bg-slate-700/50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-300">Available Variables</Label>
                        <div className="flex gap-2 flex-wrap">
                          {["{name}", "{email}", "{company}"].map((tok) => (
                            <Badge
                              key={tok}
                              variant="outline"
                              role="button"
                              tabIndex={0}
                              onClick={() => insertVariable(tok)}
                              onKeyDown={(e) => onVariableKeyDown(e, tok)}
                              className="text-slate-300 border-slate-600 cursor-pointer hover:bg-slate-600/40 select-none"
                            >
                              {tok}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">AI Tone</Label>
                        <Select value={aiTone} onValueChange={setAiTone}>
                          <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="creative">Creative</SelectItem>
                            <SelectItem value="casual">Casual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={generateAiPreview}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      >
                        <Wand2 className="h-4 w-4 mr-2" />
                        Generate Preview
                      </Button>
                      {aiPreview && (
                        <Button
                          variant="outline"
                          onClick={resetAiPreview}
                          className="border-slate-600 text-slate-300 bg-transparent"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reset
                        </Button>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="preview">
                    {aiPreview ? (
                      <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                        <div className="space-y-2 mb-4">
                          <p className="text-sm text-slate-300">
                            Subject: <span className="text-white">{aiPreview.subject}</span>
                          </p>
                          <hr className="border-slate-600" />
                        </div>
                        <div className="text-white whitespace-pre-wrap">{aiPreview.body}</div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-400">
                        No preview yet. Use the Prompt tab and click “Generate Preview”.
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-400" />
                  Custom Template Editor
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Create your own email template with placeholders
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-slate-300">
                    Email Subject
                  </Label>
                  <Input
                    id="subject"
                    ref={subjectRef}
                    onFocus={() => setLastFocused("subject")}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Hello {name}, special offer for {company}"
                    className="select-text bg-slate-700/50 border-slate-600 text-white"
                  />
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-xs text-slate-400">Available Variables:</span>
                    {["{name}", "{email}", "{company}"].map((tok) => (
                      <Badge
                        key={tok}
                        variant="outline"
                        role="button"
                        tabIndex={0}
                        onClick={() => insertVariable(tok)}
                        onKeyDown={(e) => onVariableKeyDown(e, tok)}
                        className="text-slate-300 border-slate-600 cursor-pointer hover:bg-slate-600/40 select-none"
                      >
                        {tok}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template" className="text-slate-300">
                    Email Template
                  </Label>
                  <Textarea
                    id="template"
                    ref={bodyRef}
                    onFocus={() => setLastFocused("body")}
                    value={templateBody}
                    onChange={(e) => setTemplateBody(e.target.value)}
                    placeholder={`Hi {name},

I hope this email finds you well. I wanted to reach out to you at {company} to discuss...

Best regards,
Your Name`}
                    className="select-text bg-slate-700/50 border-slate-600 text-white min-h-[200px]"
                  />
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-xs text-slate-400">Available Variables:</span>
                    {["{name}", "{email}", "{company}"].map((tok) => (
                      <Badge
                        key={tok}
                        variant="outline"
                        role="button"
                        tabIndex={0}
                        onClick={() => insertVariable(tok)}
                        onKeyDown={(e) => onVariableKeyDown(e, tok)}
                        className="text-slate-300 border-slate-600 cursor-pointer hover:bg-slate-600/40 select-none"
                      >
                        {tok}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!isAIMode && (
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Email Preview</CardTitle>
                <CardDescription className="text-slate-400">
                  Preview updates in real time from Custom Template
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-slate-300">
                      Subject: <span className="text-white">{previewSubject || "(No subject)"}</span>
                    </p>
                    <hr className="border-slate-600" />
                  </div>
                  <div className="text-white whitespace-pre-wrap">{previewBody || "(No content)"}</div>
                  {!leads.length && (
                    <p className="text-xs text-slate-500 mt-3">
                      Tip: Upload a CSV to preview with actual names and emails. Otherwise, example values are used.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="settings" className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-white">Settings</h2>
            <p className="text-slate-400">Configure your application settings and integrations</p>
          </div>

          {/* Gmail */}
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Mail className="h-5 w-5 text-red-400" />
                Gmail API Integration
              </CardTitle>
              <CardDescription className="text-slate-400">Upload Gmail API credentials.json file</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      gmailCredentials ? "bg-green-500" : "bg-slate-600"
                    }`}
                  >
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Gmail API Status</p>
                    <p className="text-sm text-slate-400">
                      {gmailCredentials ? "✓ Credentials loaded" : "⚠ No credentials uploaded"}
                    </p>
                  </div>
                </div>
                {gmailCredentials && (
                  <Button
                    onClick={removeGmailCredentials}
                    variant="outline"
                    size="sm"
                    className="border-red-500/50 text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:border-red-500"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Gmail API Credentials</Label>
                  <p className="text-sm text-slate-500">Upload the credentials.json file from Google Cloud Console</p>
                </div>

                <div className="flex items-center gap-4">
                  <Button
                    onClick={onChooseGmailJson}
                    variant="outline"
                    className="border-slate-600 text-slate-300 bg-slate-700/50 hover:bg-slate-600/50"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {gmailCredentials ? "Replace Credentials File" : "Upload Credentials File"}
                  </Button>

                  {gmailCredentials && (
                    <div className="flex items-center gap-2 text-sm text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      <span>Credentials Loaded</span>
                    </div>
                  )}
                </div>

                {gmailCredentials && (
                  <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-slate-300">Loaded Credentials Preview</p>
                      <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 text-xs">
                      <div className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
                        <span className="text-slate-400">Client ID:</span>
                        <span className="text-slate-300 font-mono">
                          {gmailCredentials.client_id?.substring(0, 12)}...{gmailCredentials.client_id?.slice(-8)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
                        <span className="text-slate-400">Project ID:</span>
                        <span className="text-slate-300 font-mono">
                          {gmailCredentials.project_id || "Not specified"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
                        <span className="text-slate-400">Client Secret:</span>
                        <span className="text-slate-300 font-mono">
                          {gmailCredentials.client_secret ? "••••••••••••" : "Not available"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {gmailCredentials && (
                  <Button
                    onClick={authenticateGmail}
                    disabled={isAuthenticating}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isAuthenticating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Authenticate with Gmail
                      </>
                    )}
                  </Button>
                )}

                <input
                  ref={gmailJsonInputRef}
                  type="file"
                  accept=".json"
                  onChange={onGmailJsonSelected}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          {/* AI API Key */}
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-400" />
                AI API Key
              </CardTitle>
              <CardDescription className="text-slate-400">
                Save your AI provider API key for personalization features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ai-key" className="text-slate-300">
                    API Key
                  </Label>
                  <Input
                    id="ai-key"
                    type="password"
                    value={aiKeyInput}
                    onChange={(e) => setAiKeyInput(e.target.value)}
                    placeholder="sk-********************************"
                    className="select-text border-slate-600 bg-slate-700/50 text-white"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleSaveAiKey}
                    className="w-full md:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    Save API Key
                  </Button>
                </div>
              </div>
              <p className="text-xs text-slate-500">Status: {settings.aiApiKey ? "Saved locally" : "Not set"}</p>
            </CardContent>
          </Card>

          {/* General Settings */}
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 font-bold">
                <SettingsIcon className="h-5 w-5 text-white" />
                General Settings
              </CardTitle>
              <CardDescription className="text-slate-400">Configure general application preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-slate-300">Email Notifications</Label>
                  <p className="text-sm text-slate-500">Receive notifications about campaign status</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(v) => setSetting("emailNotifications", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-slate-300">Auto-save Templates</Label>
                  <p className="text-sm text-slate-500">Automatically save template changes</p>
                </div>
                <Switch
                  checked={settings.autoSaveTemplates}
                  onCheckedChange={(v) => setSetting("autoSaveTemplates", v)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-white" />
                Legal & Privacy
              </CardTitle>
              <CardDescription className="text-slate-400">
                Review and re-accept Terms & Conditions or Privacy Policy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Button
                  onClick={reopenTerms}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Terms & Conditions
                </Button>
                <Button
                  variant="outline"
                  onClick={reopenPrivacy}
                  className="border-slate-600 text-slate-300 bg-transparent"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  View Privacy Policy
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Clicking these will reset your consent for that policy and require re-acceptance.
              </p>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Danger Zone</CardTitle>
              <CardDescription className="text-red-400">Irreversible and destructive actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-red-500/30 rounded-lg bg-red-500/5">
                <div>
                  <p className="text-white font-medium">Reset All Data</p>
                  <p className="text-sm text-slate-400">This will delete all leads, logs, and settings</p>
                </div>
                <Button variant="destructive" onClick={handleResetApp}>
                  Reset Application
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
