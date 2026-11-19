import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { getParkingService } from '../container';
import { syncReminders } from '../native/reminders';

const TASK_NAME = 'purge-expired-parking-photos';

// Must be defined at module top level so it exists when the OS wakes the app.
TaskManager.defineTask(TASK_NAME, async () => {
  try {
    const service = await getParkingService();
    await service.purgeExpired();
    const list = await service.list();
    await syncReminders(list, Date.now());
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerPurgeTask(): Promise<void> {
  if (await TaskManager.isTaskRegisteredAsync(TASK_NAME)) return;
  await BackgroundTask.registerTaskAsync(TASK_NAME, { minimumInterval: 60 * 24 });
}
