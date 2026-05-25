import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotFoundScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.emoji}>🐾</Text>
        <Text style={styles.title}>ページが見つかりません</Text>
        <Text style={styles.subtitle}>お探しのページは存在しないか、移動した可能性があります。</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(app)')}>
          <Text style={styles.btnText}>ホームに戻る</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f4f5' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#18181b', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#71717a', textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  btn: { backgroundColor: '#10b981', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
