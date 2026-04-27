import { StatusBar, Platform } from 'react-native';

export function topInset(insetTop: number): number {
  const base = insetTop > 0 ? insetTop : (StatusBar.currentHeight ?? 0);
  return base + 20;
}
