"use client"
const year = new Date().getFullYear()
import { Users, Mail, Brain, Settings, Home, Zap } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAppState } from "@/lib/app-state"

const menuItems = [
  { title: "Dashboard", section: "dashboard" as const, icon: Home },
  { title: "Lead Management", section: "leads" as const, icon: Users },
  { title: "Email Sending", section: "email" as const, icon: Mail },
  { title: "AI Personalization", section: "ai" as const, icon: Brain },
  { title: "Settings", section: "settings" as const, icon: Settings },
]

export function AppSidebar() {
  const { activeSection, setActiveSection } = useAppState()

  return (
    <Sidebar className="border-r border-slate-700/50">
      <SidebarHeader className="border-b border-slate-700/50 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">TrinidiumLab</h1>
            <p className="text-sm text-slate-400 font-medium">Product by Trinidium</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = activeSection === item.section
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="w-full justify-start gap-3 rounded-lg px-3 py-2.5 text-slate-300 hover:bg-slate-800/50 hover:text-white data-[active=true]:bg-gradient-to-r data-[active=true]:from-blue-500/20 data-[active=true]:to-purple-600/20 data-[active=true]:text-white"
                    >
                      <button onClick={() => setActiveSection(item.section)}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-slate-700/50 p-4">
        <p className="text-xs text-slate-500">© {year} TrinidiumLab. Not for Redistribution</p>
      </SidebarFooter>
    </Sidebar>
  )
}
