import { Controller, Get, Next, Post, Req, Res } from '@nestjs/common';
import { HttpRequestHandler } from 'postgraphile';
import type { Request, Response } from 'express';
import { FileUploadModulePlugin } from 'src/plugins/file-upload.module.plugin';
import { createMiddleware } from 'src/middlewares/postgraphile.middleware';

@Controller()
export class PostgraphileController {
  postgraphile: HttpRequestHandler;

  constructor(private uploadModulePlugin: FileUploadModulePlugin) {
    const databaseUrl =
      'postgresql://postgres:Hiimtuankiet36@localhost:5432/aielearning';
    console.log('Initializing PostGraphile Middleware...'); // Check if this logs
    this.postgraphile = createMiddleware(
      databaseUrl,
      this.uploadModulePlugin.build(),
    );
    console.log(
      'PostGraphile Middleware Initialized:',
      this.postgraphile ? 'Success' : 'Failed',
    );
  }

  @Get('graphiql')
  graphiql(@Req() request: Request, @Res() response: Response, @Next() next) {
    return this.postgraphile(request, response, next);
  }

  @Post('graphql')
  graphql(@Req() request: Request, @Res() response: Response, @Next() next) {
    return this.postgraphile(request, response, next);
  }
}
