import { Feather } from '@expo/vector-icons';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getStreak, useHabits } from '@/context/HabitContext';
import { useColors } from '@/hooks/useColors';

export default function ProgressScreen() {
  const colors = useColors();
  const { habits, checkIns } = useHabits();
  const total = Object.values(checkIns).reduce((sum, dates) => sum + dates.length, 0);
  const best = habits.reduce((max, habit) => Math.max(max, getStreak(checkIns[habit.id] ?? [])), 0);
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return date.toISOString().slice(0, 10);
  });

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={[styles.content, Platform.OS === 'web' && styles.webContent]}>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>FORTSCHRITT</Text>
      <Text style={[styles.heading, { color: colors.foreground }]}>Was wächst, darf Zeit brauchen.</Text>
      <View style={styles.stats}>
        <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="check-circle" size={21} color={colors.primary} /><Text style={[styles.value, { color: colors.foreground }]}>{total}</Text><Text style={[styles.label, { color: colors.mutedForeground }]}>Check-ins</Text></View>
        <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="zap" size={21} color={colors.accent} /><Text style={[styles.value, { color: colors.foreground }]}>{best}</Text><Text style={[styles.label, { color: colors.mutedForeground }]}>Bester Streak</Text></View>
      </View>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Letzte sieben Tage</Text>
      <View style={[styles.heatmap, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {week.map((date) => {
          const done = habits.filter((habit) => (checkIns[habit.id] ?? []).includes(date)).length;
          const opacity = habits.length ? Math.max(0.12, done / habits.length) : 0.12;
          return <View key={date} style={styles.day}><View style={[styles.dayCell, { backgroundColor: colors.primary, opacity }]} /><Text style={[styles.dayLabel, { color: colors.mutedForeground }]}>{new Date(`${date}T12:00:00`).toLocaleDateString('de-DE', { weekday: 'short' }).slice(0, 2)}</Text></View>;
        })}
      </View>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Gewohnheiten</Text>
      <View style={styles.habitStats}>
        {habits.map((habit) => {
          const count = (checkIns[habit.id] ?? []).filter((date) => week.includes(date)).length;
          return <View key={habit.id} style={[styles.habitRow, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.marker, { backgroundColor: habit.color }]} /><View style={{ flex: 1 }}><Text style={[styles.habitName, { color: colors.foreground }]}>{habit.name}</Text><View style={[styles.track, { backgroundColor: colors.muted }]}><View style={[styles.fill, { width: `${Math.min(100, (count / habit.target) * 100)}%`, backgroundColor: habit.color }]} /></View></View><Text style={[styles.count, { color: colors.mutedForeground }]}>{count}/{habit.target}</Text></View>;
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 24, paddingBottom: 130 },
  webContent: { paddingTop: 86 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.8, marginBottom: 8 },
  heading: { fontFamily: 'Inter_700Bold', fontSize: 29, lineHeight: 36, letterSpacing: -0.8, maxWidth: 330 },
  stats: { flexDirection: 'row', gap: 12, marginTop: 24 },
  stat: { flex: 1, borderRadius: 20, borderWidth: 1, padding: 16, gap: 5 },
  value: { fontFamily: 'Inter_700Bold', fontSize: 28, marginTop: 6 },
  label: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 18, marginTop: 28, marginBottom: 13 },
  heatmap: { borderWidth: 1, borderRadius: 20, padding: 18, flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', gap: 8 },
  dayCell: { width: 32, height: 48, borderRadius: 10 },
  dayLabel: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  habitStats: { gap: 10 },
  habitRow: { borderWidth: 1, borderRadius: 18, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 },
  marker: { width: 8, height: 38, borderRadius: 5 },
  habitName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, marginBottom: 8 },
  track: { height: 6, borderRadius: 6, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 6 },
  count: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
});