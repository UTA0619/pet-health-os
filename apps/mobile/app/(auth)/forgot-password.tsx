import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset() {
    if (!email.trim()) {
      Alert.alert('エラー / Error', 'メールアドレスを入力してください\nPlease enter your email address');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'pethealthos://auth/reset-password',
      });
      if (error) throw error;
      setSent(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'エラーが発生しました';
      Alert.alert('エラー / Error', msg);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <View style={styles.container}>
        <View style={styles.sentContainer}>
          <Text style={styles.sentEmoji}>📧</Text>
          <Text style={styles.sentTitle}>メールを送信しました{'\n'}Email sent</Text>
          <Text style={styles.sentMsg}>
            パスワードリセットのメールをお送りしました。{'\n'}
            メールボックスをご確認ください。{'\n\n'}
            We sent a password reset email.{'\n'}
            Please check your inbox.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace('/(auth)/login' as never)}
            accessibilityLabel="Back to login / ログインに戻る"
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>ログインに戻る / Back to login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.inner}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityLabel="Back / 戻る"
          accessibilityRole="button"
        >
          <Text style={styles.backText}>← 戻る / Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>パスワードリセット{'\n'}Reset Password</Text>
        <Text style={styles.subtitle}>
          登録済みのメールアドレスにリセットリンクを送信します。{'\n'}
          We'll send a reset link to your registered email.
        </Text>

        <Text style={styles.label}>メールアドレス / Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="your@email.com"
          placeholderTextColor="#a1a1aa"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="send"
          onSubmitEditing={handleReset}
          accessibilityLabel="Email address input"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleReset}
          disabled={loading}
          activeOpacity={0.8}
          accessibilityLabel="Send reset email / リセットメールを送信"
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>リセットメールを送信 / Send Reset Email</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, padding: 24, paddingTop: 60 },
  backBtn: { marginBottom: 32 },
  backText: { fontSize: 15, color: '#10b981', fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '800', color: '#18181b', marginBottom: 12, lineHeight: 34 },
  subtitle: { fontSize: 14, color: '#71717a', lineHeight: 22, marginBottom: 32 },
  label: { fontSize: 14, fontWeight: '600', color: '#3f3f46', marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: '#e4e4e7', borderRadius: 12,
    padding: 14, fontSize: 16, color: '#18181b', backgroundColor: '#fafafa',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#10b981', borderRadius: 12, padding: 16, alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sentContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  sentEmoji: { fontSize: 64, marginBottom: 16 },
  sentTitle: { fontSize: 22, fontWeight: '800', color: '#18181b', textAlign: 'center', marginBottom: 16, lineHeight: 30 },
  sentMsg: { fontSize: 14, color: '#71717a', textAlign: 'center', lineHeight: 22, marginBottom: 40 },
});
