require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const fs = require("fs/promises");
const path = require("path");
const { sql } = require("./db");
const { createToken, requireAuth } = require("./auth");

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured");
}

const app = express();
const port = Number(process.env.PORT || 4000);
const configuredOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (origin === configuredOrigin) return true;
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
};

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: false,
  })
);
app.use(express.json());

const ensureSchema = async () => {
  const schemaPath = path.resolve(__dirname, "../sql/schema.sql");
  const schemaSql = await fs.readFile(schemaPath, "utf8");
  const statements = schemaSql
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);

  for (const statement of statements) {
    await sql(statement);
  }
};

const formatUser = (row) => ({
  id: row.id,
  email: row.email,
  anonName: row.anon_name,
});

const isDiuEmail = (email) => typeof email === "string" && email.endsWith("@diu.edu.bd");

const buildAnonName = (email) => {
  const local = email.split("@")[0] || "student";
  return `Anon ${local.slice(0, 12)}`;
};

app.get("/api/health", (_req, res) => {
  return res.json({ data: { ok: true } });
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!isDiuEmail(email)) {
      return res.status(400).json({ message: "Only @diu.edu.bd emails are allowed" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
    if (existing.length > 0) {
      return res.status(409).json({ message: "Account already exists for this email" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const inserted = await sql`
      INSERT INTO users (email, anon_name, password_hash)
      VALUES (${email}, ${buildAnonName(email)}, ${passwordHash})
      RETURNING id, email, anon_name
    `;

    const user = inserted[0];
    const token = createToken(user);
    return res.status(201).json({ data: { token, user: formatUser(user) } });
  } catch (error) {
    console.error("signup_error", error);
    return res.status(500).json({ message: "Failed to sign up" });
  }
});

app.post("/api/auth/signin", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    const rows = await sql`
      SELECT id, email, anon_name, password_hash
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = rows[0];
    const matches = await bcrypt.compare(password, user.password_hash);
    if (!matches) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = createToken(user);
    return res.json({ data: { token, user: formatUser(user) } });
  } catch (error) {
    console.error("signin_error", error);
    return res.status(500).json({ message: "Failed to sign in" });
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    const rows = await sql`
      SELECT id, email, anon_name
      FROM users
      WHERE id = ${req.user.id}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    return res.json({ data: formatUser(rows[0]) });
  } catch (error) {
    console.error("auth_me_error", error);
    return res.status(500).json({ message: "Failed to load user" });
  }
});

app.post("/api/auth/forgot-password", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!isDiuEmail(email)) {
    return res.status(400).json({ message: "Only @diu.edu.bd emails are allowed" });
  }
  return res.json({ data: { message: "Password reset is not enabled in this backend yet." } });
});

app.get("/api/feed", requireAuth, async (req, res) => {
  try {
    const postRows = await sql`
      SELECT p.id, p.content, p.created_at, p.user_id, u.anon_name AS author_name
      FROM posts p
      JOIN users u ON u.id = p.user_id
      ORDER BY p.created_at DESC
      LIMIT 100
    `;

    const postIds = postRows.map((row) => row.id);
    if (postIds.length === 0) {
      return res.json({ data: [] });
    }

    const likeRows = await sql`
      SELECT post_id, user_id
      FROM likes
      WHERE post_id = ANY(${postIds})
    `;

    const commentRows = await sql`
      SELECT c.id, c.post_id, c.user_id, c.parent_id, c.content, c.created_at, u.anon_name
      FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.post_id = ANY(${postIds})
      ORDER BY c.created_at ASC
    `;

    const likesByPost = new Map();
    for (const like of likeRows) {
      const list = likesByPost.get(like.post_id) || [];
      list.push(like.user_id);
      likesByPost.set(like.post_id, list);
    }

    const commentsByPost = new Map();
    for (const comment of commentRows) {
      const list = commentsByPost.get(comment.post_id) || [];
      list.push({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        user_id: comment.user_id,
        parent_id: comment.parent_id,
        profiles: { anon_name: comment.anon_name },
      });
      commentsByPost.set(comment.post_id, list);
    }

    const feed = postRows.map((post) => {
      const postLikes = likesByPost.get(post.id) || [];
      const postComments = commentsByPost.get(post.id) || [];
      return {
        id: post.id,
        content: post.content,
        created_at: post.created_at,
        authorName: post.author_name,
        likesCount: postLikes.length,
        commentsCount: postComments.length,
        isLiked: postLikes.includes(req.user.id),
        comments: postComments,
      };
    });

    return res.json({ data: feed });
  } catch (error) {
    console.error("feed_error", error);
    return res.status(500).json({ message: "Failed to load feed" });
  }
});

app.post("/api/posts", requireAuth, async (req, res) => {
  try {
    const content = String(req.body?.content || "").trim();
    if (!content) {
      return res.status(400).json({ message: "Post content is required" });
    }
    const inserted = await sql`
      INSERT INTO posts (user_id, content, status)
      VALUES (${req.user.id}, ${content}, 'approved')
      RETURNING id
    `;
    return res.status(201).json({ data: { id: inserted[0].id } });
  } catch (error) {
    console.error("create_post_error", error);
    return res.status(500).json({ message: "Failed to create post" });
  }
});

app.post("/api/posts/:postId/like-toggle", requireAuth, async (req, res) => {
  try {
    const postId = req.params.postId;
    const existing = await sql`
      SELECT 1 FROM likes
      WHERE post_id = ${postId} AND user_id = ${req.user.id}
      LIMIT 1
    `;

    if (existing.length > 0) {
      await sql`
        DELETE FROM likes
        WHERE post_id = ${postId} AND user_id = ${req.user.id}
      `;
      return res.json({ data: { liked: false } });
    }

    await sql`
      INSERT INTO likes (post_id, user_id)
      VALUES (${postId}, ${req.user.id})
      ON CONFLICT (post_id, user_id) DO NOTHING
    `;
    return res.json({ data: { liked: true } });
  } catch (error) {
    console.error("toggle_like_error", error);
    return res.status(500).json({ message: "Failed to toggle like" });
  }
});

app.post("/api/posts/:postId/comments", requireAuth, async (req, res) => {
  try {
    const postId = req.params.postId;
    const content = String(req.body?.content || "").trim();
    if (!content) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    const inserted = await sql`
      INSERT INTO comments (post_id, user_id, content, parent_id)
      VALUES (${postId}, ${req.user.id}, ${content}, NULL)
      RETURNING id
    `;

    return res.status(201).json({ data: { id: inserted[0].id } });
  } catch (error) {
    console.error("add_comment_error", error);
    return res.status(500).json({ message: "Failed to add comment" });
  }
});

app.post("/api/posts/:postId/replies", requireAuth, async (req, res) => {
  try {
    const postId = req.params.postId;
    const parentId = String(req.body?.parentId || "").trim();
    const content = String(req.body?.content || "").trim();

    if (!parentId || !content) {
      return res.status(400).json({ message: "Reply content and parent comment are required" });
    }

    const parent = await sql`
      SELECT id FROM comments
      WHERE id = ${parentId} AND post_id = ${postId}
      LIMIT 1
    `;
    if (parent.length === 0) {
      return res.status(400).json({ message: "Invalid parent comment" });
    }

    const inserted = await sql`
      INSERT INTO comments (post_id, user_id, content, parent_id)
      VALUES (${postId}, ${req.user.id}, ${content}, ${parentId})
      RETURNING id
    `;

    return res.status(201).json({ data: { id: inserted[0].id } });
  } catch (error) {
    console.error("add_reply_error", error);
    return res.status(500).json({ message: "Failed to add reply" });
  }
});

app.use((_req, res) => {
  return res.status(404).json({ message: "Route not found" });
});

const start = async () => {
  try {
    await ensureSchema();
    app.listen(port, () => {
      console.log(`Backend running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("startup_error", error);
    process.exit(1);
  }
};

start();
