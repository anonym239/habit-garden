import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { Habit, useHabits } from '@/context/HabitContext';
import { useColors } from '@/hooks/useColors';

const swatches = ['#3E7C59', '#D58B50', '#6F79A8', '#A76576', '#44889A'];

export function HabitModal({ visible, habit, onClose }: { visible: boolean; habit?: Habit; onClose: () => void }) {
  const colors = useColors();
  const { addHabit, updateHabit, deleteHabit } = useHabits();
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [target, setTarget] = useState(5);
  const [color, setColor] = useState(swatches[0]);

  useEffect(() => {
    if (!visible) return;
    setName(habit?.name ?? '');
    setNote(habit?.note ?? '');
    setTarget(habit?.target ?? 5);
    setColor(habit?.color ?? swatches[0]);
  }, [visible, habit]);

  const save = () => {
    if (!name.trim()) return;
    const input = { name: name.trim(), note: note.trim(), target, color };
    if (habit) updateHabit(habit.id, input);
    else addHabit(input);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAwareScrollViewCompat style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={onClose}><Feather name="x" size={26} color={colors.foreground} /></Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>{habit ? 'Gewohnheit ändern' : 'Neue Gewohnheit'}</Text>
          <Pressable onPress={save} accessibilityLabel="Speichern"><Feather name="check" size={26} color={colors.primary} /></Pressable>
        </View>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>NAME</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Zum Beispiel: Morgenroutine" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} />
        <Text style={[styles.label, { color: colors.mutedForeground }]}>NOTIZ</Text>
        <TextInput value={note} onChangeText={setNote} placeholder="Was macht den Einstieg leicht?" placeholderTextColor={colors.mutedForeground} multiline style={[styles.input, styles.noteInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} />
        <Text style={[styles.label, { color: colors.mutedForeground }]}>ZIEL PRO WOCHE</Text>
        <View style={styles.stepper}>
          <Pressable onPress={() => setTarget(Math.max(1, target - 1))} style={[styles.stepButton, { borderColor: colors.border }]}><Feather name="minus" size={22} color={colors.foreground} /></Pressable>
          <Text style={[styles.target, { color: colors.foreground }]}>{target} Tage</Text>
          <Pressable onPress={() => setTarget(Math.min(7, target + 1))} style={[styles.stepButton, { borderColor: colors.border }]}><Feather name="plus" size={22} color={colors.foreground} /></Pressable>
        </View>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>FARBE</Text>
        <View style={styles.swatches}>{swatches.map((swatch) => <Pressable key={swatch} onPress={() => setColor(swatch)} style={[styles.swatch, { backgroundColor: swatch }, color === swatch && { borderColor: colors.foreground, borderWidth: 3 }]} />)}</View>
        {habit && <Pressable onPress={() => { deleteHabit(habit.id); onClose(); }} style={styles.delete}><Feather name="trash-2" size={18} color={colors.destructive} /><Text style={[styles.deleteText, { color: colors.destructive }]}>Gewohnheit löschen</Text></Pressable>}
      </KeyboardAwareScrollViewCompat>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: { padding: 22, paddingBottom: 48, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  label: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.2, marginTop: 8 },
  input: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, minHeight: 52, fontFamily: 'Inter_400Regular', fontSize: 16 },
  noteInput: { minHeight: 100, paddingTop: 15, textAlignVertical: 'top' },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepButton: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  target: { fontFamily: 'Inter_600SemiBold', fontSize: 18 },
  swatches: { flexDirection: 'row', gap: 14, paddingVertical: 8 },
  swatch: { width: 40, height: 40, borderRadius: 20 },
  delete: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 30, padding: 14 },
  deleteText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
});