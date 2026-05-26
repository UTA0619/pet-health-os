import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../../lib/supabase';
import {
  registerForPushNotifications,
  savePushToken,
  removePushToken,
  getNotificationPermissionStatus,
} from '../../lib/notifications';
import { useI18n } from '../../lib/i18n';

export default function SettingsScreen() {
  const { t, locale, setLocale } = useI18n();
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
            t.settings.notifTitle,
            t.settings.notifMsg,
            [
              { text: t.common.cancel, style: 'cancel' },
              { text: t.settings.openSettings, onPress: () => Linking.openSettings() },
            ]
          );
        }
      } else {
        await removePushToken();
        setNotificationsEnabled(false);
      }
    } catch (e) {
      console.error('notification settings error:', e);
      Alert.alert(t.settings.error, t.settings.notifError);
    } finally {
      setNotificationLoading(false);
    }
  }

  const isPro = plan === 'pro';

  async function handleSignOut() {
    Alert.alert(t.settings.signOutTitle, t.settings.signOutMsg, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.settings.signOut, style: 'destructive',
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
        <Text style={styles.pageTitle}>{t.settings.title}</Text>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.account}</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t.settings.emailLabel}</Text>
            <Text style={styles.rowValue}>{email}</Text>
          </View>
          <View style={[styles.row, styles.rowLast]}>
            <View>
              <Text style={styles.rowLabel}>{t.settings.plan}</Text>
              <Text style={[styles.rowValue, isPro && styles.proText]}>{isPro ? t.settings.proPlan : t.settings.freePlan}</Text>
            </View>
            {!isPro && (
              <TouchableOpacity
                style={styles.upgradeBtn}
                onPress={async () => {
                  await WebBrowser.openBrowserAsync(`${process.env.EXPO_PUBLIC_API_URL}/upgrade`);
                }}
              >
                <Text style={styles.upgradeBtnText}>{t.settings.upgrade}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.notifications}</Text>
          <View style={[styles.row, styles.rowLast]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>{t.settings.pushNotifications}</Text>
              {permissionDenied && (
                <TouchableOpacity onPress={() => Linking.openSettings()}>
                  <Text style={styles.permissionHint}>{t.settings.permissionHint}</Text>
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
          <Text style={styles.sectionTitle}>{t.settings.legal}</Text>
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push('/(app)/privacy' as never)}
            activeOpacity={0.7}
          >
            <Text style={styles.rowLabel}>{t.settings.privacyPolicy}</Text>
            <Text style={styles.rowChevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.row, styles.rowLast]}
            onPress={() => router.push('/(app)/terms' as never)}
            activeOpacity={0.7}
            accessibilityLabel="Terms of Service / 利用規約"
            accessibilityRole="button"
          >
            <Text style={styles.rowLabel}>{t.settings.termsOfService}</Text>
            <Text style={styles.rowChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.about}</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t.settings.version}</Text>
            <Text style={styles.rowValue}>{Constants.expoConfig?.version ?? '1.0.0'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t.settings.support}</Text>
            <Text style={styles.rowValue}>support@pethealthos.com</Text>
          </View>
          <TouchableOpacity
            style={[styles.row, styles.rowLast]}
            onPress={() => setLocale(locale === 'ja' ? 'en' : 'ja')}
            activeOpacity={0.7}
            accessibilityLabel="Language / 言語"
            accessibilityRole="button"
          >
            <Text style={styles.rowLabel}>{t.settings.language}</Text>
            <Text style={styles.rowValue}>{locale === 'ja' ? '🇯🇵 日本語' : '🇺🇸 English'}</Text>
          </TouchableOpacity>
          <View style={styles.copyrightRow}>
            <Text style={styles.copyrightText}>{t.settings.copyright}</Text>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Text style={styles.signOutText}>{t.settings.signOut}</Text>
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
