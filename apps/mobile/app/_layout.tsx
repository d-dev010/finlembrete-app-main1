// app/_layout.tsx — Layout raiz do Expo Router

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { requestPermissions, configureNotificationChannels } from '../services/notifications';
import { theme } from '../theme';

export default function RootLayout() {
  useEffect(() => {
    // Inicializações de notificações na primeira abertura
    requestPermissions();
    configureNotificationChannels();
  }, []);

  return (
    <>
      <StatusBar style="dark" backgroundColor={theme.colors.background} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.primaryLight,
          },
          headerTintColor: theme.colors.onSurface,
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
          contentStyle: {
            backgroundColor: theme.colors.background,
          },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="add"
          options={{
            title: 'Nova Conta',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="edit"
          options={{
            title: 'Editar Conta',
          }}
        />
      </Stack>
    </>
  );
}
