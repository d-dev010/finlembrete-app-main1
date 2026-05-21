# FinLembrete 🔔💸

Um aplicativo móvel **Local-First** e **Ultra-Minimalista** para lembrar o vencimento de contas recorrentes com precisão, privacidade e elegância. 

Sem excesso de recursos. Sem gráficos complexos ou campos desnecessários. Apenas seus lembretes essenciais com notificações persistentes e o clássico som de "cha-ching"!

---

## 🌟 Diferenciais do FinLembrete

1. **Privacidade Absoluta (Local-First):** Nenhum dado financeiro ou lembrete seu sai do seu celular. Toda a inteligência e o armazenamento rodam offline no processador do próprio smartphone.
2. **Notificações Precisas e Garantidas:** Utiliza o agendador nativo do sistema operacional. Mesmo com o app totalmente fechado ou sem internet, o alerta tocará no horário exato.
3. **Design Ultra-Minimalista:** Visual limpo, focado e sem distrações. Uma aba para tudo e outra dedicada para itens atrasados, com acesso rápido para confirmar o pagamento ou editar o lembrete.
4. **Som Clássico ("Cha-Ching"):** Alertas sonoros nostálgicos e divertidos que chamam a sua atenção na hora certa.

---

## 🛠️ Arquitetura e Tecnologia

O FinLembrete foi construído utilizando tecnologias modernas e de alta performance no ecossistema mobile:

* **React Native & Expo (Bare Workflow / Expo Router):** Estrutura moderna baseada em rotas de arquivo no diretório `app/`.
* **TypeScript:** Código robusto, tipado e livre de erros de compilação.
* **SQLite (expo-sqlite):** Banco de dados relacional físico no armazenamento interno protegido do aparelho.
* **Expo Notifications:** Integração direta com os serviços de notificação nativos do iOS (APNs) e Android (FCM), configurando canais de alta prioridade.

---

## ⏰ Regras de Notificações Locais

No modelo de produção do FinLembrete, cada lembrete cadastrado agenda automaticamente **2 gatilhos silenciosos e precisos** no despertador interno do celular:

* **Gatilho 1 (Véspera):** 1 dia antes do vencimento cadastrado, às **09:00 AM** local.
  * *Mensagem:* `📅 Conta vence amanhã: [Nome]`
* **Gatilho 2 (Dia do Vencimento):** No dia do vencimento cadastrado, às **09:00 AM** local.
  * *Mensagem:* `🔔 Conta vence hoje: [Nome]`

> [!IMPORTANT]
> Quando você toca em **"Confirmar Pagamento"** na Home, o aplicativo limpa imediatamente as notificações agendadas para aquele período específico e agenda o próximo mês de forma transparente, economizando recursos do sistema.

---

## 📂 Estrutura do Projeto


```
├── apps/
│   └── mobile/
│       ├── app/                     # Telas do Expo Router (Navegação)
│       │   ├── (tabs)/
│       │   │   ├── _layout.tsx      # Configuração da raiz e tabs ocultas
│       │   │   └── index.tsx        # Home Screen (Todas / Atrasadas, FAB e Lista)
│       │   ├── add.tsx              # Tela de Criação de Lembrete
│       │   ├── edit.tsx             # Tela de Edição de Lembrete
│       │   └── _layout.tsx          # Layout global e inicializador de canais
│       ├── assets/
│       │   └── sounds/
│       │       └── chaching.wav     # Arquivo de som clássico de caixa registradora
│       ├── components/
│       │   └── AccountCard.tsx      # Card dinâmico para exibição de contas na Home
│       ├── services/
│       │   ├── notifications.ts     # Serviço nativo de agendamento de alertas
│       │   └── storage.ts           # Acesso ao SQLite local
│       ├── store/
│       │   └── useAccountStore.ts   # Cérebro do App: Lógica de projeção mensal e estados
│       ├── types/
│       │   └── index.ts             # Definições globais de interfaces de dados
│       └── theme.ts                 # Paleta de cores, tipografia e espaçamento
```

---

## 🚀 Como Executar o Projeto Localmente

### 1. Pré-requisitos
Certifique-se de ter o **Node.js** instalado na sua máquina.

### 2. Instalação das Dependências
Na pasta raiz do projeto, instale os pacotes necessários rodando:
```bash
npm install
```

### 3. Rodar em Ambiente de Desenvolvimento
Navegue para o workspace do aplicativo mobile e inicie o servidor Expo:
```bash
cd apps/mobile
npx expo start
```
* Pressione `a` para abrir no emulador Android.
* Pressione `i` para abrir no emulador iOS.
* Ou escaneie o código QR com a câmera ou o app Expo Go no seu smartphone real.
