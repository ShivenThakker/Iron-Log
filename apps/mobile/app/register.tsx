import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS } from '@/constants/tokens';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';

export default function RegisterScreen() {
  const router = useRouter();
  const loginStore = useAuthStore((s) => s.login);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!email || !password || !name) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/register', { email, password, name });
      await loginStore(res.data.accessToken, res.data.refreshToken, res.data.userId);
      router.replace('/onboarding');
    } catch (err: any) {
      // Log the full error for debugging
      console.log('Registration error:', err, err?.response?.data);
      // Show backend validation errors clearly
      if (err?.response?.data?.error) {
        // If error is a string, show it. If it's an array (zod), join messages.
        if (Array.isArray(err.response.data.error)) {
          setError(err.response.data.error.map((e: any) => e.message).join('\n'));
        } else {
          setError(err.response.data.error);
        }
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Join IronLog</Text>
        <Text style={styles.subtitle}>Begin your journey towards a stronger you.</Text>
      </View>
      
      <View style={styles.form}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        <Text style={styles.label}>Name</Text>
        <TextInput 
          style={styles.input}
          placeholder="Arnold S."
          placeholderTextColor={COLORS.dark.textSecondary}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput 
          style={styles.input}
          placeholder="arnold@ironlog.app"
          placeholderTextColor={COLORS.dark.textSecondary}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        
        <Text style={styles.label}>Password</Text>
        <TextInput 
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor={COLORS.dark.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        
        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.dark.textPrimary} /> : <Text style={styles.buttonText}>Create Account</Text>}
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: SPACING.xl }}>
          <Text style={styles.backText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.bgPrimary,
    padding: SPACING.xl,
  },
  header: {
    marginTop: SPACING.xl * 2,
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.dark.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.dark.textSecondary,
  },
  form: {
    flex: 1,
  },
  label: {
    color: COLORS.dark.textSecondary,
    fontSize: 14,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.dark.bgInput,
    color: COLORS.dark.textPrimary,
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    fontSize: 16,
  },
  button: {
    backgroundColor: COLORS.dark.accentRed,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  buttonText: {
    color: COLORS.dark.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  backText: {
    color: COLORS.dark.textSecondary,
    textAlign: 'center',
    fontSize: 16,
  },
  errorText: {
    color: COLORS.dark.destructive,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  }
});
