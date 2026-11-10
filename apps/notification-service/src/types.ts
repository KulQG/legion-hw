interface TransferPayload {
  sum: string;
  transferId: string;
}

export interface TransferSentNotification extends TransferPayload {
  toUser: string;
  type: 'transfer-sent';
}

export interface TransferReceivedNotification extends TransferPayload {
  fromUser: string;
  type: 'transfer-received';
}

export type NotificationPayload =
  TransferSentNotification | TransferReceivedNotification;

export interface SaveNotificationReturnedValue {
  id: string;
  received: boolean;
}
