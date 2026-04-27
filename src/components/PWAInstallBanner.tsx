import React, { useEffect, useState } from 'react';
import { Platform, View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../theme';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!prompt || dismissed) return null;

  const handleInstall = async () => {
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted' || outcome === 'dismissed') {
      setPrompt(null);
    }
  };

  return (
    <View style={styles.banner}>
      <Image
        source={require('../../assets/icon.png')}
        style={styles.icon}
      />
      <View style={styles.textContainer}>
        <Text style={styles.title}>Summer Body Goal</Text>
        <Text style={styles.subtitle}>Installer l'app sur votre appareil</Text>
      </View>
      <TouchableOpacity style={styles.installBtn} onPress={handleInstall}>
        <Text style={styles.installText}>Installer</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.closeBtn} onPress={() => setDismissed(true)}>
        <Ionicons name="close" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    bottom: 80,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  installBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  installText: {
    color: '#fff',
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
});
