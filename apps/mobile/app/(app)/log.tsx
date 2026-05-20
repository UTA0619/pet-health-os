import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { METRIC_LABELS, type MetricKey } from '../../lib/types';

const METRICS = Object.keys(METRIC_LABELS) as MetricKey[];
const SCORE_EMOJI = ['', '😫', '😟', '😐', '🙂', '😊'];

type Values = Record<MetricKey, number>;

export default function LogScreen() {
  const [petId, setPetId] = useState<string | null>(null);
  const [petName, setPetName] = useState('');
  const [values, setValues] = useState<Values>({
    activity_level: 3, appetite: 3, stool_quality: 3,
    coat_condition: 3, eye_clarity: 3, energy_level: 3,
  });
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [todayLogged, setTodayLogged] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: pet } = await supabase.from('pets').select('id,name').eq('owner_id', user.id).eq('is_active', true).limit(1).single();
      if (!pet) return;
      setPetId(pet.id);
      setPetName(pet.name);
      const today = new Date().toISOString().split('T')[0];
      const { data: existing } = await supabase.from('health_logs').select('*').eq('pet_id', pet.id).eq('log_date', today).single();
      if (existing) {
        setTodayLogged(true);
        setValues({ activity_level: existing.activity_level ?? 3, appetite: existing.appetite ?? 3, stool_quality: existing.stool_quality ?? 3, coat_condition: existing.coat_condition ?? 3, eye_clarity: existing.eye_clarity ?? 3, energy_level: existing.energy_level ?? 3 });
        setNotes(existing.notes ?? '');
      }
    }
    init();
  }, []);

  function setMetric(metric: MetricKey, v: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setValues(prev => ({ ...prev, [metric]: v }));
  }

  async function handleSubmit() {
    if (!petId) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/health-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
        body: JSON.stringify({ pet_id: petId, log_date: today, ...values, notes: notes || undefined }),
      });
      if (!res.ok) throw new Error('Failed');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ 保存しました', `${petName}の今日の健康記録を保存しました！`, [{ text: 'ホームへ', onPress: () => router.replace('/(app)') }]);
    } catch {
      Alert.alert('エラー', '保存に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>{petName ? `${petName}の` : ''}今日の健康記録</Text>
          <Text style={styles.subtitle}>各項目を1〜5で評価してください</Text>
        </View>

        {todayLogged && (
          <View style={styles.alreadyLogged}>
            <Text style={styles.alreadyLoggedText}>✅ 今日はすでに記録済みです。更新できます。</Text>
          </View>
        )}

        {METRICS.map((metric) => (
          <View key={metric} style={styles.card}>
            <Text style={styles.metricLabel}>{METRIC_LABELS[metric]}</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[styles.ratingBtn, values[metric] === v && styles.ratingBtnActive]}
                  onPress={() => setMetric(metric, v)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.ratingEmoji}>{SCORE_EMOJI[v]}</Text>
                  <Text style={[styles.ratingNum, values[metric] === v && styles.ratingNumActive]}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Notes */}
        <View style={styles.card}>
          <Text style={styles.metricLabel}>メモ（任意）</Text>
          <TextInput
            style={styles.textarea}
            value={notes}
            onChangeText={setNotes}
            placeholder="気になること、特記事項など..."
            placeholderTextColor="#a1a1aa"
            multiline
            numberOfLines={3}
            maxLength={500}
          />
          <Text style={styles.charCount}>{notes.length}/500</Text>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>記録を保存してスコアを計算</Text>}
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f4f5' },
  scroll: { flex: 1 },
  header: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 20, fontWeight: '700', color: '#18181b' },
  subtitle: { fontSize: 14, color: '#71717a', marginTop: 4 },
  alreadyLogged: { marginHorizontal: 16, marginBottom: 8, backgroundColor: '#ecfdf5', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#6ee7b7' },
  alreadyLoggedText: { fontSize: 13, color: '#065f46' },
  card: { margin: 8, marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  metricLabel: { fontSize: 15, fontWeight: '600', color: '#18181b', marginBottom: 12 },
  ratingRow: { flexDirection: 'row', gap: 8 },
  ratingBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 2, borderColor: '#e4e4e7', backgroundColor: '#fafafa' },
  ratingBtnActive: { borderColor: '#10b981', backgroundColor: '#ecfdf5' },
  ratingEmoji: { fontSize: 20 },
  ratingNum: { fontSize: 12, color: '#71717a', marginTop: 2 },
  ratingNumActive: { color: '#10b981', fontWeight: '700' },
  textarea: { borderWidth: 1.5, borderColor: '#e4e4e7', borderRadius: 12, padding: 12, fontSize: 15, color: '#18181b', minHeight: 80, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: '#a1a1aa', textAlign: 'right', marginTop: 4 },
  submitBtn: { margin: 16, backgroundColor: '#10b981', borderRadius: 14, padding: 18, alignItems: 'center' },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
