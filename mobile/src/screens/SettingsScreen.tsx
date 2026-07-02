import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { WAKE_WORD } from "../config";
import { isWakeWordEnabled, setWakeWordEnabled } from "../services/wakeWordSettings";

export default function SettingsScreen() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      setEnabled(await isWakeWordEnabled());
    })();
  }, []);

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
        subito dopo, anche mentre l'app è in background (schermo bloccato o altra app in primo piano). Usa il
        riconoscimento vocale del telefono, quindi non serve nessun account esterno.
      </Text>

      <View style={styles.row}>
        <Text style={styles.label}>Attiva ascolto</Text>
        <Switch value={enabled} onValueChange={onToggle} />
      </View>

      <Text style={styles.help}>
        Vedi mobile/SETUP.md per i dettagli su permessi e limiti del riconoscimento in background.
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
  help: { color: "#888", fontSize: 12, marginTop: 20, lineHeight: 18 },
});
