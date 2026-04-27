import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { colors, spacing, radius, fontSize, fontWeight } from '../../theme';
import { supabase } from '../../lib/supabase';
import { topInset } from '../../lib/topInset';
import { DayOfWeek, WorkoutPlan, WorkoutLog } from '../../types';
import { RootStackParamList } from '../../../App';
import { getCurrentProfile, setCurrentProfile, getSteps, saveSteps, PROFILES, Profile } from '../../lib/profile';

const DAYS: DayOfWeek[] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const STEP_GOAL = 10000;

function getWeekStartDate(offset = 0): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) + offset * 7;
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}

function formatWeekLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const end = new Date(date);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  return `${fmt(date)} – ${fmt(end)}`;
}

function getDayDate(weekStart: string, dayIndex: number): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + dayIndex);
  return d.toISOString().split('T')[0];
}

type Nav = StackNavigationProp<RootStackParamList>;

export default function SportScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Lundi');
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile & steps
  const [profile, setProfile] = useState<Profile>('Florent');
  const [mySteps, setMySteps] = useState(0);
  const [partnerSteps, setPartnerSteps] = useState(0);
  const [pedometerAvailable, setPedometerAvailable] = useState(false);
  const pedometerSub = useRef<{ remove: () => void } | null>(null);
  const todayStr = new Date().toISOString().split('T')[0];

  const weekStart = getWeekStartDate(weekOffset);
  const selectedDayIndex = DAYS.indexOf(selectedDay);
  const selectedDate = getDayDate(weekStart, selectedDayIndex);

  // Init profile + steps
  useEffect(() => {
    (async () => {
      const p = await getCurrentProfile();
      setProfile(p);
      await loadSteps(p);
    })();
  }, []);

  const loadSteps = async (p: Profile) => {
    const partner = PROFILES.find(x => x !== p) ?? PROFILES[0];
    const mine = await getSteps(p, todayStr);
    const theirs = await getSteps(partner, todayStr);
    setMySteps(mine);
    setPartnerSteps(theirs);
  };

  // Start pedometer (mobile only)
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let mounted = true;
    (async () => {
      const { granted } = await Pedometer.requestPermissionsAsync();
      if (!granted || !mounted) return;
      const available = await Pedometer.isAvailableAsync();
      if (!available || !mounted) { setPedometerAvailable(false); return; }
      setPedometerAvailable(true);

      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();

      try {
        const result = await Pedometer.getStepCountAsync(start, end);
        if (mounted && result) {
          setMySteps(result.steps);
          await saveSteps(profile, todayStr, result.steps);
        }
      } catch {}

      pedometerSub.current = Pedometer.watchStepCount(async result => {
        if (!mounted) return;
        const start2 = new Date();
        start2.setHours(0, 0, 0, 0);
        try {
          const dayResult = await Pedometer.getStepCountAsync(start2, new Date());
          const steps = dayResult?.steps ?? result.steps;
          setMySteps(steps);
          await saveSteps(profile, todayStr, steps);
        } catch {
          setMySteps(prev => prev + result.steps);
        }
      });
    })();

    return () => {
      mounted = false;
      pedometerSub.current?.remove();
    };
  }, [profile]);

  const switchProfile = async (p: Profile) => {
    setProfile(p);
    await setCurrentProfile(p);
    await loadSteps(p);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: plansData }, { data: logsData }] = await Promise.all([
      supabase.from('workout_plans').select('*').eq('week_start_date', weekStart),
      supabase.from('workout_logs').select('*').gte('date', weekStart).lte('date', getDayDate(weekStart, 6)),
    ]);
    if (plansData) setPlans(plansData as WorkoutPlan[]);
    if (logsData) setLogs(logsData as WorkoutLog[]);
    setLoading(false);
  }, [weekStart]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const getDayPlan = (day: DayOfWeek) => plans.find(p => p.day_of_week === day);
  const getDayLog = (date: string) => logs.find(l => l.date === date);

  const currentPlan = getDayPlan(selectedDay);
  const currentLog = getDayLog(selectedDate);

  const startWorkout = () => {
    navigation.navigate('WorkoutLog', {
      workoutPlanId: currentPlan?.id,
      date: selectedDate,
    });
  };

  const deletePlan = async (id: string) => {
    Alert.alert('Supprimer la séance ?', '', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive', onPress: async () => {
          await supabase.from('workout_plans').delete().eq('id', id);
          fetchData();
        }
      }
    ]);
  };

  const partner = PROFILES.find(x => x !== profile) ?? PROFILES[0];
  const stepProgress = Math.min(mySteps / STEP_GOAL, 1);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset(insets.top) }]}>
        <Text style={styles.title}>🏃 Sport</Text>
        {/* Profile selector */}
        <View style={styles.profileRow}>
          {PROFILES.map(p => (
            <TouchableOpacity
              key={p}
              onPress={() => switchProfile(p)}
              style={[styles.profileChip, profile === p && styles.profileChipActive]}
            >
              <Text style={[styles.profileChipText, profile === p && styles.profileChipTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Step counter card */}
      <View style={styles.stepsCard}>
        <View style={styles.stepsRow}>
          <View style={styles.stepsMain}>
            <Text style={styles.stepsValue}>{mySteps.toLocaleString('fr-FR')}</Text>
            <Text style={styles.stepsLabel}>pas aujourd'hui</Text>
            {!pedometerAvailable && (
              <Text style={styles.stepsUnavailable}>Podomètre indisponible</Text>
            )}
          </View>
          <View style={styles.stepsPartner}>
            <Ionicons name="person-outline" size={14} color={colors.textMuted} />
            <Text style={styles.partnerName}>{partner}</Text>
            <Text style={styles.partnerSteps}>{partnerSteps.toLocaleString('fr-FR')} pas</Text>
          </View>
        </View>
        <View style={styles.stepTrack}>
          <View style={[styles.stepFill, { width: `${stepProgress * 100}%` }]} />
        </View>
        <Text style={styles.stepGoalText}>{mySteps.toLocaleString('fr-FR')} / {STEP_GOAL.toLocaleString('fr-FR')} pas</Text>
      </View>

      {/* Week selector */}
      <View style={styles.weekSelector}>
        <TouchableOpacity
          onPress={() => setWeekOffset(w => w - 1)}
          disabled={weekOffset <= 0}
          style={{ opacity: weekOffset <= 0 ? 0.2 : 1 }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.weekLabel}>{formatWeekLabel(weekStart)}</Text>
        <TouchableOpacity onPress={() => setWeekOffset(w => w + 1)}>
          <Ionicons name="chevron-forward" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Day tabs with status */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayTabs} contentContainerStyle={{ paddingHorizontal: spacing.md }}>
        {DAYS.map((day, i) => {
          const dayDate = getDayDate(weekStart, i);
          const hasPlan = !!getDayPlan(day);
          const hasLog = !!getDayLog(dayDate);
          const past = dayDate < todayStr;
          const today = dayDate === todayStr;
          const active = selectedDay === day;
          return (
            <TouchableOpacity
              key={day}
              onPress={() => setSelectedDay(day)}
              style={[
                styles.dayTab,
                active && styles.dayTabActive,
                past && !active && styles.dayTabPast,
                today && !active && styles.dayTabToday,
              ]}
            >
              <Text style={[
                styles.dayTabText,
                active && styles.dayTabTextActive,
                past && !active && styles.dayTabTextPast,
                today && !active && styles.dayTabTextToday,
              ]}>
                {day.slice(0, 3)}
              </Text>
              <View style={styles.dayIndicators}>
                {hasPlan && <View style={[styles.dot, { backgroundColor: active ? colors.white : colors.primary }]} />}
                {hasLog && <View style={[styles.dot, { backgroundColor: colors.secondary }]} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Logged workout */}
          {currentLog && (
            <View style={styles.logCard}>
              <View style={styles.logHeader}>
                <Ionicons name="checkmark-circle" size={24} color={colors.secondary} />
                <Text style={styles.logTitle}>Séance réalisée ✅</Text>
              </View>
              <View style={styles.logStats}>
                <View style={styles.logStat}>
                  <Text style={styles.logStatValue}>{currentLog.duration_minutes}</Text>
                  <Text style={styles.logStatLabel}>min</Text>
                </View>
                {currentLog.exercises_done.length > 0 && (
                  <View style={styles.logStat}>
                    <Text style={styles.logStatValue}>{currentLog.exercises_done.length}</Text>
                    <Text style={styles.logStatLabel}>blocs</Text>
                  </View>
                )}
              </View>
              {currentLog.notes ? <Text style={styles.logNotes}>{currentLog.notes}</Text> : null}
              {currentLog.exercises_done.length > 0 && (
                <View style={styles.logExercises}>
                  {(currentLog.exercises_done as any[]).map((ex: any, i: number) => (
                    <Text key={i} style={styles.logExerciseName}>· {ex.exercise_name}</Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Planned workout */}
          {currentPlan ? (
            <View style={styles.planCard}>
              <View style={styles.planHeader}>
                <View>
                  <Text style={styles.planName}>{currentPlan.name}</Text>
                  {currentPlan.description && (
                    <Text style={styles.planDesc}>{currentPlan.description}</Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => deletePlan(currentPlan.id)}>
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>

              {(currentPlan.exercises as any[])?.map((ex: any, i: number) => (
                <View key={i} style={styles.exerciseRow}>
                  <Text style={styles.exerciseName}>{ex.exercise_name ?? `Exercice ${i + 1}`}</Text>
                  <Text style={styles.exerciseMeta}>
                    {ex.sets} × {ex.reps ? `${ex.reps} reps` : `${ex.duration_seconds}s`}
                    {ex.weight_kg ? ` @ ${ex.weight_kg}kg` : ''}
                  </Text>
                </View>
              ))}

              {!currentLog && (
                <TouchableOpacity style={styles.startBtn} onPress={startWorkout}>
                  <Ionicons name="play-circle" size={20} color={colors.white} />
                  <Text style={styles.startBtnText}>Démarrer la séance</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.emptyDay}>
              {!currentLog && (
                <>
                  <Text style={styles.restEmoji}>😴</Text>
                  <Text style={styles.restText}>Jour de repos</Text>
                  <TouchableOpacity style={styles.freeWorkoutBtn} onPress={startWorkout}>
                    <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                    <Text style={styles.freeWorkoutText}>Enregistrer une séance libre</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: 0,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text },
  profileRow: { flexDirection: 'row', gap: spacing.xs },
  profileChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  profileChipText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.textSecondary },
  profileChipTextActive: { color: colors.white },
  stepsCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepsRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.sm },
  stepsMain: { flex: 1 },
  stepsValue: { fontSize: 32, fontWeight: fontWeight.bold, color: colors.primary, lineHeight: 36 },
  stepsLabel: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  stepsUnavailable: { fontSize: fontSize.xs, color: colors.error, marginTop: 4 },
  stepsPartner: { alignItems: 'flex-end', gap: 2 },
  partnerName: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: fontWeight.medium },
  partnerSteps: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.semibold },
  stepTrack: { height: 6, backgroundColor: colors.surface, borderRadius: radius.full, overflow: 'hidden', marginBottom: 4 },
  stepFill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.full },
  stepGoalText: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'right' },
  weekSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  weekLabel: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  dayTabs: { marginBottom: spacing.md, flexGrow: 0 },
  dayTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: radius.full,
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
    minWidth: 56,
  },
  dayTabActive: { backgroundColor: colors.primary },
  dayTabPast: { opacity: 0.4 },
  dayTabToday: { borderWidth: 1.5, borderColor: colors.primary },
  dayTabText: { color: colors.textSecondary, fontWeight: fontWeight.medium, fontSize: fontSize.sm },
  dayTabTextActive: { color: colors.white },
  dayTabTextPast: { color: colors.textMuted },
  dayTabTextToday: { color: colors.primary, fontWeight: fontWeight.bold },
  dayIndicators: { flexDirection: 'row', gap: 3, marginTop: 3 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  content: { flex: 1, paddingHorizontal: spacing.md },
  logCard: {
    backgroundColor: colors.secondary + '15',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  logHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  logTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.secondary },
  logStats: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.sm },
  logStat: { alignItems: 'center' },
  logStatValue: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.secondary },
  logStatLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  logNotes: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.sm, fontStyle: 'italic' },
  logExercises: { marginTop: spacing.sm, gap: 2 },
  logExerciseName: { fontSize: fontSize.sm, color: colors.text },
  planCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  planName: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  planDesc: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 4 },
  exerciseRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  exerciseName: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.text },
  exerciseMeta: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  startBtnText: { color: colors.white, fontSize: fontSize.md, fontWeight: fontWeight.bold },
  emptyDay: { alignItems: 'center', paddingTop: 60, gap: spacing.md },
  restEmoji: { fontSize: 48 },
  restText: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textSecondary },
  freeWorkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary + '20',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  freeWorkoutText: { color: colors.primary, fontSize: fontSize.md, fontWeight: fontWeight.medium },
});
