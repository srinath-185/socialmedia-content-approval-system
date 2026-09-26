import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PostsService } from '../posts/posts.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly postsService: PostsService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleAutoPublishScheduledPosts() {
    this.logger.debug('Running scheduled background job: checking due posts to publish...');
    try {
      const publishedCount = await this.postsService.publishDuePosts();
      if (publishedCount > 0) {
        this.logger.log(`Successfully published ${publishedCount} due scheduled post(s).`);
      }
    } catch (error) {
      this.logger.error('Failed to auto-publish scheduled posts:', error);
    }
  }
}
