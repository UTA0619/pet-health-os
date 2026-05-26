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

const SPECIES_VALUES = ['dog', 'cat', 'rabbit', 'bird', 'other'] as const;
type Species = typeof SPECIES_VALUES[number];

type Step = 'welcome' | 'pet-info' | 'done';

export default function OnboardingScreen() {
  const { t } = useI18n();
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
      <SafeAreaView style={styles.safe}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.heroEmoji}>🐾</Text>
          <Text style={styles.heroTitle}>{t.onboarding.heroTitle}</Text>
          <Text style={styles.heroSubtitle}>{t.onboarding.heroSubtitle}</Text>

          <View style={styles.featureList}>
            {[
              { emoji: '📊', text: t.onboarding.feature1 },
              { emoji: '🚨', text: t.onboarding.feature2 },
              { emoji: '📷', text: t.onboarding.feature3 },
              { emoji: '📈', text: t.onboarding.feature4 },
            ].map((f) => (
              <View key={f.emoji} style={styles.featureRow}>
                <Text style={styles.featureEmoji}>{f.emoji}</Text>
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
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
      <SafeAreaView style={styles.safe}>
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

            <Text style={styles.formTitle}>{t.onboarding.petInfo}</Text>
            <Text style={styles.formSubtitle}>{t.onboarding.petInfoSub}</Text>

            {/* Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                {t.onboarding.name} <Text style={styles.required}>{t.onboarding.nameRequired}</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={t.onboarding.namePlaceholder}
                placeholderTextColor="#a1a1aa"
                returnKeyType="next"
                maxLength={50}
              />
            </View>

            {/* Species */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t.onboarding.species}</Text>
              <View style={styles.speciesGrid}>
                {SPECIES_VALUES.map((val) => {
                  const labelKey = `species_${val}` as keyof typeof t.onboarding;
                  return (
                    <TouchableOpacity
                      key={val}
                      style={[
                        styles.speciesBtn,
                        species === val && styles.speciesBtnActive,
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
                      <Text style={styles.speciesBtnText}>{String(t.onboarding[labelKey])}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Breed */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t.onboarding.breed}</Text>
              <TextInput
                style={styles.input}
                value={breed}
                onChangeText={setBreed}
                placeholder={t.onboarding.breedPlaceholder}
                placeholderTextColor="#a1a1aa"
                returnKeyType="next"
                maxLength={100}
              />
            </View>

            {/* Weight */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t.onboarding.weight}</Text>
              <TextInput
                style={styles.input}
                value={weightKg}
                onChangeText={setWeightKg}
                placeholder={t.onboarding.weightPlaceholder}
                placeholderTextColor="#a1a1aa"
                keyboardType="decimal-pad"
                returnKeyType="done"
                maxLength={6}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
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
    <SafeAreaView style={styles.safe}>
      <View style={styles.doneContainer}>
        <Text style={styles.doneEmoji}>🎉</Text>
        <Text style={styles.doneTitle}>{t.onboarding.doneTitle}</Text>
        <Text style={styles.doneSubtitle}>
          <Text style={styles.donePetName}>{name}</Text>
          {t.onboarding.doneSub}
        </Text>

        <TouchableOpacity
          style={styles.primaryBtn}
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
  safe: { flex: 1, backgroundColor: '#f4f4f5' },

  // Welcome
  welcomeContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 28,
  },
  heroEmoji: { fontSize: 72, marginBottom: 16 },
  heroTitle: {
    fontSize: 28, fontWeight: '800', color: '#18181b',
    textAlign: 'center', lineHeight: 36, marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 14, color: '#71717a', textAlign: 'center',
    lineHeight: 22, marginBottom: 28,
  },
  featureList: { width: '100%', marginBottom: 36 },
  featureRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12,
    padding: 14, marginBottom: 8,
  },
  featureEmoji: { fontSize: 22, marginRight: 12 },
  featureText: { fontSize: 14, color: '#374151', fontWeight: '500', flex: 1 },

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
    fontSize: 22, fontWeight: '800', color: '#18181b',
    marginBottom: 4,
  },
  formSubtitle: { fontSize: 13, color: '#71717a', marginBottom: 24 },
  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#3f3f46', marginBottom: 8 },
  required: { color: '#ef4444' },
  input: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    fontSize: 15, color: '#18181b',
    borderWidth: 1, borderColor: '#e4e4e7',
  },
  speciesGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  speciesBtn: {
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: '#fff', borderRadius: 10,
    borderWidth: 1.5, borderColor: '#e4e4e7',
  },
  speciesBtnActive: {
    borderColor: '#10b981', backgroundColor: '#ecfdf5',
  },
  speciesBtnText: { fontSize: 14, color: '#374151' },

  // Shared
  primaryBtn: {
    backgroundColor: '#10b981', borderRadius: 14,
    padding: 16, alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnDisabled: { backgroundColor: '#6ee7b7' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Done
  doneContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 32,
  },
  doneEmoji: { fontSize: 72, marginBottom: 16 },
  doneTitle: {
    fontSize: 28, fontWeight: '800', color: '#18181b',
    marginBottom: 12,
  },
  doneSubtitle: {
    fontSize: 15, color: '#71717a', textAlign: 'center',
    lineHeight: 24, marginBottom: 40,
  },
  donePetName: { color: '#10b981', fontWeight: '700' },
});
