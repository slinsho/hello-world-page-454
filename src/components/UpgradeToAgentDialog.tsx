import { useNavigate } from "react-router-dom";
import { Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UpgradeToAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
}

export const UpgradeToAgentDialog = ({ open, onOpenChange, featureName }: UpgradeToAgentDialogProps) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="sr-only">Upgrade to Agent</DialogTitle>
        </DialogHeader>
        <div className="text-center py-4">
          <div className="h-20 w-20 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-6">
            <Building2 className="h-10 w-10 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Upgrade to Agent</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {featureName 
              ? `${featureName} is available for Agent accounts only. Upgrade to access this feature and enjoy unlimited property listings.`
              : "Upgrade to an Agent account to access all features including messaging, notifications, dashboard analytics, and unlimited property listings."
            }
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => {
                onOpenChange(false);
                navigate("/verification?upgrade=agent");
              }}
              className="w-full rounded-full gap-2"
            >
              Upgrade to Agent
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full rounded-full"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
