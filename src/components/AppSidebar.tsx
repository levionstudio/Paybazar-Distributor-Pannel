"use client"

import { useEffect, useState } from "react"
import { LayoutDashboard, UserPlus, Receipt } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar"

import { jwtDecode } from "jwt-decode"
import { title } from "process"

interface AppSidebarProps {
  role: "master" | "distributor"
}

interface TokenData {
  data: {
    master_distributor_id?: string
    master_distributor_unique_id?: string
    master_distributor_name?: string
    distributor_id?: string
    distributor_unique_id?: string
    distributor_name?: string
    admin_id: string
  }
  exp: number
}

export function AppSidebar({ role }: AppSidebarProps) {
  const { state } = useSidebar()
  const location = useLocation()
  const isCollapsed = state === "collapsed"
  const currentPath = location.pathname

  const [userName, setUserName] = useState<string>("")

  useEffect(() => {
    const token = localStorage.getItem("authToken")
    if (token) {
      try {
        const decoded: TokenData = jwtDecode(token)
        if (role === "master") {
          setUserName(decoded.data.master_distributor_name || "")
        } else if (role === "distributor") {
          setUserName(decoded.data.distributor_name || "Distributor User")
        }
      } catch (error) {
        console.error("Failed to decode token", error)
      }
    }
  }, [role])

  // Navigation Items
  const masterItems = [
    { title: "Dashboard", href: "/master", icon: LayoutDashboard },
    { title: "Create Distributor", href: "/master/create", icon: UserPlus },
    { title: "Request Funds", href: "/request-funds", icon: Receipt },
    { title:"Trasactions", href: "/transactions/md", icon: Receipt },
    {title: "Requested Funds", href: "/md/requestfund", icon: Receipt},
  ]

  const distributorItems = [
    { title: "Dashboard", href: "/distributor", icon: LayoutDashboard },
    { title: "Create Retailer", href: "/distributor/create", icon: UserPlus },
    { title: "Request Funds", href: "/request-funds/distributor", icon: Receipt },
    { title:"Trasactions", href: "/transactions/distributor", icon: Receipt },
    {title: "Requested Funds", href: "/distributor/requestedfund", icon: Receipt},
  ]

  const navItems = role === "master" ? masterItems : distributorItems

  // Active link styling — same glow & color tone as retailer sidebar
  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-all duration-200 ${
      isActive
        ? "border border-white text-white font-semibold shadow-[0_4px_12px_rgba(7,92,137,0.3)]"
        : "text-[hsl(var(--sidebar-foreground))]hover:border hover:border-white"
    }`

  return (
    <Sidebar className="border-r border-[hsl(var(--sidebar-border))]" collapsible="icon">
      <SidebarContent className="bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] transition-all duration-300">

        {/* Logo Section */}
        <SidebarGroup>
          <div className="flex h-16 items-center px-4 border-b border-[hsl(var(--sidebar-border))]">
            <div className="flex items-center gap-3">
              <img
                src={"/paybazaar-logo.png"}
                alt="PayBazaar"
                className="h-8 w-8 shrink-0 drop-shadow-md"
              />
              {!isCollapsed && (
                <span className="text-lg font-semibold text-white tracking-wide">
                  PayBazaar
                </span>
              )}
            </div>
          </div>
        </SidebarGroup>

        {/* Navigation Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase text-[0.8rem] font-medium text-[hsl(var(--paybazaar-light))]/70 tracking-wide px-4 mt-3">
            {role === "master" ? "Master Controls" : "Distributor Panel"}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <NavLink
                    to={item.href}
                    className={getNavClassName}
                    end={item.href === "/master" || item.href === "/distributor"}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Info Section */}
        {!isCollapsed && (
          <SidebarGroup className="mt-auto">
            <div className="border-t border-[hsl(var(--sidebar-border))] p-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-[hsl(var(--paybazaar-blue))] flex items-center justify-center shadow-[0_0_12px_hsl(var(--paybazaar-blue)/0.4)]">
                  <span className="text-sm font-medium text-white">
                    {role === "master" ? "MD" : "DR"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {userName || (role === "master" ? "Master Distributor" : "Distributor")}
                  </p>
                  <p className="text-xs text-[hsl(var(--paybazaar-light))]/60 truncate">
                    {role === "master" ? "Master Distributor" : "Distributor"}
                  </p>
                </div>
              </div>
            </div>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  )
}
