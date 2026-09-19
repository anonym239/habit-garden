import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { getStreak, Habit, useHabits } from '@/context/HabitContext';

export function HabitCard({ habit, onEdit }: { habit: Habit; onEdit: () => void }) {
  const colors = useColors();
  const { checkIns, toggleToday } = useHabits();
  const dates = checkIns[habit.id] ?? [];
  const done = dates.includes(new Date().toISOString().slice(0, 10));
  const streak = getStreak(dates);

  return (
    <Pressable onLongPress={onEdit} style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}>
      <View style={[styles.marker, { backgroundColor: habit.color }]} />
      <View style={styles.copy}>
        <Text style={[styles.name, { color: colors.foreground }]}>{habit.name}</Text>
        <Text numberOfLines={1} style={[styles.note, { color: colors.mutedForeground }]}>{habit.note || `${habit.target}× pro Woche`}</Text>
        <View style={styles.meta}>
          <Feather name="zap" size={14} color={streak ? habit.color : colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{streak} Tage</Text>
          <Text style={[styles.dot, { color: colors.border }]}>•</Text>
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{habit.target}× pro Woche</Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        testID={`habit-check-${habit.id}`}
        onPress={() => {
          Haptics.notificationAsync(done ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success);
          toggleToday(habit.id);
        }}
        style={[styles.check, { borderColor: done ? habit.color : colors.border, backgroundColor: done ? habit.color : colors.card }]}
      >
        {done && <Feather name="check" size={22} color="#FFFFFF" />}
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 104, borderWidth: 1, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
  marker: { width: 8, height: 52, borderRadius: 8 },
  copy: { flex: 1, gap: 4 },
  name: { fontFamily: 'Inter_600SemiBold', fontSize: 17 },
  note: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 5 },
  metaText: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  dot: { marginHorizontal: 2 },
  check: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});