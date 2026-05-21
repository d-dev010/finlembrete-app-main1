// app/add.tsx — AddAccountScreen (Versão Ultra-Minimalista)
// Formulário simplificado e responsivo para cadastrar novos lembretes

import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { createAccount } from '../store/useAccountStore';

export default function AddAccountScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [recorrenteDay, setRecorrenteDay] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Obrigatório', 'Informe o nome do lembrete.');
    if (name.trim().length > 60) return Alert.alert('Erro', 'O nome deve ter no máximo 60 caracteres.');

    const day = parseInt(recorrenteDay);
    if (isNaN(day) || day < 1 || day > 31) {
      return Alert.alert('Erro', 'Informe um dia válido entre 1 e 31 para o vencimento.');
    }

    setSaving(true);
    try {
      await createAccount({
        name: name.trim(),
        dueDay: day,
        notes: notes.trim() || undefined,
      });
      Alert.alert(
        'Sucesso 🎉',
        'Lembrete criado com sucesso!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar o lembrete.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        
        {/* Nome do Lembrete */}
        <View style={s.field}>
          <Text style={s.label}>Nome do lembrete *</Text>
          <TextInput
            style={s.input}
            value={name}
            onChangeText={setName}
            placeholder="Ex: Aluguel, Academia, Internet..."
            placeholderTextColor={theme.colors.onSurfaceVariant}
            maxLength={60}
          />
        </View>

        {/* Dia de Vencimento Fixo */}
        <View style={s.field}>
          <Text style={s.label}>Dia de vencimento (Fixo mensal) *</Text>
          <TextInput
            style={s.input}
            value={recorrenteDay}
            onChangeText={text => setRecorrenteDay(text.replace(/\D/g, ''))}
            placeholder="Ex: 10"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            keyboardType="number-pad"
            maxLength={2}
          />
          <Text style={s.hint}>A notificação tocará todo mês nesse mesmo dia.</Text>
        </View>

        {/* Observações */}
        <View style={s.field}>
          <Text style={s.label}>Observações (Opcional)</Text>
          <TextInput
            style={[s.input, { minHeight: 80 }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Alguma nota importante sobre esta conta..."
            placeholderTextColor={theme.colors.onSurfaceVariant}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Botão de Salvar */}
        <TouchableOpacity
          style={[s.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={saving}
        >
          <Ionicons name="checkmark-circle" size={22} color={theme.colors.onPrimary} />
          <Text style={s.saveTxt}>{saving ? 'Salvando...' : 'Criar Lembrete'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { padding: 16, paddingBottom: 40 },
  field: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: theme.colors.onSurface, marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: theme.colors.outline, borderRadius: 12, padding: 14, fontSize: 16, color: theme.colors.onSurface },
  hint: { fontSize: 11, color: theme.colors.onSurfaceVariant, marginTop: 4 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary, paddingVertical: 16, borderRadius: 16, gap: 8, marginTop: 16 },
  saveTxt: { fontSize: 16, fontWeight: '600', color: '#fff' },
});

