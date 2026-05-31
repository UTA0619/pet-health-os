import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../lib/i18n';
import { useTheme } from '../../lib/theme';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();
  const { colors } = useTheme();

  async function handleSignup() {
    if (!email || !password) {
      Alert.alert(t.common.error, t.login.emailRequired);
      return;
    }
    if (password.length < 8) {
      Alert.alert(t.common.error, t.signup.passwordShort);
      return;
    }
    if (confirmPassword && password !== confirmPassword) {
      Alert.alert(t.common.error, t.signup.passwordMismatch);
      return;
    }
    if (!termsAgreed) {
      Alert.alert(t.common.error, t.signup.termsRequired);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) Alert.alert(t.signup.signupError, error.message);
      else {
        Alert.alert(
          t.signup.checkEmail,
          t.signup.checkEmailMsg,
          [{ text: t.login.loginBtn, onPress: () => router.replace('/(auth)/login') }]
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.surface }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>🐾</Text>
          <Text style={[styles.title, { color: colors.text }]}>{t.signup.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Pet Health OS</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>{t.signup.email}</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg }]}
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

          <Text style={styles.label}>{t.signup.password}</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg }]}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            accessibilityLabel="Password / パスワード"
            accessibilityHint="Enter a password with at least 8 characters"
          />

          <Text style={styles.label}>{t.signup.confirmPassword}</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg }]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            accessibilityLabel="Confirm password / パスワード確認"
            accessibilityHint="Re-enter your password to confirm"
          />

          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setTermsAgreed(!termsAgreed)}
            accessibilityLabel={t.signup.termsLink}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: termsAgreed }}
          >
            <View style={[styles.checkbox, termsAgreed && styles.checkboxChecked]}>
              {termsAgreed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.termsText, { color: colors.textSecondary }]}>
              <Text style={styles.termsLink} onPress={() => router.push('/(app)/terms' as never)}>{t.signup.termsLink}</Text>
              {' '}{t.signup.terms}{' '}
              <Text style={styles.termsLink} onPress={() => router.push('/(app)/privacy' as never)}>{t.signup.privacyLink}</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.8}
            accessibilityLabel={loading ? "Registering / 登録中" : "Sign up for free / 無料で始める"}
            accessibilityRole="button"
            accessibilityState={{ disabled: loading }}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t.signup.signupBtn}</Text>}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>{t.signup.haveAccount}</Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity accessibilityLabel="Log in / ログイン" accessibilityRole="link">
                <Text style={styles.link}>{t.signup.login}</Text>
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
  termsRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 12, gap: 10 },
  checkbox: {
    width: 18, height: 18, borderRadius: 4,
    borderWidth: 1.5, borderColor: '#d4d4d8',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: { backgroundColor: '#10b981', borderColor: '#10b981' },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  termsText: { flex: 1, fontSize: 13, color: '#71717a', lineHeight: 18 },
  termsLink: { color: '#10b981', fontWeight: '600' },
  button: {
    backgroundColor: '#10b981', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, gap: 6 },
  footerText: { fontSize: 14, color: '#71717a' },
  link: { fontSize: 14, color: '#10b981', fontWeight: '600' },
});
