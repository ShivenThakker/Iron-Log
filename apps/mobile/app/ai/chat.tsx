import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS, SPACING, RADIUS } from '@/constants/tokens';
import { api } from '@/services/api';

export default function AiChat() {
  const [messages, setMessages] = useState<{role: 'user'|'ai', text: string}[]>([
    { role: 'ai', text: 'Hey there! I am your IronLog AI Coach. How can I optimize your programming today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const { data } = await api.post('/ai/chat', { message: userMsg });
      setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
    } catch (e: any) {
      const status = e?.response?.status;
      const backendError = e?.response?.data?.error;

      if (status === 401) {
        setMessages(prev => [...prev, { role: 'ai', text: 'Please log in again to use AI chat.' }]);
      } else if (backendError) {
        setMessages(prev => [...prev, { role: 'ai', text: `AI error: ${backendError}` }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: 'Could not reach the AI service. Ensure backend and Ollama are running.' }]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>AI Coach Chat</Text>
        <Text style={styles.subtitle}>Ask training, recovery, or progression questions.</Text>
      </View>
      
      <ScrollView style={styles.chatArea} contentContainerStyle={{paddingBottom: SPACING.lg}}>
        {messages.map((m, i) => (
          <View key={i} style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleAi]}>
            <Text style={styles.bubbleText}>{m.text}</Text>
          </View>
        ))}
        {loading && <ActivityIndicator color={COLORS.dark.accentRed} style={{marginTop: SPACING.md}}/>}
      </ScrollView>

      <View style={styles.inputArea}>
        <TextInput 
          style={styles.input} 
          value={input} 
          onChangeText={setInput} 
          placeholder="Ask me anything..." 
          placeholderTextColor={COLORS.dark.textSecondary}
        />
        <TouchableOpacity style={[styles.sendBtn, loading && styles.sendBtnDisabled]} onPress={sendMessage} disabled={loading}>
          <Text style={styles.sendBtnText}>{loading ? '...' : 'Send'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark.bgPrimary, paddingTop: 60 },
  headerCard: { marginHorizontal: SPACING.lg, marginBottom: SPACING.md, backgroundColor: COLORS.dark.bgSecondary, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.dark.bgInput },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.dark.textPrimary, marginBottom: SPACING.xs },
  subtitle: { color: COLORS.dark.textSecondary, fontSize: 14 },
  chatArea: { flex: 1, paddingHorizontal: SPACING.lg },
  bubble: { padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.sm, maxWidth: '85%', borderWidth: 1, borderColor: COLORS.dark.bgInput },
  bubbleUser: { backgroundColor: COLORS.dark.accentRed, alignSelf: 'flex-end', borderBottomRightRadius: 0 },
  bubbleAi: { backgroundColor: COLORS.dark.bgSecondary, alignSelf: 'flex-start', borderBottomLeftRadius: 0 },
  bubbleText: { color: COLORS.dark.textPrimary, fontSize: 16 },
  inputArea: { flexDirection: 'row', padding: SPACING.lg, backgroundColor: COLORS.dark.bgSecondary, alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.dark.bgInput },
  input: { flex: 1, backgroundColor: COLORS.dark.bgInput, color: COLORS.dark.textPrimary, padding: SPACING.md, borderRadius: RADIUS.full },
  sendBtn: { marginLeft: SPACING.sm, backgroundColor: COLORS.dark.accentRed, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderRadius: RADIUS.full },
  sendBtnDisabled: { opacity: 0.7 },
  sendBtnText: { color: COLORS.dark.textPrimary, fontWeight: 'bold' }
});
