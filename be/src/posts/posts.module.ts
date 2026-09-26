import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Post, PostSchema } from './schemas/post.schema';
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
  providers: [PostsService],
  exports: [PostsService, MongooseModule],
})
export class PostsModule {}
