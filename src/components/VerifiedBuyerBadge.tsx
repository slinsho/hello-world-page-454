import { BadgeCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  size?: "sm" | "md";
  label?: string;
}

/**
 * VerifiedBuyerBadge - shown next to a buyer/tenant name who has completed
 * identity verification. Purely visual; caller decides when to render it.
 */
export function VerifiedBuyerBadge({ className, size = "sm", label = "Verified Buyer" }: Props) {
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-medium border border-primary/20",
            className
          )}
          aria-label={label}
        >
          <BadgeCheck className={iconSize} />
          <span className="hidden sm:inline">Verified</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>{label} — identity confirmed by L-Prop</TooltipContent>
    </Tooltip>
  );
}

export default VerifiedBuyerBadge;
