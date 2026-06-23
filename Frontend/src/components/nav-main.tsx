import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { PageId } from "@/lib/types"

export function NavMain({
  items,
  activePage,
  onNavigate,
}: {
  items: {
    title: string
    id: PageId
    icon?: React.ReactNode
  }[]
  activePage: PageId
  onNavigate: (page: PageId) => void
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                isActive={activePage === item.id}
                onClick={() => onNavigate(item.id)}
              >
                {item.icon}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
