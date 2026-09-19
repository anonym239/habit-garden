import { useSignIn } from '@clerk/expo';
import { Link, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, TextInput, View, Text, ActivityIndicator } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SignInScreen() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [code, setCode] = React.useState('');

  const handleSubmit = async () => {
    if (!signIn) return;
    try {
      const { error } = await signIn.password({ emailAddress, password });
      if (error) {
        console.warn(JSON.stringify(error, null, 2));
        return;
      }

      if (signIn.status === 'complete') {
        await signIn.finalize({
          navigate: () => router.replace('/'),
        });
      } else if (signIn.status === 'needs_client_trust') {
        const emailCodeFactor = signIn.supportedSecondFactors?.find(
          (factor: any) => factor.strategy === 'email_code'
        );
        if (emailCodeFactor) {
          await signIn.mfa?.sendEmailCode();
        }
      }
    } catch (err) {
      console.warn('Sign-in failed', err);
    }
  };

  const handleVerify = async () => {
    if (!signIn) return;
    try {
      await signIn.mfa?.verifyEmailCode({ code });
      if (signIn.status === 'complete') {
        await signIn.finalize({
          navigate: () => router.replace('/'),
        });
      }
    } catch (err) {
      console.warn('Verify failed', err);
    }
  };

  if (!signIn) return null;

  if (signIn.status === 'needs_client_trust') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 24) }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={[styles.closeButton, { backgroundColor: colors.card }]}>
            <Feather name="arrow-left" size={24} color={colors.foreground} />
          </Pressable>
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>Konto verifizieren</Text>
        
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
          value={code}
          placeholder="Verifizierungscode"
          placeholderTextColor={colors.mutedForeground}
          onChangeText={setCode}
          keyboardType="numeric"
        />
        
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.8 },
            fetchStatus === 'fetching' && { opacity: 0.5 },
          ]}
          onPress={handleVerify}
          disabled={fetchStatus === 'fetching'}
        >
          {fetchStatus === 'fetching' ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Verifizieren</Text>}
        </Pressable>
        
        <Pressable style={styles.secondaryButton} onPress={() => signIn.mfa?.sendEmailCode()}>
          <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Neuen Code anfordern</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 24) }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.closeButton, { backgroundColor: colors.card }]}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </Pressable>
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>Willkommen zurück</Text>

      <Text style={[styles.label, { color: colors.foreground }]}>E-Mail-Adresse</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
        autoCapitalize="none"
        value={emailAddress}
        placeholder="deine@email.de"
        placeholderTextColor={colors.mutedForeground}
        onChangeText={setEmailAddress}
        keyboardType="email-address"
      />
      
      <Text style={[styles.label, { color: colors.foreground }]}>Passwort</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
        value={password}
        placeholder="Dein Passwort"
        placeholderTextColor={colors.mutedForeground}
        secureTextEntry
        onChangeText={setPassword}
      />
      
      <Pressable
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.primary },
          (!emailAddress || !password || fetchStatus === 'fetching') && { opacity: 0.5 },
          pressed && { opacity: 0.8 },
        ]}
        onPress={handleSubmit}
        disabled={!emailAddress || !password || fetchStatus === 'fetching'}
      >
        {fetchStatus === 'fetching' ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Weiter</Text>}
      </Pressable>

      <View style={styles.linkContainer}>
        <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>Noch kein Konto? </Text>
        <Link href="/(auth)/sign-up" asChild>
          <Pressable><Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>Registrieren</Text></Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  header: { marginBottom: 24 },
  closeButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 32, marginBottom: 32 },
  label: { fontFamily: 'Inter_500Medium', fontSize: 14, marginBottom: 8 },
  input: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontFamily: 'Inter_400Regular', fontSize: 16, marginBottom: 16 },
  button: { height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  buttonText: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  secondaryButton: { height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  secondaryButtonText: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  linkContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
});
