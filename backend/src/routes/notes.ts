import path from "path";
import fs from "fs";
import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../db";
import { AuthedRequest, requireAuth } from "../middleware/auth";

export const notesRouter = Router();
notesRouter.use(requireAuth);

const uploadsDir = path.join(__dirname, "..", "..", "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || ".m4a";
      cb(null, `${(req as AuthedRequest).userId}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
});

function deriveTitle(transcript: string): string {
  const words = transcript.split(/\s+/).filter(Boolean);
  const title = words.slice(0, 6).join(" ");
  return title.length > 0 ? title : "Appunto vocale";
}

notesRouter.post("/", upload.single("audio"), async (req: AuthedRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Missing audio file" });
  }

  const transcript = typeof req.body.transcript === "string" ? req.body.transcript.trim() : "";
  if (!transcript) {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: "Missing transcript" });
  }

  const title = typeof req.body.title === "string" && req.body.title.trim().length > 0
    ? req.body.title.trim()
    : deriveTitle(transcript);
  const source = req.body.source === "wake_word" ? "wake_word" : "manual";

  const note = await prisma.note.create({
    data: {
      userId: req.userId!,
      title,
      transcript,
      audioPath: req.file.filename,
      source,
    },
  });

  res.status(201).json(note);
});

notesRouter.get("/", async (req: AuthedRequest, res) => {
  const search = typeof req.query.q === "string" ? req.query.q.trim() : "";

  const notes = await prisma.note.findMany({
    where: {
      userId: req.userId!,
      ...(search
        ? {
            OR: [
              { transcript: { contains: search } },
              { title: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(notes);
});

notesRouter.get("/:id/audio", async (req: AuthedRequest, res) => {
  const note = await prisma.note.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!note) {
    return res.status(404).json({ error: "Note not found" });
  }
  res.sendFile(path.join(uploadsDir, note.audioPath));
});

notesRouter.patch("/:id", async (req: AuthedRequest, res) => {
  const schema = z.object({
    title: z.string().min(1).optional(),
    transcript: z.string().min(1).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const note = await prisma.note.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!note) {
    return res.status(404).json({ error: "Note not found" });
  }

  const updated = await prisma.note.update({
    where: { id: note.id },
    data: parsed.data,
  });

  res.json(updated);
});

notesRouter.delete("/:id", async (req: AuthedRequest, res) => {
  const note = await prisma.note.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!note) {
    return res.status(404).json({ error: "Note not found" });
  }

  await prisma.note.delete({ where: { id: note.id } });
  fs.unlink(path.join(uploadsDir, note.audioPath), () => {});

  res.status(204).send();
});
