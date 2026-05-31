import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../lib/i18n';
import { useTheme } from '../../lib/theme';

const SPECIES_VALUES = ['dog', 'cat', 'rabbit', 'bird', 'other'] as const;
type Species = typeof SPECIES_VALUES[number];

export default function AddPetScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<Species>('dog');
  const [breed, setBreed] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert(t.onboarding.inputError, t.onboarding.nameRequired2);
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/(auth)/login' as never); return; }
      const weight = parseFloat(weightKg);
      const { error } = await supabase.from('pets').insert({
        owner_id: user.id,
        name: name.trim(),
        species,
        breed: breed.trim() || null,
        weight_kg: isNaN(weight) ? null : weight,
        is_active: true,
      });
      if (error) throw error;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e: unknown) {
      Alert.alert(t.pets.error, e instanceof Error ? e.message : t.pets.saveError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Back / 戻る" accessibilityRole="button">
            <Text style={[styles.backBtn, { color: colors.primary }]}>‹ {t.common.cancel}</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t.pets.addTitle}</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t.pets.name}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              value={name}
              onChangeText={setName}
              placeholder={t.pets.namePlaceholder}
              placeholderTextColor={colors.textMuted}
              maxLength={50}
              accessibilityLabel="Pet name / ペットの名前"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t.pets.speciesLabel}</Text>
            <View style={styles.speciesGrid}>
              {SPECIES_VALUES.map((val) => {
                const labelKey = `species_${val}` as keyof typeof t.onboarding;
                return (
                  <TouchableOpacity
                    key={val}
                    style={[styles.speciesBtn, { borderColor: colors.border, backgroundColor: colors.inputBg }, species === val && { borderColor: colors.primary, backgroundColor: colors.primaryLight }]}
                    onPress={() => { Haptics.selectionAsync(); setSpecies(val); }}
                    accessibilityLabel={String(t.onboarding[labelKey])}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: species === val }}
                  >
                    <Text style={[styles.speciesBtnText, { color: colors.text }]}>{String(t.onboarding[labelKey])}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t.pets.breed}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              value={breed}
              onChangeText={setBreed}
              placeholder={t.pets.breedPlaceholder}
              placeholderTextColor={colors.textMuted}
              maxLength={100}
              accessibilityLabel="Breed / 品種"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t.pets.weight}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              value={weightKg}
              onChangeText={setWeightKg}
              placeholder={t.pets.weightPlaceholder}
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              maxLength={6}
              accessibilityLabel="Weight in kg / 体重 kg"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }, loading && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
            accessibilityLabel={loading ? 'Saving / 保存中' : 'Save pet / ペットを保存'}
            accessibilityRole="button"
            accessibilityState={{ disabled: loading }}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t.pets.save}</Text>}
          </TouchableOpacity>
          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  backBtn: { fontSize: 17, fontWeight: '500', minWidth: 60 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  content: { padding: 20 },
  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderRadius: 12, padding: 14,
    fontSize: 15,
  },
  speciesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  speciesBtn: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1.5,
  },
  speciesBtnText: { fontSize: 14 },
  saveBtn: {
    borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
