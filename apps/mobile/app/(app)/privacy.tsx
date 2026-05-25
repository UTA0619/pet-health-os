import { ScrollView, Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backText}>戻る</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>プライバシーポリシー</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Medical disclaimer banner */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerIcon}>⚕️</Text>
          <Text style={styles.disclaimerText}>
            このアプリのAI分析は参考情報であり、獣医師の診断に代わるものではありません
          </Text>
        </View>

        <Text style={styles.updatedAt}>最終更新日：2026年5月25日</Text>

        <Section title="1. はじめに">
          <Paragraph>
            Pet Health OS（以下「本アプリ」）は、ペットの健康管理を目的としたサービスです。本プライバシーポリシーでは、お客様から収集する情報、その利用方法、保存期間、およびお客様の権利についてご説明します。
          </Paragraph>
          <Paragraph>
            本アプリをご利用いただくことで、本ポリシーに記載された内容にご同意いただいたものとみなします。
          </Paragraph>
        </Section>

        <Section title="2. 収集する情報">
          <SubHeading>2-1. アカウント情報</SubHeading>
          <Paragraph>
            • メールアドレス — アカウントの作成・認証・サポート連絡に使用します。
          </Paragraph>

          <SubHeading>2-2. ペット情報</SubHeading>
          <Paragraph>
            • ペットの名前、種類、品種、生年月日、体重、性別などの基本情報{'\n'}
            • 健康ログ（食事、運動、症状、気分など）{'\n'}
            • 投薬・ワクチン接種履歴
          </Paragraph>

          <SubHeading>2-3. 写真・動画</SubHeading>
          <Paragraph>
            • ペットの写真および動画 — AI健康分析のためにアップロードされた画像。写真はお客様のアカウントに紐付けて保存されますが、広告や第三者への販売目的では使用しません。
          </Paragraph>

          <SubHeading>2-4. 自動収集情報</SubHeading>
          <Paragraph>
            • アプリの利用状況、クラッシュレポート、デバイス情報（OS バージョン、端末モデル）。これらはアプリの品質改善のみに使用します。
          </Paragraph>
        </Section>

        <Section title="3. 情報の利用目的">
          <Paragraph>
            収集した情報は以下の目的で利用します：
          </Paragraph>
          <Paragraph>
            • アカウントの作成・管理・認証{'\n'}
            • AI によるペット健康分析（症状の傾向把握、アドバイス生成）{'\n'}
            • プッシュ通知（投薬リマインダー、健康アラート）{'\n'}
            • アプリ機能の改善およびバグ修正{'\n'}
            • お客様サポートへの対応{'\n'}
            • 法令遵守
          </Paragraph>
          <Paragraph>
            収集した個人情報を第三者に販売することは一切ありません。
          </Paragraph>
        </Section>

        <Section title="4. AI分析について">
          <View style={styles.aiNote}>
            <Text style={styles.aiNoteText}>
              本アプリのAI分析機能は、ペットの健康状態についての参考情報を提供するものであり、資格を持つ獣医師による専門的な診断・治療に代わるものではありません。ペットの健康に不安がある場合は、必ず獣医師にご相談ください。
            </Text>
          </View>
          <Paragraph>
            AI分析に使用する写真・健康データは、分析処理のためにサーバーに送信されます。分析結果はお客様のアカウントに保存され、お客様のみが参照できます。
          </Paragraph>
        </Section>

        <Section title="5. データの保存期間">
          <Paragraph>
            • アカウント情報・ペット情報・健康ログ：アカウントが有効な期間中、および退会後30日間保存します。{'\n'}
            • 写真・動画：アカウント有効期間中保存します。退会時に削除されます。{'\n'}
            • 匿名化された利用統計：サービス改善のために最大2年間保存する場合があります。
          </Paragraph>
        </Section>

        <Section title="6. データの共有">
          <Paragraph>
            以下の場合を除き、お客様の個人情報を第三者と共有することはありません：
          </Paragraph>
          <Paragraph>
            • お客様の明示的な同意がある場合{'\n'}
            • 法令または裁判所命令により開示が必要な場合{'\n'}
            • サービス提供に必要なクラウドインフラ事業者（Supabase、Vercel 等）との間でのデータ処理。これらの事業者は当社の指示のもとでのみデータを処理します。
          </Paragraph>
        </Section>

        <Section title="7. お客様の権利">
          <Paragraph>
            お客様は以下の権利を有します：
          </Paragraph>
          <Paragraph>
            • <Text style={styles.bold}>開示請求</Text>：保有する個人情報の内容を確認する権利{'\n'}
            • <Text style={styles.bold}>訂正・追加</Text>：不正確な情報の訂正を求める権利{'\n'}
            • <Text style={styles.bold}>削除請求</Text>：アカウントおよび関連するすべてのデータの削除を求める権利{'\n'}
            • <Text style={styles.bold}>利用停止</Text>：特定の目的でのデータ利用を停止するよう求める権利
          </Paragraph>
          <Paragraph>
            これらの権利を行使する場合は、下記のお問い合わせ先までご連絡ください。合理的な期間内（最大30日）にご対応します。
          </Paragraph>
        </Section>

        <Section title="8. データの削除方法">
          <Paragraph>
            アカウントおよびすべての関連データの削除をご希望の場合は、以下のいずれかの方法でご連絡ください：{'\n'}
            • メール：support@pethealthos.com（件名：「データ削除申請」）{'\n'}
            • ご連絡後、30日以内にすべてのデータを削除します。
          </Paragraph>
        </Section>

        <Section title="9. セキュリティ">
          <Paragraph>
            お客様のデータは、業界標準の暗号化（転送時はTLS、保存時はAES-256）を使用して保護されています。ただし、インターネット上のいかなる送信方法も100%安全ではないことをご了承ください。
          </Paragraph>
        </Section>

        <Section title="10. プライバシーポリシーの変更">
          <Paragraph>
            本ポリシーは予告なく変更される場合があります。重要な変更がある場合は、アプリ内通知またはメールでお知らせします。変更後も本アプリを継続してご利用いただいた場合、変更後のポリシーにご同意いただいたものとみなします。
          </Paragraph>
        </Section>

        <Section title="11. お問い合わせ">
          <Paragraph>
            プライバシーに関するご質問・ご要望は、以下までお問い合わせください：
          </Paragraph>
          <View style={styles.contactBox}>
            <Text style={styles.contactText}>Pet Health OS 運営事務局</Text>
            <Text style={styles.contactText}>メール：support@pethealthos.com</Text>
            <Text style={styles.contactText}>© 2026 Pet Health OS. All rights reserved.</Text>
          </View>
        </Section>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <Text style={styles.subHeading}>{children}</Text>;
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f4f5' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', minWidth: 60 },
  backArrow: { fontSize: 28, color: '#10b981', marginRight: 2, lineHeight: 30 },
  backText: { fontSize: 16, color: '#10b981', fontWeight: '500' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#18181b' },

  // Body
  scroll: { flex: 1 },
  content: { padding: 16 },

  updatedAt: { fontSize: 12, color: '#71717a', marginBottom: 16, textAlign: 'center' },

  // Disclaimer banner
  disclaimer: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#6ee7b7',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 10,
  },
  disclaimerIcon: { fontSize: 20 },
  disclaimerText: { flex: 1, fontSize: 13, color: '#065f46', fontWeight: '500', lineHeight: 19 },

  // AI note
  aiNote: {
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  aiNoteText: { fontSize: 13, color: '#047857', lineHeight: 20 },

  // Sections
  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 10,
  },
  subHeading: {
    fontSize: 13,
    fontWeight: '600',
    color: '#18181b',
    marginTop: 8,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 14,
    color: '#3f3f46',
    lineHeight: 22,
    marginBottom: 6,
  },
  bold: { fontWeight: '700', color: '#18181b' },

  // Contact
  contactBox: {
    backgroundColor: '#f4f4f5',
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  contactText: { fontSize: 13, color: '#52525b', lineHeight: 20 },
});
