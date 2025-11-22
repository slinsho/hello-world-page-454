import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { format } from "date-fns";

interface Feedback {
  id: string;
  role: string;
  rating: number;
  activity: string;
  problem: string;
  suggestions: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  created_at: string;
}

const AdminFeedback = () => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFeedback(data || []);
    } catch (error) {
      console.error("Error fetching feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-blue-500";
      case "agent":
        return "bg-green-500";
      case "property_seeker":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const getActivityLabel = (activity: string) => {
    const labels: Record<string, string> = {
      posting_property: "Posting Property",
      searching_property: "Searching Property",
      contacting: "Contacting",
      managing_listings: "Managing Listings",
      uploading_media: "Uploading Media",
      other: "Other",
    };
    return labels[activity] || activity;
  };

  if (loading) {
    return <div className="p-6">Loading feedback...</div>;
  }

  return (
    <div className="py-6">
      <h2 className="text-2xl font-bold mb-4">User Feedback</h2>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Problem</TableHead>
              <TableHead>Suggestions</TableHead>
              <TableHead>Contact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feedback.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No feedback received yet
                </TableCell>
              </TableRow>
            ) : (
              feedback.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(item.created_at), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(item.role)}>
                      {item.role.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < item.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{getActivityLabel(item.activity)}</TableCell>
                  <TableCell className="max-w-xs truncate">{item.problem}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {item.suggestions || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      {item.email && <div>Email: {item.email}</div>}
                      {item.phone && <div>Phone: {item.phone}</div>}
                      {item.whatsapp && <div>WhatsApp: {item.whatsapp}</div>}
                      {!item.email && !item.phone && !item.whatsapp && "-"}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminFeedback;
