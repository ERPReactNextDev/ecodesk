"use client"

import * as React from "react"
import Image from "next/image"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"

export function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string
    plan: string
  }[]
}) {
  const [activeTeam] = React.useState(teams[0])

  if (!activeTeam) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton 
          className="w-full data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 transition-all duration-200"
        >
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Image
                src="/Ecodesk.png"
                alt="Ecodesk Logo"
                width={32}
                height={32}
                className="rounded-lg shadow-sm"
              />
              <div className="absolute inset-0 rounded-lg ring-2 ring-primary/20"></div>
            </div>
            <div className="flex flex-col">
              <span className="truncate font-semibold text-sm">{activeTeam.name}</span>
              <span className="truncate text-xs text-muted-foreground">{activeTeam.plan}</span>
            </div>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
