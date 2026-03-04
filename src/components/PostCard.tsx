import { useState } from "react";
import { Heart, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { addComment, addReply, toggleLike } from "@/lib/mockStore";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  profiles?: { anon_name: string };
  replies?: Comment[];
}

interface PostCardProps {
  id: string;
  content: string;
  created_at: string;
  authorName: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  comments: Comment[];
  currentUserId: string;
  onRefresh: () => void;
}

const PostCard = ({
  id,
  content,
  created_at,
  authorName,
  likesCount,
  commentsCount,
  isLiked,
  comments,
  currentUserId,
  onRefresh,
}: PostCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const handleLike = async () => {
    await toggleLike(id, currentUserId);
    onRefresh();
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    await addComment(id, currentUserId, commentText.trim());
    setCommentText("");
    onRefresh();
  };

  const handleReply = async (parentId: string) => {
    if (!replyText.trim()) return;
    await addReply(id, currentUserId, replyText.trim(), parentId);
    setReplyText("");
    setReplyTo(null);
    onRefresh();
  };

  const topLevelComments = comments.filter((c) => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter((c) => c.parent_id === parentId);

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground">{authorName}</span>
        <span className="text-xs text-muted-foreground">·</span>
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
        </span>
      </div>
      <p className="mb-3 text-sm text-foreground">{content}</p>
      <div className="flex items-center gap-4">
        <button
          onClick={handleLike}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <Heart
            className={`h-4 w-4 ${isLiked ? "fill-primary text-primary" : ""}`}
          />
          {likesCount}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          {commentsCount}
          {showComments ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {showComments && (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          {topLevelComments.map((comment) => (
            <div key={comment.id} className="space-y-2">
              <div className="rounded-md bg-muted p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-foreground">
                    {comment.profiles?.anon_name || "Anon"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-foreground">{comment.content}</p>
                <button
                  onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                  className="mt-1 text-xs text-primary hover:underline"
                >
                  Reply
                </button>
              </div>

              {getReplies(comment.id).map((reply) => (
                <div key={reply.id} className="ml-6 rounded-md bg-muted p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-foreground">
                      {reply.profiles?.anon_name || "Anon"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{reply.content}</p>
                </div>
              ))}

              {replyTo === comment.id && (
                <div className="ml-6 flex gap-2">
                  <input
                    type="text"
                    placeholder="Write a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleReply(comment.id)}
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    onClick={() => handleReply(comment.id)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Send
                  </button>
                </div>
              )}
            </div>
          ))}

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleComment()}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={handleComment}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
