"use client"

import { usePathname } from "next/navigation"
import { type LucideIcon } from "lucide-react"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
  }[]
}) {
  const pathname = usePathname() || "/"

  // Helper to get base path without query params
  const getBasePath = (url: string) => {
    try {
      return new URL(url, window.location.origin).pathname;
    } catch {
      return url;
    }
  }

  return (
    <SidebarMenu>
      {items.map((item) => {
        const basePath = getBasePath(item.url)
        const isActive = pathname === basePath || (basePath !== "/" && pathname.startsWith(basePath))
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild isActive={isActive}>
              <a href={item.url}>
                <item.icon />
                <span>{item.title}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}
