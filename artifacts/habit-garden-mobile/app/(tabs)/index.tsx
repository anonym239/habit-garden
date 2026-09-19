import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { HabitCard } from '@/components/HabitCard';
import { HabitModal } from '@/components/HabitModal';
import { Habit, useHabits } from '@/context/HabitContext';
import { useColors } from '@/hooks/useColors';

export default function TodayScreen() {
  const colors = useColors();
  const { habits, checkIns, hydrated } = useHabits();
  const [editing, setEditing] = useState<Habit | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const completed = habits.filter((habit) => (checkIns[habit.id] ?? []).includes(today)).length;
  const progress = habits.length ? completed / habits.length : 0;

  if (!hydrated) return <View style={[styles.loading, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /></View>;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, Platform.OS === 'web' && styles.webContent]} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>HEUTE</Text>
            <Text style={[styles.heading, { color: colors.foreground }]}>Ein kleiner Schritt.</Text>
          </View>
          <Pressable testID="add-habit" onPress={() => { setEditing(undefined); setModalOpen(true); }} style={[styles.add, { backgroundColor: colors.primary }]}><Feather name="plus" size={24} color={colors.primaryForeground} /></Pressable>
        </View>
        <View style={[styles.progressCard, { backgroundColor: colors.secondary }]}>
          <View style={styles.progressCopy}><Text style={[styles.progressValue, { color: colors.secondaryForeground }]}>{completed}/{habits.length}</Text><Text style={[styles.progressLabel, { color: colors.secondaryForeground }]}>heute gepflegt</Text></View>
          <View style={[styles.ring, { borderColor: colors.border }]}><Text style={[styles.ringText, { color: colors.primary }]}>{Math.round(progress * 100)}%</Text></View>
        </View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Deine Gewohnheiten</Text>
        <View style={styles.list}>
          {habits.map((habit) => <HabitCard key={habit.id} habit={habit} onEdit={() => { setEditing(habit); setModalOpen(true); }} />)}
          {!habits.length && <View style={[styles.empty, { borderColor: colors.border }]}><Feather name="sunrise" size={32} color={colors.primary} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>Dein Garten ist bereit</Text><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Lege eine erste Gewohnheit an, die leicht genug für heute ist.</Text></View>}
        </View>
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>Lange drücken, um eine Gewohnheit zu bearbeiten.</Text>
      </ScrollView>
      <HabitModal visible={modalOpen} habit={editing} onClose={() => setModalOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingTop: 24, paddingBottom: 130 },
  webContent: { paddingTop: 86 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.8, marginBottom: 6 },
  heading: { fontFamily: 'Inter_700Bold', fontSize: 30, letterSpacing: -1 },
  add: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  progressCard: { borderRadius: 24, padding: 20, marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressCopy: { gap: 2 },
  progressValue: { fontFamily: 'Inter_700Bold', fontSize: 32 },
  progressLabel: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  ring: { width: 66, height: 66, borderRadius: 33, borderWidth: 7, alignItems: 'center', justifyContent: 'center' },
  ringText: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 18, marginTop: 28, marginBottom: 14 },
  list: { gap: 12 },
  empty: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 22, padding: 30, alignItems: 'center', gap: 8 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 17, marginTop: 4 },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, textAlign: 'center' },
  hint: { fontFamily: 'Inter_400Regular', textAlign: 'center', fontSize: 12, marginTop: 20 },
});
