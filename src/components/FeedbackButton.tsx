import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";

const FeedbackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on feedback page itself or admin pages
  if (location.pathname === "/feedback" || location.pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <Button
      onClick={() => navigate("/feedback")}
      className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg z-50"
      size="icon"
      title="Tell Us Your Experience"
    >
      <MessageSquare className="h-6 w-6" />
    </Button>
  );
};

export default FeedbackButton;
