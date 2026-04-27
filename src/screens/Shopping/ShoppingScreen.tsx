import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize, fontWeight } from '../../theme';
import { supabase } from '../../lib/supabase';
import { topInset } from '../../lib/topInset';
import { loadFromCache, saveToCache } from '../../lib/cache';
import { ShoppingItem } from '../../types';

const GROCERY_CATEGORIES: { label: string; icon: string; keywords: string[] }[] = [
  { label: 'Légumes', icon: '🥦', keywords: ['brocoli', 'carotte', 'courgette', 'poireau', 'tomate', 'épinard', 'champignon', 'haricot', 'oignon', 'ail', 'salade', 'concombre', 'chou', 'betterave', 'patate', 'radis', 'céleri', 'asperge', 'aubergine', 'fenouil', 'artichaut'] },
  { label: 'Fruits', icon: '🍎', keywords: ['pomme', 'banane', 'orange', 'citron', 'fraise', 'framboise', 'myrtille', 'fruit rouge', 'raisin', 'mangue', 'ananas', 'poire', 'pêche', 'abricot', 'cerise', 'kiwi', 'avocat', 'melon'] },
  { label: 'Viandes & Volailles', icon: '🥩', keywords: ['poulet', 'dinde', 'boeuf', 'bœuf', 'veau', 'porc', 'agneau', 'steak', 'escalope', 'blanc de', 'jambon', 'saucisse', 'hachée', 'lardon'] },
  { label: 'Poissons', icon: '🐟', keywords: ['saumon', 'cabillaud', 'thon', 'sardine', 'maquereau', 'crevette', 'dorade', 'bar', 'sole', 'truite'] },
  { label: 'Produits laitiers & Œufs', icon: '🥛', keywords: ['lait', 'yaourt', 'fromage', 'beurre', 'crème', 'oeuf', 'œuf', 'ricotta', 'mozzarella', 'parmesan', 'comté', 'emmental', 'skyr'] },
  { label: 'Féculents & Légumineuses', icon: '🌾', keywords: ['riz', 'pâte', 'quinoa', 'lentille', 'pois', 'farine', 'pain', 'flocon', 'avoine', 'semoule', 'boulgour', 'orge'] },
  { label: 'Fruits secs & Graines', icon: '🥜', keywords: ['amande', 'noix', 'noisette', 'pistache', 'cajou', 'graine', 'chia', 'lin', 'sésame', 'tournesol'] },
  { label: 'Épicerie & Condiments', icon: '🥫', keywords: ['huile', 'sel', 'poivre', 'épice', 'herbe', 'bouillon', 'sauce', 'moutarde', 'vinaigre', 'miel', 'sucre', 'chocolat', 'confiture', 'concassée', 'conserve', 'aneth', 'cumin', 'curcuma', 'paprika', 'cannelle', 'levure'] },
];

function getCategoryForItem(name: string): { label: string; icon: string } {
  const lower = name.toLowerCase();
  for (const cat of GROCERY_CATEGORIES) {
    if (cat.keywords.some(k => lower.includes(k))) return cat;
  }
  return { label: 'Autres', icon: '🛍️' };
}

function groupByCategory(items: ShoppingItem[]): { label: string; icon: string; items: ShoppingItem[] }[] {
  const map = new Map<string, { label: string; icon: string; items: ShoppingItem[] }>();
  for (const item of items) {
    const cat = getCategoryForItem(item.name);
    if (!map.has(cat.label)) map.set(cat.label, { ...cat, items: [] });
    map.get(cat.label)!.items.push(item);
  }
  // Sort categories in GROCERY_CATEGORIES order, then Autres last
  const order = [...GROCERY_CATEGORIES.map(c => c.label), 'Autres'];
  return Array.from(map.values()).sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label));
}

function getWeekStartDate(offset = 0): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) + offset * 7;
  return new Date(new Date().setDate(diff)).toISOString().split('T')[0];
}

function formatWeekLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const end = new Date(date);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  return `${fmt(date)} – ${fmt(end)}`;
}

export default function ShoppingScreen() {
  const insets = useSafeAreaInsets();
  const [weekOffset, setWeekOffset] = useState(0);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newUnit, setNewUnit] = useState('');

  const weekStart = getWeekStartDate(weekOffset);
  const cacheKey = `shopping_${weekStart}`;

  const fetchItems = useCallback(async () => {
    const cached = await loadFromCache<ShoppingItem[]>(cacheKey);
    if (cached) { setItems(cached); setLoading(false); } else { setLoading(true); }
    try {
      const { data } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('week_start_date', weekStart)
        .order('is_checked')
        .order('name');
      if (data) {
        setItems(data as ShoppingItem[]);
        await saveToCache(cacheKey, data);
      }
    } catch {}
    setLoading(false);
  }, [weekStart]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const toggleItem = async (item: ShoppingItem) => {
    const updated = { ...item, is_checked: !item.is_checked };
    setItems(prev => prev.map(i => i.id === item.id ? updated : i));
    const cached = await loadFromCache<ShoppingItem[]>(cacheKey) ?? [];
    await saveToCache(cacheKey, cached.map(i => i.id === item.id ? updated : i));
    try { await supabase.from('shopping_items').update({ is_checked: updated.is_checked }).eq('id', item.id); } catch {}
  };

  const addItem = async () => {
    if (!newItem.trim()) return;
    const name = newItem.trim();
    const quantity = parseFloat(newQty) || 1;
    const unit = newUnit.trim() || 'unité';
    setNewItem(''); setNewQty(''); setNewUnit('');
    const { data, error } = await supabase.from('shopping_items').insert({
      name,
      quantity,
      unit,
      is_checked: false,
      week_start_date: weekStart,
    }).select().single();
    if (error) {
      Alert.alert('Erreur', error.message);
      return;
    }
    if (data) {
      setItems(prev => [data as ShoppingItem, ...prev]);
      const cached = await loadFromCache<ShoppingItem[]>(cacheKey) ?? [];
      await saveToCache(cacheKey, [data as ShoppingItem, ...cached]);
    } else {
      // select bloqué mais insert OK — recharge depuis la base
      fetchItems();
    }
  };

  const deleteChecked = async () => {
    Alert.alert('Supprimer ?', 'Retirer tous les articles cochés ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive', onPress: async () => {
          await supabase.from('shopping_items').delete().eq('week_start_date', weekStart).eq('is_checked', true);
          fetchItems();
        }
      }
    ]);
  };

  const unchecked = items.filter(i => !i.is_checked);
  const checked = items.filter(i => i.is_checked);
  const progress = items.length > 0 ? checked.length / items.length : 0;

  const groups = groupByCategory(unchecked);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset(insets.top) }]}>
        <Text style={styles.title}>🛒 Liste de Courses</Text>
        {checked.length > 0 && (
          <TouchableOpacity onPress={deleteChecked} style={styles.clearBtn}>
            <Ionicons name="trash-outline" size={16} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.weekSelector}>
        <TouchableOpacity onPress={() => setWeekOffset(w => w - 1)} disabled={weekOffset <= 0} style={{ opacity: weekOffset <= 0 ? 0.2 : 1 }}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.weekLabel}>{formatWeekLabel(weekStart)}</Text>
        <TouchableOpacity onPress={() => setWeekOffset(w => w + 1)}>
          <Ionicons name="chevron-forward" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {items.length > 0 && (
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{checked.length}/{items.length}</Text>
        </View>
      )}

      <View style={styles.addRow}>
        <TextInput style={[styles.input, { flex: 2 }]} placeholder="Article..." placeholderTextColor={colors.textMuted} value={newItem} onChangeText={setNewItem} />
        <TextInput style={[styles.input, { flex: 0.6 }]} placeholder="Qté" placeholderTextColor={colors.textMuted} value={newQty} onChangeText={setNewQty} keyboardType="numeric" />
        <TextInput style={[styles.input, { flex: 0.8 }]} placeholder="Unité" placeholderTextColor={colors.textMuted} value={newUnit} onChangeText={setNewUnit} />
        <TouchableOpacity onPress={addItem} style={styles.addBtn}>
          <Ionicons name="add" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 100 }}>
          {items.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🛒</Text>
              <Text style={styles.emptyText}>Liste vide</Text>
              <Text style={styles.emptySubtext}>Génère la liste depuis le planning repas ou ajoute des articles manuellement.</Text>
            </View>
          ) : (
            <>
              {groups.map(group => (
                <View key={group.label}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryIcon}>{group.icon}</Text>
                    <Text style={styles.categoryLabel}>{group.label}</Text>
                    <Text style={styles.categoryCount}>{group.items.length}</Text>
                  </View>
                  {group.items.map(item => (
                    <ShoppingRow key={item.id} item={item} onToggle={toggleItem} />
                  ))}
                </View>
              ))}

              {checked.length > 0 && (
                <>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryIcon}>✅</Text>
                    <Text style={styles.categoryLabel}>Dans le panier</Text>
                    <Text style={styles.categoryCount}>{checked.length}</Text>
                  </View>
                  {checked.map(item => (
                    <ShoppingRow key={item.id} item={item} onToggle={toggleItem} />
                  ))}
                </>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function ShoppingRow({ item, onToggle }: { item: ShoppingItem; onToggle: (i: ShoppingItem) => void }) {
  return (
    <TouchableOpacity style={styles.itemRow} onPress={() => onToggle(item)} activeOpacity={0.7}>
      <View style={[styles.checkbox, item.is_checked && styles.checkboxChecked]}>
        {item.is_checked && <Ionicons name="checkmark" size={14} color={colors.white} />}
      </View>
      <Text style={[styles.itemName, item.is_checked && styles.itemNameDone]}>{item.name}</Text>
      <Text style={[styles.itemQty, item.is_checked && styles.itemNameDone]}>
        {item.quantity} {item.unit}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text },
  clearBtn: { padding: spacing.sm, backgroundColor: colors.error + '20', borderRadius: radius.full },
  weekSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.surface, marginHorizontal: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm },
  weekLabel: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.sm },
  progressTrack: { flex: 1, height: 6, backgroundColor: colors.surface, borderRadius: radius.full, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.secondary, borderRadius: radius.full },
  progressText: { fontSize: fontSize.sm, color: colors.textMuted },
  addRow: { flexDirection: 'row', marginHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.md },
  input: { backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: 10, color: colors.text, fontSize: fontSize.sm, borderWidth: 1, borderColor: colors.border },
  addBtn: { backgroundColor: colors.primary, borderRadius: radius.md, width: 44, alignItems: 'center', justifyContent: 'center' },
  list: { flex: 1, paddingHorizontal: spacing.md },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, marginTop: spacing.sm },
  categoryIcon: { fontSize: 18 },
  categoryLabel: { flex: 1, fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.textSecondary },
  categoryCount: { fontSize: fontSize.xs, color: colors.textMuted, backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, gap: spacing.md, borderWidth: 1, borderColor: colors.border },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  itemName: { flex: 1, fontSize: fontSize.md, color: colors.text },
  itemNameDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  itemQty: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.primary },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: spacing.sm },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  emptySubtext: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing.xl },
});
