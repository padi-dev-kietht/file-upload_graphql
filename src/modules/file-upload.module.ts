import { Module } from '@nestjs/common';
import { FileUploadResolver } from '../graphql/resolvers/file-upload.resolver';
import { FileUploadModulePlugin } from '../plugins/file-upload.module.plugin';

@Module({
  providers: [FileUploadResolver, FileUploadModulePlugin],
  exports: [FileUploadResolver, FileUploadModulePlugin],
})
export class FileUploadModule {}
