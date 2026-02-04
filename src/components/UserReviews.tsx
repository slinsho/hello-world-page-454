import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Review {
  id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  property_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer?: {
    name: string;
    profile_photo_url: string | null;
  };
}

interface UserReviewsProps {
  userId: string;
  userName: string;
  propertyId?: string;
  showAddReview?: boolean;
}

export function UserReviews({ userId, userName, propertyId, showAddReview = true }: UserReviewsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [averageRating, setAverageRating] = useState(0);
  const [canReview, setCanReview] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [userId]);

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("reviewed_user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Fetch reviewer profiles
      const reviewsWithProfiles = await Promise.all(
        data.map(async (review: any) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name, profile_photo_url")
            .eq("id", review.reviewer_id)
            .single();

          return { ...review, reviewer: profile };
        })
      );

      setReviews(reviewsWithProfiles);

      // Calculate average
      if (reviewsWithProfiles.length > 0) {
        const avg = reviewsWithProfiles.reduce((sum, r) => sum + r.rating, 0) / reviewsWithProfiles.length;
        setAverageRating(avg);
      }

      // Check if current user has already reviewed
      if (user) {
        const existingReview = reviewsWithProfiles.find(
          (r) => r.reviewer_id === user.id && (propertyId ? r.property_id === propertyId : true)
        );
        setCanReview(!existingReview);
      }
    }
    setLoading(false);
  };

  const submitReview = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to leave a review",
        variant: "destructive",
      });
      return;
    }

    if (newRating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    if (user.id === userId) {
      toast({
        title: "Cannot Review Self",
        description: "You cannot review yourself",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("reviews").insert({
      reviewer_id: user.id,
      reviewed_user_id: userId,
      property_id: propertyId || null,
      rating: newRating,
      comment: newComment.trim() || null,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });
      setNewRating(0);
      setNewComment("");
      fetchReviews();
    }
    setSubmitting(false);
  };

  const StarRating = ({ rating, size = "md", interactive = false, onRate }: any) => {
    const stars = [1, 2, 3, 4, 5];
    const sizeClass = size === "sm" ? "h-4 w-4" : "h-6 w-6";

    return (
      <div className="flex gap-1">
        {stars.map((star) => (
          <Star
            key={star}
            className={`${sizeClass} cursor-${interactive ? "pointer" : "default"} transition-colors ${
              star <= (interactive ? hoverRating || rating : rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            }`}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            onClick={() => interactive && onRate && onRate(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Reviews for {userName}</CardTitle>
          <div className="flex items-center gap-2">
            <StarRating rating={Math.round(averageRating)} size="sm" />
            <span className="text-sm text-muted-foreground">
              ({averageRating.toFixed(1)}) • {reviews.length} reviews
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Review Form */}
        {showAddReview && user && user.id !== userId && canReview && (
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <p className="font-medium">Leave a Review</p>
            <StarRating
              rating={newRating}
              interactive
              onRate={(star: number) => setNewRating(star)}
            />
            <Textarea
              placeholder="Share your experience... (optional)"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <Button
              onClick={submitReview}
              disabled={submitting || newRating === 0}
              className="gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Review
            </Button>
          </div>
        )}

        {/* Reviews List */}
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No reviews yet. Be the first to leave a review!
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="flex gap-3 pb-4 border-b last:border-0">
                <Avatar>
                  <AvatarImage src={review.reviewer?.profile_photo_url || undefined} />
                  <AvatarFallback>
                    {review.reviewer?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{review.reviewer?.name || "Anonymous"}</p>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(review.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                  {review.comment && (
                    <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
