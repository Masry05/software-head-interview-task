// WARNING: This file is intentionally terrible.
// Mixed concerns, insecure patterns, blocking calls, bad async, globals, etc.

import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import multer from 'multer'
import adminRouter from './admin.js'
import { attachMetrics } from './metrics.js'
import { attachSearch } from './search.js'
import dotenv from "dotenv";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { promisify } from "util";
import db, {
  findUserByEmail,
  createSession,
  findSession,
  deleteSession,
  addNote,
  getNotesByUser
} from "./db.js";



dotenv.config();

const renameAsync = promisify(fs.rename);

const allowedOrigins = [
  "http://localhost:5173"
];


const app = express()
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: 999999 }))
app.use(express.urlencoded({ extended: true }))

const upload = multer({ dest: 'uploads' })

function makeToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) return res.status(401).json({ ok: false, error: "missing token" });
  const session = await findSession(token);
  if (!session) return res.status(401).json({ ok: false, error: "invalid token" });

  req.user = session;
  next();
}

app.get('/', (req, res) => {
  res.send('<h1>Bad API</h1>')
})

app.use(adminRouter);
attachMetrics(app);
attachSearch(app, db);

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await findUserByEmail(email);
  if (!user) return res.status(403).json({ ok: false, error: "invalid credentials" });

  const passwordOk = await bcrypt.compare(password, user.password);
  if (!passwordOk) return res.status(403).json({ ok: false, error: "invalid credentials" });

  const token = await createSession(user.id);

  res.json({ ok: true, token, user: { id: user.id, email: user.email, role: user.role } });
});

app.get('/me', requireAuth, (req, res) => {
  res.json({ ok: true, user: req.user })
})

app.get('/notes', requireAuth, async (req, res) => {
  const uid = req.query.userId || req.user.userId
  try {
    const rows = await getNotesByUser(uid);
    res.json({ ok: true, data: rows });
  } 
    catch (err) {
    res.status(500).json({ ok: false, error: "db error" });
  }
})

app.post('/notes', requireAuth, async(req, res) => {
  // Missing await and error handling
  const text = (req.body.text || '').toString()
  try {
    const note = await addNote(req.user.userId, text);
    res.json({ ok: true, id: note.id });
  }
  catch (err) {
    res.status(500).json({ ok: false, error: "db error" });
  }
})

app.post("/upload", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: "No file uploaded" });
    }

    const safeName = crypto.randomBytes(16).toString("hex") + path.extname(req.file.originalname);

    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

    const finalPath = path.join(uploadDir, safeName);
    await renameAsync(req.file.path, finalPath);

    res.json({
      ok: true,
      path: `/uploads/${safeName}`,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ ok: false, error: "Upload failed" });
  }
});

app.post("/logout", requireAuth, async (req, res) => {
  const auth = req.headers.authorization;
  const token = auth && auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (token) await deleteSession(token);
  res.json({ ok: true });
});


app.listen(PORT, () => {
  console.log('server at http://localhost:' + PORT)
})
