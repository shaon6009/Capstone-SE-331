import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestPasswordReset, signIn, signUp } from "@/lib/mockStore";
import { Shield } from "lucide-react";
import { toast } from "sonner";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    return email.endsWith("@diu.edu.bd");
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      toast.error("Only @diu.edu.bd emails are allowed");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
        toast.success("Account created successfully!");
        navigate("/");
      } else {
        await signIn(email, password);
        navigate("/");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Authentication failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      toast.error("Only @diu.edu.bd emails are allowed");
      return;
    }
    setLoading(true);
    try {
      await requestPasswordReset(email);
      toast.success("Password reset is a frontend demo in this build.");
      setIsForgotPassword(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to process request";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (isForgotPassword) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-sm">
          <div className="flex flex-col items-center mb-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent">
              <Shield className="h-6 w-6 text-accent-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">FixMyCampus</h1>
            <p className="text-sm text-muted-foreground mt-1">Reset your password</p>
            <p className="text-xs text-muted-foreground">Only @diu.edu.bd emails</p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <input
              type="email"
              placeholder="your.email@diu.edu.bd"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsForgotPassword(false)}
              className="text-sm text-primary hover:underline"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent">
            <Shield className="h-6 w-6 text-accent-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">FixMyCampus</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSignUp ? "Create a new account" : "Sign in to your account"}
          </p>
          <p className="text-xs text-muted-foreground">Only @diu.edu.bd emails</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <input
            type="email"
            placeholder="your.email@diu.edu.bd"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>

        <div className="mt-4 flex flex-col items-center gap-1">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-primary hover:underline"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
          {!isSignUp && (
            <button
              onClick={() => setIsForgotPassword(true)}
              className="text-sm text-muted-foreground hover:underline"
            >
              Forgot password?
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
