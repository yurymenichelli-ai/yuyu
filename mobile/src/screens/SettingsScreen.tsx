import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { WAKE_WORD } from "../config";
import {
  getPicovoiceAccessKey,
  isWakeWordEnabled,
  setPicovoiceAccessKey,
  setWakeWordEnabled,
} from "../services/wakeWordSettings";

export default function SettingsScreen() {
  const [accessKey, setAccessKey] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    (async () => {
      setAccessKey((await getPicovoiceAccessKey()) ?? "");
      setEnabled(await isWakeWordEnabled());
    })();
  }, []);

  const onSave = async () => {
    await setPicovoiceAccessKey(accessKey.trim());
    setIsSaved(true);
    Alert.alert(
      "Salvato",
      "Riavvia l'app per applicare la nuova chiave e attivare l'ascolto della parola \"" + WAKE_WORD + "\"."
    );
  };

  const onToggle = async (value: boolean) => {
    setEnabled(value);
    await setWakeWordEnabled(value);
    Alert.alert("Riavvia l'app", "Chiudi e riapri l'app perché la modifica abbia effetto.");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Ascolto vocale in background</Text>
      <Text style={styles.description}>
        Quando attivo, l'app resta in ascolto della parola "{WAKE_WORD}" e registra automaticamente ciò che dici
        subito dopo, anche mentre l'app è in background (schermo bloccato o altra app in primo piano).
      </Text>

      <View style={styles.row}>
        <Text style={styles.label}>Attiva ascolto</Text>
        <Switch value={enabled} onValueChange={onToggle} />
      </View>

      <Text style={styles.label}>Chiave d'accesso Picovoice</Text>
      <TextInput
        style={styles.input}
        placeholder="Incolla qui la tua AccessKey da console.picovoice.ai"
        autoCapitalize="none"
        value={accessKey}
        onChangeText={(text) => {
          setAccessKey(text);
          setIsSaved(false);
        }}
      />
      <TouchableOpacity style={styles.saveButton} onPress={onSave}>
        <Text style={styles.saveButtonText}>{isSaved ? "Salvata" : "Salva chiave"}</Text>
      </TouchableOpacity>

      <Text style={styles.help}>
        Vedi mobile/SETUP.md per la guida completa: creazione dell'account Picovoice, generazione della parola chiave
        personalizzata "{WAKE_WORD}" e installazione dei file del modello nell'app.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 14 },
  sectionTitle: { fontSize: 20, fontWeight: "700" },
  description: { color: "#555", lineHeight: 20 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
  label: { fontSize: 15, fontWeight: "600" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, fontSize: 14 },
  saveButton: { backgroundColor: "#2563eb", padding: 14, borderRadius: 8, alignItems: "center" },
  saveButtonText: { color: "#fff", fontWeight: "600" },
  help: { color: "#888", fontSize: 12, marginTop: 20, lineHeight: 18 },
});
