import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  GaugeIcon,
  ClockIcon,
  AlertTriangleIcon,
  LayersIcon,
  InfoIcon,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { AnalyticsSummary } from "@/lib/types"

interface KPICardsProps {
  summary: AnalyticsSummary
}

export function KPICards({ summary }: KPICardsProps) {
  const cards = [
    {
      title: "Operational Efficiency",
      value: `${summary.efficiency_score}%`,
      description: `${summary.productive_hours}h productive of ${summary.total_hours}h total`,
      icon: GaugeIcon,
      tooltipText: "Operational Efficiency = (Productive Hours / Total Hours) × 100. Productive Hours exclude Breakdown and Unknown Failure events.",
    },
    {
      title: "Total Shift Hours",
      value: `${summary.total_hours}h`,
      description: `${summary.total_records} records across ${summary.valid_records} valid entries`,
      icon: ClockIcon,
      tooltipText: "Total duration of all recorded shift records. Active duplicates and invalid records are excluded from this sum.",
    },
    {
      title: "Downtime Events",
      value: `${summary.breakdown_count}`,
      description: `${summary.downtime_hours}h total downtime (Breakdown + Unknown Failure)`,
      icon: AlertTriangleIcon,
      tooltipText: "Number of unplanned equipment breakdowns and failure events. The total downtime duration includes Breakdown and Unknown Failure reasons.",
    },
    {
      title: "Activity Categories",
      value: `${summary.unique_categories}`,
      description: "Unique activity reasons detected in the dataset",
      icon: LayersIcon,
      tooltipText: "The number of unique activity reasons detected in the uploaded CSV dataset.",
    },
  ]

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
        {cards.map((card) => (
          <Card key={card.title} className="@container/card flex flex-col justify-between">
            <CardHeader>
              <CardDescription className="flex items-center gap-1.5 pr-6">
                <card.icon className="size-3.5" />
                {card.title}
              </CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl mt-1">
                {card.value}
              </CardTitle>
              <CardAction>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground/50 hover:text-foreground cursor-pointer transition-colors p-0.5 rounded-md hover:bg-muted/80">
                      <InfoIcon className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="center" className="max-w-[200px] text-xs leading-normal">
                    {card.tooltipText}
                  </TooltipContent>
                </Tooltip>
              </CardAction>
            </CardHeader>
            <CardFooter className="text-sm text-muted-foreground min-h-[5.5rem] flex items-center">
              {card.description}
            </CardFooter>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  )
}
