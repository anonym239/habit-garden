import { Feather } from '@expo/vector-icons';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useHabits } from '@/context/HabitContext';
import { useColors } from '@/hooks/useColors';
import { useAuth, useUser, useClerk } from '@clerk/expo';
import { useSubscription } from '@/lib/subscription';
import { useRouter } from 'expo-router';
import { useSaveGarden, useGetGarden, useReviewHabits, useGetRevenue, getGetGardenQueryKey } from '@workspace/api-client-react';

export default function SettingsScreen() {
  const colors = useColors();
  const { habits, checkIns, reset, hydrated, setAll } = useHabits();
  const count = Object.values(checkIns).reduce((sum, dates) => sum + dates.length, 0);
  
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { isPro } = useSubscription();
  const router = useRouter();

  const { data: revenueData } = useGetRevenue();
  const saveGarden = useSaveGarden();
  const getGarden = useGetGarden('mobile', { query: { enabled: false, queryKey: getGetGardenQueryKey('mobile') } });
  const reviewHabits = useReviewHabits();

  const confirmReset = () => Alert.alert('Lokale Daten löschen?', 'Alle Gewohnheiten und Check-ins auf diesem Gerät werden entfernt.', [
    { text: 'Abbrechen', style: 'cancel' },
    { text: 'Löschen', style: 'destructive', onPress: reset },
  ]);

  const handleSaveToCloud = async () => {
    try {
      await saveGarden.mutateAsync({ platform: 'mobile', data: { data: { habits, checkIns } } });
      Alert.alert('Erfolg', 'Dein Garten wurde in der Cloud gespeichert.');
    } catch (err) {
      Alert.alert('Fehler', 'Speichern fehlgeschlagen.');
    }
  };

  const handleRestoreFromCloud = async () => {
    try {
      const res = await getGarden.refetch();
      if (res.data && res.data.data) {
        const payload = res.data.data as any;
        if (payload.habits && payload.checkIns) {
          setAll(payload.habits, payload.checkIns);
          Alert.alert('Erfolg', 'Garten aus der Cloud geladen.');
        } else {
          Alert.alert('Fehler', 'Keine gültigen Daten in der Cloud gefunden.');
        }
      } else {
        Alert.alert('Fehler', 'Cloud ist leer.');
      }
    } catch (err) {
      Alert.alert('Fehler', 'Laden fehlgeschlagen.');
    }
  };

  const handleReview = async () => {
    if (!habits.length) return Alert.alert('Keine Gewohnheiten', 'Lege zuerst Gewohnheiten an.');
    try {
      const res = await reviewHabits.mutateAsync({
        data: {
          habits: habits.map(h => ({ name: h.name, note: h.note, targetPerWeek: h.target })),
          locale: 'de'
        }
      });
      Alert.alert('KI Review', res.summary + '\n\n' + res.suggestions.join('\n'));
    } catch (err) {
      Alert.alert('Fehler', 'Review fehlgeschlagen.');
    }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={[styles.content, Platform.OS === 'web' && styles.webContent]}>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>EINSTELLUNGEN</Text>
      <Text style={[styles.heading, { color: colors.foreground }]}>Dein Garten gehört dir.</Text>
      
      {isSignedIn ? (
        <View style={[styles.card, { backgroundColor: colors.secondary, flexDirection: 'column', alignItems: 'flex-start' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, width: '100%' }}>
            <View style={[styles.icon, { backgroundColor: colors.card }]}><Feather name="user" size={23} color={colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.secondaryForeground }]}>
                {user?.primaryEmailAddress?.emailAddress || 'Angemeldet'}
              </Text>
              <Text style={[styles.cardText, { color: colors.secondaryForeground }]}>
                {isPro ? 'Pro-Mitglied' : 'Kostenloser Account'}
              </Text>
            </View>
            <Pressable onPress={() => signOut()} style={{ padding: 8 }}>
              <Feather name="log-out" size={20} color={colors.secondaryForeground} />
            </Pressable>
          </View>
          
          {isPro && (
            <View style={{ marginTop: 16, width: '100%', gap: 10 }}>
              <View style={{ height: 1, backgroundColor: colors.border, width: '100%', marginBottom: 6 }} />
              <Pressable onPress={handleSaveToCloud} style={[styles.actionRow, { backgroundColor: colors.card }]}>
                <Feather name="upload-cloud" size={18} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.foreground }]}>In die Cloud speichern</Text>
                {saveGarden.isPending && <ActivityIndicator size="small" color={colors.primary} />}
              </Pressable>
              <Pressable onPress={handleRestoreFromCloud} style={[styles.actionRow, { backgroundColor: colors.card }]}>
                <Feather name="download-cloud" size={18} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.foreground }]}>Aus der Cloud laden</Text>
                {getGarden.isFetching && <ActivityIndicator size="small" color={colors.primary} />}
              </Pressable>
              <Pressable onPress={handleReview} style={[styles.actionRow, { backgroundColor: colors.card }]}>
                <Feather name="cpu" size={18} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.foreground }]}>KI Habit Review</Text>
                {reviewHabits.isPending && <ActivityIndicator size="small" color={colors.primary} />}
              </Pressable>
            </View>
          )}
          {!isPro && (
            <Pressable onPress={() => router.push('/upgrade')} style={[styles.proButton, { backgroundColor: colors.primary }]}>
              <Text style={[styles.proButtonText, { color: colors.primaryForeground }]}>Pro freischalten</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <View style={[styles.card, { backgroundColor: colors.secondary, flexDirection: 'column' }]}>
          <View style={{ flexDirection: 'row', gap: 14 }}>
            <View style={[styles.icon, { backgroundColor: colors.card }]}><Feather name="shield" size={23} color={colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.secondaryForeground }]}>Privat auf deinem Gerät</Text>
              <Text style={[styles.cardText, { color: colors.secondaryForeground }]}>Keine Anmeldung, keine Werbung, kein Tracking. Deine Daten bleiben lokal.</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <Pressable onPress={() => router.push('/(auth)/sign-in')} style={[styles.authButton, { backgroundColor: colors.primary }]}>
              <Text style={[styles.authButtonText, { color: colors.primaryForeground }]}>Anmelden</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/(auth)/sign-up')} style={[styles.authButton, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
              <Text style={[styles.authButtonText, { color: colors.foreground }]}>Registrieren</Text>
            </Pressable>
          </View>
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Datenübersicht</Text>
      <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="layers" size={21} color={colors.primary} /><Text style={[styles.rowText, { color: colors.foreground }]}>{habits.length} Gewohnheiten</Text></View>
      <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="check-square" size={21} color={colors.primary} /><Text style={[styles.rowText, { color: colors.foreground }]}>{count} Check-ins</Text></View>
      
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Über Habit Garden</Text>
      <View style={[styles.about, { borderColor: colors.border }]}>
        <Text style={[styles.aboutText, { color: colors.mutedForeground }]}>Kostenlos, lokal-first und Open Source. Die Web-Version unterstützt zusätzlich JSON-Export und -Import für einfache Backups.</Text>
      </View>

      {revenueData && (
        <View style={[styles.revenueBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.revenueTitle, { color: colors.foreground }]}>Transparenz</Text>
          <Text style={[styles.revenueText, { color: colors.mutedForeground }]}>Wir glauben an offene Zahlen.</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
            <View>
              <Text style={[styles.revenueValue, { color: colors.primary }]}>${(revenueData.totalRevenueUsd || 0).toFixed(2)}</Text>
              <Text style={[styles.revenueLabel, { color: colors.mutedForeground }]}>Umsatz</Text>
            </View>
            <View>
              <Text style={[styles.revenueValue, { color: colors.primary }]}>{revenueData.activeSubscriptions || 0}</Text>
              <Text style={[styles.revenueLabel, { color: colors.mutedForeground }]}>Pro-Mitglieder</Text>
            </View>
          </View>
        </View>
      )}

      <Pressable testID="reset-data" onPress={confirmReset} style={[styles.danger, { borderColor: colors.destructive }]}><Feather name="trash-2" size={18} color={colors.destructive} /><Text style={[styles.dangerText, { color: colors.destructive }]}>Alle lokalen Daten löschen</Text></Pressable>
      <Text style={[styles.version, { color: colors.mutedForeground }]}>Habit Garden 1.0.0 · MIT License</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 24, paddingBottom: 130 },
  webContent: { paddingTop: 86 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.8, marginBottom: 8 },
  heading: { fontFamily: 'Inter_700Bold', fontSize: 30, letterSpacing: -1 },
  card: { borderRadius: 22, padding: 18, marginTop: 24 },
  icon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, marginBottom: 5 },
  cardText: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, opacity: 0.8 },
  authButton: { flex: 1, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  authButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  proButton: { width: '100%', height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  proButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16 },
  actionText: { fontFamily: 'Inter_500Medium', fontSize: 15, flex: 1 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 17, marginTop: 28, marginBottom: 12 },
  row: { borderWidth: 1, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  rowText: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  about: { borderWidth: 1, borderRadius: 16, padding: 16 },
  aboutText: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
  revenueBox: { borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 16 },
  revenueTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, marginBottom: 4 },
  revenueText: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  revenueValue: { fontFamily: 'Inter_700Bold', fontSize: 24 },
  revenueLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 4 },
  danger: { borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 30, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 9 },
  dangerText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  version: { textAlign: 'center', fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 24 },
});
