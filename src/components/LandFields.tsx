import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Ruler, MapPin } from "lucide-react";
import {
  LAND_USE_OPTIONS,
  LAND_SIZE_UNITS,
  TITLE_DEED_STATUSES,
  TOPOGRAPHY_OPTIONS,
  UTILITIES_OPTIONS,
} from "@/lib/constants";

export interface LandFieldsState {
  land_size: string;
  land_size_unit: string;
  land_use: string;
  road_access: boolean | null;
  title_deed_status: string;
  utilities_nearby: string[];
  zoning: string;
  topography: string;
  boundary_marked: boolean | null;
  nearest_landmark: string;
}

export const emptyLandFields = (): LandFieldsState => ({
  land_size: "",
  land_size_unit: "lots",
  land_use: "",
  road_access: null,
  title_deed_status: "",
  utilities_nearby: [],
  zoning: "",
  topography: "",
  boundary_marked: null,
  nearest_landmark: "",
});

interface Props {
  value: LandFieldsState;
  onChange: (next: LandFieldsState) => void;
  errors?: Partial<Record<keyof LandFieldsState, string>>;
}

const LandFields = ({ value, onChange, errors }: Props) => {
  const errClass = (k: keyof LandFieldsState) =>
    errors?.[k] ? "border-destructive focus-visible:ring-destructive" : "";
  const Err = ({ k }: { k: keyof LandFieldsState }) =>
    errors?.[k] ? <p className="text-xs text-destructive mt-1">{errors[k]}</p> : null;
  const set = <K extends keyof LandFieldsState>(k: K, v: LandFieldsState[K]) =>
    onChange({ ...value, [k]: v });

  const toggleUtility = (u: string) => {
    const next = value.utilities_nearby.includes(u)
      ? value.utilities_nearby.filter((x) => x !== u)
      : [...value.utilities_nearby, u];
    set("utilities_nearby", next);
  };

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Land Details
        </span>
        <div className="flex-1 h-px bg-border/60" />
      </div>

      {/* Land size */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Ruler className="h-4 w-4 text-muted-foreground" />
          Land Size <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={value.land_size}
            onChange={(e) => set("land_size", e.target.value)}
            placeholder="Size"
            className={`rounded-xl h-12 ${errClass("land_size")}`}
          />
          <Select value={value.land_size_unit} onValueChange={(v) => set("land_size_unit", v)}>
            <SelectTrigger className="rounded-xl h-12"><SelectValue placeholder="Unit" /></SelectTrigger>
            <SelectContent>
              {LAND_SIZE_UNITS.map((u) => (
                <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Err k="land_size" />
      </div>

      {/* Land use */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Land Use <span className="text-destructive">*</span></Label>
        <Select value={value.land_use} onValueChange={(v) => set("land_use", v)}>
          <SelectTrigger className={`rounded-xl h-12 ${errClass("land_use")}`}><SelectValue placeholder="Select use" /></SelectTrigger>
          <SelectContent>
            {LAND_USE_OPTIONS.map((u) => (
              <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Err k="land_use" />
      </div>

      {/* Title deed */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Title / Ownership Status <span className="text-destructive">*</span></Label>
        <Select value={value.title_deed_status} onValueChange={(v) => set("title_deed_status", v)}>
          <SelectTrigger className={`rounded-xl h-12 ${errClass("title_deed_status")}`}><SelectValue placeholder="Select status" /></SelectTrigger>
          <SelectContent>
            {TITLE_DEED_STATUSES.map((u) => (
              <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Err k="title_deed_status" />
      </div>

      {/* Topography */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Topography</Label>
        <Select value={value.topography} onValueChange={(v) => set("topography", v)}>
          <SelectTrigger className="rounded-xl h-12"><SelectValue placeholder="Select topography" /></SelectTrigger>
          <SelectContent>
            {TOPOGRAPHY_OPTIONS.map((u) => (
              <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Zoning */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Zoning <span className="text-muted-foreground font-normal">(Optional)</span></Label>
        <Input
          value={value.zoning}
          onChange={(e) => set("zoning", e.target.value)}
          maxLength={100}
          placeholder="e.g., R-2 Residential"
          className="rounded-xl h-12"
        />
      </div>

      {/* Nearest landmark */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          Nearest Landmark
        </Label>
        <Input
          value={value.nearest_landmark}
          onChange={(e) => set("nearest_landmark", e.target.value)}
          maxLength={200}
          placeholder="e.g., Near ELWA Junction"
          className="rounded-xl h-12"
        />
      </div>

      {/* Road access + boundary */}
      <div className="grid grid-cols-2 gap-3">
        <label className="flex items-start gap-2 rounded-xl border border-border p-3 cursor-pointer">
          <Checkbox
            checked={value.road_access === true}
            onCheckedChange={(c) => set("road_access", c === true ? true : false)}
          />
          <span className="text-sm">Road access</span>
        </label>
        <label className="flex items-start gap-2 rounded-xl border border-border p-3 cursor-pointer">
          <Checkbox
            checked={value.boundary_marked === true}
            onCheckedChange={(c) => set("boundary_marked", c === true ? true : false)}
          />
          <span className="text-sm">Boundary marked</span>
        </label>
      </div>

      {/* Utilities nearby */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Utilities Nearby</Label>
        <div className="grid grid-cols-2 gap-2">
          {UTILITIES_OPTIONS.map((u) => {
            const active = value.utilities_nearby.includes(u.value);
            return (
              <button
                key={u.value}
                type="button"
                onClick={() => toggleUtility(u.value)}
                className={`text-sm px-3 py-2 rounded-xl border transition-colors text-left ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground"
                }`}
              >
                {u.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LandFields;
