import React from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../auth/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import NotesListScreen from "../screens/NotesListScreen";
import NoteDetailScreen from "../screens/NoteDetailScreen";
import SettingsScreen from "../screens/SettingsScreen";
import WakeWordListener from "../services/WakeWordListener";
import { Note } from "../types";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type RootStackParamList = {
  NotesList: undefined;
  NoteDetail: { noteId: string; note: Note };
  Settings: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <>
      <WakeWordListener />
      <RootStack.Navigator>
        <RootStack.Screen name="NotesList" component={NotesListScreen} options={{ title: "Appunti Vocali" }} />
        <RootStack.Screen name="NoteDetail" component={NoteDetailScreen} options={{ title: "Appunto" }} />
        <RootStack.Screen name="Settings" component={SettingsScreen} options={{ title: "Impostazioni" }} />
      </RootStack.Navigator>
    </>
  );
}

export default function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <NavigationContainer>{user ? <AppNavigator /> : <AuthNavigator />}</NavigationContainer>;
}
