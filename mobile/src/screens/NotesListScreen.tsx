import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { fetchNotes, uploadNote } from "../api/notes";
import { useVoiceRecorder } from "../services/useVoiceRecorder";
import { useAuth } from "../auth/AuthContext";
import { Note } from "../types";
import { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "NotesList">;

export default function NotesListScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const recorder = useVoiceRecorder();

  const load = useCallback(async (query?: string) => {
    setIsLoading(true);
    try {
      const data = await fetchNotes(query);
      setNotes(data);
    } catch {
      Alert.alert("Errore", "Impossibile caricare gli appunti.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(search);
    }, [load])
  );

  const onToggleRecord = async () => {
    if (recorder.isRecording) {
      const uri = await recorder.stop();
      if (!uri) return;
      setIsUploading(true);
      try {
        await uploadNote({ audioUri: uri, source: "manual" });
        await load(search);
      } catch {
        Alert.alert("Errore", "Trascrizione non riuscita. Riprova.");
      } finally {
        setIsUploading(false);
      }
    } else {
      try {
        await recorder.start();
      } catch {
        Alert.alert("Permesso negato", "Serve l'accesso al microfono per registrare.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.search}
          placeholder="Cerca negli appunti..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => load(search)}
        />
        <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
          <Text style={styles.settings}>⚙️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Esci</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} />
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={false} onRefresh={() => load(search)} />}
          contentContainerStyle={notes.length === 0 && styles.emptyContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>Nessun appunto ancora. Registra il primo!</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.noteRow} onPress={() => navigation.navigate("NoteDetail", { noteId: item.id, note: item })}>
              <Text style={styles.noteTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.noteTranscript} numberOfLines={2}>{item.transcript}</Text>
              <Text style={styles.noteDate}>{new Date(item.createdAt).toLocaleString("it-IT")}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity
        style={[styles.recordButton, recorder.isRecording && styles.recordButtonActive]}
        onPress={onToggleRecord}
        disabled={isUploading}
      >
        {isUploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.recordButtonText}>{recorder.isRecording ? "Stop" : "Registra"}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  search: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10 },
  logout: { color: "#dc2626", fontWeight: "600" },
  settings: { fontSize: 20 },
  loader: { marginTop: 40 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#888", fontSize: 15 },
  noteRow: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#eee" },
  noteTitle: { fontSize: 16, fontWeight: "600" },
  noteTranscript: { color: "#555", marginTop: 4 },
  noteDate: { color: "#999", fontSize: 12, marginTop: 6 },
  recordButton: {
    position: "absolute",
    bottom: 28,
    alignSelf: "center",
    backgroundColor: "#2563eb",
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 32,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  recordButtonActive: { backgroundColor: "#dc2626" },
  recordButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
