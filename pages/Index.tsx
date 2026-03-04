import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Send, Eye, Users, Bot } from "lucide-react";
import Navbar from "@/components/Navbar";
import PostCard from "@/components/PostCard";
import {
  createPost,
  getCurrentUser,
  getFeed,
  type FeedPost,
  type MockUser,
} from "@/lib/mockStore";

const Index = () => {
  const [user, setUser] = useState<MockUser | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [postContent, setPostContent] = useState("");
  const [activeTab, setActiveTab] = useState("view");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const activeUser = await getCurrentUser();
      if (!activeUser) {
        navigate("/auth");
        return;
      }
      setUser(activeUser);
    };

    init();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      const loadFeed = async () => {
        setLoading(true);
        const data = await getFeed(user.id);
        setPosts(data);
        setLoading(false);
      };

      loadFeed();
    }
  }, [user]);

  const fetchPosts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await getFeed(user.id);
    setPosts(data);
    setLoading(false);
  }, [user]);

  const handleSubmitPost = async () => {
    if (!user) return;
    if (!postContent.trim()) return;
    await createPost(user.id, postContent.trim());
    toast.success("Post submitted!");
    setPostContent("");
    fetchPosts();
  };

  if (!user) return null;

  const tabs = [
    { id: "view", label: "View", icon: Eye },
    { id: "groups", label: "Groups", icon: Users },
    { id: "ai", label: "AI", icon: Bot },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar anonName={user.anonName} />

      <div className="mx-auto max-w-3xl px-4 py-4">
        {/* Tabs */}
        <div className="mb-4 flex rounded-lg border border-border bg-card overflow-hidden">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "view" && (
          <div className="space-y-4">
            {/* Create post */}
            <div className="rounded-lg border border-border bg-card p-4">
              <textarea
                placeholder="Report a campus issue... (text only)"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                className="w-full resize-y rounded-md border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
              />
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Posts require Super Admin approval
                </p>
                <button
                  onClick={handleSubmitPost}
                  disabled={!postContent.trim()}
                  className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  <Send className="h-4 w-4" />
                  Submit
                </button>
              </div>
            </div>

            {/* Posts feed */}
            {loading ? (
              <div className="text-center text-sm text-muted-foreground py-8">Loading posts...</div>
            ) : posts.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">No posts yet. Be the first to report an issue!</div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  {...post}
                  currentUserId={user.id}
                  onRefresh={fetchPosts}
                />
              ))
            )}
          </div>
        )}

        {activeTab === "groups" && (
          <div className="flex items-center justify-center rounded-lg border border-border bg-card py-20">
            <p className="text-muted-foreground">Groups coming soon...</p>
          </div>
        )}

        {activeTab === "ai" && (
          <div className="flex items-center justify-center rounded-lg border border-border bg-card py-20">
            <p className="text-muted-foreground">AI features coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
