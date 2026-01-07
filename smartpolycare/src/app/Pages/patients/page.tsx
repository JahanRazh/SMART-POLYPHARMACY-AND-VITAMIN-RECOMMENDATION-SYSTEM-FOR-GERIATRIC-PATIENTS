"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/components/Contexts/AuthContext";
import { collection, addDoc, query, orderBy, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/app/lib/firebaseConfig";

type Review = {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  feedback: string;
  createdAt: any;
  helpful?: number;
};

const PatientsPage = () => {
  const { user, userProfile } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [bestReviews, setBestReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    rating: 5,
    feedback: "",
  });

  // Fetch reviews from Firestore
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const reviewsRef = collection(db, "patient_reviews");
        
        // Fetch all reviews ordered by createdAt (descending) - single orderBy to avoid index requirement
        const q = query(reviewsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        const reviewsData: Review[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          reviewsData.push({
            id: doc.id,
            ...data,
          } as Review);
        });

        // Sort by rating first, then by date
        const sortedReviews = reviewsData.sort((a, b) => {
          if (a.rating !== b.rating) {
            return b.rating - a.rating; // Higher rating first
          }
          // If same rating, sort by date (newer first)
          const aDate = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const bDate = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return bDate - aDate;
        });

        setReviews(sortedReviews);
        
        // Get best reviews (5 stars and top rated)
        const best = sortedReviews
          .filter((r) => r.rating === 5)
          .slice(0, 6)
          .sort((a, b) => {
            // Sort by helpful count if available, otherwise by date
            const aHelpful = a.helpful || 0;
            const bHelpful = b.helpful || 0;
            if (aHelpful !== bHelpful) return bHelpful - aHelpful;
            const aDate = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const bDate = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return bDate - aDate;
          });
        
        setBestReviews(best);
        setLoading(false);
      } catch (error: any) {
        console.error("Error fetching reviews:", error);
        // Check if it's an index error
        if (error?.code === 'failed-precondition') {
          setError("Database index required. Please check the console for index creation link.");
        } else {
          setError("Failed to load reviews. Please try again later.");
        }
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const handleRatingChange = (rating: number) => {
    setFormData({ ...formData, rating });
  };

  const handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, feedback: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!user) {
      setError("Please sign in to submit a review.");
      return;
    }

    if (!formData.feedback.trim()) {
      setError("Please write your feedback before submitting.");
      return;
    }

    if (formData.feedback.trim().length < 10) {
      setError("Feedback must be at least 10 characters long.");
      return;
    }

    setSubmitting(true);

    try {
      const userName = userProfile?.displayName || 
        `${userProfile?.firstName || ""} ${userProfile?.lastName || ""}`.trim() ||
        user.email?.split("@")[0] ||
        "Anonymous";

      const reviewData = {
        userId: user.uid,
        userName: userName,
        userPhoto: userProfile?.photoURL || user.photoURL || null,
        rating: formData.rating,
        feedback: formData.feedback.trim(),
        createdAt: Timestamp.now(),
        helpful: 0,
      };

      await addDoc(collection(db, "patient_reviews"), reviewData);

      setSuccessMessage("Thank you for your feedback! Your review has been submitted.");
      setFormData({ rating: 5, feedback: "" });

      // Refresh reviews
      const reviewsRef = collection(db, "patient_reviews");
      const q = query(reviewsRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      const reviewsData: Review[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reviewsData.push({
          id: doc.id,
          ...data,
        } as Review);
      });

      // Sort by rating first, then by date
      const sortedReviews = reviewsData.sort((a, b) => {
        if (a.rating !== b.rating) {
          return b.rating - a.rating; // Higher rating first
        }
        // If same rating, sort by date (newer first)
        const aDate = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const bDate = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return bDate - aDate;
      });

      setReviews(sortedReviews);
      
      const best = sortedReviews
        .filter((r) => r.rating === 5)
        .slice(0, 6)
        .sort((a, b) => {
          const aHelpful = a.helpful || 0;
          const bHelpful = b.helpful || 0;
          if (aHelpful !== bHelpful) return bHelpful - aHelpful;
          const aDate = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const bDate = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return bDate - aDate;
        });
      
      setBestReviews(best);
    } catch (error) {
      console.error("Error submitting review:", error);
      setError("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Recently";
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) return "Just now";
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
      
      return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return "Recently";
    }
  };

  const StarRating = ({ rating, interactive = false, onRatingChange }: { 
    rating: number; 
    interactive?: boolean;
    onRatingChange?: (rating: number) => void;
  }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? "button" : undefined}
            onClick={interactive && onRatingChange ? () => onRatingChange(star) : undefined}
            className={interactive ? "cursor-pointer transition-transform hover:scale-110" : "cursor-default"}
            disabled={!interactive}
          >
            <svg
              className={`w-5 h-5 ${
                star <= rating
                  ? "text-yellow-400 fill-current"
                  : "text-gray-300 fill-current"
              }`}
              viewBox="0 0 20 20"
            >
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  const ReviewCard = ({ review }: { review: Review }) => {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {review.userPhoto ? (
              <img
                src={review.userPhoto}
                alt={review.userName}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-indigo-600 font-semibold text-lg">
                  {review.userName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900">{review.userName}</p>
              <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
            </div>
          </div>
          <StarRating rating={review.rating} />
        </div>
        <p className="text-gray-700 leading-relaxed">{review.feedback}</p>
        {review.helpful !== undefined && review.helpful > 0 && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.834a1 1 0 001.364.97l5.108-2.188a3 3 0 001.797-3.118l-.569-5.124a1 1 0 00-1.175-.968l-5.33.96a1 1 0 00-.84.99z" />
            </svg>
            <span>{review.helpful} found this helpful</span>
          </div>
        )}
      </div>
    );
  };

  // Calculate average rating
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
    percentage: reviews.length > 0
      ? (reviews.filter((r) => r.rating === rating).length / reviews.length) * 100
      : 0,
  }));

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-wide text-indigo-500">
            Patient Feedback
          </p>
          <h1 className="text-4xl font-bold text-gray-900 mt-2">
            Share Your Experience
          </h1>
          <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
            Your feedback helps us improve our services and assist other patients in making informed decisions.
          </p>
        </div>

        {/* Overall Rating Summary */}
        {reviews.length > 0 && (
          <div className="mb-10 rounded-3xl border border-gray-200 bg-white p-8 shadow-lg">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <span className="text-5xl font-bold text-gray-900">
                    {averageRating.toFixed(1)}
                  </span>
                  <div className="flex flex-col">
                    <StarRating rating={Math.round(averageRating)} />
                    <span className="text-sm text-gray-500 mt-1">
                      Based on {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {ratingDistribution.map(({ rating, count, percentage }) => (
                  <div key={rating} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600 w-8">
                      {rating}★
                    </span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-12 text-right">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Submit Review Form */}
        <div className="mb-10 rounded-3xl border border-gray-200 bg-white p-8 shadow-lg">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Write a Review
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Share your experience with Smart Polycare
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
              {successMessage}
            </div>
          )}

          {!user ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
              <p className="text-amber-800">
                Please sign in to submit a review.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Your Rating
                </label>
                <StarRating
                  rating={formData.rating}
                  interactive={true}
                  onRatingChange={handleRatingChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Feedback *
                </label>
                <textarea
                  value={formData.feedback}
                  onChange={handleFeedbackChange}
                  placeholder="Share your experience, what you liked, or suggestions for improvement..."
                  rows={6}
                  required
                  minLength={10}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.feedback.length} characters (minimum 10)
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full md:w-auto rounded-2xl bg-indigo-600 px-8 py-3 text-white font-semibold shadow-lg transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          )}
        </div>

        {/* Best Reviews Section */}
        {bestReviews.length > 0 && (
          <div className="mb-10">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                ⭐ Top Rated Reviews
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Reviews from our most satisfied patients
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bestReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </div>
        )}

        {/* All Reviews Section */}
        <div>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                All Reviews
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {reviews.length} {reviews.length === 1 ? "review" : "reviews"} total
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-500">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No reviews yet
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Be the first to share your experience!
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientsPage;

