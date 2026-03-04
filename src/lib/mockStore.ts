export interface MockUser {
  id: string;
  email: string;
  anonName: string;
}

export interface FeedComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  profiles?: { anon_name: string };
}

export interface FeedPost {
  id: string;
  content: string;
  created_at: string;
  authorName: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  comments: FeedComment[];
}

interface ApiResponse<T> {
  data: T;
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/$/, "");
const TOKEN_KEY = "fixmycampus_token";

const getToken = () => localStorage.getItem(TOKEN_KEY);

const setToken = (token: string | null) => {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
};

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const token = getToken();
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
    });
  } catch {
    throw new Error(
      `Cannot reach backend at ${API_BASE_URL}. Make sure the API server is running and CORS allows this frontend origin.`
    );
  }

  if (!response.ok) {
    let message = "Request failed";
    try {
      const errorBody = await response.json();
      if (typeof errorBody?.message === "string") {
        message = errorBody.message;
      }
    } catch {
      // Ignore parsing error and fallback to generic message.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json()) as ApiResponse<T>;
  return payload.data;
};

export const getCurrentUser = async () => {
  const token = getToken();
  if (!token) return null;

  try {
    return await request<MockUser>("/auth/me", { method: "GET" });
  } catch {
    setToken(null);
    return null;
  }
};

export const signIn = async (email: string, password: string) => {
  const data = await request<{ token: string; user: MockUser }>("/auth/signin", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data.user;
};

export const signUp = async (email: string, password: string) => {
  const data = await request<{ token: string; user: MockUser }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data.user;
};

export const signOut = async () => {
  setToken(null);
};

export const getFeed = async (_viewerUserId: string): Promise<FeedPost[]> => {
  return request<FeedPost[]>("/feed", { method: "GET" });
};

export const createPost = async (_userId: string, content: string) => {
  await request("/posts", {
    method: "POST",
    body: JSON.stringify({ content }),
  });
};

export const toggleLike = async (postId: string, _userId: string) => {
  await request(`/posts/${postId}/like-toggle`, {
    method: "POST",
  });
};

export const addComment = async (postId: string, _userId: string, content: string) => {
  await request(`/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
};

export const addReply = async (
  postId: string,
  _userId: string,
  content: string,
  parentId: string
) => {
  await request(`/posts/${postId}/replies`, {
    method: "POST",
    body: JSON.stringify({ content, parentId }),
  });
};

export const requestPasswordReset = async (email: string) => {
  await request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
};
