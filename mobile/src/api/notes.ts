import * as FileSystem from "expo-file-system/legacy";
import { api, getToken } from "./client";
import { API_BASE_URL } from "../config";
import { Note } from "../types";

export async function fetchNotes(search?: string): Promise<Note[]> {
  const { data } = await api.get<Note[]>("/notes", { params: search ? { q: search } : undefined });
  return data;
}

const MIME_BY_EXTENSION: Record<string, string> = {
  wav: "audio/wav",
  caf: "audio/x-caf",
  m4a: "audio/m4a",
};

export async function uploadNote(params: {
  audioUri: string;
  transcript: string;
  source: "manual" | "wake_word";
}): Promise<Note> {
  const extension = params.audioUri.match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase() ?? "caf";

  const form = new FormData();
  form.append("audio", {
    uri: params.audioUri,
    name: `note.${extension}`,
    type: MIME_BY_EXTENSION[extension] ?? "audio/octet-stream",
  } as unknown as Blob);
  form.append("transcript", params.transcript);
  form.append("source", params.source);

  const { data } = await api.post<Note>("/notes", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function updateNote(id: string, changes: Partial<Pick<Note, "title" | "transcript">>): Promise<Note> {
  const { data } = await api.patch<Note>(`/notes/${id}`, changes);
  return data;
}

export async function deleteNote(id: string): Promise<void> {
  await api.delete(`/notes/${id}`);
}

// The audio endpoint requires an Authorization header, so it can't be played
// directly from a URL. Download it once (with auth) to a local file instead.
export async function downloadNoteAudio(id: string): Promise<string> {
  const localUri = `${FileSystem.cacheDirectory}note-${id}.m4a`;
  const token = await getToken();
  const result = await FileSystem.downloadAsync(`${API_BASE_URL}/notes/${id}/audio`, localUri, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return result.uri;
}
