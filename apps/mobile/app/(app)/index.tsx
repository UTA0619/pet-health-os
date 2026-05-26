import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import type { Pet, HealthScore, HealthLog } from '../../lib/types';
import { useTheme } from '../../lib/theme';
import { DashboardSkeleton } from '../../components/dashboard-skeleton';
import { useI18n } from '../../lib/i18n';

function ScoreCircle({ score, trend }: { score: number; trend: string }) {
  const { colors } = useTheme();
  const color = score >= 80 ? colors.scoreGreen : score >= 60 ? colors.scoreYellow : colors.scoreRed;
  const trendEmoji = trend === 'improving' ? '↑' : trend === 'declining' ? '↓' : '→';
  return (
    <View style={[scoreStyles.circle, { borderColor: color, backgroundColor: colors.surface }]}>
      <Text style={[scoreStyles.number, { color }]}>{score}</Text>
      <Text style={[scoreStyles.label, { color: colors.textSecondary }]}>/ 100</Text>
      <Text style={scoreStyles.trend}>{trendEmoji}</Text>
    </View>
  );
}

const scoreStyles = StyleSheet.create({
  circle: {
    width: 160, height: 160, borderRadius: 80,
    borderWidth: 6, alignItems: 'center', justifyContent: 'center',
  },
  number: { fontSize: 48, fontWeight: '800' },
  label: { fontSize: 14, marginTop: -4 },
  trend: { fontSize: 20, marginTop: 4 },
});

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [pet, setPet] = useState<Pet | null>(null);
  const [score, setScore] = useState<HealthScore | null>(null);
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayLogged, setTodayLogged] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: pets } = await supabase.from('pets').select('id,name,species,photo_url').eq('owner_id', user.id).eq('is_active', true).limit(1).single();
      if (!pets) { router.replace('/(app)/onboarding' as never); return; }
      setPet(pets);

      const today = new Date().toISOString().split('T')[0];
      const [scoreData, logsData, todayLogData] = await Promise.all([
        supabase.from('health_scores').select('*').eq('pet_id', pets.id).order('score_date', { ascending: false }).limit(1).single(),
        supabase.from('health_logs').select('*').eq('pet_id', pets.id).order('log_date', { ascending: false }).limit(7),
        supabase.from('health_logs').select('id').eq('pet_id', pets.id).eq('log_date', today).single(),
      ]);

      if (scoreData.data) setScore({ overall: scoreData.data.overall_score, trend: scoreData.data.trend_direction, confidence: scoreData.data.confidence, components: scoreData.data.component_scores ?? {} });
      if (logsData.data) setLogs(logsData.data);
      setTodayLogged(!!todayLogData.data);
    } catch (e) {
      console.error(e);
      Alert.alert(
        t.dashboard.error,
        t.dashboard.loadError,
        [{ text: t.dashboard.retry, onPress: load }]
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (loading) return <DashboardSkeleton />;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>{t.dashboard.greeting}</Text>
            <Text style={[styles.petName, { color: colors.text }]}>{pet?.name}{t.dashboard.healthDashboard}</Text>
          </View>
          <TouchableOpacity
            style={[styles.petMgmtBtn, { backgroundColor: colors.primaryLight }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(app)/pets' as never);
            }}
            activeOpacity={0.7}
            accessibilityLabel="Pet management / ペット管理"
            accessibilityRole="button"
          >
            <Text style={styles.petMgmtEmoji}>🐾</Text>
            <Text style={[styles.petMgmtLabel, { color: colors.primaryDark }]}>{t.dashboard.petManagement}</Text>
          </TouchableOpacity>
        </View>

        {/* Score Card */}
        <View style={[styles.scoreCard, { backgroundColor: colors.surface }]}>
          {score ? (
            <>
              <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>{t.dashboard.todayScore}</Text>
              <View style={styles.scoreCenter}>
                <ScoreCircle score={Math.round(score.overall)} trend={score.trend} />
              </View>
              {score.explanation && <Text style={[styles.explanation, { color: colors.textSecondary }]}>{score.explanation}</Text>}
            </>
          ) : (
            <View style={styles.noScore}>
              <Text style={styles.noScoreEmoji}>📊</Text>
              <Text style={[styles.noScoreText, { color: colors.textSecondary }]}>{t.dashboard.noScore}</Text>
            </View>
          )}
        </View>

        {/* Today's log banner */}
        {!todayLogged && (
          <TouchableOpacity style={[styles.logBanner, { backgroundColor: colors.primaryLight, borderColor: colors.accent }]} onPress={() => router.push('/(app)/log' as never)} activeOpacity={0.8} accessibilityLabel="Log today's health / 今日の健康記録をつける" accessibilityRole="button">
            <Text style={[styles.logBannerText, { color: colors.primaryDark }]}>{t.dashboard.logToday}</Text>
          </TouchableOpacity>
        )}

        {/* Recent Logs */}
        {logs.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.dashboard.recentLogs}</Text>
            {logs.slice(0, 5).map((log) => (
              <View key={log.id} style={[styles.logRow, { borderBottomColor: colors.background }]}>
                <Text style={[styles.logDate, { color: colors.textSecondary }]}>{log.log_date}</Text>
                <View style={styles.logMetrics}>
                  {(['activity_level', 'appetite', 'energy_level'] as const).map((k) => (
                    <View key={k} style={[styles.metricBadge, { backgroundColor: colors.primaryLight }]}>
                      <Text style={[styles.metricValue, { color: colors.primary }]}>{log[k]}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
  greeting: { fontSize: 14, color: '#71717a' },
  petName: { fontSize: 20, fontWeight: '700', color: '#18181b' },
  petMgmtBtn: { alignItems: 'center', backgroundColor: '#ecfdf5', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  petMgmtEmoji: { fontSize: 20 },
  petMgmtLabel: { fontSize: 11, color: '#065f46', fontWeight: '600', marginTop: 2 },
  scoreCard: { margin: 16, backgroundColor: '#fff', borderRadius: 20, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#3f3f46', marginBottom: 16 },
  scoreCenter: { marginVertical: 8 },
  explanation: { fontSize: 13, color: '#71717a', textAlign: 'center', marginTop: 12, lineHeight: 18 },
  noScore: { alignItems: 'center', padding: 20 },
  noScoreEmoji: { fontSize: 40, marginBottom: 8 },
  noScoreText: { fontSize: 14, color: '#71717a', textAlign: 'center' },
  logBanner: { marginHorizontal: 16, backgroundColor: '#ecfdf5', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#6ee7b7' },
  logBannerText: { fontSize: 14, color: '#065f46', fontWeight: '600' },
  section: { margin: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#18181b', marginBottom: 12 },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f4f4f5' },
  logDate: { fontSize: 13, color: '#71717a' },
  logMetrics: { flexDirection: 'row', gap: 6 },
  metricBadge: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center' },
  metricValue: { fontSize: 13, fontWeight: '700', color: '#10b981' },
});
