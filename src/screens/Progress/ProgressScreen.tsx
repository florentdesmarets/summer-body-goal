import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize, fontWeight } from '../../theme';
import { supabase } from '../../lib/supabase';
import { topInset } from '../../lib/topInset';
import { WorkoutLog } from '../../types';

interface ProgressStats {
  totalWorkouts: number;
  totalMinutes: number;
  avgDuration: number;
  thisWeekWorkouts: number;
  lastWeekWorkouts: number;
  streak: number;
  volumeByWeek: { week: string; count: number; minutes: number }[];
  suggestions: string[];
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function computeStats(logs: WorkoutLog[]): ProgressStats {
  if (logs.length === 0) {
    return {
      totalWorkouts: 0, totalMinutes: 0, avgDuration: 0,
      thisWeekWorkouts: 0, lastWeekWorkouts: 0, streak: 0,
      volumeByWeek: [], suggestions: getBeginnerSuggestions(),
    };
  }

  const now = new Date();
  const thisWeek = getWeekStart(now);
  const lastWeekDate = new Date(now);
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  const lastWeek = getWeekStart(lastWeekDate);

  const totalWorkouts = logs.length;
  const totalMinutes = logs.reduce((acc, l) => acc + l.duration_minutes, 0);
  const avgDuration = Math.round(totalMinutes / totalWorkouts);
  const thisWeekWorkouts = logs.filter(l => getWeekStart(new Date(l.date)) === thisWeek).length;
  const lastWeekWorkouts = logs.filter(l => getWeekStart(new Date(l.date)) === lastWeek).length;

  // Streak calculation
  const sorted = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let streak = 0;
  let checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);
  for (const log of sorted) {
    const logDate = new Date(log.date);
    logDate.setHours(0, 0, 0, 0);
    const diff = Math.round((checkDate.getTime() - logDate.getTime()) / 86400000);
    if (diff <= 1) { streak++; checkDate = logDate; }
    else break;
  }

  // Volume by week (last 8 weeks)
  const weekMap = new Map<string, { count: number; minutes: number }>();
  logs.forEach(l => {
    const w = getWeekStart(new Date(l.date));
    const existing = weekMap.get(w) ?? { count: 0, minutes: 0 };
    weekMap.set(w, { count: existing.count + 1, minutes: existing.minutes + l.duration_minutes });
  });
  const volumeByWeek = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([week, data]) => ({ week, ...data }));

  // Generate progressive suggestions
  const suggestions = generateSuggestions(totalWorkouts, avgDuration, thisWeekWorkouts, lastWeekWorkouts, streak);

  return { totalWorkouts, totalMinutes, avgDuration, thisWeekWorkouts, lastWeekWorkouts, streak, volumeByWeek, suggestions };
}

function getBeginnerSuggestions(): string[] {
  return [
    '🎯 Commence par 2-3 séances par semaine, 30 minutes chacune.',
    '💧 Hydrate-toi bien avant, pendant et après l\'entraînement.',
    '😴 Le repos est aussi important que l\'entraînement !',
    '📝 Note tes séances pour suivre ta progression.',
  ];
}

function generateSuggestions(
  total: number, avgDur: number, thisWeek: number, lastWeek: number, streak: number
): string[] {
  const s: string[] = [];

  if (streak >= 5) s.push(`🔥 Incroyable ! ${streak} jours de suite. Continue comme ça !`);
  else if (streak >= 3) s.push(`💪 Belle série de ${streak} jours ! Tu es en feu !`);

  if (thisWeek > lastWeek) s.push(`📈 Tu t'entraînes plus que la semaine dernière (+${thisWeek - lastWeek} séance(s)) !`);
  else if (thisWeek < lastWeek) s.push(`⚡ Tu as fait ${lastWeek - thisWeek} séance(s) de moins cette semaine. Rattrape ça !`);

  if (total < 5) {
    s.push('🏃 Objectif : atteins 3 séances/semaine pour créer l\'habitude.');
    s.push('🎯 Commence léger et augmente progressivement l\'intensité.');
  } else if (total < 15) {
    s.push('📊 Tu prends de bonnes habitudes ! Essaie d\'ajouter 5 min à tes séances.');
    if (avgDur < 40) s.push(`⏱ Tes séances durent en moyenne ${avgDur} min. Vise 45 min !`);
  } else if (total < 30) {
    s.push('🚀 Tu deviens régulier·e ! Il est temps d\'augmenter les charges progressivement.');
    s.push('💡 Essaie de varier les exercices pour travailler tous les muscles.');
    if (thisWeek >= 3) s.push('🏋️ 3 séances/semaine atteintes ! Pense à intégrer du cardio entre les séances de musculation.');
  } else {
    s.push('🏆 Tu es maintenant un·e athlète confirmé·e ! Pense à la périodisation.');
    s.push('📅 Programme des semaines de récupération tous les 4-6 semaines.');
    s.push('🥗 À ton niveau, la nutrition est aussi importante que l\'entraînement. Suis tes macros !');
  }

  return s.slice(0, 4);
}

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ProgressStats | null>(null);

  useEffect(() => {
    supabase.from('workout_logs').select('*').order('date', { ascending: false }).then(({ data, error }) => {
      const logData = error ? [] : (data ?? []) as WorkoutLog[];
      setLogs(logData);
      setStats(computeStats(logData));
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );

  const maxWeekCount = stats && stats.volumeByWeek.length > 0 ? Math.max(...stats.volumeByWeek.map(w => w.count), 1) : 1;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset(insets.top) }]}>
        <Text style={styles.title}>📈 Progression</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: spacing.md }}>
        {/* Key stats */}
        <View style={styles.statsGrid}>
          <StatCard icon="🏋️" value={stats?.totalWorkouts ?? 0} label="Séances total" color={colors.primary} />
          <StatCard icon="⏱" value={stats?.totalMinutes ?? 0} label="Minutes total" color={colors.accent} />
          <StatCard icon="🔥" value={stats?.streak ?? 0} label="Jours de suite" color={colors.warning} />
          <StatCard icon="📊" value={stats?.avgDuration ?? 0} label="Moy. (min)" color={colors.secondary} />
        </View>

        {/* This week vs last week */}
        <View style={styles.weekCompare}>
          <Text style={styles.sectionTitle}>Cette semaine vs. la précédente</Text>
          <View style={styles.weekBars}>
            <WeekBar label="Sem. passée" value={stats?.lastWeekWorkouts ?? 0} max={7} color={colors.textMuted} />
            <WeekBar label="Cette sem." value={stats?.thisWeekWorkouts ?? 0} max={7} color={colors.primary} />
          </View>
        </View>

        {/* Volume chart */}
        {(stats?.volumeByWeek?.length ?? 0) > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.sectionTitle}>Séances par semaine</Text>
            <View style={styles.chart}>
              {stats!.volumeByWeek.map((w, i) => {
                const h = Math.max(4, (w.count / maxWeekCount) * 80);
                const d = new Date(w.week);
                const label = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric' });
                return (
                  <View key={i} style={styles.chartBar}>
                    <Text style={styles.chartValue}>{w.count}</Text>
                    <View style={[styles.bar, { height: h }]} />
                    <Text style={styles.chartLabel}>{label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* AI Suggestions */}
        <View style={styles.suggestionsCard}>
          <View style={styles.suggestionsHeader}>
            <Ionicons name="bulb" size={20} color={colors.warning} />
            <Text style={styles.sectionTitle}>Conseils personnalisés</Text>
          </View>
          {stats?.suggestions.map((s, i) => (
            <View key={i} style={styles.suggestionRow}>
              <Text style={styles.suggestionText}>{s}</Text>
            </View>
          ))}
        </View>

        {/* Recent workouts */}
        {logs.length > 0 && (
          <View style={styles.recentCard}>
            <Text style={styles.sectionTitle}>Dernières séances</Text>
            {logs.slice(0, 5).map((log, i) => (
              <View key={i} style={styles.logRow}>
                <View style={styles.logDate}>
                  <Text style={styles.logDateText}>
                    {new Date(log.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </Text>
                </View>
                <Text style={styles.logDuration}>⏱ {log.duration_minutes} min</Text>
                <Text style={styles.logExercises}>{log.exercises_done.length} exercices</Text>
              </View>
            ))}
          </View>
        )}

        {logs.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌟</Text>
            <Text style={styles.emptyTitle}>Commence ton aventure !</Text>
            <Text style={styles.emptyText}>
              Enregistre ta première séance dans l'onglet Sport pour voir ta progression ici.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, value, label, color }: { icon: string; value: number; label: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderColor: color + '40' }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function WeekBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(value / max, 1);
  return (
    <View style={styles.weekBarRow}>
      <Text style={styles.weekBarLabel}>{label}</Text>
      <View style={styles.weekBarTrack}>
        <View style={[styles.weekBarFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.weekBarValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
  },
  statIcon: { fontSize: 24 },
  statValue: { fontSize: fontSize.xxxl, fontWeight: fontWeight.extrabold },
  statLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  weekCompare: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  weekBars: { gap: spacing.sm },
  weekBarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  weekBarLabel: { width: 80, fontSize: fontSize.sm, color: colors.textSecondary },
  weekBarTrack: {
    flex: 1, height: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  weekBarFill: { height: '100%', borderRadius: radius.full },
  weekBarValue: { width: 20, fontSize: fontSize.sm, fontWeight: fontWeight.bold, textAlign: 'right' },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, height: 110 },
  chartBar: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  bar: { width: '100%', backgroundColor: colors.primary, borderRadius: radius.sm },
  chartValue: { fontSize: fontSize.xs, color: colors.primary, fontWeight: fontWeight.bold },
  chartLabel: { fontSize: 9, color: colors.textMuted },
  suggestionsCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning + '40',
    gap: spacing.md,
  },
  suggestionsHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  suggestionRow: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  suggestionText: { fontSize: fontSize.md, color: colors.text, lineHeight: 22 },
  recentCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  logDate: { flex: 1 },
  logDateText: { fontSize: fontSize.sm, color: colors.text },
  logDuration: { fontSize: fontSize.sm, color: colors.accent },
  logExercises: { fontSize: fontSize.sm, color: colors.textMuted },
  emptyState: { alignItems: 'center', paddingTop: 40, gap: spacing.md },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  emptyText: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing.lg },
});
