import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { supabase } from '../../lib/supabase';
import {
  registerForPushNotifications,
  savePushToken,
  removePushToken,
  getNotificationPermissionStatus,
} from '../../lib/notifications';

export default function SettingsScreen() {
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState('free');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? '');
      const { data } = await supabase.from('subscriptions').select('plan,status').eq('user_id', user.id).single();
      if (data?.plan === 'pro' && data?.status !== 'cancelled') setPlan('pro');

      // Check current notification permission state
      const status = await getNotificationPermissionStatus();
      setNotificationsEnabled(status === 'granted');
      setPermissionDenied(status === 'denied');
    }
    load();
  }, []);

  async function handleNotificationToggle(value: boolean) {
    if (notificationLoading) return;
    setNotificationLoading(true);
    try {
      if (value) {
        const token = await registerForPushNotifications();
        if (token) {
          await savePushToken(token);
          setNotificationsEnabled(true);
          setPermissionDenied(false);
        } else {
          // Permission denied
          setPermissionDenied(true);
          Alert.alert(
            '通知の許可が必要です',
            '設定アプリから通知を許可してください。\n設定 → ペットヘルスOS → 通知',
            [
              { text: 'キャンセル', style: 'cancel' },
              { text: '設定を開く', onPress: () => Linking.openSettings() },
            ]
          );
        }
      } else {
        await removePushToken();
        setNotificationsEnabled(false);
      }
    } catch (e) {
      console.error('通知設定エラー:', e);
      Alert.alert('エラー', '通知設定の変更に失敗しました');
    } finally {
      setNotificationLoading(false);
    }
  }

  const isPro = plan === 'pro';

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
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>プッシュ通知</Text>
              {permissionDenied && (
                <TouchableOpacity onPress={() => Linking.openSettings()}>
                  <Text style={styles.permissionHint}>設定から通知を許可してください →</Text>
                </TouchableOpacity>
              )}
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              disabled={notificationLoading}
              trackColor={{ false: '#d4d4d8', true: '#10b981' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>法的情報</Text>
          <TouchableOpacity
            style={[styles.row, styles.rowLast]}
            onPress={() => router.push('/(app)/privacy' as never)}
            activeOpacity={0.7}
          >
            <Text style={styles.rowLabel}>プライバシーポリシー</Text>
            <Text style={styles.rowChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>このアプリについて</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>バージョン</Text>
            <Text style={styles.rowValue}>{Constants.expoConfig?.version ?? '1.0.0'}</Text>
          </View>
          <View style={[styles.row, styles.rowLast]}>
            <Text style={styles.rowLabel}>サポート</Text>
            <Text style={styles.rowValue}>support@pethealthos.com</Text>
          </View>
          <View style={styles.copyrightRow}>
            <Text style={styles.copyrightText}>© 2026 Pet Health OS</Text>
          </View>
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
  permissionHint: { fontSize: 12, color: '#f59e0b', marginTop: 4 },
  rowChevron: { fontSize: 20, color: '#d4d4d8', fontWeight: '300' },
  copyrightRow: { paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f4f4f5' },
  copyrightText: { fontSize: 12, color: '#a1a1aa', textAlign: 'center' },
});
