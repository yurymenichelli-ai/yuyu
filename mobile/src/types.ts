export interface User {
  id: string;
  email: string;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  transcript: string;
  audioPath: string;
  source: "manual" | "wake_word";
  createdAt: string;
  updatedAt: string;
}
