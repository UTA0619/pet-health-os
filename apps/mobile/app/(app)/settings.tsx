import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function SettingsScreen() {
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState('free');
  const [dailyReminder, setDailyReminder] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? '');
      const { data } = await supabase.from('subscriptions').select('plan,status').eq('user_id', user.id).single();
      if (data?.plan === 'pro' && data?.status !== 'cancelled') setPlan('pro');
    }
    load();
  }, []);

  async function handleSignOut() {
    Alert.alert('サインアウト', 'サインアウトしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'サインアウト', style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/(auth)/login');
        }
      }
    ]);
  }

  const isPro = plan === 'pro';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll}>
        <Text style={styles.pageTitle}>設定</Text>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アカウント</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>メールアドレス</Text>
            <Text style={styles.rowValue}>{email}</Text>
          </View>
          <View style={[styles.row, styles.rowLast]}>
            <View>
              <Text style={styles.rowLabel}>プラン</Text>
              <Text style={[styles.rowValue, isPro && styles.proText]}>{isPro ? '🌟 Proプラン' : 'フリープラン'}</Text>
            </View>
            {!isPro && (
              <TouchableOpacity style={styles.upgradeBtn} onPress={() => Alert.alert('アップグレード', `ブラウザで ${process.env.EXPO_PUBLIC_API_URL}/upgrade を開いてアップグレードしてください`)}>
                <Text style={styles.upgradeBtnText}>アップグレード</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>通知</Text>
          <View style={[styles.row, styles.rowLast]}>
            <Text style={styles.rowLabel}>毎日の健康リマインダー</Text>
            <Switch
              value={dailyReminder}
              onValueChange={setDailyReminder}
              trackColor={{ true: '#10b981' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アプリ情報</Text>
          {[
            { label: 'バージョン', value: '1.0.0' },
            { label: 'サポート', value: 'support@pethealthos.com' },
          ].map(({ label, value }) => (
            <View key={label} style={styles.row}>
              <Text style={styles.rowLabel}>{label}</Text>
              <Text style={styles.rowValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Text style={styles.signOutText}>サインアウト</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f4f5' },
  scroll: { flex: 1 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#18181b', padding: 20, paddingBottom: 12 },
  section: { margin: 16, marginBottom: 0, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#71717a', padding: 16, paddingBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#f4f4f5' },
  rowLast: {},
  rowLabel: { fontSize: 15, color: '#18181b' },
  rowValue: { fontSize: 14, color: '#71717a' },
  proText: { color: '#10b981', fontWeight: '700' },
  upgradeBtn: { backgroundColor: '#10b981', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  upgradeBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  signOutBtn: { margin: 16, marginTop: 24, padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: '#fca5a5', alignItems: 'center', backgroundColor: '#fff' },
  signOutText: { fontSize: 16, fontWeight: '600', color: '#ef4444' },
});
