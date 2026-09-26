import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { PostsModule } from '../posts/posts.module';

@Module({
  imports: [PostsModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
