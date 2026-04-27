import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'sbg:';

export async function saveToCache(key: string, data: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(data));
  } catch {}
}

export async function loadFromCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function updateCacheItem<T extends { id: string }>(
  key: string,
  updater: (item: T) => T
): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (!raw) return;
    const data: T[] = JSON.parse(raw);
    const updated = data.map(item => updater(item));
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(updated));
  } catch {}
}
