import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import type { Pet, HealthScore, HealthLog } from '../../lib/types';

function ScoreCircle({ score, trend }: { score: number; trend: string }) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  const trendEmoji = trend === 'improving' ? '↑' : trend === 'declining' ? '↓' : '→';
  return (
    <View style={[scoreStyles.circle, { borderColor: color }]}>
      <Text style={[scoreStyles.number, { color }]}>{score}</Text>
      <Text style={scoreStyles.label}>/ 100</Text>
      <Text style={scoreStyles.trend}>{trendEmoji}</Text>
    </View>
  );
}

const scoreStyles = StyleSheet.create({
  circle: {
    width: 160, height: 160, borderRadius: 80,
    borderWidth: 6, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff',
  },
  number: { fontSize: 48, fontWeight: '800' },
  label: { fontSize: 14, color: '#71717a', marginTop: -4 },
  trend: { fontSize: 20, marginTop: 4 },
});

export default function DashboardScreen() {
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
      if (!pets) { router.replace('/onboarding' as never); return; }
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

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#10b981" /></View>;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>こんにちは 👋</Text>
            <Text style={styles.petName}>{pet?.name}の健康ダッシュボード</Text>
          </View>
        </View>

        {/* Score Card */}
        <View style={styles.scoreCard}>
          {score ? (
            <>
              <Text style={styles.cardTitle}>今日の健康スコア</Text>
              <View style={styles.scoreCenter}>
                <ScoreCircle score={Math.round(score.overall)} trend={score.trend} />
              </View>
              {score.explanation && <Text style={styles.explanation}>{score.explanation}</Text>}
            </>
          ) : (
            <View style={styles.noScore}>
              <Text style={styles.noScoreEmoji}>📊</Text>
              <Text style={styles.noScoreText}>健康記録を入力するとスコアが表示されます</Text>
            </View>
          )}
        </View>

        {/* Today's log banner */}
        {!todayLogged && (
          <TouchableOpacity style={styles.logBanner} onPress={() => router.push('/(app)/log' as never)} activeOpacity={0.8}>
            <Text style={styles.logBannerText}>📝 今日の健康記録をつける →</Text>
          </TouchableOpacity>
        )}

        {/* Recent Logs */}
        {logs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>最近の記録</Text>
            {logs.slice(0, 5).map((log) => (
              <View key={log.id} style={styles.logRow}>
                <Text style={styles.logDate}>{log.log_date}</Text>
                <View style={styles.logMetrics}>
                  {(['activity_level', 'appetite', 'energy_level'] as const).map((k) => (
                    <View key={k} style={styles.metricBadge}>
                      <Text style={styles.metricValue}>{log[k]}</Text>
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
  safe: { flex: 1, backgroundColor: '#f4f4f5' },
  scroll: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
  greeting: { fontSize: 14, color: '#71717a' },
  petName: { fontSize: 20, fontWeight: '700', color: '#18181b' },
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
