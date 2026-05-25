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

const SPECIES = [
  { value: 'dog', label: '🐶 犬' },
  { value: 'cat', label: '🐱 猫' },
  { value: 'rabbit', label: '🐰 うさぎ' },
  { value: 'bird', label: '🐦 鳥' },
  { value: 'other', label: '🐾 その他' },
] as const;

type Species = typeof SPECIES[number]['value'];

type Step = 'welcome' | 'pet-info' | 'done';

export default function OnboardingScreen() {
  const [step, setStep] = useState<Step>('welcome');

  // Pet form state
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<Species>('dog');
  const [breed, setBreed] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreatePet() {
    if (!name.trim()) {
      Alert.alert('入力エラー', 'ペットの名前を入力してください');
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
      const msg = e instanceof Error ? e.message : 'エラーが発生しました';
      Alert.alert('エラー', msg);
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
          <Text style={styles.heroTitle}>Pet Health OSへ{'\n'}ようこそ</Text>
          <Text style={styles.heroSubtitle}>
            AIがあなたのペットの健康を毎日見守ります。{'\n'}
            体調の変化を早期発見し、大切な家族を守りましょう。
          </Text>

          <View style={styles.featureList}>
            {[
              { emoji: '📊', text: 'AIが毎日の健康スコアを算出' },
              { emoji: '🚨', text: '異常を検知したらすぐにお知らせ' },
              { emoji: '📷', text: 'カメラで見た目の健康チェック' },
              { emoji: '📈', text: '30日間のトレンドを分析' },
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
          >
            <Text style={styles.primaryBtnText}>はじめる →</Text>
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

            <Text style={styles.formTitle}>ペットの情報を教えてください</Text>
            <Text style={styles.formSubtitle}>後から変更できます</Text>

            {/* Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                名前 <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="例: ポチ"
                placeholderTextColor="#a1a1aa"
                returnKeyType="next"
                maxLength={50}
              />
            </View>

            {/* Species */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>種類</Text>
              <View style={styles.speciesGrid}>
                {SPECIES.map((s) => (
                  <TouchableOpacity
                    key={s.value}
                    style={[
                      styles.speciesBtn,
                      species === s.value && styles.speciesBtnActive,
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSpecies(s.value);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.speciesBtnText}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Breed */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>品種（任意）</Text>
              <TextInput
                style={styles.input}
                value={breed}
                onChangeText={setBreed}
                placeholder="例: トイプードル"
                placeholderTextColor="#a1a1aa"
                returnKeyType="next"
                maxLength={100}
              />
            </View>

            {/* Weight */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>体重 kg（任意）</Text>
              <TextInput
                style={styles.input}
                value={weightKg}
                onChangeText={setWeightKg}
                placeholder="例: 3.5"
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
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>ペットを登録する</Text>
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
        <Text style={styles.doneTitle}>登録完了！</Text>
        <Text style={styles.doneSubtitle}>
          <Text style={styles.donePetName}>{name}</Text>
          の健康管理を始めましょう。{'\n'}
          毎日の記録でAIスコアが更新されます。
        </Text>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.replace('/(app)' as never);
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>ダッシュボードへ →</Text>
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
