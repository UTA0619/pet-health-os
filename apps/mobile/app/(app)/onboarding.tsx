import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../lib/i18n';
import { useTheme } from '../../lib/theme';

const SPECIES_VALUES = ['dog', 'cat', 'rabbit', 'bird', 'other'] as const;
type Species = typeof SPECIES_VALUES[number];

type Step = 'welcome' | 'pet-info' | 'done';

export default function OnboardingScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [step, setStep] = useState<Step>('welcome');

  // Pet form state
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<Species>('dog');
  const [breed, setBreed] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreatePet() {
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
      setStep('done');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t.onboarding.error;
      Alert.alert(t.onboarding.error, msg);
    } finally {
      setLoading(false);
    }
  }

  // ── Step: Welcome ────────────────────────────────────────────
  if (step === 'welcome') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.heroEmoji}>🐾</Text>
          <Text style={[styles.heroTitle, { color: colors.text }]}>{t.onboarding.heroTitle}</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>{t.onboarding.heroSubtitle}</Text>

          <View style={styles.featureList}>
            {[
              { emoji: '📊', text: t.onboarding.feature1 },
              { emoji: '🚨', text: t.onboarding.feature2 },
              { emoji: '📷', text: t.onboarding.feature3 },
              { emoji: '📈', text: t.onboarding.feature4 },
            ].map((f) => (
              <View key={f.emoji} style={[styles.featureRow, { backgroundColor: colors.surface }]}>
                <Text style={styles.featureEmoji}>{f.emoji}</Text>
                <Text style={[styles.featureText, { color: colors.textSecondary }]}>{f.text}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setStep('pet-info');
            }}
            activeOpacity={0.85}
            accessibilityLabel="Get started / はじめる"
            accessibilityRole="button"
          >
            <Text style={styles.primaryBtnText}>{t.onboarding.start}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Step: Pet Info ───────────────────────────────────────────
  if (step === 'pet-info') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.formContainer}
            keyboardShouldPersistTaps="handled"
          >
            {/* Progress */}
            <View style={styles.progressRow}>
              <View style={[styles.progressDot, styles.progressDotActive]} />
              <View style={styles.progressLine} />
              <View style={styles.progressDot} />
            </View>

            <Text style={[styles.formTitle, { color: colors.text }]}>{t.onboarding.petInfo}</Text>
            <Text style={[styles.formSubtitle, { color: colors.textSecondary }]}>{t.onboarding.petInfoSub}</Text>

            {/* Name */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {t.onboarding.name} <Text style={styles.required}>{t.onboarding.nameRequired}</Text>
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                value={name}
                onChangeText={setName}
                placeholder={t.onboarding.namePlaceholder}
                placeholderTextColor={colors.textMuted}
                returnKeyType="next"
                maxLength={50}
              />
            </View>

            {/* Species */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t.onboarding.species}</Text>
              <View style={styles.speciesGrid}>
                {SPECIES_VALUES.map((val) => {
                  const labelKey = `species_${val}` as keyof typeof t.onboarding;
                  return (
                    <TouchableOpacity
                      key={val}
                      style={[
                        styles.speciesBtn,
                        { backgroundColor: colors.inputBg, borderColor: colors.border },
                        species === val && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSpecies(val);
                      }}
                      activeOpacity={0.7}
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

            {/* Breed */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t.onboarding.breed}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                value={breed}
                onChangeText={setBreed}
                placeholder={t.onboarding.breedPlaceholder}
                placeholderTextColor={colors.textMuted}
                returnKeyType="next"
                maxLength={100}
              />
            </View>

            {/* Weight */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t.onboarding.weight}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                value={weightKg}
                onChangeText={setWeightKg}
                placeholder={t.onboarding.weightPlaceholder}
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                returnKeyType="done"
                maxLength={6}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }, loading && styles.primaryBtnDisabled]}
              onPress={handleCreatePet}
              disabled={loading}
              activeOpacity={0.85}
              accessibilityLabel={loading ? "Registering / 登録中" : "Register pet / ペットを登録する"}
              accessibilityRole="button"
              accessibilityState={{ disabled: loading }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>{t.onboarding.register}</Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 32 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Step: Done ───────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.doneContainer}>
        <Text style={styles.doneEmoji}>🎉</Text>
        <Text style={[styles.doneTitle, { color: colors.text }]}>{t.onboarding.doneTitle}</Text>
        <Text style={[styles.doneSubtitle, { color: colors.textSecondary }]}>
          <Text style={styles.donePetName}>{name}</Text>
          {t.onboarding.doneSub}
        </Text>

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.replace('/(app)' as never);
          }}
          activeOpacity={0.85}
          accessibilityLabel="Go to dashboard / ダッシュボードへ"
          accessibilityRole="button"
        >
          <Text style={styles.primaryBtnText}>{t.onboarding.toDashboard}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  // Welcome
  welcomeContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 28,
  },
  heroEmoji: { fontSize: 72, marginBottom: 16 },
  heroTitle: {
    fontSize: 28, fontWeight: '800',
    textAlign: 'center', lineHeight: 36, marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 14, textAlign: 'center',
    lineHeight: 22, marginBottom: 28,
  },
  featureList: { width: '100%', marginBottom: 36 },
  featureRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, padding: 14, marginBottom: 8,
  },
  featureEmoji: { fontSize: 22, marginRight: 12 },
  featureText: { fontSize: 14, fontWeight: '500', flex: 1 },

  // Form
  formContainer: { padding: 24, paddingTop: 16 },
  progressRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', marginBottom: 24,
  },
  progressDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#d1d5db',
  },
  progressDotActive: { backgroundColor: '#10b981' },
  progressLine: { flex: 0, width: 40, height: 2, backgroundColor: '#d1d5db', marginHorizontal: 8 },
  formTitle: {
    fontSize: 22, fontWeight: '800',
    marginBottom: 4,
  },
  formSubtitle: { fontSize: 13, marginBottom: 24 },
  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  required: { color: '#ef4444' },
  input: {
    borderRadius: 12, padding: 14,
    fontSize: 15, borderWidth: 1,
  },
  speciesGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  speciesBtn: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1.5,
  },
  speciesBtnText: { fontSize: 14 },

  // Shared
  primaryBtn: {
    borderRadius: 14, padding: 16, alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Done
  doneContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 32,
  },
  doneEmoji: { fontSize: 72, marginBottom: 16 },
  doneTitle: {
    fontSize: 28, fontWeight: '800',
    marginBottom: 12,
  },
  doneSubtitle: {
    fontSize: 15, textAlign: 'center',
    lineHeight: 24, marginBottom: 40,
  },
  donePetName: { color: '#10b981', fontWeight: '700' },
});
