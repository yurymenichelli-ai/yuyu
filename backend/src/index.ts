import express from "express";
import cors from "cors";
import { env } from "./env";
import { authRouter } from "./routes/auth";
import { notesRouter } from "./routes/notes";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/auth", authRouter);
app.use("/notes", notesRouter);

app.listen(env.port, () => {
  console.log(`Voice notes backend listening on port ${env.port}`);
});
