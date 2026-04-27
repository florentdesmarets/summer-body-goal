import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radius, fontSize, fontWeight } from '../../theme';
import { supabase } from '../../lib/supabase';
import { topInset } from '../../lib/topInset';
import { MealPlan, MealType, RecipeStep } from '../../types';

const todayKey = () => `cuisine:hidden:${new Date().toISOString().split('T')[0]}`;

const MEAL_ORDER = ['petit_dejeuner', 'dejeuner', 'diner', 'collation'];
const MEAL_LABELS: Record<string, { label: string; icon: string }> = {
  petit_dejeuner: { label: 'Petit-déjeuner', icon: '☀️' },
  dejeuner: { label: 'Déjeuner', icon: '🌤' },
  diner: { label: 'Dîner', icon: '🌙' },
  collation: { label: 'Collation', icon: '🍎' },
};

const MEAL_TYPE_OPTIONS: { key: MealType; label: string; icon: string }[] = [
  { key: 'petit_dejeuner', label: 'Petit-déj', icon: '☀️' },
  { key: 'dejeuner', label: 'Déjeuner', icon: '🌤' },
  { key: 'diner', label: 'Dîner', icon: '🌙' },
  { key: 'collation', label: 'Collation', icon: '🍎' },
];

const TAG_OPTIONS = ['cookeo', 'végétarien', 'protéiné', 'light', 'sans gluten', 'batch cooking'];

type DraftIngredient = { name: string; quantity: string; unit: string };
type DraftStep = { description: string; duration_minutes: string };

function getWeekStartToday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(new Date().setDate(diff)).toISOString().split('T')[0];
}

function getTodayDayName(): string {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  return days[new Date().getDay()];
}

function formatTimer(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function emptyDraft() {
  return {
    name: '',
    description: '',
    mealType: 'dejeuner' as MealType,
    prepTime: '',
    cookTime: '',
    servings: '2',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    tags: [] as string[],
    ingredients: [{ name: '', quantity: '', unit: '' }] as DraftIngredient[],
    steps: [{ description: '', duration_minutes: '' }] as DraftStep[],
  };
}

export default function CuisineScreen() {
  const insets = useSafeAreaInsets();
  const [meals, setMeals] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Record<string, Set<number>>>({});
  const [portions, setPortions] = useState<1 | 2>(1);
  const [hiddenMeals, setHiddenMeals] = useState<Set<string>>(new Set());

  // Timer
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [activeTimerKey, setActiveTimerKey] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Recipe creation modal
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(emptyDraft());

  const todayLabel = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  useFocusEffect(useCallback(() => {
    fetchTodayMeals();
    loadHidden();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []));

  const loadHidden = async () => {
    const raw = await AsyncStorage.getItem(todayKey());
    setHiddenMeals(new Set(raw ? JSON.parse(raw) : []));
  };

  const hideMeal = async (mealId: string) => {
    const next = new Set(hiddenMeals).add(mealId);
    setHiddenMeals(next);
    if (expandedMeal === mealId) setExpandedMeal(null);
    await AsyncStorage.setItem(todayKey(), JSON.stringify([...next]));
  };

  const fetchTodayMeals = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('meal_plans')
      .select('*, recipe:recipes(*)')
      .eq('week_start_date', getWeekStartToday())
      .eq('day', getTodayDayName());
    if (data) setMeals(data as MealPlan[]);
    setLoading(false);
  };

  const startTimer = (key: string, minutes: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveTimerKey(key);
    setSecondsLeft(minutes * 60);
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          setActiveTimerKey(null);
          Alert.alert('⏱ Terminé !', 'Étape terminée, passez à la suivante.');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveTimerKey(null);
    setSecondsLeft(0);
  };

  const toggleStep = (mealId: string, stepIndex: number) => {
    setCompletedSteps(prev => {
      const steps = new Set(prev[mealId] ?? []);
      if (steps.has(stepIndex)) steps.delete(stepIndex); else steps.add(stepIndex);
      return { ...prev, [mealId]: steps };
    });
  };

  // ─── Draft helpers ────────────────────────────────────────────────────────

  const setDraftField = <K extends keyof ReturnType<typeof emptyDraft>>(
    key: K, value: ReturnType<typeof emptyDraft>[K]
  ) => setDraft(d => ({ ...d, [key]: value }));

  const updateIngredient = (i: number, field: keyof DraftIngredient, value: string) =>
    setDraft(d => {
      const ingredients = [...d.ingredients];
      ingredients[i] = { ...ingredients[i], [field]: value };
      return { ...d, ingredients };
    });

  const addIngredient = () =>
    setDraft(d => ({ ...d, ingredients: [...d.ingredients, { name: '', quantity: '', unit: '' }] }));

  const removeIngredient = (i: number) =>
    setDraft(d => ({ ...d, ingredients: d.ingredients.filter((_, idx) => idx !== i) }));

  const updateStep = (i: number, field: keyof DraftStep, value: string) =>
    setDraft(d => {
      const steps = [...d.steps];
      steps[i] = { ...steps[i], [field]: value };
      return { ...d, steps };
    });

  const addStep = () =>
    setDraft(d => ({ ...d, steps: [...d.steps, { description: '', duration_minutes: '' }] }));

  const removeStep = (i: number) =>
    setDraft(d => ({ ...d, steps: d.steps.filter((_, idx) => idx !== i) }));

  const toggleTag = (tag: string) =>
    setDraft(d => ({
      ...d,
      tags: d.tags.includes(tag) ? d.tags.filter(t => t !== tag) : [...d.tags, tag],
    }));

  const openModal = () => { setDraft(emptyDraft()); setShowModal(true); };
  const closeModal = () => setShowModal(false);

  const saveRecipe = async () => {
    if (!draft.name.trim()) {
      Alert.alert('Nom manquant', 'Donne un nom à ta recette.');
      return;
    }

    setSaving(true);
    const ingredients = draft.ingredients
      .filter(i => i.name.trim())
      .map((i, idx) => ({ id: `ing-${idx}`, name: i.name.trim(), quantity: parseFloat(i.quantity) || 1, unit: i.unit.trim() || 'unité' }));

    const steps: RecipeStep[] = draft.steps
      .filter(s => s.description.trim())
      .map((s, idx) => ({
        order: idx + 1,
        description: s.description.trim(),
        ...(s.duration_minutes ? { duration_minutes: parseInt(s.duration_minutes) } : {}),
      }));

    const { error } = await supabase.from('recipes').insert({
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      prep_time_minutes: parseInt(draft.prepTime) || 0,
      cook_time_minutes: parseInt(draft.cookTime) || 0,
      servings: parseInt(draft.servings) || 2,
      calories_per_serving: parseFloat(draft.calories) || null,
      protein_g: parseFloat(draft.protein) || null,
      carbs_g: parseFloat(draft.carbs) || null,
      fat_g: parseFloat(draft.fat) || null,
      tags: draft.tags,
      ingredients,
      steps,
    });

    setSaving(false);

    if (error) {
      Alert.alert('Erreur', error.message);
      return;
    }

    setShowModal(false);
    Alert.alert('✅ Recette enregistrée', `"${draft.name}" a été ajoutée à ta bibliothèque.`);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const sortedMeals = [...meals]
    .filter(m => !hiddenMeals.has(m.id))
    .sort((a, b) => MEAL_ORDER.indexOf(a.meal_type) - MEAL_ORDER.indexOf(b.meal_type));

  const totalKcal = meals.reduce((s, m) => s + (m.recipe?.calories_per_serving ?? 0), 0) * portions;
  const totalP = meals.reduce((s, m) => s + (m.recipe?.protein_g ?? 0), 0) * portions;
  const totalG = meals.reduce((s, m) => s + (m.recipe?.carbs_g ?? 0), 0) * portions;
  const totalL = meals.reduce((s, m) => s + (m.recipe?.fat_g ?? 0), 0) * portions;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset(insets.top) }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>👨‍🍳 Cuisine</Text>
          <Text style={styles.subtitle}>{todayLabel}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.addRecipeBtn} onPress={openModal}>
            <Ionicons name="add" size={18} color={colors.white} />
            <Text style={styles.addRecipeBtnText}>Recette</Text>
          </TouchableOpacity>
          <View style={styles.portionsToggle}>
            <TouchableOpacity
              style={[styles.portionBtn, portions === 1 && styles.portionBtnActive]}
              onPress={() => setPortions(1)}
            >
              <Text style={[styles.portionBtnText, portions === 1 && styles.portionBtnTextActive]}>×1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.portionBtn, portions === 2 && styles.portionBtnActive]}
              onPress={() => setPortions(2)}
            >
              <Text style={[styles.portionBtnText, portions === 2 && styles.portionBtnTextActive]}>×2</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Daily macros */}
      {!loading && meals.length > 0 && (
        <View style={styles.macroBar}>
          <MacroItem label="kcal" value={totalKcal} color={colors.primary} />
          <View style={styles.macroDivider} />
          <MacroItem label="Protéines" value={totalP} unit="g" color={colors.secondary} />
          <View style={styles.macroDivider} />
          <MacroItem label="Glucides" value={totalG} unit="g" color={colors.warning} />
          <View style={styles.macroDivider} />
          <MacroItem label="Lipides" value={totalL} unit="g" color={colors.accent} />
        </View>
      )}

      {/* Active timer banner */}
      {activeTimerKey && (
        <View style={styles.timerBanner}>
          <Ionicons name="timer" size={18} color={colors.white} />
          <Text style={styles.timerBannerText}>{formatTimer(secondsLeft)}</Text>
          <Text style={styles.timerBannerLabel}>en cours</Text>
          <TouchableOpacity onPress={stopTimer} style={styles.timerStopBtn}>
            <Ionicons name="stop-circle" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : meals.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🍽️</Text>
          <Text style={styles.emptyTitle}>Aucun repas planifié aujourd'hui</Text>
          <Text style={styles.emptyText}>Ajoute des recettes dans le Planning Repas</Text>
          <TouchableOpacity style={styles.emptyAddBtn} onPress={openModal}>
            <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.emptyAddBtnText}>Créer une recette</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: spacing.md }}>
          {sortedMeals.map(meal => {
            const recipe = meal.recipe;
            if (!recipe) return null;
            const mealLabel = MEAL_LABELS[meal.meal_type] ?? { label: meal.meal_type, icon: '🍽️' };
            const isExpanded = expandedMeal === meal.id;
            const steps: RecipeStep[] = (recipe.steps ?? []);
            const done = completedSteps[meal.id] ?? new Set<number>();
            const progress = steps.length > 0 ? done.size / steps.length : 0;
            const isCookeo = recipe.tags?.includes('cookeo');

            return (
              <View key={meal.id} style={styles.mealCard}>
                <TouchableOpacity
                  style={styles.mealCardHeader}
                  onPress={() => setExpandedMeal(isExpanded ? null : meal.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.mealLabelIcon}>{mealLabel.icon}</Text>
                  <View style={styles.mealCardInfo}>
                    <Text style={styles.mealCardLabel}>{mealLabel.label}</Text>
                    <Text style={styles.mealCardName} numberOfLines={1}>{recipe.name}</Text>
                    <View style={styles.mealCardMetaRow}>
                      <Text style={styles.mealCardMeta}>
                        ⏱ {recipe.prep_time_minutes + recipe.cook_time_minutes} min
                      </Text>
                      <Text style={styles.mealCardMeta}>
                        🔥 {Math.round((recipe.calories_per_serving ?? 0) * portions)} kcal
                      </Text>
                      {isCookeo && <View style={styles.cookeoBadge}><Text style={styles.cookeoBadgeText}>Cookeo</Text></View>}
                    </View>
                  </View>
                  {steps.length > 0 && (
                    <View style={styles.stepsBadge}>
                      <Text style={styles.stepsBadgeText}>{done.size}/{steps.length}</Text>
                    </View>
                  )}
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.expanded}>
                    {steps.length > 0 && (
                      <View style={styles.progressRow}>
                        <View style={styles.progressTrack}>
                          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                        </View>
                        <Text style={styles.progressText}>{done.size}/{steps.length} étapes</Text>
                      </View>
                    )}

                    <View style={styles.recipeMacroRow}>
                      {recipe.protein_g ? <Text style={styles.recipeMacro}>💪 {Math.round(recipe.protein_g * portions)}g prot</Text> : null}
                      {recipe.carbs_g ? <Text style={styles.recipeMacro}>🌾 {Math.round(recipe.carbs_g * portions)}g glucides</Text> : null}
                      {recipe.fat_g ? <Text style={styles.recipeMacro}>🫒 {Math.round(recipe.fat_g * portions)}g lipides</Text> : null}
                    </View>

                    <Text style={styles.sectionTitle}>🛒 Ingrédients</Text>
                    {(recipe.ingredients ?? []).map((ing: any, i: number) => (
                      <View key={i} style={styles.ingredientRow}>
                        <View style={styles.ingredientDot} />
                        <Text style={styles.ingredientName}>{ing.name}</Text>
                        <Text style={styles.ingredientQty}>
                          {portions === 1 ? ing.quantity : Math.round(ing.quantity * portions * 10) / 10} {ing.unit}
                        </Text>
                      </View>
                    ))}

                    {steps.length > 0 && (
                      <>
                        <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>📋 Étapes</Text>
                        {steps.map((step, i) => {
                          const stepKey = `${meal.id}-${i}`;
                          const isActive = activeTimerKey === stepKey;
                          const isDone = done.has(i);
                          return (
                            <View key={i} style={[styles.stepCard, isDone && styles.stepCardDone]}>
                              <TouchableOpacity
                                style={styles.stepLeft}
                                onPress={() => toggleStep(meal.id, i)}
                              >
                                <View style={[styles.stepNumber, isDone && styles.stepNumberDone]}>
                                  {isDone
                                    ? <Ionicons name="checkmark" size={14} color={colors.white} />
                                    : <Text style={styles.stepNumberText}>{i + 1}</Text>}
                                </View>
                                <Text style={[styles.stepText, isDone && styles.stepTextDone]}>
                                  {step.description}
                                </Text>
                              </TouchableOpacity>
                              {step.duration_minutes ? (
                                <TouchableOpacity
                                  style={[styles.timerBtn, isActive && styles.timerBtnActive]}
                                  onPress={() => isActive ? stopTimer() : startTimer(stepKey, step.duration_minutes!)}
                                >
                                  <Ionicons
                                    name={isActive ? 'stop' : 'timer-outline'}
                                    size={13}
                                    color={isActive ? colors.white : colors.primary}
                                  />
                                  <Text style={[styles.timerBtnText, isActive && { color: colors.white }]}>
                                    {isActive ? formatTimer(secondsLeft) : `${step.duration_minutes}min`}
                                  </Text>
                                </TouchableOpacity>
                              ) : null}
                            </View>
                          );
                        })}
                      </>
                    )}

                    {done.size === steps.length && steps.length > 0 && (
                      <View style={styles.doneCard}>
                        <Text style={styles.doneText}>🎉 Bon appétit !</Text>
                      </View>
                    )}

                    <TouchableOpacity style={styles.hideMealBtn} onPress={() => hideMeal(meal.id)}>
                      <Ionicons name="eye-off-outline" size={15} color={colors.textMuted} />
                      <Text style={styles.hideMealBtnText}>Masquer pour aujourd'hui</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ─── Recipe Creation Modal ─────────────────────────────────────────── */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeModal}>
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: colors.background }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Modal header */}
          <View style={[styles.modalHeader, { paddingTop: topInset(insets.top) }]}>
            <TouchableOpacity onPress={closeModal}>
              <Text style={styles.modalCancel}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nouvelle recette</Text>
            <TouchableOpacity onPress={saveRecipe} disabled={saving}>
              {saving
                ? <ActivityIndicator color={colors.primary} />
                : <Text style={styles.modalSave}>Enregistrer</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Général ── */}
            <FormSection title="Général">
              <FormInput
                label="Nom de la recette *"
                value={draft.name}
                onChangeText={v => setDraftField('name', v)}
                placeholder="Ex: Poulet rôti aux herbes"
              />
              <FormInput
                label="Description"
                value={draft.description}
                onChangeText={v => setDraftField('description', v)}
                placeholder="Courte description..."
                multiline
              />
              <Text style={styles.formLabel}>Type de repas</Text>
              <View style={styles.chipRow}>
                {MEAL_TYPE_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.chip, draft.mealType === opt.key && styles.chipActive]}
                    onPress={() => setDraftField('mealType', opt.key)}
                  >
                    <Text style={[styles.chipText, draft.mealType === opt.key && styles.chipTextActive]}>
                      {opt.icon} {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.rowInputs}>
                <View style={{ flex: 1 }}>
                  <FormInput label="Préparation (min)" value={draft.prepTime} onChangeText={v => setDraftField('prepTime', v)} placeholder="0" keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <FormInput label="Cuisson (min)" value={draft.cookTime} onChangeText={v => setDraftField('cookTime', v)} placeholder="0" keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <FormInput label="Portions" value={draft.servings} onChangeText={v => setDraftField('servings', v)} placeholder="2" keyboardType="numeric" />
                </View>
              </View>
            </FormSection>

            {/* ── Macros ── */}
            <FormSection title="Macros (par portion)">
              <View style={styles.rowInputs}>
                <View style={{ flex: 1 }}>
                  <FormInput label="Calories" value={draft.calories} onChangeText={v => setDraftField('calories', v)} placeholder="0" keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <FormInput label="Protéines (g)" value={draft.protein} onChangeText={v => setDraftField('protein', v)} placeholder="0" keyboardType="numeric" />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{ flex: 1 }}>
                  <FormInput label="Glucides (g)" value={draft.carbs} onChangeText={v => setDraftField('carbs', v)} placeholder="0" keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <FormInput label="Lipides (g)" value={draft.fat} onChangeText={v => setDraftField('fat', v)} placeholder="0" keyboardType="numeric" />
                </View>
              </View>
            </FormSection>

            {/* ── Tags ── */}
            <FormSection title="Tags">
              <View style={styles.chipRow}>
                {TAG_OPTIONS.map(tag => (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.chip, draft.tags.includes(tag) && styles.chipActive]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text style={[styles.chipText, draft.tags.includes(tag) && styles.chipTextActive]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </FormSection>

            {/* ── Ingrédients ── */}
            <FormSection title="Ingrédients">
              {draft.ingredients.map((ing, i) => (
                <View key={i} style={styles.ingredientFormRow}>
                  <TextInput
                    style={[styles.formInput, { flex: 2 }]}
                    placeholder="Ingrédient"
                    placeholderTextColor={colors.textMuted}
                    value={ing.name}
                    onChangeText={v => updateIngredient(i, 'name', v)}
                  />
                  <TextInput
                    style={[styles.formInput, { flex: 0.7 }]}
                    placeholder="Qté"
                    placeholderTextColor={colors.textMuted}
                    value={ing.quantity}
                    onChangeText={v => updateIngredient(i, 'quantity', v)}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.formInput, { flex: 0.9 }]}
                    placeholder="Unité"
                    placeholderTextColor={colors.textMuted}
                    value={ing.unit}
                    onChangeText={v => updateIngredient(i, 'unit', v)}
                  />
                  {draft.ingredients.length > 1 && (
                    <TouchableOpacity onPress={() => removeIngredient(i)} style={styles.removeBtn}>
                      <Ionicons name="trash-outline" size={16} color={colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity style={styles.addRowBtn} onPress={addIngredient}>
                <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                <Text style={styles.addRowBtnText}>Ajouter un ingrédient</Text>
              </TouchableOpacity>
            </FormSection>

            {/* ── Étapes ── */}
            <FormSection title="Étapes">
              {draft.steps.map((step, i) => (
                <View key={i} style={styles.stepFormCard}>
                  <View style={styles.stepFormHeader}>
                    <View style={styles.stepFormNumber}>
                      <Text style={styles.stepFormNumberText}>{i + 1}</Text>
                    </View>
                    {draft.steps.length > 1 && (
                      <TouchableOpacity onPress={() => removeStep(i)} style={styles.removeBtn}>
                        <Ionicons name="trash-outline" size={16} color={colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <TextInput
                    style={[styles.formInput, styles.stepDescInput]}
                    placeholder="Description de l'étape..."
                    placeholderTextColor={colors.textMuted}
                    value={step.description}
                    onChangeText={v => updateStep(i, 'description', v)}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                  <View style={styles.stepTimerRow}>
                    <Ionicons name="timer-outline" size={15} color={colors.textMuted} />
                    <TextInput
                      style={[styles.formInput, styles.stepTimerInput]}
                      placeholder="Durée (min) — optionnel"
                      placeholderTextColor={colors.textMuted}
                      value={step.duration_minutes}
                      onChangeText={v => updateStep(i, 'duration_minutes', v)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              ))}
              <TouchableOpacity style={styles.addRowBtn} onPress={addStep}>
                <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                <Text style={styles.addRowBtnText}>Ajouter une étape</Text>
              </TouchableOpacity>
            </FormSection>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Small components ──────────────────────────────────────────────────────

function MacroItem({ label, value, unit, color }: { label: string; value: number; unit?: string; color: string }) {
  return (
    <View style={styles.macroItem}>
      <Text style={[styles.macroValue, { color }]}>{Math.round(value)}{unit ?? ''}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.formSection}>
      <Text style={styles.formSectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function FormInput({
  label, value, onChangeText, placeholder, multiline, keyboardType,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; multiline?: boolean; keyboardType?: 'numeric' | 'default';
}) {
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={[styles.formInput, multiline && styles.formInputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
        keyboardType={keyboardType ?? 'default'}
      />
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text },
  subtitle: { fontSize: fontSize.sm, color: colors.textMuted, textTransform: 'capitalize' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  addRecipeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  addRecipeBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.white },
  portionsToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  portionBtn: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full },
  portionBtnActive: { backgroundColor: colors.primary },
  portionBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.textMuted },
  portionBtnTextActive: { color: colors.white },
  macroBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  macroItem: { flex: 1, alignItems: 'center' },
  macroValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  macroLabel: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  macroDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: 4 },
  timerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  timerBannerText: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.white },
  timerBannerLabel: { flex: 1, fontSize: fontSize.sm, color: colors.white + 'CC' },
  timerStopBtn: { padding: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  emptyText: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center' },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary + '20',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  emptyAddBtnText: { color: colors.primary, fontSize: fontSize.md, fontWeight: fontWeight.medium },
  mealCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  mealCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  mealLabelIcon: { fontSize: 24 },
  mealCardInfo: { flex: 1 },
  mealCardLabel: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: fontWeight.semibold, textTransform: 'uppercase' },
  mealCardName: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text, marginTop: 1 },
  mealCardMetaRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 3, alignItems: 'center', flexWrap: 'wrap' },
  mealCardMeta: { fontSize: fontSize.xs, color: colors.textMuted },
  cookeoBadge: { backgroundColor: colors.primary + '25', borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  cookeoBadgeText: { fontSize: 9, color: colors.primary, fontWeight: fontWeight.bold },
  stepsBadge: { backgroundColor: colors.surface, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 4 },
  stepsBadgeText: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: fontWeight.semibold },
  expanded: { borderTopWidth: 1, borderTopColor: colors.border, padding: spacing.md, paddingTop: spacing.sm },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  progressTrack: { flex: 1, height: 6, backgroundColor: colors.surface, borderRadius: radius.full, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.secondary, borderRadius: radius.full },
  progressText: { fontSize: fontSize.xs, color: colors.textMuted, minWidth: 50, textAlign: 'right' },
  recipeMacroRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm, flexWrap: 'wrap' },
  recipeMacro: { fontSize: fontSize.xs, color: colors.textSecondary },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.sm },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.sm },
  ingredientDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  ingredientName: { flex: 1, fontSize: fontSize.sm, color: colors.text },
  ingredientQty: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.primary },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepCardDone: { opacity: 0.5, borderColor: colors.secondary },
  stepLeft: { flex: 1, flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  stepNumber: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumberDone: { backgroundColor: colors.secondary },
  stepNumberText: { color: colors.white, fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  stepText: { flex: 1, fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },
  stepTextDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  timerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary + '20', borderRadius: radius.full,
    paddingHorizontal: 8, paddingVertical: 5,
    borderWidth: 1, borderColor: colors.primary, flexShrink: 0,
  },
  timerBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  timerBtnText: { fontSize: 11, color: colors.primary, fontWeight: fontWeight.bold },
  doneCard: {
    backgroundColor: colors.secondary + '20', borderRadius: radius.lg, padding: spacing.md,
    alignItems: 'center', marginTop: spacing.sm, borderWidth: 1, borderColor: colors.secondary,
  },
  doneText: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.secondary },
  hideMealBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, marginTop: spacing.md, paddingVertical: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  hideMealBtnText: { fontSize: fontSize.sm, color: colors.textMuted },

  // ── Modal ──
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  modalTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  modalCancel: { fontSize: fontSize.md, color: colors.textMuted },
  modalSave: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary },
  modalContent: { padding: spacing.md, paddingBottom: 60 },

  // ── Form ──
  formSection: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formSectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  formLabel: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: 4, fontWeight: fontWeight.medium },
  formInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    color: colors.text,
    fontSize: fontSize.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formInputMultiline: { minHeight: 72, paddingTop: 10 },
  rowInputs: { flexDirection: 'row', gap: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  chipTextActive: { color: colors.white },

  // ── Ingredient form row ──
  ingredientFormRow: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', marginBottom: spacing.sm },
  removeBtn: { padding: 6 },
  addRowBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm, justifyContent: 'center',
  },
  addRowBtnText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: fontWeight.medium },

  // ── Step form card ──
  stepFormCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepFormHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  stepFormNumber: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  stepFormNumberText: { color: colors.white, fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  stepDescInput: { marginBottom: spacing.sm, minHeight: 70 },
  stepTimerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepTimerInput: { flex: 1 },
});
