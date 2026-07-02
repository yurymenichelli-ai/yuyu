import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { deleteNote, downloadNoteAudio, updateNote } from "../api/notes";
import { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "NoteDetail">;

export default function NoteDetailScreen({ route, navigation }: Props) {
  const { note } = route.params;
  const [title, setTitle] = useState(note.title);
  const [transcript, setTranscript] = useState(note.transcript);
  const [isSaving, setIsSaving] = useState(false);
  const [localAudioUri, setLocalAudioUri] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(true);

  const player = useAudioPlayer(localAudioUri ?? undefined);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const uri = await downloadNoteAudio(note.id);
        if (!cancelled) setLocalAudioUri(uri);
      } catch {
        if (!cancelled) Alert.alert("Errore", "Impossibile scaricare l'audio.");
      } finally {
        if (!cancelled) setIsDownloading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [note.id]);

  const onSave = async () => {
    setIsSaving(true);
    try {
      await updateNote(note.id, { title, transcript });
      navigation.goBack();
    } catch {
      Alert.alert("Errore", "Salvataggio non riuscito.");
    } finally {
      setIsSaving(false);
    }
  };

  const onDelete = () => {
    Alert.alert("Elimina appunto", "Sei sicuro?", [
      { text: "Annulla", style: "cancel" },
      {
        text: "Elimina",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteNote(note.id);
            navigation.goBack();
          } catch {
            Alert.alert("Errore", "Eliminazione non riuscita.");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <TextInput style={styles.titleInput} value={title} onChangeText={setTitle} placeholder="Titolo" />

      <TouchableOpacity
        style={styles.playButton}
        disabled={isDownloading || !localAudioUri}
        onPress={() => (status.playing ? player.pause() : player.play())}
      >
        {isDownloading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.playButtonText}>{status.playing ? "⏸ Pausa" : "▶ Riproduci"}</Text>
        )}
      </TouchableOpacity>

      <TextInput
        style={styles.transcriptInput}
        value={transcript}
        onChangeText={setTranscript}
        multiline
        placeholder="Trascrizione"
      />

      <View style={styles.actions}>
        <TouchableOpacity style={styles.saveButton} onPress={onSave} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Salva</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <Text style={styles.deleteButtonText}>Elimina</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16, backgroundColor: "#fff" },
  titleInput: { fontSize: 20, fontWeight: "700", borderBottomWidth: 1, borderBottomColor: "#ddd", paddingBottom: 8 },
  playButton: { backgroundColor: "#2563eb", padding: 14, borderRadius: 8, alignItems: "center" },
  playButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  transcriptInput: { flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 12, fontSize: 16, textAlignVertical: "top" },
  actions: { flexDirection: "row", gap: 12 },
  saveButton: { flex: 1, backgroundColor: "#16a34a", padding: 14, borderRadius: 8, alignItems: "center" },
  saveButtonText: { color: "#fff", fontWeight: "600" },
  deleteButton: { flex: 1, backgroundColor: "#dc2626", padding: 14, borderRadius: 8, alignItems: "center" },
  deleteButtonText: { color: "#fff", fontWeight: "600" },
});
