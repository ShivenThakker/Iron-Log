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
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import {
  OBSIDIAN_COLORS,
  OBSIDIAN_RADIUS,
  OBSIDIAN_SPACING,
  OBSIDIAN_TYPOGRAPHY,
} from '@/constants/tokens';
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
  const scrollViewRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: "Hey! I'm your IronLog Coach. I have your workouts, current rank, and nutrition data. How can I optimize your training today?",
      timestamp: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (messageToSend?: string) => {
    const text = (messageToSend || inputText).trim();
    if (!text || loading) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text.slice(0, 2000), // Strict F5 safety: maxLength 2,000 characters
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    const history = messages
      .filter((m) => m.id !== 'welcome-1')
      .map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('model' as const),
        parts: m.text,
      }));

    try {
      const response = await api.post('/ai/chat', {
        message: text.slice(0, 2000),
        history,
      });
      const aiReply =
        response.data?.reply ||
        response.data?.text ||
        "I've analyzed your progress. Keep progressive overload consistent and ensure you hit your protein targets.";

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.warn('Coach AI error:', err?.response?.data || err?.message);
      const errorDetail = err?.response?.data?.error || 'Unable to connect to IronLog Coach right now. Please check your connection and try again.';
      const fallbackMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: `⚠️ ${errorDetail}`,
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
    <ScreenContainer scrollable={false} style={{ backgroundColor: OBSIDIAN_COLORS.surface }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <Icon name="CaretLeft" size={22} color={OBSIDIAN_COLORS.textWhite} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>IronLog Coach</Text>
              <View style={styles.geminiBadge}>
                <Icon name="Sparkle" size={11} color={OBSIDIAN_COLORS.voltLime} />
                <Text style={styles.geminiBadgeText}>Coach</Text>
              </View>
            </View>
            <Text style={styles.status}>Online • Ready to program</Text>
          </View>

          <View style={{ width: 36 }} />
        </View>

        {/* Message Feed */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.feed}
          contentContainerStyle={styles.feedContent}
          showsVerticalScrollIndicator={false}
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
                    <Icon name="Sparkle" size={14} color={OBSIDIAN_COLORS.voltLime} />
                  </View>
                )}

                <View
                  style={[
                    styles.bubble,
                    isAi ? styles.bubbleAi : styles.bubbleUser,
                  ]}
                >
                  <Text style={[styles.bubbleText, isAi ? styles.textAi : styles.textUser]}>
                    {msg.text}
                  </Text>
                  <Text
                    style={[
                      styles.timestamp,
                      isAi ? styles.timestampAi : styles.timestampUser,
                    ]}
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
                <Icon name="Sparkle" size={14} color={OBSIDIAN_COLORS.voltLime} />
              </View>
              <View style={styles.typingCard}>
                <ActivityIndicator size="small" color={OBSIDIAN_COLORS.voltLime} />
                <Text style={styles.typingText}>Coach is thinking...</Text>
              </View>
            </View>
          )}

          {/* Suggested Starter Prompt Chips */}
          {messages.length <= 2 && (
            <View style={styles.starterSection}>
              <Text style={styles.starterLabel}>SUGGESTED QUESTIONS</Text>
              <View style={styles.starterChips}>
                {STARTER_PROMPTS.map((prompt, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.starterChip}
                    activeOpacity={0.8}
                    onPress={() => handleSend(prompt)}
                  >
                    <Icon name="Sparkle" size={13} color={OBSIDIAN_COLORS.voltLime} />
                    <Text style={styles.starterChipText}>{prompt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask about workouts, form, or nutrition..."
            placeholderTextColor={OBSIDIAN_COLORS.textMuted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend()}
            maxLength={2000} // Strict F5 Character Limit
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
            disabled={!inputText.trim() || loading}
            activeOpacity={0.85}
            onPress={() => handleSend()}
          >
            <Icon
              name="PaperPlaneTilt"
              size={18}
              color={!inputText.trim() || loading ? OBSIDIAN_COLORS.textMuted : OBSIDIAN_COLORS.onPrimary}
              weight="bold"
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OBSIDIAN_COLORS.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: OBSIDIAN_SPACING.md,
    paddingTop: OBSIDIAN_SPACING.xs,
    paddingBottom: OBSIDIAN_SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    ...OBSIDIAN_TYPOGRAPHY.headlineSm,
    color: OBSIDIAN_COLORS.textWhite,
  },
  geminiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(204, 255, 0, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: OBSIDIAN_RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.25)',
  },
  geminiBadgeText: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.voltLime,
    fontSize: 9,
  },
  status: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.cyanAccent,
    fontSize: 10,
    marginTop: 2,
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingHorizontal: OBSIDIAN_SPACING.md,
    paddingVertical: OBSIDIAN_SPACING.md,
    gap: OBSIDIAN_SPACING.md,
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
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
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: OBSIDIAN_RADIUS.lg,
  },
  bubbleAi: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    borderBottomLeftRadius: 3,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
  },
  bubbleUser: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    borderBottomRightRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
  },
  bubbleText: {
    ...OBSIDIAN_TYPOGRAPHY.bodyMd,
    lineHeight: 20,
    fontSize: 14,
  },
  textAi: {
    color: OBSIDIAN_COLORS.textWhite,
  },
  textUser: {
    color: OBSIDIAN_COLORS.textWhite,
  },
  timestamp: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    fontSize: 9,
    marginTop: 4,
  },
  timestampAi: {
    color: OBSIDIAN_COLORS.textMuted,
    alignSelf: 'flex-start',
  },
  timestampUser: {
    color: OBSIDIAN_COLORS.voltLime,
    alignSelf: 'flex-end',
  },
  typingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: OBSIDIAN_RADIUS.lg,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
  },
  typingText: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 12,
  },
  starterSection: {
    marginTop: OBSIDIAN_SPACING.sm,
    gap: 8,
  },
  starterLabel: {
    ...OBSIDIAN_TYPOGRAPHY.labelCaps,
    color: OBSIDIAN_COLORS.textMuted,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  starterChips: {
    gap: 6,
  },
  starterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLow,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: OBSIDIAN_RADIUS.full,
    borderWidth: 1,
    borderColor: OBSIDIAN_COLORS.borderGhost,
  },
  starterChipText: {
    ...OBSIDIAN_TYPOGRAPHY.bodySm,
    color: OBSIDIAN_COLORS.textWhite,
    fontSize: 12,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: OBSIDIAN_SPACING.md,
    paddingVertical: OBSIDIAN_SPACING.sm,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: OBSIDIAN_COLORS.borderGhost,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: OBSIDIAN_COLORS.surfaceContainer,
    color: OBSIDIAN_COLORS.textWhite,
    borderRadius: OBSIDIAN_RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 9,
    maxHeight: 100,
    fontSize: 14,
    fontFamily: 'Inter',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: OBSIDIAN_COLORS.voltLime,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: OBSIDIAN_COLORS.voltLime,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: OBSIDIAN_COLORS.surfaceContainerHigh,
    shadowOpacity: 0,
    elevation: 0,
  },
});
