import { Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/cn";

interface LoadingSpinnerProps {
  className?: string;
  size?: number;
}

export function LoadingSpinner({ className, size = 24 }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Loader2 size={size} className="animate-spin text-primary" />
    </div>
  );
}
