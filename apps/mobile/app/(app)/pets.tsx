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

interface PetWithLog extends Pet {
  last_logged?: string | null;
  breed?: string;
  date_of_birth?: string;
}

function PetCard({ pet, onEdit }: { pet: PetWithLog; onEdit: (pet: PetWithLog) => void }) {
  const speciesEmoji = pet.species === 'dog' ? '🐶' : pet.species === 'cat' ? '🐱' : '🐾';

  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.left}>
        <Text style={cardStyles.emoji}>{speciesEmoji}</Text>
        <View style={cardStyles.info}>
          <Text style={cardStyles.name}>{pet.name}</Text>
          <Text style={cardStyles.sub}>
            {pet.species === 'dog' ? '犬' : pet.species === 'cat' ? '猫' : pet.species}
            {pet.breed ? ` • ${pet.breed}` : ''}
          </Text>
          {pet.last_logged ? (
            <Text style={cardStyles.lastLog}>最終記録: {pet.last_logged}</Text>
          ) : (
            <Text style={cardStyles.noLog}>まだ記録がありません</Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={cardStyles.editBtn}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onEdit(pet);
        }}
        activeOpacity={0.7}
      >
        <Text style={cardStyles.editBtnText}>編集</Text>
      </TouchableOpacity>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
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
  name: { fontSize: 17, fontWeight: '700', color: '#18181b' },
  sub: { fontSize: 13, color: '#71717a', marginTop: 2 },
  lastLog: { fontSize: 12, color: '#10b981', marginTop: 4 },
  noLog: { fontSize: 12, color: '#d4d4d8', marginTop: 4 },
  editBtn: {
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 8,
  },
  editBtnText: { fontSize: 14, fontWeight: '600', color: '#3f3f46' },
});

export default function PetsScreen() {
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
    Alert.alert(
      `${pet.name}を編集`,
      '編集機能は近日公開予定です。',
      [{ text: 'OK' }]
    );
  }

  function handleAddPet() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(app)/add-pet' as never);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>ペット管理</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={handleAddPet}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ 追加</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
        }
      >
        {pets.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🐾</Text>
            <Text style={styles.emptyTitle}>ペットを登録しましょう</Text>
            <Text style={styles.emptyText}>ペットの健康状態を管理するには、まずペットを追加してください。</Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={handleAddPet} activeOpacity={0.8}>
              <Text style={styles.emptyAddBtnText}>+ ペットを追加する</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {pets.map((pet) => (
              <PetCard key={pet.id} pet={pet} onEdit={handleEdit} />
            ))}
            <TouchableOpacity style={styles.addMoreBtn} onPress={handleAddPet} activeOpacity={0.8}>
              <Text style={styles.addMoreText}>+ ペットを追加する</Text>
            </TouchableOpacity>
          </>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f4f5' },
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
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#18181b' },
  addBtn: {
    backgroundColor: '#10b981',
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
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#18181b', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#71717a', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  emptyAddBtn: {
    backgroundColor: '#10b981',
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
    borderColor: '#d4d4d8',
    borderStyle: 'dashed',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  addMoreText: { fontSize: 15, fontWeight: '600', color: '#71717a' },
});
