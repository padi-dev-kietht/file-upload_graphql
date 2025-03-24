import { Injectable } from '@nestjs/common';
import { FileUpload } from 'graphql-upload/processRequest.mjs';
import { createWriteStream, readFileSync } from 'fs';
import * as path from 'path';
// import * as os from 'os';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();
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
        const pdfBuffer = readFileSync(filePath);
        const pdfData = await pdfParse(pdfBuffer);
        return pdfData.text;
      }
      if (mimetype.includes('word') || fileExt === '.docx') {
        const docxBuffer = readFileSync(filePath);
        const result = await mammoth.extractRawText({ buffer: docxBuffer });
        return result.value;
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

  async generateQuestions(text: string): Promise<string[]> {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-pro',
      });
      const prompt = `Generate 10 multiple-choice questions based on the following text:
"${text}".
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

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      console.log(response);
      return JSON.parse(response);
    } catch (error) {
      console.error('Error generating questions:', error);
      return ['Error generating questions'];
    }
  }
}
