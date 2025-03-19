import { Injectable } from '@nestjs/common';
import { FileUpload } from 'graphql-upload/processRequest.mjs';
import { createWriteStream } from 'fs';
import * as path from 'path';
// import * as os from 'os';

@Injectable()
export class FileUploadResolver {
  async handleFileUpload(upload: FileUpload): Promise<any> {
    const { file } = upload;
    if (!file) throw new Error('No file');

    const { createReadStream, filename, mimetype, encoding } = await file;

    const uploadDir = path.join(process.cwd(), 'uploads'); // Ensures it's at the root
    const uploadPath = path.join(uploadDir, filename);
    // const desktopPath = path.join(os.homedir(), 'Desktop', filename);
    console.log(`Uploading: ${filename}`);

    // Save the file to local storage (modify this for cloud storage)
    await new Promise((resolve, reject) => {
      createReadStream()
        .pipe(createWriteStream(uploadPath))
        .on('finish', resolve)
        .on('error', reject);
    });

    return {
      filename,
      mimetype,
      encoding,
      url: `/uploads/${filename}`, // Modify for actual hosting solution
    };
  }
}
