import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';

function AppChrome() {
  const { resolvedTheme } = useTheme();
  return (
    <>
      <StatusBar style={resolvedTheme === 'light' ? 'dark' : 'light'} />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppChrome />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
