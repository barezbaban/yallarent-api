import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { devicesApi } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;

  try {
    await devicesApi.register(token, Platform.OS);
  } catch {}

  return token;
}

export async function unregisterPushNotifications(pushToken: string) {
  try {
    await devicesApi.unregister(pushToken);
  } catch {}
}

export async function scheduleBookingNotification(carName: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Booking Confirmed!',
      body: `Your ${carName} is reserved. Check your bookings for details.`,
      sound: true,
    },
    trigger: null, // fires immediately
  });
}
