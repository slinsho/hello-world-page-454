import { Loader2, X } from "lucide-react";
import lpropLogo from "@/assets/lprop-logo.png";

const SearchLoadingOverlay = ({ query, onCancel }: { query?: string; onCancel?: () => void }) => {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/70 backdrop-blur-md"
      role="status"
      aria-live="polite"
    >
      {onCancel && (
        <button
          onClick={onCancel}
          aria-label="Cancel search"
          className="absolute top-4 right-4 h-10 w-10 rounded-full bg-card/80 border border-border flex items-center justify-center hover:bg-card transition-colors"
        >
          <X className="h-5 w-5 text-foreground" />
        </button>
      )}
      <img
        src={lpropLogo}
        alt="L-Prop"
        className="h-20 w-20 rounded-2xl shadow-2xl mb-6 animate-pulse"
      />
      <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
      <p className="text-sm text-foreground font-medium">
        {query ? `Searching "${query}"...` : "Loading..."}
      </p>
      {onCancel && (
        <button
          onClick={onCancel}
          className="mt-4 text-xs text-muted-foreground hover:text-foreground underline"
        >
          Tap to cancel
        </button>
      )}
    </div>
  );
};

export default SearchLoadingOverlay;
