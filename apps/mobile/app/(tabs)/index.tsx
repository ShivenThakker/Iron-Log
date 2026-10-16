import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS } from '@/constants/tokens';

export default function HomeDashboard() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Ready to lift, Rookie?</Text>
        <Text style={styles.date}>{new Date().toDateString()}</Text>
      </View>

      <ScrollView style={{flex: 1}} showsVerticalScrollIndicator={false}>
        {/* Today's Workout */}
        <View style={styles.section}>
           <Text style={styles.sectionTitle}>Today's Plan</Text>
           <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/workout/active')}>
             <View>
               <Text style={styles.cardTitle}>Upper Body A</Text>
               <Text style={styles.cardSub}>Chest, Triceps, Core • 60 min</Text>
             </View>
             <Text style={styles.startBtn}>Start</Text>
           </TouchableOpacity>
        </View>

        {/* Daily Macros Summary */}
        <View style={styles.section}>
           <Text style={styles.sectionTitle}>Nutrition</Text>
           <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/nutrition')}>
             <View>
               <Text style={styles.cardTitle}>1850 / 2500 kcal</Text>
               <Text style={styles.cardSub}>Protein: 140g • Carbs: 200g • Fat: 50g</Text>
             </View>
             <Text style={styles.startBtn}>Log</Text>
           </TouchableOpacity>
        </View>

        {/* Gamification Snippet */}
        <View style={styles.section}>
           <Text style={styles.sectionTitle}>Rank Progress</Text>
           <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/achievements')}>
             <View>
               <Text style={styles.cardTitle}>Rookie (450 XP)</Text>
               <Text style={styles.cardSub}>550 XP to Iron Novice</Text>
             </View>
           </TouchableOpacity>
        </View>

        {/* AI Snippet */}
        <View style={styles.section}>
           <Text style={styles.sectionTitle}>Coach</Text>
           <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/ai/chat')}>
             <View>
               <Text style={styles.cardTitle}>Ask Gemini AI</Text>
               <Text style={styles.cardSub}>Get workout and form advice</Text>
             </View>
           </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark.bgPrimary, padding: SPACING.lg, paddingTop: 60 },
  header: { marginBottom: SPACING.xl },
  greeting: { fontSize: 32, fontWeight: 'bold', color: COLORS.dark.textPrimary },
  date: { fontSize: 16, color: COLORS.dark.textSecondary, marginTop: SPACING.xs },
  section: { marginBottom: SPACING.xl },
  sectionTitle: { color: COLORS.dark.textPrimary, fontSize: 20, fontWeight: 'bold', marginBottom: SPACING.md },
  actionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.dark.bgSecondary, padding: SPACING.xl, borderRadius: RADIUS.md },
  cardTitle: { color: COLORS.dark.textPrimary, fontSize: 18, fontWeight: 'bold' },
  cardSub: { color: COLORS.dark.textSecondary, marginTop: SPACING.xs },
  startBtn: { color: COLORS.dark.accentRed, fontWeight: 'bold', fontSize: 16 }
});
