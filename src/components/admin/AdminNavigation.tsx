import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight,
  LayoutDashboard, BarChart3, Shield, FileCheck, Users, Home, Newspaper,
  Star, Zap, Flag, Megaphone, MessageSquare, FileText, Scale, Info, Mail
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface NavItem {
  value: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

interface AdminNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  pendingCounts?: {
    verifications?: number;
    reports?: number;
    promotions?: number;
  };
}

export function AdminNavigation({ activeTab, onTabChange, pendingCounts }: AdminNavigationProps) {
  const groups: NavGroup[] = [
    {
      label: "Overview",
      items: [
        { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { value: "analytics", label: "Analytics", icon: BarChart3 },
      ],
    },
    {
      label: "Content",
      items: [
        { value: "properties", label: "Properties", icon: Home },
        { value: "blog", label: "Blog", icon: Newspaper },
        { value: "moderation", label: "Moderation", icon: Shield },
      ],
    },
    {
      label: "Users & Trust",
      items: [
        { value: "users", label: "Users", icon: Users },
        { value: "verifications", label: "Verifications", icon: FileCheck, badge: pendingCounts?.verifications },
        { value: "verified-docs", label: "Verified Docs", icon: FileText },
      ],
    },
    {
      label: "Business",
      items: [
        { value: "promotions", label: "Promotions", icon: Star, badge: pendingCounts?.promotions },
        { value: "active-promos", label: "Active Promos", icon: Zap },
        { value: "marketing", label: "Marketing", icon: Megaphone },
        { value: "rates", label: "Rates", icon: BarChart3 },
      ],
    },
    {
      label: "Support",
      items: [
        { value: "reports", label: "Reports", icon: Flag, badge: pendingCounts?.reports },
        { value: "feedback", label: "Feedback", icon: MessageSquare },
        { value: "contacts", label: "Contacts", icon: Mail },
      ],
    },
    {
      label: "Settings",
      items: [
        { value: "legal", label: "Legal Pages", icon: Scale },
        { value: "about", label: "About Page", icon: Info },
      ],
    },
  ];

  // Track expanded groups — expand the one containing active tab by default
  const getActiveGroup = () => {
    for (const group of groups) {
      if (group.items.some((i) => i.value === activeTab)) return group.label;
    }
    return "Overview";
  };

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set([getActiveGroup()]));

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  return (
    <ScrollArea className="max-h-[60vh] md:max-h-none">
      <nav className="space-y-1">
        {groups.map((group) => {
          const isExpanded = expandedGroups.has(group.label);
          const hasActiveBadge = group.items.some((i) => i.badge && i.badge > 0);

          return (
            <div key={group.label}>
              <button
                onClick={() => toggleGroup(group.label)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="flex items-center gap-2">
                  {group.label}
                  {!isExpanded && hasActiveBadge && (
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                  )}
                </span>
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>

              {isExpanded && (
                <div className="space-y-0.5 pb-2">
                  {group.items.map((item) => {
                    const isActive = activeTab === item.value;
                    return (
                      <button
                        key={item.value}
                        onClick={() => onTabChange(item.value)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                          isActive
                            ? "bg-primary/15 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge && item.badge > 0 ? (
                          <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-[10px] font-bold">
                            {item.badge > 99 ? "99+" : item.badge}
                          </Badge>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </ScrollArea>
  );
}
