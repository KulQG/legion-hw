import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MSchema } from 'mongoose';
import { NotificationPayload } from '../../types';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema()
export class Notification {
  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  eventId!: string;

  @Prop({ type: MSchema.Types.Mixed, required: true })
  data!: NotificationPayload;

  @Prop({ required: true })
  received!: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ userId: 1, eventId: 1 }, { unique: true });

NotificationSchema.index({ userId: 1, received: 1 });
