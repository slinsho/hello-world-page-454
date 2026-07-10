import { memo } from "react";
import PropertyCard from "@/components/PropertyCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Home } from "lucide-react";
import {
  usePropertyList,
  type PropertyListFilters,
  type PropertySort,
} from "@/hooks/usePropertyList";

type Variant = "default" | "featured";

interface PropertyListProps {
  filters?: PropertyListFilters;
  sort?: PropertySort;
  pageSize?: number;
  scope?: string;
  variant?: Variant;
  /** Number of cards flagged as image priority (LCP). */
  priorityCount?: number;
  /** Grid class override. Defaults to a responsive 1→4 grid. */
  gridClassName?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Called with the total count once known (for parent-level headers). */
  onTotalChange?: (n: number | undefined) => void;
  /** Render extra content after the grid (e.g. inline sections). */
  footer?: React.ReactNode;
  /** Insert content (full-width) after the Nth card in the grid flow. */
  insertAfter?: number;
  insertContent?: React.ReactNode;
}

const DEFAULT_GRID =
  "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6";

function PropertyListImpl({
  filters,
  sort = "random",
  pageSize = 15,
  scope,
  variant = "featured",
  priorityCount = 2,
  gridClassName = DEFAULT_GRID,
  emptyTitle = "No properties yet",
  emptyDescription = "Check back soon or adjust your filters.",
  footer,
  insertAfter,
  insertContent,
}: PropertyListProps) {
  const {
    items,
    isLoading,
    isError,
    hasMore,
    isFetchingNext,
    loadMore,
    retry,
    total,
  } = usePropertyList({ filters, sort, pageSize, scope });

  if (isLoading) {
    return (
      <div className={gridClassName}>
        {Array.from({ length: Math.min(pageSize, 8) }).map((_, i) => (
          <Skeleton key={i} className="h-[340px] w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (isError && items.length === 0) {
    return (
      <ErrorState onRetry={retry} />
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
          <Home className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold mb-1">{emptyTitle}</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={gridClassName}>
        {items.map((property, idx) => (
          <>
            <PropertyCard
              key={property.id}
              property={property}
              priority={idx < priorityCount}
              variant={variant}
            />
            {insertAfter != null && insertContent && idx + 1 === insertAfter && (
              <div key={`insert-${idx}`} className="col-span-full">
                {insertContent}
              </div>
            )}
          </>
        ))}
      </div>

      {isError && (
        <ErrorState inline onRetry={retry} />
      )}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            onClick={loadMore}
            disabled={isFetchingNext}
            variant="outline"
            size="lg"
            className="min-w-[180px]"
          >
            {isFetchingNext ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading…
              </>
            ) : (
              <>Load more{typeof total === "number" ? ` (${Math.max(total - items.length, 0)} left)` : ""}</>
            )}
          </Button>
        </div>
      )}

      {footer}
    </div>
  );
}

function ErrorState({ onRetry, inline }: { onRetry: () => void; inline?: boolean }) {
  return (
    <div className={inline ? "rounded-xl border border-border bg-card p-4 flex items-center gap-3" : "text-center py-12"}>
      <AlertCircle className={inline ? "h-5 w-5 text-destructive shrink-0" : "h-8 w-8 text-destructive mx-auto mb-2"} />
      <div className={inline ? "flex-1 text-sm" : ""}>
        <p className={inline ? "font-medium" : "font-medium mb-1"}>Couldn't load properties</p>
        <p className="text-sm text-muted-foreground">
          Check your connection and try again.
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={onRetry} className={inline ? "" : "mt-3"}>
        Retry
      </Button>
    </div>
  );
}

const PropertyList = memo(PropertyListImpl);
export default PropertyList;
