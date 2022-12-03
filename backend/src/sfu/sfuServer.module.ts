import { Module } from '@nestjs/common';
import { SFUServerGateway } from './sfuServer.gateway';

@Module({
  providers: [SFUServerGateway],
})
export class SFUServerModule {}
