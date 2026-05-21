# 🔔 FinLembrete — Sistema de Lembretes e Notificações

Este documento descreve as especificações técnicas, fluxos e configurações do sistema de lembretes ultra-minimalista do **FinLembrete**, focando no agendamento de alertas e na personalização sonora com o efeito clássico de **caixa registradora antiga ("cha-ching")**.

---

## 1. Visão Geral do Sistema

O objetivo principal do aplicativo é garantir que o usuário **nunca se esqueça de pagar uma conta**. Eliminando a complexidade de valores (R$) e categorias, o app foca exclusivamente em duas informações por lembrete:
1. **Nome da Conta** (Ex: *Aluguel*, *Internet*, *Luz*)
2. **Dia de Vencimento** (Dia fixo do mês de 1 a 31 para contas recorrentes, ou data específica para contas avulsas)

As notificações são agendadas de forma **local e offline** no próprio dispositivo do usuário, garantindo privacidade absoluta e funcionamento sem internet.

---

## 2. Regras de Disparo dos Lembretes

Cada conta ativa no aplicativo agenda automaticamente **2 notificações push locais** de forma cronológica:

| Gatilho Temporal | Horário | Conteúdo do Alerta | Som do Alerta |
| :--- | :--- | :--- | :--- |
| **1 dia antes do vencimento** | `09:00 AM` | "📅 Amanhã vence a conta: **[Nome]**" | Caixa Registradora 🔊 |
| **No dia do vencimento** | `09:00 AM` | "🔔 Hoje vence a conta: **[Nome]**" | Caixa Registradora 🔊 |

---

## 3. Configuração do Som de Caixa Registradora ("Cha-ching")

Para criar uma experiência marcante e satisfatória, as notificações utilizam um arquivo de áudio personalizado: `chaching.wav` (som de caixa registradora antiga).

### 3.1 Estrutura de Arquivos no Projeto
O arquivo de som deve ser colocado na pasta de ativos do projeto móvel:
```
apps/mobile/
├── assets/
│   └── sounds/
│       └── chaching.wav  <-- Arquivo de áudio (formato PCM WAV, leve e curto)
```

### 3.2 Configuração no `app.json` (Expo Config Plugin)
Para que o Expo compile o arquivo de som nas pastas nativas de recursos (`res/raw` no Android e o bundle principal no iOS), registramos o som no plugin do `expo-notifications`:

```json
{
  "expo": {
    "name": "FinLembrete",
    "slug": "finlembrete",
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#4DB896",
          "sounds": [
            "./assets/sounds/chaching.wav"
          ]
        }
      ]
    ]
  }
}
```

---

## 4. Implementação Técnica das Notificações

### 4.1 Criação do Canal no Android (Notification Channel)
A partir do Android 8.0 (API 26), sons personalizados precisam ser vinculados a um **Canal de Notificação** com importância máxima. O canal é configurado no arquivo `services/notifications.ts`:

```typescript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function configureNotificationChannels() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('bill-reminders', {
      name: 'Lembretes de Contas',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4DB896',
      sound: 'chaching.wav', // Referência ao arquivo de áudio registrado no app.json
    });
  }
}
```

### 4.2 Agendando a Notificação
Ao programar a notificação local, o som é referenciado diretamente no payload (necessário para iOS) e o canal é especificado nos metadados (necessário para Android):

```typescript
import * as Notifications from 'expo-notifications';
import { set, subDays } from 'date-fns';

export async function scheduleBillNotification(
  id: string,
  name: string,
  dueDate: Date
): Promise<{ dayBeforeId: string; dayOfId: string }> {
  
  const morningTime = { hour: 9, minute: 0, second: 0 };
  
  // 1. Alerta de 1 dia antes
  const dayBeforeId = await Notifications.scheduleNotificationAsync({
    content: {
      title: '📅 Conta vence amanhã',
      body: `Amanhã vence a conta: ${name}`,
      sound: 'chaching.wav', // Som para iOS
      data: { billId: id, channelId: 'bill-reminders' }, // Canal para Android
    },
    trigger: set(subDays(dueDate, 1), morningTime),
  });

  // 2. Alerta do dia do vencimento
  const dayOfId = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔔 Conta vence hoje',
      body: `Hoje vence a conta: ${name}`,
      sound: 'chaching.wav', // Som para iOS
      data: { billId: id, channelId: 'bill-reminders' }, // Canal para Android
    },
    trigger: set(dueDate, morningTime),
  });

  return { dayBeforeId, dayOfId };
}
```

---

## 5. Como Testar e Buildar com Som Personalizado

> [!WARNING]
> **Importante para Testes:** Customizações de som nativas (como a inclusão de arquivos `.wav` no empacotamento) **não são totalmente suportadas pelo Expo Go básico**.
>
> Para escutar o som clássico de caixa registradora funcionando no seu celular durante o desenvolvimento, siga estes passos:

1. **Gere as pastas nativas (Build de Desenvolvimento):**
   ```bash
   npx expo run:android
   # ou
   npx expo run:ios
   ```
   Isso compilará o aplicativo no seu dispositivo/emulador real vinculando o som `chaching.wav` diretamente no código nativo do sistema.
2. Certifique-se de que o dispositivo **não está no modo silencioso** ou "Não Perturbe" na hora do disparo do teste!
