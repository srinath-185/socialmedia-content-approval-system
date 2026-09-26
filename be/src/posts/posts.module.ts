import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Post, PostSchema } from './schemas/post.schema';
import { PostsRepository } from './repositories/posts.repository';
import { ClientsModule } from '../clients/clients.module';
import { CommentsModule } from '../comments/comments.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    ClientsModule,
    CommentsModule,
    AuditLogsModule,
  ],
  controllers: [PostsController],
  providers: [PostsService, PostsRepository],
  exports: [PostsService, PostsRepository, MongooseModule],
})
export class PostsModule {}
