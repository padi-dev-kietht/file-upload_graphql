import { Injectable } from '@nestjs/common';
import { FileUpload } from 'graphql-upload/processRequest.mjs';
import { createWriteStream, readFileSync } from 'fs';
import * as path from 'path';
// import * as os from 'os';
import * as dotenv from 'dotenv';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

dotenv.config();
@Injectable()
export class FileUploadResolver {
  private llm = new ChatGoogleGenerativeAI({
    model: 'gemini-1.5-pro',
    maxOutputTokens: 2048,
    apiKey: process.env.GEMINI_API_KEY,
  });

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

    const extractedText = await this.extractText(uploadPath, mimetype);
    const generatedQuestions = await this.generateQuestions(extractedText);

    return {
      filename,
      mimetype,
      encoding,
      url: `/uploads/${filename}`,
      extractedText: extractedText.substring(0, 500),
      generatedQuestions,
    };
  }

  async extractText(filePath: string, mimetype: string): Promise<string> {
    try {
      const fileExt = path.extname(filePath).toLowerCase();
      if (mimetype.includes('pdf') || fileExt === '.pdf') {
        const loader = new PDFLoader(filePath);
        const docs = await loader.load();
        return docs.map((doc) => doc.pageContent).join('\n');
      }
      if (mimetype.includes('text') || fileExt === '.txt') {
        return readFileSync(filePath, 'utf8');
      }
      return 'Unsupported file format';
    } catch (error) {
      console.error('Error extracting text:', error);
      return 'Error extracting text from file';
    }
  }

  async generateQuestions(text: string): Promise<any[]> {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 100,
    });
    const chunks = await splitter.splitText(text);

    const results = await Promise.all(
      chunks.map(async (chunk) => {
        const prompt = `Generate 5 multiple-choice questions based on the following text:
"${chunk}".
Each question should have four answer choices labeled as A, B, C, and D.
Provide the output as a valid JSON array with the following structure:

[
  {
    "question": "What is X?",
    "options": [
      "A. Option A text",
      "B. Option B text",
      "C. Option C text",
      "D. Option D text"
    ],
    "answer": "A/B/C/D"
  }
]

Ensure:
- Each option starts with "A.", "B.", "C.", or "D."
- The correct answer is returned as a single letter: "A", "B", "C", or "D".
- The response is a valid JSON array without any additional formatting or markdown. Do NOT include triple backticks (\`\`\`), newlines outside JSON, or extra explanations.`;
        try {
          const response = await this.llm.invoke(prompt);
          const textResponse =
            typeof response.content === 'string'
              ? response.content
              : response.content?.map((msg) => msg).join(' ') || '';
          console.log('Response:', textResponse);

          return JSON.parse(textResponse);
        } catch (error) {
          console.error('Error parsing JSON:', error);
          return [];
        }
      }),
    );
    return results.flat();
  }
}
