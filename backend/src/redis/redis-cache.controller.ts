import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { RedisCacheService } from './redis-cache.service';

@Controller()
export class RedisCacheController {
  constructor(private redisCacheService: RedisCacheService) {}

  @Get('/cache')
  async getCache(@Query('key') key: string): Promise<string> {
    const value = await this.redisCacheService.getValue(key);
    console.log(value);
    return value;
  }

  @Post('/cache')
  async setCache(@Body() cache): Promise<boolean> {
    const result = await this.redisCacheService.setKey(cache.key, cache.value);
    return result;
  }

  @Post('/enterRoom')
  async enter(
    @Body()
    body: {
      studyRoomId: number;
      userId: string;
      nickname: string;
      isMaster: boolean;
    },
  ): Promise<void> {
    return await this.redisCacheService.enterRoom(body);
  }

  @Post('/leaveRoom')
  async leave(
    @Body() body: { studyRoomId: number; userId: string },
  ): Promise<void> {
    return await this.redisCacheService.leaveRoom(body);
  }
}
