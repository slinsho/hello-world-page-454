import { Check } from "lucide-react";

interface Props {
  step: 1 | 2 | 3;
}

const LABELS = ["Room", "Details", "Review"];

export const BookingStepper = ({ step }: Props) => {
  return (
    <div className="flex items-center justify-center gap-1.5 px-4 pb-3">
      {LABELS.map((label, i) => {
        const idx = i + 1;
        const active = idx === step;
        const done = idx < step;
        return (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className={`flex items-center gap-1.5 h-7 pl-1.5 pr-2.5 rounded-full transition-all ${
                active
                  ? "bg-primary text-primary-foreground"
                  : done
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full grid place-items-center text-[10px] font-bold ${
                  active
                    ? "bg-primary-foreground text-primary"
                    : done
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground"
                }`}
              >
                {done ? <Check className="w-2.5 h-2.5" /> : idx}
              </span>
              <span className="text-[11px] font-semibold">{label}</span>
            </div>
            {idx < LABELS.length && (
              <div className={`w-3 h-[2px] rounded-full ${done ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};
