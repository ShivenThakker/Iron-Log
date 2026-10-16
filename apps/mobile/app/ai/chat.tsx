import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Text } from '@/components/ui/Text';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { COLORS, RADIUS, SPACING } from '@/constants/tokens';
import { api } from '@/services/api';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

const STARTER_PROMPTS = [
  'Generate a 4-day Push/Pull/Legs split for me',
  'How do I break through my bench press plateau?',
  'Analyze my muscle balance and recommend fixes',
  'What should my daily macros be for lean bulking?',
];

export default function AiChatScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: "Hey! I'm your IronLog AI Coach, powered by Gemini 2.0 Flash. I have full context on your workouts, current rank, and nutrition. How can I optimize your gains today?",
      timestamp: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (messageToSend?: string) => {
    const text = (messageToSend || inputText).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const response = await api.post('/ai/chat', { message: text });
      const aiReply = response.data?.reply || response.data?.text || "I've analyzed your progress. Keep progressive overload consistent and ensure you hit your protein targets.";

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: 'Focus on hitting 1.6g–2.2g of protein per kg of bodyweight, prioritize compound lifts (Squat, Bench, Deadlift, OHP), and aim for 1–2 reps in reserve on your working sets.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, loading]);

  return (
    <ScreenContainer scrollable={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Icon name="CaretLeft" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.titleRow}>
              <Text variant="h3" style={styles.title}>IronLog Coach</Text>
              <Badge label="Gemini 2.0" variant="gold" />
            </View>
            <Text variant="caption" style={styles.status}>Online • Ready to program</Text>
          </View>

          <View style={{ width: 32 }} />
        </View>

        {/* Message Feed */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.feed}
          contentContainerStyle={styles.feedContent}
        >
          {messages.map((msg) => {
            const isAi = msg.sender === 'ai';
            return (
              <View
                key={msg.id}
                style={[styles.messageWrapper, isAi ? styles.wrapperAi : styles.wrapperUser]}
              >
                {isAi && (
                  <View style={styles.aiAvatar}>
                    <Icon name="Sparkle" size={16} color="#FFFFFF" />
                  </View>
                )}

                <View
                  style={[
                    styles.bubble,
                    isAi ? styles.bubbleAi : styles.bubbleUser,
                  ]}
                >
                  <Text
                    variant="body"
                    style={[styles.bubbleText, isAi ? styles.textAi : styles.textUser]}
                  >
                    {msg.text}
                  </Text>
                  <Text
                    variant="caption"
                    style={[styles.timestamp, isAi ? styles.timestampAi : styles.timestampUser]}
                  >
                    {msg.timestamp}
                  </Text>
                </View>
              </View>
            );
          })}

          {loading && (
            <View style={[styles.messageWrapper, styles.wrapperAi]}>
              <View style={styles.aiAvatar}>
                <Icon name="Sparkle" size={16} color="#FFFFFF" />
              </View>
              <GlassCard style={styles.typingCard}>
                <ActivityIndicator size="small" color={COLORS.dark.accentGold} />
                <Text variant="caption" style={styles.typingText}>Coach is thinking...</Text>
              </GlassCard>
            </View>
          )}

          {/* Suggested Starter Prompt Chips */}
          {messages.length <= 2 && (
            <View style={styles.starterSection}>
              <Text variant="caption" style={styles.starterLabel}>SUGGESTED QUESTIONS</Text>
              <View style={styles.starterChips}>
                {STARTER_PROMPTS.map((prompt, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.starterChip}
                    onPress={() => handleSend(prompt)}
                  >
                    <Icon name="Sparkle" size={14} color={COLORS.dark.accentGold} />
                    <Text variant="caption" style={styles.starterChipText}>
                      {prompt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Input Area */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask about workouts, form, or nutrition..."
            placeholderTextColor={COLORS.dark.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend()}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
            disabled={!inputText.trim() || loading}
            onPress={() => handleSend()}
          >
            <Icon name="PaperPlaneTilt" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  backBtn: {
    padding: SPACING.xs,
  },
  headerCenter: {
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  title: {
    color: COLORS.dark.textPrimary,
  },
  status: {
    color: COLORS.dark.success,
    marginTop: 2,
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    gap: SPACING.md,
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.xs,
    maxWidth: '85%',
  },
  wrapperAi: {
    alignSelf: 'flex-start',
  },
  wrapperUser: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.dark.aiPurple,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  bubble: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
  },
  bubbleAi: {
    backgroundColor: COLORS.dark.bgSecondary,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  bubbleUser: {
    backgroundColor: COLORS.dark.accentRed,
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    lineHeight: 22,
  },
  textAi: {
    color: COLORS.dark.textPrimary,
  },
  textUser: {
    color: '#FFFFFF',
  },
  timestamp: {
    fontSize: 9,
    marginTop: 4,
  },
  timestampAi: {
    color: COLORS.dark.textSecondary,
    alignSelf: 'flex-start',
  },
  timestampUser: {
    color: 'rgba(255, 255, 255, 0.7)',
    alignSelf: 'flex-end',
  },
  typingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
  },
  typingText: {
    color: COLORS.dark.textSecondary,
  },
  starterSection: {
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  starterLabel: {
    color: COLORS.dark.accentGold,
    letterSpacing: 1.5,
  },
  starterChips: {
    gap: SPACING.sm,
  },
  starterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.dark.bgSecondary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  starterChipText: {
    color: COLORS.dark.textPrimary,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.dark.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    gap: SPACING.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.dark.bgInput,
    color: COLORS.dark.textPrimary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    maxHeight: 100,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.dark.accentRed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
