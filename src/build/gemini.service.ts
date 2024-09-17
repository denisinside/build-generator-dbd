import { Injectable } from '@nestjs/common';
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from '@google/generative-ai';
import * as process from 'node:process';
import { GoogleAIFileManager } from '@google/generative-ai/server';

@Injectable()
export class GeminiService {
  private apiKey = process.env.GEMINI_API_KEY;
  private genAI = new GoogleGenerativeAI(this.apiKey);
  private fileManager = new GoogleAIFileManager(this.apiKey);

  private async uploadToGemini(path, mimeType) {
    const uploadResult = await this.fileManager.uploadFile(path, {
      mimeType,
      displayName: path,
    });
    const file = uploadResult.file;
    console.log(`Uploaded file ${file.displayName} as: ${file.name}`);
    return file;
  }
  private async waitForFilesActive(files) {
    console.log('Waiting for file processing...');
    for (const name of files.map((file) => file.name)) {
      let file = await this.fileManager.getFile(name);
      while (file.state === 'PROCESSING') {
        process.stdout.write('.');
        await new Promise((resolve) => setTimeout(resolve, 10_000));
        file = await this.fileManager.getFile(name);
      }
      if (file.state !== 'ACTIVE') {
        throw Error(`File ${file.name} failed to process`);
      }
    }
    console.log('...all files ready\n');
  }

  async requestBuild(request: string, balance: 'Low' | 'Mid' | 'High') {
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ];

    const responseSchema = JSON.parse(process.env.GEMINI_RESPONSE_SCHEMA);
    const generationConfig = {
      temperature: parseFloat(process.env.GEMINI_TEMPERATURE),
      topP: parseFloat(process.env.GEMINI_TOP_P),
      topK: parseFloat(process.env.GEMINI_TOP_K),
      maxOutputTokens: parseFloat(process.env.GEMINI_MAX_OUTPUT_TOKENS),
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
    };

    let prompt: string = process.env.GEMINI_PROMPT;
    prompt = prompt.replace('<REQUEST>', request);
    prompt = prompt.replace('<BALANCE>', balance);
    const parts = [{ text: prompt }];

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: {
        parts: [{ text: process.env.GEMINI_INSTRUCTIONS }],
        role: 'model',
      },
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      safetySettings,
      generationConfig,
    });

    try {
      if (
        result.response.promptFeedback &&
        result.response.promptFeedback.blockReason
      ) {
        return {
          error: `Blocked for ${result.response.promptFeedback.blockReason}`,
        };
      }
      const response = result.response;
      return { response };
    } catch (e) {
      return {
        error: e.message,
      };
    }
  }
}
