import AsyncStorage from '@react-native-async-storage/async-storage';

export type Profile = 'Florent' | 'Julie';
export const PROFILES: Profile[] = ['Florent', 'Julie'];

const KEY_PROFILE = 'sbg:profile';
const stepsKey = (profile: Profile, date: string) => `sbg:steps:${profile}:${date}`;

export async function getCurrentProfile(): Promise<Profile> {
  const p = await AsyncStorage.getItem(KEY_PROFILE);
  return (p as Profile) ?? 'Florent';
}

export async function setCurrentProfile(profile: Profile): Promise<void> {
  await AsyncStorage.setItem(KEY_PROFILE, profile);
}

export async function getSteps(profile: Profile, date: string): Promise<number> {
  const val = await AsyncStorage.getItem(stepsKey(profile, date));
  return val ? parseInt(val) : 0;
}

export async function saveSteps(profile: Profile, date: string, steps: number): Promise<void> {
  await AsyncStorage.setItem(stepsKey(profile, date), steps.toString());
}
