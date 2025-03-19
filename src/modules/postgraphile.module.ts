import { Module } from '@nestjs/common';
import { PostgraphileController } from '../controllers/postgraphile.controller';
import { FileUploadModule } from './file-upload.module';

@Module({
  imports: [FileUploadModule],
  controllers: [PostgraphileController],
})
export class PostgraphileModule {}
