import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityLabel="Back / 戻る"
          accessibilityRole="button"
          style={styles.backBtn}
        >
          <Text style={styles.backText}>← 戻る / Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>利用規約 / Terms of Service</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>最終更新 / Last updated: 2026年5月26日</Text>

        <Text style={styles.sectionTitle}>1. はじめに / Introduction</Text>
        <Text style={styles.body}>
          Pet Health OS（以下「本サービス」）をご利用いただきありがとうございます。本利用規約（以下「本規約」）は、本サービスのご利用に際しての条件を定めるものです。{'\n\n'}
          Thank you for using Pet Health OS ("the Service"). These Terms of Service ("Terms") govern your use of the Service.
        </Text>

        <Text style={styles.sectionTitle}>2. サービスの内容 / About the Service</Text>
        <Text style={styles.body}>
          本サービスは、AIを活用したペット健康管理アプリです。本サービスが提供する情報はAIによる参考情報であり、獣医師の診断・医療行為の代替となるものではありません。{'\n\n'}
          The Service is an AI-powered pet health monitoring app. Information provided by the Service is AI-generated reference only and does not substitute for veterinary diagnosis or medical care.
        </Text>

        <Text style={styles.sectionTitle}>3. 免責事項（医療） / Medical Disclaimer</Text>
        <Text style={styles.body}>
          本サービスのAI分析結果は参考情報です。ペットの健康状態に関する医療上の判断は、必ず資格を持つ獣医師にご相談ください。本サービスの利用により生じたいかなる損害についても、当社は責任を負いません。{'\n\n'}
          AI analysis results are for reference only. For medical decisions regarding your pet's health, always consult a qualified veterinarian. We accept no liability for any damages arising from use of the Service.
        </Text>

        <Text style={styles.sectionTitle}>4. アカウント / Accounts</Text>
        <Text style={styles.body}>
          本サービスのご利用には13歳以上であることが必要です。アカウント情報は正確に入力し、安全に管理してください。{'\n\n'}
          You must be at least 13 years old to use the Service. Provide accurate account information and keep it secure.
        </Text>

        <Text style={styles.sectionTitle}>5. サブスクリプション / Subscriptions</Text>
        <Text style={styles.body}>
          Proプランは月額または年額の有料サービスです。課金はApp Store / Google Playを通じて行われます。解約は各ストアの設定から行ってください。{'\n\n'}
          The Pro plan is a paid subscription (monthly or annual). Billing is processed through the App Store / Google Play. Cancel through your store account settings.
        </Text>

        <Text style={styles.sectionTitle}>6. 禁止事項 / Prohibited Activities</Text>
        <Text style={styles.body}>
          以下の行為を禁止します：サービスの逆コンパイル・改変、他のユーザーへの迷惑行為、違法なコンテンツの投稿。{'\n\n'}
          The following are prohibited: decompiling or modifying the Service, harassing other users, posting illegal content.
        </Text>

        <Text style={styles.sectionTitle}>7. 規約の変更 / Changes to Terms</Text>
        <Text style={styles.body}>
          本規約は予告なく変更される場合があります。変更後も本サービスを継続して利用された場合、変更後の規約に同意いただいたものとみなします。{'\n\n'}
          These Terms may be updated without notice. Continued use of the Service after changes constitutes acceptance of the new Terms.
        </Text>

        <Text style={styles.sectionTitle}>8. お問い合わせ / Contact</Text>
        <Text style={styles.body}>
          support@pethealthos.com{'\n'}
          © 2026 Pet Health OS
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f4f5' },
  header: { padding: 20, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f4f4f5' },
  backBtn: { marginBottom: 8 },
  backText: { fontSize: 15, color: '#10b981', fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#18181b' },
  scroll: { flex: 1 },
  content: { padding: 20 },
  lastUpdated: { fontSize: 12, color: '#a1a1aa', marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#18181b', marginTop: 20, marginBottom: 8 },
  body: { fontSize: 14, color: '#374151', lineHeight: 22 },
});
