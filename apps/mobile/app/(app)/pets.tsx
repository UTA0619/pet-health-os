import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import type { Pet } from '../../lib/types';
import { useI18n } from '../../lib/i18n';
import { useTheme } from '../../lib/theme';
import type { AppColors } from '../../lib/theme';

interface PetWithLog extends Pet {
  last_logged?: string | null;
  breed?: string;
  date_of_birth?: string;
  weight_kg?: number | null;
}

function PetCard({ pet, onEdit, labels, colors }: { pet: PetWithLog; onEdit: (pet: PetWithLog) => void; labels: { edit: string; lastLog: string; noLog: string; speciesLabel: string }; colors: AppColors }) {
  const speciesEmoji = pet.species === 'dog' ? '🐶' : pet.species === 'cat' ? '🐱' : '🐾';

  return (
    <View style={[cardStyles.card, { backgroundColor: colors.surface }]}>
      <View style={cardStyles.left}>
        <Text style={cardStyles.emoji}>{speciesEmoji}</Text>
        <View style={cardStyles.info}>
          <Text style={[cardStyles.name, { color: colors.text }]}>{pet.name}</Text>
          <Text style={[cardStyles.sub, { color: colors.textSecondary }]}>
            {labels.speciesLabel}
            {pet.breed ? ` • ${pet.breed}` : ''}
          </Text>
          {pet.last_logged ? (
            <Text style={[cardStyles.lastLog, { color: colors.primary }]}>{labels.lastLog}: {pet.last_logged}</Text>
          ) : (
            <Text style={[cardStyles.noLog, { color: colors.textMuted }]}>{labels.noLog}</Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={[cardStyles.editBtn, { backgroundColor: colors.background }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onEdit(pet);
        }}
        activeOpacity={0.7}
        accessibilityLabel={`Edit ${pet.name}`}
        accessibilityRole="button"
      >
        <Text style={[cardStyles.editBtnText, { color: colors.textSecondary }]}>{labels.edit}</Text>
      </TouchableOpacity>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  emoji: { fontSize: 36, marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 17, fontWeight: '700' },
  sub: { fontSize: 13, marginTop: 2 },
  lastLog: { fontSize: 12, marginTop: 4 },
  noLog: { fontSize: 12, marginTop: 4 },
  editBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 8,
  },
  editBtnText: { fontSize: 14, fontWeight: '600' },
});

export default function PetsScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [pets, setPets] = useState<PetWithLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: petsData, error } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!petsData) { setPets([]); return; }

      // Fetch last log date for each pet
      const petsWithLogs: PetWithLog[] = await Promise.all(
        petsData.map(async (pet) => {
          const { data: logData } = await supabase
            .from('health_logs')
            .select('log_date')
            .eq('pet_id', pet.id)
            .order('log_date', { ascending: false })
            .limit(1)
            .single();
          return { ...pet, last_logged: logData?.log_date ?? null };
        })
      );

      setPets(petsWithLogs);
    } catch (e) {
      console.error('ペット読み込みエラー:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  function handleEdit(pet: PetWithLog) {
    const speciesKey = `species_${pet.species}` as keyof typeof t.pets;
    const speciesLabel = String(t.pets[speciesKey] ?? pet.species);
    const details = [
      speciesLabel,
      pet.breed || null,
      pet.weight_kg ? `${pet.weight_kg} kg` : null,
      pet.last_logged ? `${t.pets.lastLog}: ${pet.last_logged}` : t.pets.noLog,
    ].filter(Boolean).join('\n');
    Alert.alert(pet.name, details, [{ text: t.common.ok }]);
  }

  function handleAddPet() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(app)/add-pet' as never);
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>{t.pets.title}</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={handleAddPet}
          activeOpacity={0.8}
          accessibilityLabel="Add pet / ペットを追加"
          accessibilityRole="button"
        >
          <Text style={styles.addBtnText}>{t.pets.add}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {pets.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🐾</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.pets.noPetsTitle}</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t.pets.noPetsText}</Text>
            <TouchableOpacity style={[styles.emptyAddBtn, { backgroundColor: colors.primary }]} onPress={handleAddPet} activeOpacity={0.8} accessibilityLabel="Add your first pet / ペットを追加する" accessibilityRole="button">
              <Text style={styles.emptyAddBtnText}>{t.pets.addMore}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {pets.map((pet) => {
              const speciesKey = `species_${pet.species}` as keyof typeof t.pets;
              const speciesLabel = String(t.pets[speciesKey] ?? pet.species);
              return (
                <PetCard
                  key={pet.id}
                  pet={pet}
                  onEdit={handleEdit}
                  labels={{ edit: t.pets.edit, lastLog: t.pets.lastLog, noLog: t.pets.noLog, speciesLabel }}
                  colors={colors}
                />
              );
            })}
            <TouchableOpacity style={[styles.addMoreBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={handleAddPet} activeOpacity={0.8} accessibilityLabel="Add another pet / ペットを追加する" accessibilityRole="button">
              <Text style={[styles.addMoreText, { color: colors.textSecondary }]}>{t.pets.addMore}</Text>
            </TouchableOpacity>
          </>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 8,
  },
  pageTitle: { fontSize: 24, fontWeight: '800' },
  addBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  emptyAddBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyAddBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  addMoreBtn: {
    marginTop: 4,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addMoreText: { fontSize: 15, fontWeight: '600' },
});
