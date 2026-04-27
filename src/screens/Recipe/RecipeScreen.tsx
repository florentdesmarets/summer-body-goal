import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize, fontWeight } from '../../theme';
import { supabase } from '../../lib/supabase';
import { topInset } from '../../lib/topInset';
import { saveToCache, loadFromCache } from '../../lib/cache';
import { Recipe, RecipeStep } from '../../types';
import { RootStackParamList } from '../../../App';

type RouteT = RouteProp<RootStackParamList, 'Recipe'>;

export default function RecipeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteT>();
  const { recipeId } = route.params;

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'steps'>('ingredients');
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    const cacheKey = `recipe:${recipeId}`;
    loadFromCache<Recipe>(cacheKey).then(cached => {
      if (cached) { setRecipe(cached); setLoading(false); }
    });
    supabase.from('recipes').select('*').eq('id', recipeId).single().then(({ data }) => {
      if (data) {
        setRecipe(data as Recipe);
        saveToCache(cacheKey, data);
      }
      setLoading(false);
    });
  }, [recipeId]);

  const toggleStep = (index: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  if (loading) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );

  if (!recipe) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ color: colors.text }}>Recette introuvable</Text>
    </View>
  );

  const steps: RecipeStep[] = recipe.steps ?? [];
  const progress = steps.length > 0 ? completedSteps.size / steps.length : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset(insets.top) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{recipe.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Meta info */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={16} color={colors.primary} />
          <Text style={styles.metaLabel}>Préparation</Text>
          <Text style={styles.metaValue}>{recipe.prep_time_minutes} min</Text>
        </View>
        <View style={styles.metaSep} />
        <View style={styles.metaItem}>
          <Ionicons name="flame-outline" size={16} color={colors.warning} />
          <Text style={styles.metaLabel}>Cuisson</Text>
          <Text style={styles.metaValue}>{recipe.cook_time_minutes} min</Text>
        </View>
        <View style={styles.metaSep} />
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={16} color={colors.secondary} />
          <Text style={styles.metaLabel}>Portions</Text>
          <Text style={styles.metaValue}>{recipe.servings}</Text>
        </View>
        {recipe.calories_per_serving ? (
          <>
            <View style={styles.metaSep} />
            <View style={styles.metaItem}>
              <Ionicons name="fitness-outline" size={16} color={colors.accent} />
              <Text style={styles.metaLabel}>Calories</Text>
              <Text style={styles.metaValue}>{recipe.calories_per_serving} kcal</Text>
            </View>
          </>
        ) : null}
      </View>

      {/* Macros */}
      {(recipe.protein_g || recipe.carbs_g || recipe.fat_g) ? (
        <View style={styles.macrosRow}>
          {recipe.protein_g ? <MacroBadge label="Protéines" value={recipe.protein_g} unit="g" color={colors.secondary} /> : null}
          {recipe.carbs_g ? <MacroBadge label="Glucides" value={recipe.carbs_g} unit="g" color={colors.warning} /> : null}
          {recipe.fat_g ? <MacroBadge label="Lipides" value={recipe.fat_g} unit="g" color={colors.accent} /> : null}
        </View>
      ) : null}

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ingredients' && styles.tabActive]}
          onPress={() => setActiveTab('ingredients')}
        >
          <Text style={[styles.tabText, activeTab === 'ingredients' && styles.tabTextActive]}>
            🥗 Ingrédients ({recipe.ingredients?.length ?? 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'steps' && styles.tabActive]}
          onPress={() => setActiveTab('steps')}
        >
          <Text style={[styles.tabText, activeTab === 'steps' && styles.tabTextActive]}>
            📋 Étapes ({steps.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        {activeTab === 'ingredients' ? (
          <View>
            {recipe.ingredients?.map((ing, i) => (
              <View key={i} style={styles.ingredientRow}>
                <View style={styles.ingredientDot} />
                <Text style={styles.ingredientName}>{ing.name}</Text>
                <Text style={styles.ingredientQty}>{ing.quantity} {ing.unit}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View>
            {/* Progress bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {completedSteps.size}/{steps.length} étapes
              </Text>
            </View>

            {steps.map((step, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.stepCard, completedSteps.has(i) && styles.stepCardDone]}
                onPress={() => toggleStep(i)}
                activeOpacity={0.8}
              >
                <View style={[styles.stepNumber, completedSteps.has(i) && styles.stepNumberDone]}>
                  {completedSteps.has(i)
                    ? <Ionicons name="checkmark" size={16} color={colors.white} />
                    : <Text style={styles.stepNumberText}>{i + 1}</Text>
                  }
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepText, completedSteps.has(i) && styles.stepTextDone]}>
                    {step.description}
                  </Text>
                  {step.duration_minutes ? (
                    <Text style={styles.stepDuration}>⏱ {step.duration_minutes} min</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))}

            {completedSteps.size === steps.length && steps.length > 0 && (
              <View style={styles.doneCard}>
                <Text style={styles.doneText}>🎉 Recette terminée ! Bon appétit !</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function MacroBadge({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <View style={[styles.macroBadge, { borderColor: color }]}>
      <Text style={[styles.macroValue, { color }]}>{value}{unit}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
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
  headerTitle: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaItem: { flex: 1, alignItems: 'center', gap: 4 },
  metaLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  metaValue: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
  metaSep: { width: 1, backgroundColor: colors.border },
  macrosRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  macroBadge: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
  },
  macroValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  macroLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 4,
    marginBottom: spacing.md,
  },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.md },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.textMuted },
  tabTextActive: { color: colors.white },
  content: { flex: 1, paddingHorizontal: spacing.md },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  ingredientDot: {
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  ingredientName: { flex: 1, fontSize: fontSize.md, color: colors.text },
  ingredientQty: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.primary },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  progressTrack: {
    flex: 1, height: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.secondary, borderRadius: radius.full },
  progressText: { fontSize: fontSize.sm, color: colors.textSecondary, minWidth: 60 },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepCardDone: { borderColor: colors.secondary, opacity: 0.7 },
  stepNumber: {
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberDone: { backgroundColor: colors.secondary },
  stepNumberText: { color: colors.white, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  stepContent: { flex: 1 },
  stepText: { fontSize: fontSize.md, color: colors.text, lineHeight: 22 },
  stepTextDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  stepDuration: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 4 },
  doneCard: {
    backgroundColor: colors.secondary + '20',
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.secondary,
    marginTop: spacing.md,
  },
  doneText: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.secondary },
});
