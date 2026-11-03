import { Module } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { TransfersController } from './transfers.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { TRANSFERS_KAFKA_NAME } from './constants';
import { OutboxPublisherService } from './outbox-publisher.service';
import { OutboxRepository } from './outbox.repository';
import kafkaConfig from '../../../../lib/common/configs/kafka.config';
import { KafkaConfigType } from '../../../../lib/common/types';

@Module({
  imports: [
    ClientsModule.registerAsync({
      clients: [
        {
          name: TRANSFERS_KAFKA_NAME,
          imports: [ConfigModule],
          inject: [kafkaConfig.KEY],
          useFactory: (configService: KafkaConfigType) => ({
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId: 'user-service',
                brokers: [configService.url],
              },
              producerOnlyMode: true,
            },
          }),
        },
      ],
    }),
  ],
  controllers: [TransfersController],
  providers: [TransfersService, OutboxPublisherService, OutboxRepository],
})
export class TransfersModule {}
