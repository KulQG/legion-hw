import { Module } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { TransfersController } from './transfers.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TRANSFERS_KAFKA_NAME } from './constants';
import { OutboxPublisherService } from './outbox-publisher.service';

@Module({
  imports: [
    ClientsModule.registerAsync({
      clients: [
        {
          name: TRANSFERS_KAFKA_NAME,
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId: 'user-service',
                brokers: [configService.getOrThrow<string>('KAFKA_URL')],
              },
              producerOnlyMode: true,
            },
          }),
        },
      ],
    }),
  ],
  controllers: [TransfersController],
  providers: [TransfersService, OutboxPublisherService],
})
export class TransfersModule {}
