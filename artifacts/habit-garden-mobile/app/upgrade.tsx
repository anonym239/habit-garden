import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useSubscription } from '@/lib/subscription';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';

export default function UpgradeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { offerings, purchase, restore, isPro, isPurchasing, isRestoring } = useSubscription();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const currentOffering = offerings?.current;
  const packageToPurchase = currentOffering?.availablePackages?.find((item) => item.identifier === '$rc_monthly');
  const donationPackage = currentOffering?.availablePackages?.find((item) => item.identifier === '$rc_custom_donation');
  const price = packageToPurchase?.product.priceString || 'Laden...';

  const isTestStore = __DEV__ || Platform.OS === 'web' || Constants.executionEnvironment === 'storeClient';

  const handlePurchase = async () => {
    if (!packageToPurchase) return;
    if (isTestStore) {
      setShowConfirmModal(true);
      return;
    }
    await performPurchase();
  };

  const performPurchase = async () => {
    try {
      setShowConfirmModal(false);
      await purchase(packageToPurchase);
      if (isPro) {
        router.back();
      }
    } catch (err) {
      Alert.alert('Kauf nicht abgeschlossen', 'Bitte versuche es später erneut.');
    }
  };

  const handleRestore = async () => {
    try {
      await restore();
      if (isPro) {
        router.back();
      }
    } catch (err) {
      Alert.alert('Wiederherstellung fehlgeschlagen', 'Bitte versuche es später erneut.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 24) }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={[styles.closeButton, { backgroundColor: colors.card }]}>
            <Feather name="x" size={24} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={[styles.iconWrapper, { backgroundColor: colors.accent }]}>
            <Feather name="star" size={32} color={colors.accentForeground} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Habit Garden Pro</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Unterstütze die Entwicklung und schalte exklusive Funktionen frei.
          </Text>
        </View>

        <View style={styles.features}>
          <FeatureItem
            icon="cloud"
            title="Cloud Sync"
            description="Speichere deinen Garten sicher in der Cloud und greife von überall darauf zu."
            colors={colors}
          />
          <FeatureItem
            icon="cpu"
            title="KI Habit Review"
            description="Lass deine Gewohnheiten von unserer KI analysieren und erhalte sanfte Verbesserungsvorschläge."
            colors={colors}
          />
          <FeatureItem
            icon="heart"
            title="Entwicklung unterstützen"
            description="Hilf mit, Habit Garden für alle kostenlos und werbefrei zu halten."
            colors={colors}
          />
        </View>

        <View style={[styles.pricingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.priceText, { color: colors.foreground }]}>{price}</Text>
          <Text style={[styles.priceSubtext, { color: colors.mutedForeground }]}>Monatlich kündbar über Google Play</Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.9 },
              (isPurchasing || !packageToPurchase) && { opacity: 0.5 },
            ]}
            onPress={handlePurchase}
            disabled={isPurchasing || !packageToPurchase}
          >
            {isPurchasing ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
                Pro freischalten
              </Text>
            )}
          </Pressable>
          {donationPackage && (
            <Pressable
              style={[styles.donationButton, { borderColor: colors.accent }]}
              onPress={() => purchase(donationPackage).catch(() => Alert.alert('Spende nicht abgeschlossen'))}
            >
              <Feather name="heart" size={18} color={colors.accent} />
              <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>
                Einmalig {donationPackage.product.priceString} spenden
              </Text>
            </Pressable>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && { opacity: 0.7 },
            ]}
            onPress={handleRestore}
            disabled={isRestoring}
          >
            {isRestoring ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
                Käufe wiederherstellen
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      {showConfirmModal && (
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Testkauf bestätigen</Text>
            <Text style={[styles.modalText, { color: colors.mutedForeground }]}>
              Dies ist ein simulierter Kauf in der Testumgebung. Es wird kein echtes Geld abgebucht.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.muted }]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.foreground }]}>Abbrechen</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={performPurchase}
              >
                <Text style={[styles.modalButtonText, { color: colors.primaryForeground }]}>Kaufen</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

function FeatureItem({ icon, title, description, colors }: any) {
  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIcon, { backgroundColor: colors.secondary }]}>
        <Feather name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.featureText}>
        <Text style={[styles.featureTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.featureDescription, { color: colors.mutedForeground }]}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  features: {
    gap: 24,
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    gap: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
    marginBottom: 4,
  },
  featureDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
  },
  pricingCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  priceText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 36,
    marginBottom: 8,
  },
  priceSubtext: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  actions: {
    gap: 16,
  },
  primaryButton: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
  },
  secondaryButton: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
  },
  donationButton: {
    minHeight: 54,
    borderRadius: 27,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 1000,
  },
  modalContent: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    marginBottom: 12,
  },
  modalText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
});
