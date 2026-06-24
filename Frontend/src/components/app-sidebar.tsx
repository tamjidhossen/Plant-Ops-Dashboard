import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  BarChart3Icon,
  AlertTriangleIcon,
  Table2Icon,
  ShieldCheckIcon,
  FactoryIcon,
  UploadIcon,
} from "lucide-react"
import { NavMain } from "@/components/nav-main"
import { NavDocuments } from "@/components/nav-documents"
import type { PageId } from "@/lib/types"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activePage: PageId
  onNavigate: (page: PageId) => void
  hasData?: boolean
}

export function AppSidebar({
  activePage,
  onNavigate,
  hasData = true,
  ...props
}: AppSidebarProps) {
  const navMainItems = [
    { id: "overview" as PageId, title: "Overview", icon: <LayoutDashboardIcon /> },
    { id: "shift-analysis" as PageId, title: "Shift Analysis", icon: <BarChart3Icon /> },
    { id: "breakdown-analysis" as PageId, title: "Breakdown Streaks", icon: <AlertTriangleIcon /> },
  ]

  const navDocumentsItems = [
    { id: "upload-csv" as PageId, name: "Upload CSV", icon: <UploadIcon /> },
    { id: "data-explorer" as PageId, name: "Data Explorer", icon: <Table2Icon /> },
    { id: "data-quality" as PageId, name: "Data Quality", icon: <ShieldCheckIcon /> },
  ]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              disabled={!hasData}
            >
              <button
                onClick={() => onNavigate("overview")}
                className="flex items-center gap-2 w-full text-left"
                disabled={!hasData}
              >
                <FactoryIcon className="size-5 text-primary" />
                <span className="text-base font-semibold tracking-tight text-foreground">Plant Ops</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={navMainItems}
          activePage={activePage}
          onNavigate={onNavigate}
          disabled={!hasData}
        />
        <NavDocuments
          items={navDocumentsItems}
          activePage={activePage}
          onNavigate={onNavigate}
          disabledItems={hasData ? [] : ["data-explorer", "data-quality"]}
        />
      </SidebarContent>
    </Sidebar>
  )
}
