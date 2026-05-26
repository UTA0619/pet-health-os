import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../lib/i18n';
import { useTheme } from '../../lib/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();
  const { colors } = useTheme();

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert(t.common.error, t.login.emailRequired);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) Alert.alert(t.login.loginError, error.message);
      else router.replace('/(app)');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.surface }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>🐾</Text>
          <Text style={styles.title}>{t.login.title}</Text>
          <Text style={styles.subtitle}>{t.login.subtitle}</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>{t.login.email}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Email address / メールアドレス"
            accessibilityHint="Enter your email address"
          />

          <Text style={styles.label}>{t.login.password}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            accessibilityLabel="Password / パスワード"
            accessibilityHint="Enter your password"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
            accessibilityLabel={loading ? "Logging in / ログイン中" : "Log in / ログイン"}
            accessibilityRole="button"
            accessibilityState={{ disabled: loading }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t.login.loginBtn}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => router.push('/(auth)/forgot-password' as never)}
            activeOpacity={0.7}
            accessibilityLabel="Forgot password / パスワードを忘れた"
            accessibilityRole="button"
          >
            <Text style={styles.forgotPasswordText}>{t.login.forgotPassword}</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t.login.noAccount}</Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity accessibilityLabel="Sign up / 新規登録" accessibilityRole="link">
                <Text style={styles.link}>{t.login.signup}</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 48 },
  logo: { fontSize: 64, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#18181b', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#71717a' },
  form: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#3f3f46', marginBottom: 4, marginTop: 8 },
  input: {
    borderWidth: 1.5, borderColor: '#e4e4e7', borderRadius: 12,
    padding: 14, fontSize: 16, color: '#18181b', backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: '#10b981', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 24,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  forgotPassword: { alignItems: 'center', marginTop: 12 },
  forgotPasswordText: { fontSize: 14, color: '#71717a' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, gap: 6 },
  footerText: { fontSize: 14, color: '#71717a' },
  link: { fontSize: 14, color: '#10b981', fontWeight: '600' },
});
