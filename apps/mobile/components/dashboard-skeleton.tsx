import { View, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { useTheme } from '../lib/theme';

function SkeletonBox({ width, height, borderRadius = 8, style }: {
  width?: number;
  height: number;
  borderRadius?: number;
  style?: object;
}) {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: colors.border, opacity: anim },
        style,
      ]}
    />
  );
}

export function DashboardSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header skeleton */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View>
          <SkeletonBox width={80} height={14} style={{ marginBottom: 8 }} />
          <SkeletonBox width={200} height={20} />
        </View>
        <SkeletonBox width={64} height={56} borderRadius={12} />
      </View>

      {/* Score card skeleton */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <SkeletonBox width={120} height={16} style={{ marginBottom: 16 }} />
        <SkeletonBox width={160} height={160} borderRadius={80} style={{ alignSelf: 'center' }} />
        <SkeletonBox width={240} height={14} style={{ alignSelf: 'center', marginTop: 16 }} />
      </View>

      {/* Banner skeleton */}
      <View style={styles.bannerRow}>
        <SkeletonBox height={50} borderRadius={12} style={{ flex: 1 }} />
      </View>

      {/* Logs section skeleton */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <SkeletonBox width={100} height={16} style={{ marginBottom: 12 }} />
        {[0, 1, 2].map(i => (
          <View key={i} style={styles.logRow}>
            <SkeletonBox width={80} height={14} />
            <View style={styles.logMetrics}>
              <SkeletonBox width={28} height={28} borderRadius={8} />
              <SkeletonBox width={28} height={28} borderRadius={8} />
              <SkeletonBox width={28} height={28} borderRadius={8} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
  card: { margin: 16, borderRadius: 20, padding: 20, alignItems: 'center' },
  bannerRow: { marginHorizontal: 16 },
  section: { margin: 16, borderRadius: 16, padding: 16 },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  logMetrics: { flexDirection: 'row', gap: 6 },
});
