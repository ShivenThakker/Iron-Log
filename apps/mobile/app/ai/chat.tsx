import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../../constants/tokens';
import { api } from '../../../services/api';

export default function AiChat() {
  const [messages, setMessages] = useState<{role: 'user'|'ai', text: string}[]>([
    { role: 'ai', text: 'Hey there! I am your IronLog AI Coach. How can I optimize your programming today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const { data } = await api.post('/ai/chat', { message: userMsg });
      setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I'm having trouble connecting to the cloud right now." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <Text style={styles.title}>AI Coach Chat</Text>
      
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
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark.bgPrimary, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.dark.textPrimary, paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  chatArea: { flex: 1, paddingHorizontal: SPACING.lg },
  bubble: { padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.sm, maxWidth: '85%' },
  bubbleUser: { backgroundColor: COLORS.dark.accentRed, alignSelf: 'flex-end', borderBottomRightRadius: 0 },
  bubbleAi: { backgroundColor: COLORS.dark.bgSecondary, alignSelf: 'flex-start', borderBottomLeftRadius: 0 },
  bubbleText: { color: COLORS.dark.textPrimary, fontSize: 16 },
  inputArea: { flexDirection: 'row', padding: SPACING.lg, backgroundColor: COLORS.dark.bgSecondary, alignItems: 'center' },
  input: { flex: 1, backgroundColor: COLORS.dark.bgInput, color: COLORS.dark.textPrimary, padding: SPACING.md, borderRadius: RADIUS.full },
  sendBtn: { marginLeft: SPACING.sm, backgroundColor: COLORS.dark.accentRed, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderRadius: RADIUS.full },
  sendBtnText: { color: COLORS.dark.textPrimary, fontWeight: 'bold' }
});
