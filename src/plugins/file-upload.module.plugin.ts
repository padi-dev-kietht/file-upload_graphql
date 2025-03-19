import { Injectable } from '@nestjs/common';
import { gql, makeExtendSchemaPlugin, Plugin } from 'postgraphile';
import GraphQLUpload, { FileUpload } from 'graphql-upload/GraphQLUpload.mjs';
import { FileUploadResolver } from 'src/graphql/resolvers/file-upload.resolver';

@Injectable()
export class FileUploadModulePlugin {
  constructor(private fileUploadResolver: FileUploadResolver) {}

  build(): Plugin {
    const fileUploadResolver = this.fileUploadResolver;
    return makeExtendSchemaPlugin(() => {
      return {
        typeDefs: gql`
          scalar Upload

          input _FileUploadInput {
            file: Upload!
          }

          type _FileUploadPayload {
            filename: String!
            mimetype: String!
            encoding: String!
            url: String!
          }

          extend type Mutation {
            _fileUpload(input: _FileUploadInput!): _FileUploadPayload
          }
        `,

        resolvers: {
          Upload: GraphQLUpload,

          Mutation: {
            _fileUpload: async (_query: any, args: { input: FileUpload }) => {
              return fileUploadResolver.handleFileUpload(args.input);
            },
          },
        },
      };
    });
  }
}
