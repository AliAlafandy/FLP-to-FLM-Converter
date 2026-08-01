const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'community.json');
const MAX_POSTS = 500;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 5;

function loadPosts() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
}

function savePosts(posts) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2));
}

let posts = loadPosts();

function sanitize(str, maxLen) {
  return String(str == null ? '' : str)
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLen);
}

function publicPost(p) {
  const { ownerKey, ...rest } = p;
  return rest;
}

const rateLimitMap = new Map();
function isRateLimited(key) {
  const now = Date.now();
  const entry = rateLimitMap.get(key) || { count: 0, reset: now + RATE_LIMIT_WINDOW_MS };
  if (now > entry.reset) {
    entry.count = 0;
    entry.reset = now + RATE_LIMIT_WINDOW_MS;
  }
  entry.count += 1;
  rateLimitMap.set(key, entry);
  return entry.count > RATE_LIMIT_MAX;
}
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.reset) rateLimitMap.delete(key);
  }
}, RATE_LIMIT_WINDOW_MS).unref();

const app = express();
app.use(cors());
app.use(express.json({ limit: '200kb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, posts: posts.length });
});

app.get('/api/community/posts', (req, res) => {
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const before = req.query.before ? parseInt(req.query.before, 10) : Date.now();
  const q = sanitize(req.query.q, 80).toLowerCase();

  let filtered = posts.filter(p => p.createdAt < before);
  if (q) {
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.message.toLowerCase().includes(q) ||
      p.author.toLowerCase().includes(q)
    );
  }
  filtered.sort((a, b) => b.createdAt - a.createdAt);
  const page = filtered.slice(0, limit);

  res.json({
    posts: page.map(publicPost),
    hasMore: filtered.length > limit,
    nextBefore: page.length ? page[page.length - 1].createdAt : null,
  });
});

app.post('/api/community/posts', (req, res) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many posts — please wait a bit before posting again.' });
  }

  const author = sanitize(req.body && req.body.author, 40) || 'Anonymous';
  const title = sanitize(req.body && req.body.title, 100);
  const message = sanitize(req.body && req.body.message, 1000);
  const fileName = sanitize(req.body && req.body.fileName, 120);

  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required.' });
  }

  const ownerKey = crypto.randomBytes(16).toString('hex');
  const post = {
    id: crypto.randomBytes(8).toString('hex'),
    author,
    title,
    message,
    fileName: fileName || null,
    likes: 0,
    createdAt: Date.now(),
    ownerKey,
  };

  posts.push(post);
  if (posts.length > MAX_POSTS) posts = posts.slice(posts.length - MAX_POSTS);
  savePosts(posts);

  res.status(201).json({ post: publicPost(post), ownerKey });
});

app.post('/api/community/posts/:id/like', (req, res) => {
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found.' });
  post.likes = (post.likes || 0) + 1;
  savePosts(posts);
  res.json({ post: publicPost(post) });
});

app.delete('/api/community/posts/:id', (req, res) => {
  const idx = posts.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Post not found.' });
  const ownerKey = req.body && req.body.ownerKey;
  if (!ownerKey || posts[idx].ownerKey !== ownerKey) {
    return res.status(403).json({ error: 'Not authorized to delete this post.' });
  }
  posts.splice(idx, 1);
  savePosts(posts);
  res.json({ ok: true });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

app.listen(PORT, () => {
  console.log(`FLP-to-FLM Community API listening on port ${PORT}`);
});
