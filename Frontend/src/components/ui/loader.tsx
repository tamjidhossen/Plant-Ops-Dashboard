import { cn } from "@/lib/utils"

interface LoaderProps {
  className?: string
  message?: string
  size?: "sm" | "md" | "lg"
}

export function Loader({ className, message = "Loading dashboard...", size = "md" }: LoaderProps) {
  const sizeClasses = {
    sm: "size-6 border-2",
    md: "size-10 border-4",
    lg: "size-14 border-[5px]",
  }

  return (
    <div className={cn("flex flex-col items-center justify-center p-8 min-h-[160px]", className)}>
      <div className="relative">
        {/* Outer Ring */}
        <div
          className={cn(
            "rounded-full border-muted/20 dark:border-neutral-800/40",
            sizeClasses[size]
          )}
        />
        {/* Spinning Arc */}
        <div
          className={cn(
            "absolute inset-0 rounded-full border-primary border-t-transparent animate-spin",
            sizeClasses[size]
          )}
        />
      </div>
      {message && (
        <span className="mt-4 text-xs font-medium text-muted-foreground tracking-wide animate-pulse">
          {message}
        </span>
      )}
    </div>
  )
}
