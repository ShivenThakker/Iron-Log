import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { TIMER_CHIME_BASE64_URI } from './timerChime';

// Configure how notifications appear when app is in foreground/background
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    }),
  });
}

let channelInitialized = false;

export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android' || channelInitialized) return;
  try {
    await Notifications.setNotificationChannelAsync('rest-timer-channel', {
      name: 'Rest Timer Alerts',
      description: 'Alerts when your rest period ends between sets',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 300, 200, 300],
      lightColor: '#CCFF00',
      enableVibrate: true,
      enableLights: true,
    });
    channelInitialized = true;
  } catch (err) {
    console.warn('[NotificationService] Failed to set notification channel:', err);
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    await setupNotificationChannels();
    const settings = await Notifications.getPermissionsAsync();
    if (!settings.granted) {
      const requested = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: false,
          allowSound: true,
        },
      });
      return requested.granted;
    }
    return true;
  } catch (err) {
    console.warn('[NotificationService] Failed to request permissions:', err);
    return false;
  }
}

export async function scheduleRestTimerNotification(
  seconds: number,
  exerciseName?: string,
  isNextExercise?: boolean
): Promise<string | null> {
  if (Platform.OS === 'web' || seconds <= 0) return null;
  try {
    await setupNotificationChannels();
    const triggerSeconds = Math.max(1, Math.round(seconds));

    let bodyText = "Time for your next set! Let's get back to work! 💪";
    if (exerciseName) {
      bodyText = isNextExercise
        ? `Up next: ${exerciseName}! Ready to crush it? 💪`
        : `Time for your next set of ${exerciseName}! Let's crush it! 💪`;
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Rest Time Over! ⚡',
        body: bodyText,
        sound: 'default',
        vibrate: [0, 300, 200, 300],
        data: { type: 'rest_timer_complete', exerciseName, isNextExercise },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: triggerSeconds,
        channelId: 'rest-timer-channel',
      },
    });

    return id;
  } catch (err) {
    console.warn('[NotificationService] Failed to schedule notification:', err);
    return null;
  }
}

export async function cancelRestTimerNotification(id?: string | null): Promise<void> {
  if (!id || Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch (err) {
    console.warn('[NotificationService] Failed to cancel notification:', err);
  }
}

export async function playTimerAlertSound(): Promise<void> {
  try {
    if (Platform.OS !== 'web') {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: TIMER_CHIME_BASE64_URI },
        { shouldPlay: true, volume: 1.0 }
      );

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
        }
      });
    }
  } catch (err) {
    console.warn('[NotificationService] Audio playback error:', err);
  }
}
