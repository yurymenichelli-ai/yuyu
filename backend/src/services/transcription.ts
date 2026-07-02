import fs from "fs";
import OpenAI from "openai";
import { env } from "../env";

const openai = new OpenAI({ apiKey: env.openaiApiKey });

export async function transcribeAudio(filePath: string): Promise<string> {
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: "whisper-1",
    language: "it",
  });
  return transcription.text.trim();
}
