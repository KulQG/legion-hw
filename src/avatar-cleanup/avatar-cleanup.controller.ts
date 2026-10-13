import { Controller, Post } from '@nestjs/common';
import { AvatarCleanupService } from './avatar-cleanup.service';

@Controller('avatar-cleanup')
export class AvatarCleanupController {
  constructor(private readonly avatarCleanupService: AvatarCleanupService) {}

  @Post()
  async startCleanAvatars() {
    await this.avatarCleanupService.startCleanUp();
  }
}
