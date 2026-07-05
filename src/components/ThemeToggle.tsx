import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

interface ThemeToggleProps {
  size?: "sm" | "md";
}

const ThemeToggle = ({ size = "md" }: ThemeToggleProps) => {
  const { theme, toggle } = useTheme();
  const dim = size === "sm" ? "h-8 w-8" : "h-9 w-9";

  return (
    <Button
      variant="ghost"
      size="icon"
      className={dim}
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={theme === "dark" ? "Light theme" : "Dark theme"}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
};

export default ThemeToggle;
