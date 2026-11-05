export type {
  AwarenessNudgeNotification,
  BadgeAwardedNotification,
  DemoNotificationDraft,
  GoalReachedNotification,
  MovementLine,
  NotificationKind,
  PlatformNotification,
  StreakBrokenNotification,
  TransactionsIngestedNotification,
} from './domain/notification';

export {
  listNotifications,
  markNotificationsRead,
  openNotificationStream,
  sendDemoNotification,
} from './infrastructure/notifications-api';
