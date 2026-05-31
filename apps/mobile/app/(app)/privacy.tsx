import { ScrollView, Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useI18n } from '../../lib/i18n';

export default function PrivacyScreen() {
  const { locale, setLocale } = useI18n();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}
          accessibilityLabel="Back / 戻る" accessibilityRole="button">
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backText}>{locale === 'ja' ? '戻る' : 'Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{locale === 'ja' ? 'プライバシーポリシー' : 'Privacy Policy'}</Text>
        <TouchableOpacity
          onPress={() => setLocale(locale === 'ja' ? 'en' : 'ja')}
          accessibilityLabel="Switch language / 言語切替"
          accessibilityRole="button"
        >
          <Text style={styles.langToggle}>{locale === 'ja' ? '🇺🇸 EN' : '🇯🇵 JA'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {locale === 'en' ? (
          <>
            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerIcon}>⚕️</Text>
              <Text style={styles.disclaimerText}>
                The AI analysis in this app is for reference purposes only and does not replace professional veterinary diagnosis.
              </Text>
            </View>
            <Text style={styles.updatedAt}>Last updated: May 25, 2026</Text>
            <Section title="1. Introduction">
              <Paragraph>Pet Health OS ("the App") is a service for pet health management. This Privacy Policy explains what information we collect, how we use it, how long we store it, and your rights.</Paragraph>
              <Paragraph>By using the App, you agree to the terms of this policy.</Paragraph>
            </Section>
            <Section title="2. Information We Collect">
              <SubHeading>2-1. Account Information</SubHeading>
              <Paragraph>• Email address — used to create and authenticate your account and for support communications.</Paragraph>
              <SubHeading>2-2. Pet Information</SubHeading>
              <Paragraph>• Pet name, species, breed, date of birth, weight, sex, and other basic information{'\n'}• Health logs (food, exercise, symptoms, mood, etc.){'\n'}• Medication and vaccination history</Paragraph>
              <SubHeading>2-3. Photos & Videos</SubHeading>
              <Paragraph>• Pet photos and videos uploaded for AI health analysis. Images are stored linked to your account but are never used for advertising or sold to third parties.</Paragraph>
              <SubHeading>2-4. Automatically Collected Information</SubHeading>
              <Paragraph>• App usage data, crash reports, device info (OS version, device model). Used only for app quality improvement.</Paragraph>
            </Section>
            <Section title="3. How We Use Your Information">
              <Paragraph>We use collected information for:{'\n'}• Account creation, management, and authentication{'\n'}• AI-powered pet health analysis{'\n'}• Push notifications (medication reminders, health alerts){'\n'}• App improvement and bug fixes{'\n'}• Customer support{'\n'}• Legal compliance</Paragraph>
              <Paragraph>We never sell your personal information to third parties.</Paragraph>
            </Section>
            <Section title="4. AI Analysis">
              <View style={styles.aiNote}>
                <Text style={styles.aiNoteText}>The AI analysis features provide reference information about your pet's health and do not replace professional diagnosis or treatment by a licensed veterinarian. If you have concerns about your pet's health, please consult a veterinarian.</Text>
              </View>
              <Paragraph>Photos and health data used for AI analysis are sent to our servers for processing. Results are stored in your account and accessible only to you.</Paragraph>
            </Section>
            <Section title="5. Data Retention">
              <Paragraph>• Account, pet, and health log data: retained while your account is active and for 30 days after deletion.{'\n'}• Photos & videos: retained while your account is active; deleted upon account closure.{'\n'}• Anonymized usage statistics: may be retained for up to 2 years for service improvement.</Paragraph>
            </Section>
            <Section title="6. Data Sharing">
              <Paragraph>We do not share your personal information with third parties except:{'\n'}• With your explicit consent{'\n'}• When required by law or court order{'\n'}• With cloud infrastructure providers (Supabase, Vercel, etc.) who process data only under our instructions</Paragraph>
            </Section>
            <Section title="7. Your Rights">
              <Paragraph>You have the right to:{'\n'}• <Text style={styles.bold}>Access</Text>: view the personal information we hold{'\n'}• <Text style={styles.bold}>Correct</Text>: request correction of inaccurate information{'\n'}• <Text style={styles.bold}>Delete</Text>: request deletion of your account and all related data{'\n'}• <Text style={styles.bold}>Restrict</Text>: request that we stop using your data for certain purposes</Paragraph>
              <Paragraph>To exercise these rights, contact us at the address below. We will respond within 30 days.</Paragraph>
            </Section>
            <Section title="8. Data Deletion">
              <Paragraph>To delete your account and all related data:{'\n'}• Email: support@pethealthos.com (subject: "Data Deletion Request"){'\n'}• All data will be deleted within 30 days of your request.</Paragraph>
            </Section>
            <Section title="9. Security">
              <Paragraph>Your data is protected with industry-standard encryption (TLS in transit, AES-256 at rest). No internet transmission method is 100% secure.</Paragraph>
            </Section>
            <Section title="10. Policy Changes">
              <Paragraph>This policy may change without prior notice. For significant changes, we will notify you via in-app notification or email. Continued use of the App after changes constitutes acceptance.</Paragraph>
            </Section>
            <Section title="11. Contact">
              <Paragraph>For privacy questions or requests:</Paragraph>
              <View style={styles.contactBox}>
                <Text style={styles.contactText}>Pet Health OS Operations</Text>
                <Text style={styles.contactText}>Email: support@pethealthos.com</Text>
                <Text style={styles.contactText}>© 2026 Pet Health OS. All rights reserved.</Text>
              </View>
            </Section>
          </>
        ) : (
          <>
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
          </>
        )}

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
  langToggle: { fontSize: 14, fontWeight: '600', color: '#10b981' },

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
