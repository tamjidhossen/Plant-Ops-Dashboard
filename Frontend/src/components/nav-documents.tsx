"use client"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { PageId } from "@/lib/types"

export function NavDocuments({
  items,
  activePage,
  onNavigate,
}: {
  items: {
    name: string
    id: PageId
    icon: React.ReactNode
  }[]
  activePage: PageId
  onNavigate: (page: PageId) => void
}) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Data & Reports</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              isActive={activePage === item.id}
              onClick={() => onNavigate(item.id)}
            >
              {item.icon}
              <span>{item.name}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
