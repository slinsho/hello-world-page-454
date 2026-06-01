import { Loader2 } from "lucide-react";
import lpropLogo from "@/assets/lprop-logo.png";

const SearchLoadingOverlay = ({ query }: { query?: string }) => {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/70 backdrop-blur-md"
      role="status"
      aria-live="polite"
    >
      <img
        src={lpropLogo}
        alt="L-Prop"
        className="h-20 w-20 rounded-2xl shadow-2xl mb-6 animate-pulse"
      />
      <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
      <p className="text-sm text-foreground font-medium">
        {query ? `Searching "${query}"...` : "Loading..."}
      </p>
    </div>
  );
};

export default SearchLoadingOverlay;
