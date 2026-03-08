import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Loader2, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
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
  const [showForm, setShowForm] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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

      if (reviewsWithProfiles.length > 0) {
        const avg = reviewsWithProfiles.reduce((sum, r) => sum + r.rating, 0) / reviewsWithProfiles.length;
        setAverageRating(avg);
      }

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
      toast({ title: "Login Required", description: "Please login to leave a review", variant: "destructive" });
      return;
    }
    if (newRating === 0) {
      toast({ title: "Rating Required", description: "Please select a rating", variant: "destructive" });
      return;
    }
    if (user.id === userId) {
      toast({ title: "Cannot Review Self", description: "You cannot review yourself", variant: "destructive" });
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
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Review Submitted", description: "Thank you for your feedback!" });
      setNewRating(0);
      setNewComment("");
      setShowForm(false);
      fetchReviews();
    }
    setSubmitting(false);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 280;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const StarRating = ({ rating, size = "md", interactive = false, onRate }: any) => {
    const stars = [1, 2, 3, 4, 5];
    const sizeClass = size === "sm" ? "h-3 w-3" : size === "xs" ? "h-2.5 w-2.5" : "h-5 w-5";

    return (
      <div className="flex gap-0.5">
        {stars.map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${interactive ? "cursor-pointer" : ""} transition-colors ${
              star <= (interactive ? hoverRating || rating : rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30"
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold">Reviews</h3>
          {reviews.length > 0 && (
            <div className="flex items-center gap-1.5">
              <StarRating rating={Math.round(averageRating)} size="xs" />
              <span className="text-xs text-muted-foreground">
                {averageRating.toFixed(1)} ({reviews.length})
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {reviews.length > 2 && (
            <>
              <button onClick={() => scroll("left")} className="h-7 w-7 rounded-full bg-secondary/80 flex items-center justify-center hover:bg-secondary transition-colors">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => scroll("right")} className="h-7 w-7 rounded-full bg-secondary/80 flex items-center justify-center hover:bg-secondary transition-colors">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          {showAddReview && user && user.id !== userId && canReview && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(!showForm)}
              className="rounded-full h-7 text-[10px] px-3 ml-1 gap-1"
            >
              <MessageSquare className="h-3 w-3" />
              Review
            </Button>
          )}
        </div>
      </div>

      {/* Add Review Form (collapsible) */}
      {showForm && (
        <div className="space-y-3 p-3 bg-secondary/30 rounded-xl border border-border/50">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">Your Rating</p>
            <StarRating rating={newRating} interactive onRate={(star: number) => setNewRating(star)} />
          </div>
          <Textarea
            placeholder="Share your experience... (optional)"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={2}
            className="rounded-xl text-xs resize-none"
          />
          <div className="flex gap-2">
            <Button onClick={submitReview} disabled={submitting || newRating === 0} size="sm" className="rounded-full h-8 text-xs flex-1">
              {submitting && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              Submit
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="rounded-full h-8 text-xs">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Reviews Horizontal Slider */}
      {loading ? (
        <div className="text-center py-6 text-xs text-muted-foreground">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-6 text-xs text-muted-foreground">
          <Star className="h-6 w-6 mx-auto text-muted-foreground/20 mb-1" />
          No reviews yet
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-1 -mx-1 px-1"
        >
          {reviews.map((review) => (
            <div
              key={review.id}
              className="flex-shrink-0 w-[240px] sm:w-[260px] snap-start bg-card rounded-xl border border-border/50 p-3.5 space-y-2.5"
            >
              {/* Reviewer info */}
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={review.reviewer?.profile_photo_url || undefined} className="object-cover" />
                  <AvatarFallback className="text-[10px] bg-secondary">
                    {review.reviewer?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">{review.reviewer?.name || "Anonymous"}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(review.created_at), "MMM d, yyyy")}
                  </p>
                </div>
              </div>

              {/* Rating */}
              <StarRating rating={review.rating} size="xs" />

              {/* Comment */}
              {review.comment && (
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                  "{review.comment}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
