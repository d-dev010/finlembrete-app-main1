// services/notifications.ts — Som de Caixa Registradora Antiga
// Conforme especificado em lembretes-notificacoes.md

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { set, subDays } from 'date-fns';

// Handler global: exibe alerta + som sempre que chegar uma notificação
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const CHANNEL_ID = 'bill-reminders';
const SOUND_FILE  = 'chaching.wav';

/**
 * Cria o canal Android com o som de caixa registradora.
 * Deve ser chamado UMA VEZ na inicialização do app (_layout.tsx).
 */
export async function configureNotificationChannels(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Lembretes de Contas',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 150, 80, 150],
      lightColor: '#4DB896',
      sound: SOUND_FILE,
    });
  }
}

/**
 * Solicita permissão de notificações ao usuário.
 */
export async function requestPermissions(): Promise<void> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    console.warn('FinLembrete: permissão de notificações negada.');
  }
}

/**
 * Agenda 2 notificações para uma conta:
 *  - 1 dia antes do vencimento às 09:00 🔔 "cha-ching"
 *  - No dia do vencimento às 09:00 🔔 "cha-ching"
 *
 * @param accountId  ID da conta
 * @param name       Nome da conta (Ex: "Luz", "Netflix")
 * @param dueDateStr Data de vencimento no formato "YYYY-MM-DD"
 * @returns IDs das duas notificações agendadas
 */
export async function scheduleBillNotifications(
  accountId: string,
  name: string,
  dueDateStr: string,
): Promise<{ dayBeforeId: string; dayOfId: string }> {
  const dueDate  = new Date(dueDateStr + 'T00:00:00');
  const times = [
    { hours: 9, minutes: 0, seconds: 0 },
    { hours: 14, minutes: 0, seconds: 0 },
    { hours: 20, minutes: 0, seconds: 0 },
  ];

  // --- Notificações: 1 dia antes ---
  const dayBeforeIds: string[] = [];
  for (const time of times) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📅 Conta vence amanhã',
        body: `Amanhã vence a conta: ${name}`,
        sound: SOUND_FILE,           // iOS
        data: { accountId, channelId: CHANNEL_ID },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: set(subDays(dueDate, 1), time),
      },
    });
    dayBeforeIds.push(id);
  }

  // --- Notificações: no dia do vencimento ---
  const dayOfIds: string[] = [];
  for (const time of times) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 Conta vence hoje',
        body: `Hoje vence a conta: ${name}`,
        sound: SOUND_FILE,           // iOS
        data: { accountId, channelId: CHANNEL_ID },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: set(dueDate, time),
      },
    });
    dayOfIds.push(id);
  }

  return {
    dayBeforeId: dayBeforeIds.join(','),
    dayOfId: dayOfIds.join(','),
  };
}

/**
 * Cancela notificações pelo ID.
 */
export async function cancelBillNotifications(ids: string[]): Promise<void> {
  await Promise.all(
    ids.map(id => Notifications.cancelScheduledNotificationAsync(id)),
  );
}
