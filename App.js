import React from 'react';
import { useFonts } from 'expo-font';
import { ArchivoBlack_400Regular } from '@expo-google-fonts/archivo-black';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { JosefinSans_600SemiBold } from '@expo-google-fonts/josefin-sans';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { SocketProvider } from './src/context/SocketContext';
import RootNavigator from './src/navigation/RootNavigator';
// Registrar el task de GPS antes de que renderice el árbol de componentes
import './src/tasks/locationTask';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    ArchivoBlack_400Regular,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JosefinSans_600SemiBold,
  });

  // Si las fuentes fallan, la app sigue con las del sistema
  if (!fontsLoaded && !fontError) return null;

  return (
    <AuthProvider>
      <ThemeProvider>
        <SocketProvider>
          <RootNavigator />
        </SocketProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
