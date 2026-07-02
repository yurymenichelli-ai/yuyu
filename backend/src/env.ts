import { config } from "dotenv";

// override: true makes the project's .env win over any same-named variable
// already exported in the shell (e.g. a stray empty OPENAI_API_KEY from
// another tool's setup), which otherwise silently shadows it.
config({ override: true });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: required("JWT_SECRET"),
  openaiApiKey: required("OPENAI_API_KEY"),
};
