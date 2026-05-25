import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  children: React.ReactNode;
}
interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.safe}>
          <View style={styles.container}>
            <Text style={styles.emoji}>😿</Text>
            <Text style={styles.title}>エラーが発生しました</Text>
            <Text style={styles.message}>{this.state.error?.message ?? '予期しないエラーが発生しました'}</Text>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => this.setState({ hasError: false, error: undefined })}
            >
              <Text style={styles.btnText}>再試行する</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f4f5' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#18181b', marginBottom: 8 },
  message: { fontSize: 13, color: '#71717a', textAlign: 'center', marginBottom: 32 },
  btn: { backgroundColor: '#10b981', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
