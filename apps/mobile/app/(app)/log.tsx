import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { type MetricKey } from '../../lib/types';
import { useI18n } from '../../lib/i18n';
import { useTheme } from '../../lib/theme';

const METRIC_KEYS: MetricKey[] = ['activity_level', 'appetite', 'stool_quality', 'coat_condition', 'eye_clarity', 'energy_level'];
const METRICS = METRIC_KEYS;
const SCORE_EMOJI = ['', '😫', '😟', '😐', '🙂', '😊'];

type Values = Record<MetricKey, number>;

export default function LogScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
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
      Alert.alert(t.log.success, t.log.successMsg, [{ text: 'Home', onPress: () => router.replace('/(app)') }]);
    } catch {
      Alert.alert(t.log.error, t.log.saveError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{petName ? `${petName} ${t.log.subtitle}` : t.log.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.log.each}</Text>
        </View>

        {todayLogged && (
          <View style={[styles.alreadyLogged, { backgroundColor: colors.primaryLight, borderColor: colors.accent }]}>
            <Text style={[styles.alreadyLoggedText, { color: colors.primaryDark }]}>✅ {t.log.alreadyLogged}</Text>
          </View>
        )}

        {METRICS.map((metric) => (
          <View key={metric} style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.metricLabel, { color: colors.text }]}>{t.metrics[metric]}</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[styles.ratingBtn, { borderColor: colors.border, backgroundColor: colors.inputBg }, values[metric] === v && styles.ratingBtnActive]}
                  onPress={() => setMetric(metric, v)}
                  activeOpacity={0.7}
                  accessibilityLabel={`${t.metrics[metric]} ${v} / 5`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: values[metric] === v }}
                >
                  <Text style={styles.ratingEmoji}>{SCORE_EMOJI[v]}</Text>
                  <Text style={[styles.ratingNum, { color: colors.textSecondary }, values[metric] === v && styles.ratingNumActive]}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Notes */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.metricLabel, { color: colors.text }]}>{t.log.notes}</Text>
          <TextInput
            style={[styles.textarea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg }]}
            value={notes}
            onChangeText={setNotes}
            placeholder={t.log.notesPlaceholder}
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            maxLength={500}
          />
          <Text style={[styles.charCount, { color: colors.textMuted }]}>{notes.length}/500</Text>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
          accessibilityLabel={loading ? "Saving / 保存中" : "Save health log / 記録を保存する"}
          accessibilityRole="button"
          accessibilityState={{ disabled: loading }}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{t.log.submit}</Text>}
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
