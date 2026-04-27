import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, TextInput, FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize, fontWeight } from '../../theme';
import { supabase } from '../../lib/supabase';
import { topInset } from '../../lib/topInset';
import { loadFromCache, saveToCache } from '../../lib/cache';
import { DayOfWeek, MealType, MealPlan, Recipe, WorkoutLog } from '../../types';
import { RootStackParamList } from '../../../App';

const DAYS: DayOfWeek[] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const MEAL_TYPES: { key: MealType; label: string; icon: string }[] = [
  { key: 'petit_dejeuner', label: 'Petit-déj', icon: '☀️' },
  { key: 'dejeuner', label: 'Déjeuner', icon: '🌤' },
  { key: 'diner', label: 'Dîner', icon: '🌙' },
  { key: 'collation', label: 'Collation', icon: '🍎' },
];

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

type Nav = StackNavigationProp<RootStackParamList>;

export default function MealsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Lundi');
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Picker state
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerDay, setPickerDay] = useState<DayOfWeek>('Lundi');
  const [pickerMealType, setPickerMealType] = useState<MealType>('dejeuner');
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [recipesLoading, setRecipesLoading] = useState(false);

  const weekStart = getWeekStartDate(weekOffset);
  const todayStr = new Date().toISOString().split('T')[0];

  const getDayDateStr = (day: DayOfWeek) => {
    const idx = DAYS.indexOf(day);
    const d = new Date(weekStart);
    d.setDate(d.getDate() + idx);
    return d.toISOString().split('T')[0];
  };

  const isDayPast = (day: DayOfWeek) => getDayDateStr(day) < todayStr;
  const isDayToday = (day: DayOfWeek) => getDayDateStr(day) === todayStr;

  const weekEndDate = (() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d.toISOString().split('T')[0];
  })();

  const fetchMealPlans = useCallback(async () => {
    const cacheKey = `meal_plans_${weekStart}`;
    const cached = await loadFromCache<MealPlan[]>(cacheKey);
    if (cached) { setMealPlans(cached); setLoading(false); } else { setLoading(true); }
    try {
      const [{ data: mealsData, error }, { data: logsData }] = await Promise.all([
        supabase.from('meal_plans').select('*, recipe:recipes(*)').eq('week_start_date', weekStart),
        supabase.from('workout_logs').select('*').gte('date', weekStart).lte('date', weekEndDate),
      ]);
      if (!error && mealsData) {
        setMealPlans(mealsData as MealPlan[]);
        await saveToCache(cacheKey, mealsData);
      }
      if (logsData) setWorkoutLogs(logsData as WorkoutLog[]);
    } catch {}
    setLoading(false);
  }, [weekStart]);

  useEffect(() => { fetchMealPlans(); }, [fetchMealPlans]);

  const fetchAllRecipes = useCallback(async () => {
    setRecipesLoading(true);
    const { data, error } = await supabase.from('recipes').select('*').order('name');
    if (error) {
      Alert.alert('Erreur Supabase', error.message);
    } else if (data) {
      setAllRecipes(data as Recipe[]);
      await saveToCache('all_recipes', data);
    }
    setRecipesLoading(false);
  }, []);

  const openPicker = (day: DayOfWeek, mealType: MealType) => {
    setPickerDay(day);
    setPickerMealType(mealType);
    setSearchQuery('');
    setSelectedCategory(null);
    setPickerVisible(true);
    fetchAllRecipes();
  };

  const selectRecipe = async (recipe: Recipe) => {
    setAdding(true);
    const { error } = await supabase.from('meal_plans').upsert({
      week_start_date: weekStart,
      day: pickerDay,
      meal_type: pickerMealType,
      recipe_id: recipe.id,
    }, { onConflict: 'week_start_date,day,meal_type' });
    setAdding(false);
    if (!error) {
      setPickerVisible(false);
      fetchMealPlans();
    } else {
      Alert.alert('Erreur', error.message);
    }
  };

  const getMeal = (day: DayOfWeek, type: MealType) =>
    mealPlans.find(p => p.day === day && p.meal_type === type);

  const removeMeal = async (id: string) => {
    await supabase.from('meal_plans').delete().eq('id', id);
    await fetchMealPlans();
  };

  const generateShoppingList = async () => {
    const allIngredients: { name: string; quantity: number; unit: string }[] = [];
    mealPlans.forEach(plan => {
      if (plan.recipe?.ingredients) {
        plan.recipe.ingredients.forEach(ing => {
          const existing = allIngredients.find(
            i => i.name.toLowerCase() === ing.name.toLowerCase() && i.unit === ing.unit
          );
          if (existing) existing.quantity += ing.quantity;
          else allIngredients.push({ ...ing });
        });
      }
    });
    await supabase.from('shopping_items').delete().eq('week_start_date', weekStart);
    if (allIngredients.length > 0) {
      await supabase.from('shopping_items').insert(
        allIngredients.map(i => ({ ...i, week_start_date: weekStart, is_checked: false }))
      );
    }
    Alert.alert('✅ Liste générée !', `${allIngredients.length} article(s) ajouté(s) à ta liste de courses.`);
  };

  // Remove duplicate DAYS already defined at top level
  const MEAL_TYPE_TAG: Record<MealType, string> = {
    petit_dejeuner: 'petit-dejeuner',
    dejeuner: 'dejeuner',
    diner: 'diner',
    collation: 'collation',
  };

  const RECIPE_CATEGORIES = [
    { key: 'cookeo', label: 'Cookeo', icon: '🥘', color: '#FF6B35' },
    { key: 'vegetarien', label: 'Végétarien', icon: '🥦', color: '#4CAF50' },
    { key: 'proteine', label: 'Protéiné', icon: '💪', color: '#2196F3' },
    { key: 'light', label: 'Light', icon: '🌿', color: '#00BCD4' },
    { key: 'batch-cooking', label: 'Batch cooking', icon: '🍱', color: '#9C27B0' },
    { key: 'sans gluten', label: 'Sans gluten', icon: '🌾', color: '#FF9800' },
  ];

  const mealTypeLabel = MEAL_TYPES.find(m => m.key === pickerMealType);
  const mealTypeTag = MEAL_TYPE_TAG[pickerMealType];

  const filteredRecipes = allRecipes.filter(r => {
    const matchesMealType = (r.tags ?? []).includes(mealTypeTag);
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = !selectedCategory || (r.tags ?? []).includes(selectedCategory);
    return matchesMealType && matchesSearch && matchesCat;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset(insets.top) }]}>
        <Text style={styles.title} numberOfLines={1}>🍽️ Planning Repas</Text>
        <TouchableOpacity onPress={generateShoppingList} style={styles.cartBtn}>
          <Ionicons name="cart" size={16} color={colors.white} />
          <Text style={styles.cartBtnText}>Courses</Text>
        </TouchableOpacity>
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

      {/* Day tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayTabs} contentContainerStyle={{ paddingHorizontal: spacing.md }}>
        {DAYS.map(day => {
          const past = isDayPast(day);
          const today = isDayToday(day);
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
              {today && <View style={styles.todayDot} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Meals for selected day */}
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={styles.mealsContainer} contentContainerStyle={{ paddingBottom: 100 }}>
          {MEAL_TYPES.map(({ key, label, icon }) => {
            const meal = getMeal(selectedDay, key);
            const past = isDayPast(selectedDay);
            return (
              <View key={key} style={[styles.mealCard, past && styles.mealCardPast]}>
                <View style={styles.mealHeader}>
                  <Text style={styles.mealIcon}>{icon}</Text>
                  <Text style={styles.mealType}>{label}</Text>
                </View>
                {meal?.recipe ? (
                  <TouchableOpacity
                    style={styles.recipeCard}
                    onPress={() => navigation.navigate('Recipe', { recipeId: meal.recipe_id })}
                  >
                    <View style={styles.recipeInfo}>
                      <Text style={styles.recipeName}>{meal.recipe.name}</Text>
                      <View style={styles.recipeMeta}>
                        <Text style={styles.recipeMetaText}>
                          ⏱ {meal.recipe.prep_time_minutes + meal.recipe.cook_time_minutes} min
                        </Text>
                        {meal.recipe.calories_per_serving && (
                          <Text style={styles.recipeMetaText}>🔥 {meal.recipe.calories_per_serving} kcal</Text>
                        )}
                      </View>
                    </View>
                    {!past && (
                      <TouchableOpacity onPress={() => removeMeal(meal.id)} style={styles.removeBtn}>
                        <Ionicons name="close-circle" size={22} color={colors.error} />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                ) : !past ? (
                  <TouchableOpacity style={styles.addMealBtn} onPress={() => openPicker(selectedDay, key)}>
                    <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                    <Text style={styles.addMealText}>Ajouter une recette</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.noMealPast}>—</Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Recipe Picker Modal */}
      <Modal visible={pickerVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPickerVisible(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Choisir une recette</Text>
              <Text style={styles.modalSubtitle}>
                {mealTypeLabel?.icon} {mealTypeLabel?.label} — {pickerDay}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setPickerVisible(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher une recette..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
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
            {RECIPE_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.key}
                style={[styles.categoryChip, selectedCategory === cat.key && { backgroundColor: cat.color, borderColor: cat.color }]}
                onPress={() => setSelectedCategory(prev => prev === cat.key ? null : cat.key)}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={[styles.categoryChipText, selectedCategory === cat.key && styles.categoryChipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {adding || recipesLoading ? (
            <View style={styles.emptyPicker}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={[styles.emptyPickerText, { marginTop: spacing.md }]}>
                {adding ? 'Enregistrement...' : 'Chargement des recettes...'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredRecipes}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingBottom: 40 }}
              ListEmptyComponent={
                <View style={styles.emptyPicker}>
                  <Text style={styles.emptyPickerText}>
                    {allRecipes.length === 0
                      ? '⚠️ Aucune recette en base.\nExécute les fichiers seed.sql et seed_cookeo.sql dans Supabase.'
                      : 'Aucune recette trouvée'}
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.recipePickerRow} onPress={() => selectRecipe(item)} activeOpacity={0.7}>
                  <View style={styles.recipePickerInfo}>
                    <Text style={styles.recipePickerName}>{item.name}</Text>
                    <View style={styles.recipePickerMeta}>
                      <Text style={styles.recipePickerMetaText}>
                        ⏱ {item.prep_time_minutes + item.cook_time_minutes} min
                      </Text>
                      {item.calories_per_serving ? (
                        <Text style={styles.recipePickerMetaText}>🔥 {item.calories_per_serving} kcal</Text>
                      ) : null}
                      {item.tags?.includes('cookeo') ? (
                        <Text style={styles.cookeoTag}>Cookeo</Text>
                      ) : null}
                    </View>
                  </View>
                  <Ionicons name="add-circle" size={28} color={colors.primary} />
                </TouchableOpacity>
              )}
            />
          )}
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text, flex: 1, marginRight: spacing.sm },
  cartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    gap: 4,
  },
  cartBtnText: { color: colors.white, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
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
    height: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  dayTabActive: { backgroundColor: colors.primary },
  dayTabPast: { backgroundColor: colors.surface, opacity: 0.45 },
  dayTabToday: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.primary },
  dayTabText: { color: colors.textSecondary, fontWeight: fontWeight.medium, fontSize: fontSize.sm },
  dayTabTextActive: { color: colors.white },
  dayTabTextPast: { color: colors.textMuted },
  dayTabTextToday: { color: colors.primary, fontWeight: fontWeight.bold },
  todayDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primary },
  mealsContainer: { flex: 1, paddingHorizontal: spacing.md },
  mealCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mealCardPast: { opacity: 0.5 },
  noMealPast: { fontSize: fontSize.sm, color: colors.textMuted, paddingVertical: 4 },
  mealHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  mealIcon: { fontSize: 18 },
  mealType: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  recipeInfo: { flex: 1 },
  recipeName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  recipeMeta: { flexDirection: 'row', gap: spacing.md, marginTop: 4 },
  recipeMetaText: { fontSize: fontSize.sm, color: colors.textMuted },
  removeBtn: { padding: 4 },
  addMealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  addMealText: { color: colors.primary, fontSize: fontSize.md, fontWeight: fontWeight.medium },

  workoutLogCard: {
    backgroundColor: colors.secondary + '15',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  workoutLogHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 },
  workoutLogIcon: { fontSize: 18 },
  workoutLogTitle: { flex: 1, fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.secondary },
  workoutLogBadge: {
    backgroundColor: colors.secondary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  workoutLogBadgeText: { fontSize: fontSize.xs, color: colors.white, fontWeight: fontWeight.bold },
  workoutLogNotes: { fontSize: fontSize.sm, color: colors.text, marginBottom: 4, fontStyle: 'italic' },
  workoutLogExercises: { fontSize: fontSize.xs, color: colors.textMuted },

  // Modal
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingTop: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  modalSubtitle: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: 2 },
  closeBtn: {
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
    borderRadius: radius.md,
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: colors.text,
    fontSize: fontSize.md,
  },
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
  recipePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recipePickerInfo: { flex: 1 },
  recipePickerName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  recipePickerMeta: { flexDirection: 'row', gap: spacing.sm, marginTop: 4, flexWrap: 'wrap' },
  recipePickerMetaText: { fontSize: fontSize.sm, color: colors.textMuted },
  cookeoTag: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.bold,
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  emptyPicker: { alignItems: 'center', paddingTop: 60 },
  emptyPickerText: { fontSize: fontSize.md, color: colors.textMuted },
});
