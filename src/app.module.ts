import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FileUploadModule } from 'src/modules/file-upload.module';
import { PostgraphileModule } from 'src/modules/postgraphile.module';

@Module({
  imports: [
    PrismaModule.forRoot({ isGlobal: true }),
    FileUploadModule,
    PostgraphileModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
