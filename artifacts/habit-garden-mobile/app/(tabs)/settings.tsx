import { Feather } from '@expo/vector-icons';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useHabits } from '@/context/HabitContext';
import { useColors } from '@/hooks/useColors';

export default function SettingsScreen() {
  const colors = useColors();
  const { habits, checkIns, reset } = useHabits();
  const count = Object.values(checkIns).reduce((sum, dates) => sum + dates.length, 0);

  const confirmReset = () => Alert.alert('Lokale Daten löschen?', 'Alle Gewohnheiten und Check-ins auf diesem Gerät werden entfernt.', [
    { text: 'Abbrechen', style: 'cancel' },
    { text: 'Löschen', style: 'destructive', onPress: reset },
  ]);

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={[styles.content, Platform.OS === 'web' && styles.webContent]}>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>EINSTELLUNGEN</Text>
      <Text style={[styles.heading, { color: colors.foreground }]}>Dein Garten gehört dir.</Text>
      <View style={[styles.card, { backgroundColor: colors.secondary }]}>
        <View style={[styles.icon, { backgroundColor: colors.card }]}><Feather name="shield" size={23} color={colors.primary} /></View>
        <View style={{ flex: 1 }}><Text style={[styles.cardTitle, { color: colors.secondaryForeground }]}>Privat auf deinem Gerät</Text><Text style={[styles.cardText, { color: colors.secondaryForeground }]}>Keine Anmeldung, keine Werbung, kein Tracking. Deine Daten bleiben lokal.</Text></View>
      </View>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Datenübersicht</Text>
      <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="layers" size={21} color={colors.primary} /><Text style={[styles.rowText, { color: colors.foreground }]}>{habits.length} Gewohnheiten</Text></View>
      <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="check-square" size={21} color={colors.primary} /><Text style={[styles.rowText, { color: colors.foreground }]}>{count} Check-ins</Text></View>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Über Habit Garden</Text>
      <View style={[styles.about, { borderColor: colors.border }]}>
        <Text style={[styles.aboutText, { color: colors.mutedForeground }]}>Kostenlos, lokal-first und Open Source. Die Web-Version unterstützt zusätzlich JSON-Export und -Import für einfache Backups.</Text>
      </View>
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
  card: { borderRadius: 22, padding: 18, flexDirection: 'row', gap: 14, marginTop: 24 },
  icon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, marginBottom: 5 },
  cardText: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, opacity: 0.8 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 17, marginTop: 28, marginBottom: 12 },
  row: { borderWidth: 1, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  rowText: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  about: { borderWidth: 1, borderRadius: 16, padding: 16 },
  aboutText: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
  danger: { borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 30, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 9 },
  dangerText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  version: { textAlign: 'center', fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 24 },
});