import { Review } from "@/types/music";
import { RatingStars } from "./RatingStars";
import { Link } from "react-router-dom";
import { Heart, MessageSquare, Pencil, Send, ThumbsDown, ThumbsUp, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useReviewStore } from "@/stores/reviewStore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const MAX_COMMENT_LENGTH = 300;
const MAX_REVIEW_COMMENTS = 5;
const MAX_REVIEW_LENGTH = 500;

export function ReviewCard({ review }: { review: Review }) {
  const detailLink = review.songId ? `/song/${review.songId}` : `/album/${review.albumId}`;
  const updateReview = useReviewStore((state) => state.updateReview);
  const deleteReview = useReviewStore((state) => state.deleteReview);
  const reactToReview = useReviewStore((state) => state.reactToReview);
  const addComment = useReviewStore((state) => state.addComment);
  const updateComment = useReviewStore((state) => state.updateComment);
  const deleteComment = useReviewStore((state) => state.deleteComment);
  const toggleCommentLike = useReviewStore((state) => state.toggleCommentLike);
  const { isAuthenticated, token, user } = useAuth();
  const comments = Array.isArray(review.comments) ? review.comments : [];
  const likesCount = typeof review.likesCount === "number" ? review.likesCount : 0;
  const dislikesCount = typeof review.dislikesCount === "number" ? review.dislikesCount : 0;
  const currentUserReaction =
    review.currentUserReaction === "like" || review.currentUserReaction === "dislike"
      ? review.currentUserReaction
      : null;
  const [isSubmittingReaction, setIsSubmittingReaction] = useState(false);
  const [commentLikeTargetId, setCommentLikeTargetId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [isSavingCommentEdit, setIsSavingCommentEdit] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editRating, setEditRating] = useState(review.rating);
  const [editText, setEditText] = useState(review.text);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeletingReview, setIsDeletingReview] = useState(false);
  const isOwner = user?.id === review.userId;
  const trimmedComment = commentText.trim();
  const trimmedReviewText = editText.trim();
  const canSubmitComment =
    isAuthenticated &&
    comments.length < MAX_REVIEW_COMMENTS &&
    trimmedComment.length > 0 &&
    trimmedComment.length <= MAX_COMMENT_LENGTH;
  const canSaveEdit =
    isOwner &&
    editRating > 0 &&
    trimmedReviewText.length > 0 &&
    trimmedReviewText.length <= MAX_REVIEW_LENGTH &&
    (editRating !== review.rating || trimmedReviewText !== review.text);

  useEffect(() => {
    if (isEditing) {
      return;
    }

    setEditRating(review.rating);
    setEditText(review.text);
  }, [isEditing, review.rating, review.text]);

  async function handleReaction(nextReaction: "like" | "dislike") {
    if (!isAuthenticated || !token) {
      toast.error("Sign in to react to reviews.");
      return;
    }

    try {
      setIsSubmittingReaction(true);
      await reactToReview(
        review.id,
        currentUserReaction === nextReaction ? null : nextReaction,
        token
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update review reaction.");
    } finally {
      setIsSubmittingReaction(false);
    }
  }

  async function handleCommentSubmit() {
    if (!canSubmitComment || !token) {
      return;
    }

    try {
      setIsSubmittingComment(true);
      await addComment(review.id, trimmedComment, token);
      setCommentText("");
      setIsCommentsOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add comment.");
    } finally {
      setIsSubmittingComment(false);
    }
  }

  async function handleCommentLike(commentId: string) {
    if (!isAuthenticated || !token) {
      toast.error("Sign in to like comments.");
      return;
    }

    try {
      setCommentLikeTargetId(commentId);
      await toggleCommentLike(review.id, commentId, token);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update comment like.");
    } finally {
      setCommentLikeTargetId(null);
    }
  }

  async function handleCommentEditSave() {
    if (!editingCommentId || !token) {
      return;
    }

    const trimmedEditedComment = editingCommentText.trim();

    if (!trimmedEditedComment || trimmedEditedComment.length > MAX_COMMENT_LENGTH) {
      return;
    }

    const existingComment = comments.find((comment) => comment.id === editingCommentId);

    if (!existingComment) {
      setEditingCommentId(null);
      setEditingCommentText("");
      return;
    }

    if (trimmedEditedComment === existingComment.text) {
      setEditingCommentId(null);
      setEditingCommentText("");
      return;
    }

    try {
      setIsSavingCommentEdit(true);
      await updateComment(review.id, editingCommentId, trimmedEditedComment, token);
      setEditingCommentId(null);
      setEditingCommentText("");
      toast.success("Reply updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update comment.");
    } finally {
      setIsSavingCommentEdit(false);
    }
  }

  async function handleCommentDelete(commentId: string) {
    if (!token) {
      return;
    }

    if (typeof window !== "undefined" && !window.confirm("Delete this reply? This cannot be undone.")) {
      return;
    }

    try {
      setDeletingCommentId(commentId);
      await deleteComment(review.id, commentId, token);

      if (editingCommentId === commentId) {
        setEditingCommentId(null);
        setEditingCommentText("");
      }

      toast.success("Reply deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete comment.");
    } finally {
      setDeletingCommentId(null);
    }
  }

  async function handleReviewSave() {
    if (!canSaveEdit || !token) {
      return;
    }

    try {
      setIsSavingEdit(true);
      await updateReview(review.id, {
        rating: editRating,
        text: trimmedReviewText,
      }, token);
      setIsEditing(false);
      toast.success("Review updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update review.");
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleReviewDelete() {
    if (!isOwner || !token) {
      return;
    }

    if (typeof window !== "undefined" && !window.confirm("Delete this review? This cannot be undone.")) {
      return;
    }

    try {
      setIsDeletingReview(true);
      await deleteReview(review.id, token);
      toast.success("Review deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete review.");
    } finally {
      setIsDeletingReview(false);
    }
  }

  return (
    <div className="flex gap-4 rounded-xl bg-card p-4 border border-border card-hover">
      <Link to={detailLink} className="shrink-0">
        <img src={review.albumCover} alt={review.albumTitle} className="h-20 w-20 rounded-lg object-cover" />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link to={detailLink} className="font-semibold text-sm hover:text-primary transition-colors truncate block">
              {review.albumTitle}
            </Link>
            <Link to={`/artist/${encodeURIComponent(review.artist)}`} className="text-xs text-muted-foreground hover:text-primary transition-colors">
              {review.artist}
            </Link>
          </div>
          <RatingStars
            rating={isEditing ? editRating : review.rating}
            size="sm"
            interactive={isEditing}
            onRate={setEditRating}
          />
        </div>
        {isEditing ? (
          <div className="mt-3 rounded-lg border border-border bg-background/60 p-3">
            <p className="mb-2 text-xs text-muted-foreground">Update your rating and review text.</p>
            <textarea
              value={editText}
              onChange={(event) => setEditText(event.target.value)}
              maxLength={MAX_REVIEW_LENGTH}
              rows={4}
              disabled={isSavingEdit}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className={`text-xs ${trimmedReviewText.length > MAX_REVIEW_LENGTH * 0.9 ? "text-destructive" : "text-muted-foreground"}`}>
                {trimmedReviewText.length}/{MAX_REVIEW_LENGTH}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditRating(review.rating);
                    setEditText(review.text);
                  }}
                  disabled={isSavingEdit}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleReviewSave();
                  }}
                  disabled={!canSaveEdit || isSavingEdit}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {isSavingEdit ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-secondary-foreground leading-relaxed whitespace-pre-wrap break-words line-clamp-2">
            {review.text}
          </p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <Link to={`/user/${review.userId}`}>
            <img src={review.avatarUrl} alt={review.username} className="h-5 w-5 rounded-full" />
          </Link>
          <Link to={`/user/${review.userId}`} className="text-xs text-muted-foreground hover:text-primary transition-colors">{review.username}</Link>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{review.date}</span>
        </div>
        {isOwner && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsEditing(true);
                setEditRating(review.rating);
                setEditText(review.text);
              }}
              disabled={isDeletingReview}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                void handleReviewDelete();
              }}
              disabled={isDeletingReview || isSavingEdit}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {isDeletingReview ? "Deleting..." : "Delete"}
            </button>
          </div>
        )}
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void handleReaction("like");
            }}
            disabled={isSubmittingReaction || isDeletingReview}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              currentUserReaction === "like"
                ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-200"
                : "border-border text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
            } disabled:cursor-not-allowed disabled:opacity-60`}
            aria-label="Like review"
          >
            <ThumbsUp className="h-3.5 w-3.5" />
            {likesCount}
          </button>
          <button
            type="button"
            onClick={() => {
              void handleReaction("dislike");
            }}
            disabled={isSubmittingReaction || isDeletingReview}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              currentUserReaction === "dislike"
                ? "border-rose-400/60 bg-rose-500/15 text-rose-200"
                : "border-border text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
            } disabled:cursor-not-allowed disabled:opacity-60`}
            aria-label="Dislike review"
          >
            <ThumbsDown className="h-3.5 w-3.5" />
            {dislikesCount}
          </button>
          <button
            type="button"
            onClick={() => setIsCommentsOpen((current) => !current)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              isCommentsOpen
                ? "border-primary/40 bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
            }`}
            aria-label="Toggle comments"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {comments.length}
          </button>
        </div>
        {isCommentsOpen && (
          <div className="mt-4 rounded-lg border border-border bg-background/50 p-3">
            {comments.length > 0 ? (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2.5">
                    <Link to={`/user/${comment.userId}`} className="shrink-0">
                      <img src={comment.avatarUrl} alt={comment.username} className="h-7 w-7 rounded-full" />
                    </Link>
                    <div className="min-w-0 flex-1 rounded-lg bg-card/70 px-3 py-2">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex min-w-0 items-center gap-2">
                          <Link to={`/user/${comment.userId}`} className="truncate font-semibold hover:text-primary transition-colors">
                            {comment.username}
                          </Link>
                          <span className="text-muted-foreground">{comment.date}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {user?.id === comment.userId && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCommentId(comment.id);
                                  setEditingCommentText(comment.text);
                                }}
                                disabled={isSavingCommentEdit || deletingCommentId === comment.id}
                                className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                                aria-label="Edit comment"
                              >
                                <Pencil className="h-3 w-3" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  void handleCommentDelete(comment.id);
                                }}
                                disabled={isSavingCommentEdit || deletingCommentId === comment.id}
                                className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-60"
                                aria-label="Delete comment"
                              >
                                <Trash2 className="h-3 w-3" />
                                {deletingCommentId === comment.id ? "Deleting..." : "Delete"}
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              void handleCommentLike(comment.id);
                            }}
                            disabled={commentLikeTargetId === comment.id || isSavingCommentEdit || deletingCommentId === comment.id}
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium transition-colors ${
                              comment.currentUserLiked
                                ? "border-primary/50 bg-primary/10 text-foreground"
                                : "border-border text-muted-foreground hover:text-foreground"
                            } disabled:cursor-not-allowed disabled:opacity-60`}
                            aria-label="Like comment"
                          >
                            <Heart className="h-3 w-3" />
                            {comment.likesCount}
                          </button>
                        </div>
                      </div>
                      {editingCommentId === comment.id ? (
                        <div className="mt-2">
                          <textarea
                            value={editingCommentText}
                            onChange={(event) => setEditingCommentText(event.target.value)}
                            maxLength={MAX_COMMENT_LENGTH}
                            rows={3}
                            disabled={isSavingCommentEdit || deletingCommentId === comment.id}
                            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                          <div className="mt-2 flex items-center justify-between gap-3">
                            <p className={`text-xs ${editingCommentText.trim().length > MAX_COMMENT_LENGTH * 0.9 ? "text-destructive" : "text-muted-foreground"}`}>
                              {editingCommentText.trim().length}/{MAX_COMMENT_LENGTH}
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCommentId(null);
                                  setEditingCommentText("");
                                }}
                                disabled={isSavingCommentEdit || deletingCommentId === comment.id}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <X className="h-3.5 w-3.5" />
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  void handleCommentEditSave();
                                }}
                                disabled={
                                  isSavingCommentEdit ||
                                  deletingCommentId === comment.id ||
                                  editingCommentText.trim().length === 0 ||
                                  editingCommentText.trim().length > MAX_COMMENT_LENGTH
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                {isSavingCommentEdit ? "Saving..." : "Save"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-1 text-sm text-secondary-foreground whitespace-pre-wrap break-words">
                          {comment.text}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No replies yet.</p>
            )}

            <div className="mt-3 border-t border-border pt-3">
              {!isAuthenticated ? (
                <p className="text-xs text-muted-foreground">Sign in to reply to this review.</p>
              ) : comments.length >= MAX_REVIEW_COMMENTS ? (
                <p className="text-xs text-muted-foreground">
                  This review already has the maximum of {MAX_REVIEW_COMMENTS} comments.
                </p>
              ) : (
                <>
                  <textarea
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    placeholder="Write a reply..."
                    maxLength={MAX_COMMENT_LENGTH}
                    rows={2}
                    disabled={isSubmittingComment}
                    className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      {trimmedComment.length}/{MAX_COMMENT_LENGTH}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        void handleCommentSubmit();
                      }}
                      disabled={!canSubmitComment || isSubmittingComment}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {isSubmittingComment ? "Posting..." : "Reply"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
