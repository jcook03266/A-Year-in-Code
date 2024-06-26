"use client";
// Dependencies

/**
 * Manages transient in-app notifications. Transient notifications are notifications received from the backend
 * either in real-time or via query. Unread notifications are loaded up into a queue / array where the first
 * notification is the latest one received.
 *
 * Transient notifications are marked as read in the database when the user views said notifications,
 * and this clears them from the notification queue which also translates into them not being loaded back into
 * the queue when the database is queried for notifications again / when the notification subscription is connected.
 *
 * Note: Special notifications like the profile task notifications are automatically generated when the user first creates their account. When
 * the user views these notifications then this is saved in the DB and the user won't have to do the same thing
 * again when it comes to viewing their account on different devices.
 */
export class NotificationManager {
  // Singleton instance
  static shared: NotificationManager = new NotificationManager();

  // Properties
  private _notificationQueue: string[] = [];

  // Convenience
  // Notifications
  currentNotifications = (): string[] => [];
  notificationCounter = (): number => 0;
  hasNotifications = () => this.notificationCounter() > 0;
  unreadNotifications = (): string[] => [];
  unreadNotificationsCount = (): number => 0;
  hasUnreadNotifications = () => this.notificationCounter() > 0;

  // Getters / Setters
  public get notificationQueue(): string[] {
    return this._notificationQueue;
  }

  set notificationQueue(notifications: string[]) {
    this._notificationQueue = notifications;
  }

  addNotificationToQueue(notification: string) {
    this._notificationQueue.unshift(notification);
  }

  clearQueue() {
    this._notificationQueue = [];
  }

  async markNotificationsAsRead(notificationIDs: string[]) {
    // await shared.apiService().markNotificationsAsRead(notificationIDs);
  }

  async markNotificationsAsUnread(notificationIDs: string[]) {
    // await shared.apiService().markNotificationsAsUnread(notificationIDs);
  }
}
