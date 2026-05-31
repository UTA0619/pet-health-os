import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../lib/i18n';
import { useTheme } from '../../lib/theme';

type AnalysisResult = {
  coat_condition: string; eye_clarity: string; posture: string;
  mobility: string; visible_concerns: string[]; confidence: number;
  recommendations: string[]; requires_vet_attention: boolean;
};

export default function CameraScreen() {
  const { t, locale } = useI18n();
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [petId, setPetId] = useState<string | null>(null);
  const [petName, setPetName] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    async function loadPet() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('pets').select('id,name').eq('owner_id', user.id).eq('is_active', true).limit(1).single();
      if (data) { setPetId(data.id); setPetName(data.name); }
    }
    loadPet();
  }, []);

  async function pickFromLibrary() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, base64: false });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
      setResult(null);
    }
  }

  async function takePhoto() {
    if (!cameraRef.current) return;
    const pic = await cameraRef.current.takePictureAsync({ quality: 0.8 });
    if (pic) { setPhoto(pic.uri); setShowCamera(false); setResult(null); }
  }

  async function analyze() {
    if (!photo || !petId) return;
    setAnalyzing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const formData = new FormData();
      formData.append('pet_id', petId);
      formData.append('locale', locale);
      formData.append('file', { uri: photo, name: 'photo.jpg', type: 'image/jpeg' } as never);
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/camera/analyze`, {
        method: 'POST',
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error('Analysis failed');
      const { analysis } = await res.json();
      setResult(analysis);
    } catch {
      Alert.alert(t.camera.error, t.camera.analysisError);
    } finally {
      setAnalyzing(false);
    }
  }

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing="back" ref={cameraRef}>
          <View style={styles.cameraControls}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowCamera(false)} accessibilityLabel="Close camera / カメラを閉じる" accessibilityRole="button">
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shutterBtn} onPress={takePhoto} accessibilityLabel="Take photo / 写真を撮影" accessibilityRole="button" />
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView style={styles.scroll}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{t.camera.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{petName || t.camera.noPet}</Text>
        </View>

        {!photo ? (
          <View style={[styles.uploadArea, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.uploadEmoji}>📷</Text>
            <Text style={[styles.uploadTitle, { color: colors.text }]}>{t.camera.takePhoto} / {t.camera.fromLibrary}</Text>
            <Text style={[styles.uploadHint, { color: colors.textMuted }]}>JPG, PNG</Text>
            <View style={styles.uploadButtons}>
              <TouchableOpacity style={[styles.uploadBtn, { borderColor: colors.border, backgroundColor: colors.inputBg }]} onPress={pickFromLibrary} activeOpacity={0.8} accessibilityLabel="Choose from library / ライブラリから選択" accessibilityRole="button">
                <Text style={[styles.uploadBtnText, { color: colors.text }]}>📁 {t.camera.fromLibrary}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.uploadBtn, styles.uploadBtnPrimary]}
                onPress={async () => {
                  if (!permission?.granted) { await requestPermission(); }
                  setShowCamera(true);
                }}
                activeOpacity={0.8}
                accessibilityLabel="Take photo / 写真を撮影"
                accessibilityRole="button"
              >
                <Text style={[styles.uploadBtnText, styles.uploadBtnTextPrimary]}>📷 {t.camera.takePhoto}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View>
            <Image source={{ uri: photo }} style={styles.preview} />
            {!result && (
              <View style={styles.previewActions}>
                <TouchableOpacity style={[styles.retakeBtn, { borderColor: colors.border, backgroundColor: colors.surface }]} onPress={() => { setPhoto(null); setResult(null); }} accessibilityLabel="Retake photo / 撮り直す" accessibilityRole="button">
                  <Text style={styles.retakeBtnText}>{t.camera.retake}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.analyzeBtn, analyzing && styles.analyzeBtnDisabled]}
                  onPress={analyze} disabled={analyzing} activeOpacity={0.8}
                  accessibilityLabel={analyzing ? "Analyzing / 分析中" : "Start AI analysis / AI分析を開始"}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: analyzing }}
                >
                  {analyzing ? <ActivityIndicator color="#fff" /> : <Text style={styles.analyzeBtnText}>{t.camera.analyze}</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {result && (
          <View style={[styles.resultCard, { backgroundColor: colors.surface }, result.requires_vet_attention && styles.resultCardWarning]}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultHeaderEmoji}>{result.requires_vet_attention ? '⚠️' : '✅'}</Text>
              <View>
                <Text style={[styles.resultTitle, { color: colors.text }]}>{result.requires_vet_attention ? t.camera.vetAttention : t.camera.result}</Text>
                <Text style={[styles.resultConfidence, { color: colors.textSecondary }]}>{t.camera.confidence}: {Math.round(result.confidence * 100)}%</Text>
              </View>
            </View>

            <View style={styles.resultGrid}>
              {([[t.camera.coat, result.coat_condition], [t.camera.eyes, result.eye_clarity], [t.camera.posture, result.posture], [t.camera.mobility, result.mobility]] as [string, string][]).map(([label, value]) => (
                <View key={label} style={[styles.resultItem, { backgroundColor: colors.background }]}>
                  <Text style={[styles.resultItemLabel, { color: colors.textSecondary }]}>{label}</Text>
                  <Text style={[styles.resultItemValue, { color: colors.text }]}>{value}</Text>
                </View>
              ))}
            </View>

            {result.recommendations.length > 0 && (
              <View style={styles.recommendations}>
                <Text style={[styles.recommendationsTitle, { color: colors.text }]}>{t.camera.recommendations}</Text>
                {result.recommendations.map((r, i) => (
                  <Text key={i} style={styles.recommendationItem}>• {r}</Text>
                ))}
              </View>
            )}

            <TouchableOpacity style={[styles.retakeBtn, { borderColor: colors.border, backgroundColor: colors.surface }]} onPress={() => { setPhoto(null); setResult(null); }} accessibilityLabel="Retake photo / 撮り直す" accessibilityRole="button">
              <Text style={styles.retakeBtnText}>{t.camera.retake}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f4f5' },
  scroll: { flex: 1 },
  header: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 20, fontWeight: '700', color: '#18181b' },
  subtitle: { fontSize: 14, color: '#71717a', marginTop: 4 },
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  cameraControls: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 60 },
  closeBtn: { position: 'absolute', top: 60, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#fff', fontSize: 16 },
  shutterBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', borderWidth: 4, borderColor: '#10b981' },
  uploadArea: { margin: 16, backgroundColor: '#fff', borderRadius: 20, padding: 32, alignItems: 'center', borderWidth: 2, borderColor: '#e4e4e7', borderStyle: 'dashed' },
  uploadEmoji: { fontSize: 48, marginBottom: 12 },
  uploadTitle: { fontSize: 16, fontWeight: '600', color: '#18181b', marginBottom: 4 },
  uploadHint: { fontSize: 13, color: '#a1a1aa', marginBottom: 20 },
  uploadButtons: { flexDirection: 'row', gap: 12 },
  uploadBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#e4e4e7', backgroundColor: '#fafafa' },
  uploadBtnPrimary: { backgroundColor: '#10b981', borderColor: '#10b981' },
  uploadBtnText: { fontSize: 14, fontWeight: '600', color: '#18181b' },
  uploadBtnTextPrimary: { color: '#fff' },
  preview: { width: '100%', height: 280, resizeMode: 'cover' },
  previewActions: { flexDirection: 'row', gap: 12, padding: 16 },
  retakeBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#e4e4e7', alignItems: 'center', backgroundColor: '#fff', margin: 16 },
  retakeBtnText: { fontSize: 14, fontWeight: '600', color: '#3f3f46' },
  analyzeBtn: { flex: 2, padding: 14, borderRadius: 12, backgroundColor: '#10b981', alignItems: 'center' },
  analyzeBtnDisabled: { opacity: 0.6 },
  analyzeBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  resultCard: { margin: 16, backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 2, borderColor: '#6ee7b7' },
  resultCardWarning: { borderColor: '#fca5a5' },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  resultHeaderEmoji: { fontSize: 32 },
  resultTitle: { fontSize: 16, fontWeight: '700', color: '#18181b' },
  resultConfidence: { fontSize: 12, color: '#71717a', marginTop: 2 },
  resultGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  resultItem: { width: '48%', backgroundColor: '#f4f4f5', borderRadius: 12, padding: 12 },
  resultItemLabel: { fontSize: 11, color: '#71717a', marginBottom: 4 },
  resultItemValue: { fontSize: 13, fontWeight: '600', color: '#18181b' },
  recommendations: { marginBottom: 16 },
  recommendationsTitle: { fontSize: 14, fontWeight: '700', color: '#18181b', marginBottom: 8 },
  recommendationItem: { fontSize: 13, color: '#3f3f46', lineHeight: 20, marginBottom: 4 },
});
