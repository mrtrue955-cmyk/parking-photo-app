import * as Notifications from 'expo-notifications';

// Show notifications as a banner and in the list even while the app is open (no sound).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});
