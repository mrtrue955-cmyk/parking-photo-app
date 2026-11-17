import * as Notifications from 'expo-notifications';
import { isSilentPost } from '../domain/parkedNotification';

// Show notifications as a banner and in the list even while the app is open (no sound).
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // Silent re-posts (after a button or body tap) go to the list only, with no new banner.
    const silent = isSilentPost(notification.request.content.data);
    return {
      shouldShowBanner: !silent,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    };
  },
});
