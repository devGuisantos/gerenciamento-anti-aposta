export type {
  AwarenessNudgeNotification,
  BadgeAwardedNotification,
  DemoNotificationDraft,
  GoalReachedNotification,
  NotificationKind,
  PlatformNotification,
  StreakBrokenNotification,
  TransactionsIngestedNotification,
} from './domain/notification';

export { openNotificationStream, sendDemoNotification } from './infrastructure/notifications-api';
