import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, Modal, FlatList,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize, fontWeight } from '../../theme';
import { supabase } from '../../lib/supabase';
import { topInset } from '../../lib/topInset';
import { WorkoutPlan, SetLog } from '../../types';
import { RootStackParamList } from '../../../App';

type RouteT = RouteProp<RootStackParamList, 'WorkoutLog'>;

interface LogExercise {
  exercise_id: string;
  exercise_name: string;
  sets_done: SetLog[];
}

const RUN_CATALOG: { category: string; icon: string; color: string; exercises: { name: string; hint: string }[] }[] = [
  {
    category: 'Footing',
    icon: '🏃',
    color: '#FF6B35',
    exercises: [
      { name: 'Footing léger', hint: 'Allure confortable, conversation possible' },
      { name: 'Footing modéré', hint: 'Endurance fondamentale, rythme régulier' },
      { name: 'Footing long', hint: 'Sortie longue, 60–90 min' },
      { name: 'Course de récupération', hint: 'Très lent, après une séance difficile' },
      { name: 'Endurance active', hint: 'Un peu plus soutenu que le footing léger' },
    ],
  },
  {
    category: 'Fractionné',
    icon: '⚡',
    color: '#E91E63',
    exercises: [
      { name: '30/30', hint: '30s rapide / 30s récup, répéter 10–20x' },
      { name: '1min/1min', hint: '1min rapide / 1min récup, répéter 8–15x' },
      { name: 'Répétitions 200m', hint: 'Sprint 200m, marche de récup' },
      { name: 'Répétitions 400m', hint: 'Course soutenue 400m, récup 1min' },
      { name: 'Répétitions 1km', hint: 'Allure 5km, récup 2min entre chaque' },
      { name: 'Pyramide', hint: '200-400-600-800-600-400-200m' },
      { name: 'Tempo run', hint: 'Allure soutenue sur 20–30min' },
      { name: 'Fartlek', hint: 'Accélérations libres sur footing' },
    ],
  },
  {
    category: 'Côtes',
    icon: '🏔️',
    color: '#9C27B0',
    exercises: [
      { name: 'Côtes courtes', hint: '10–15s en montée, descente en récup, ×8–12' },
      { name: 'Côtes longues', hint: '30–60s en montée, ×6–10' },
      { name: 'Descentes techniques', hint: 'Travailler la foulée en descente' },
    ],
  },
  {
    category: 'Marche',
    icon: '🚶',
    color: '#4CAF50',
    exercises: [
      { name: 'Marche rapide', hint: 'Cardio modéré, bon pour récupérer' },
      { name: 'Marche de récupération', hint: 'Très lente, après effort intense' },
      { name: 'Marche-course', hint: 'Alterner marche et course pour débutant' },
    ],
  },
  {
    category: 'Renforcement',
    icon: '💪',
    color: '#2196F3',
    exercises: [
      { name: 'Gainage frontal', hint: 'Planche, maintenir 30–60s' },
      { name: 'Gainage latéral', hint: 'Planche côté, 30s par côté' },
      { name: 'Fentes', hint: 'Renforce les quadriceps et fessiers' },
      { name: 'Squats', hint: 'Force des jambes pour la propulsion' },
      { name: 'Montées de genoux', hint: 'Travail de fréquence et de gainage' },
      { name: 'Talons-fesses', hint: 'Active les ischio-jambiers' },
      { name: 'Corde à sauter', hint: 'Coordination et cardio léger' },
      { name: 'Étirements post-run', hint: 'Ischio, quadri, mollets, hanche' },
    ],
  },
];

export default function WorkoutLogScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteT>();
  const { workoutPlanId, date } = route.params;

  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [duration, setDuration] = useState('');
  const [totalKm, setTotalKm] = useState('');
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<LogExercise[]>([]);
  const [saving, setSaving] = useState(false);
  const [startTime] = useState(Date.now());

  const [pickerVisible, setPickerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!workoutPlanId) return;
    supabase.from('workout_plans').select('*').eq('id', workoutPlanId).single().then(({ data }) => {
      if (!data) return;
      const p = data as WorkoutPlan;
      setPlan(p);
      const exs: LogExercise[] = ((p.exercises ?? []) as any[]).map((ex: any) => ({
        exercise_id: ex.exercise_id ?? '',
        exercise_name: ex.exercise_name ?? 'Course',
        sets_done: Array.from({ length: ex.sets ?? 1 }, (_, i) => ({
          set_number: i + 1,
          reps: ex.reps,
          weight_kg: ex.weight_kg,
          completed: false,
        })),
      }));
      setExercises(exs);
    });
  }, [workoutPlanId]);

  const filteredExercises = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return RUN_CATALOG.flatMap(cat => {
      if (selectedCategory && cat.category !== selectedCategory) return [];
      return cat.exercises
        .filter(ex => !q || ex.name.toLowerCase().includes(q))
        .map(ex => ({ ...ex, category: cat.category, color: cat.color, icon: cat.icon }));
    });
  }, [searchQuery, selectedCategory]);

  const addExercise = (name: string) => {
    setExercises(prev => [...prev, {
      exercise_id: '',
      exercise_name: name,
      sets_done: [{ set_number: 1, completed: false }],
    }]);
    setPickerVisible(false);
    setSearchQuery('');
    setSelectedCategory(null);
  };

  const toggleSet = (exIndex: number, setIndex: number) => {
    setExercises(prev => prev.map((ex, i) =>
      i !== exIndex ? ex : {
        ...ex,
        sets_done: ex.sets_done.map((s, j) =>
          j !== setIndex ? s : { ...s, completed: !s.completed }
        ),
      }
    ));
  };

  // reps = distance km, weight_kg = allure min/km
  const updateSet = (exIndex: number, setIndex: number, field: 'reps' | 'weight_kg', value: string) => {
    setExercises(prev => prev.map((ex, i) =>
      i !== exIndex ? ex : {
        ...ex,
        sets_done: ex.sets_done.map((s, j) =>
          j !== setIndex ? s : { ...s, [field]: parseFloat(value) || undefined }
        ),
      }
    ));
  };

  const addSet = (exIndex: number) => {
    setExercises(prev => prev.map((ex, i) =>
      i !== exIndex ? ex : {
        ...ex,
        sets_done: [...ex.sets_done, { set_number: ex.sets_done.length + 1, completed: false }],
      }
    ));
  };

  const removeExercise = (exIndex: number) => {
    setExercises(prev => prev.filter((_, i) => i !== exIndex));
  };

  const saveLog = async () => {
    const mins = parseInt(duration) || Math.round((Date.now() - startTime) / 60000);
    setSaving(true);
    const { error } = await supabase.from('workout_logs').insert({
      workout_plan_id: workoutPlanId ?? null,
      date,
      duration_minutes: mins,
      notes: [totalKm ? `Distance : ${totalKm} km` : '', notes.trim()].filter(Boolean).join('\n') || null,
      exercises_done: exercises,
    });
    setSaving(false);
    if (error) { Alert.alert('Erreur', error.message); return; }
    Alert.alert('🏃 Séance enregistrée !', `${mins} min${totalKm ? ` · ${totalKm} km` : ''} notés.`, [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  const completedSets = exercises.reduce((acc, ex) => acc + ex.sets_done.filter(s => s.completed).length, 0);
  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets_done.length, 0);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset(insets.top) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{plan ? plan.name : 'Séance libre'}</Text>
        <TouchableOpacity onPress={saveLog} style={styles.saveBtn} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? '...' : 'Terminer'}</Text>
        </TouchableOpacity>
      </View>

      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <TextInput
            style={styles.summaryInput}
            value={duration}
            onChangeText={setDuration}
            placeholder="--"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            textAlign="center"
          />
          <Text style={styles.summaryLabel}>Minutes</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <TextInput
            style={styles.summaryInput}
            value={totalKm}
            onChangeText={setTotalKm}
            placeholder="--"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            textAlign="center"
          />
          <Text style={styles.summaryLabel}>Kilomètres</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{completedSets}/{totalSets}</Text>
          <Text style={styles.summaryLabel}>Blocs ✓</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }}>
        {exercises.map((ex, exIndex) => (
          <View key={exIndex} style={styles.exerciseCard}>
            <View style={styles.exerciseCardHeader}>
              <Text style={styles.exerciseName}>{ex.exercise_name}</Text>
              <TouchableOpacity onPress={() => removeExercise(exIndex)} style={styles.removeExBtn}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>

            <View style={styles.setHeader}>
              <Text style={[styles.setHeaderText, { width: 28 }]}>#</Text>
              <Text style={[styles.setHeaderText, { flex: 1 }]}>km</Text>
              <Text style={[styles.setHeaderText, { flex: 1 }]}>min/km</Text>
              <Text style={[styles.setHeaderText, { width: 32 }]}>✓</Text>
            </View>

            {ex.sets_done.map((s, setIndex) => (
              <View key={setIndex} style={[styles.setRow, s.completed && styles.setRowDone]}>
                <Text style={styles.setNumber}>{s.set_number}</Text>
                <TextInput
                  style={styles.setInput}
                  value={s.reps?.toString() ?? ''}
                  onChangeText={v => updateSet(exIndex, setIndex, 'reps', v)}
                  placeholder="0.0"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                />
                <TextInput
                  style={styles.setInput}
                  value={s.weight_kg?.toString() ?? ''}
                  onChangeText={v => updateSet(exIndex, setIndex, 'weight_kg', v)}
                  placeholder="5:30"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                />
                <TouchableOpacity
                  style={[styles.checkBtn, s.completed && styles.checkBtnDone]}
                  onPress={() => toggleSet(exIndex, setIndex)}
                >
                  {s.completed && <Ionicons name="checkmark" size={14} color={colors.white} />}
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity onPress={() => addSet(exIndex)} style={styles.addSetBtn}>
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={styles.addSetText}>Ajouter un bloc</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.notesCard}>
          <Text style={styles.notesLabel}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Sensations, météo, parcours…"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity onPress={() => setPickerVisible(true)} style={styles.addExBtn}>
          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.addExText}>Ajouter un bloc</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Exercise picker modal */}
      <Modal visible={pickerVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPickerVisible(false)}>
        <View style={[styles.modalContainer, { paddingTop: topInset(insets.top) }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Type de séance</Text>
            <TouchableOpacity onPress={() => { setPickerVisible(false); setSearchQuery(''); setSelectedCategory(null); }} style={styles.modalClose}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Rechercher…"
              placeholderTextColor={colors.textMuted}
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryContent}>
            <TouchableOpacity
              style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>Tout</Text>
            </TouchableOpacity>
            {RUN_CATALOG.map(cat => (
              <TouchableOpacity
                key={cat.category}
                style={[styles.categoryChip, selectedCategory === cat.category && { backgroundColor: cat.color, borderColor: cat.color }]}
                onPress={() => setSelectedCategory(prev => prev === cat.category ? null : cat.category)}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={[styles.categoryChipText, selectedCategory === cat.category && styles.categoryChipTextActive]}>
                  {cat.category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <FlatList
            data={filteredExercises}
            keyExtractor={(item, i) => `${item.name}-${i}`}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.exerciseRow} onPress={() => addExercise(item.name)}>
                <View style={[styles.exerciseCatDot, { backgroundColor: item.color }]} />
                <View style={styles.exerciseRowContent}>
                  <Text style={styles.exerciseRowName}>{item.name}</Text>
                  <Text style={styles.exerciseRowHint}>{item.hint}</Text>
                </View>
                <Ionicons name="add-circle" size={24} color={item.color} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyPicker}>
                <Text style={styles.emptyPickerText}>Aucun résultat</Text>
              </View>
            }
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  saveBtnText: { color: colors.white, fontWeight: fontWeight.bold, fontSize: fontSize.md },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  summaryDivider: { width: 1, height: 36, backgroundColor: colors.border },
  summaryValue: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.primary },
  summaryInput: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.primary, width: 70 },
  summaryLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  content: { flex: 1, paddingHorizontal: spacing.md },
  exerciseCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  exerciseName: { flex: 1, fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  removeExBtn: { padding: 4 },
  setHeader: { flexDirection: 'row', marginBottom: 4 },
  setHeaderText: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: fontWeight.semibold },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: radius.sm,
    gap: spacing.sm,
  },
  setRowDone: { opacity: 0.5 },
  setNumber: { width: 28, fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' },
  setInput: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    color: colors.text,
    fontSize: fontSize.md,
    textAlign: 'center',
  },
  checkBtn: {
    width: 32, height: 32,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnDone: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addSetText: { color: colors.primary, fontSize: fontSize.sm },
  notesCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSecondary, marginBottom: spacing.sm },
  notesInput: { color: colors.text, fontSize: fontSize.md, minHeight: 70 },
  addExBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.primary + '15',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  addExText: { color: colors.primary, fontSize: fontSize.md, fontWeight: fontWeight.medium },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  modalTitle: { flex: 1, fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  modalClose: {
    width: 36, height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: fontSize.md },
  categoryScroll: { flexGrow: 0, marginBottom: spacing.sm },
  categoryContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryIcon: { fontSize: 14 },
  categoryChipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  categoryChipTextActive: { color: colors.white },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  exerciseCatDot: { width: 10, height: 10, borderRadius: 5 },
  exerciseRowContent: { flex: 1 },
  exerciseRowName: { fontSize: fontSize.md, color: colors.text, fontWeight: fontWeight.medium },
  exerciseRowHint: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  emptyPicker: { alignItems: 'center', paddingTop: 40 },
  emptyPickerText: { fontSize: fontSize.md, color: colors.textMuted },
});
