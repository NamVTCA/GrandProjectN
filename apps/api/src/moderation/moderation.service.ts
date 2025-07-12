import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ModerationStatus } from '../posts/schemas/post.schema';

interface ModerationResult {
  status: ModerationStatus;
  reason?: string;
}

@Injectable()
export class ModerationService {
  private readonly apiKey: string;
  private readonly textApiUrl: string;
  private readonly logger = new Logger(ModerationService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GOOGLE_AI_API_KEY');
    if (!apiKey) {
      throw new Error('Google AI API Key is not configured.');
    }
    this.apiKey = apiKey;
    this.textApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`;
  }

  async checkText(text: string): Promise<ModerationResult> {
    if (!this.apiKey) {
      this.logger.warn('Google AI API Key not configured. Skipping moderation.');
      return { status: ModerationStatus.APPROVED };
    }
    const payload = {
      contents: [{ parts: [{ text }] }],
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    };
    try {
      const response = await firstValueFrom(this.httpService.post(this.textApiUrl, payload));
      if (response.data.promptFeedback?.blockReason) {
        return { status: ModerationStatus.REJECTED, reason: `Bị chặn do: ${response.data.promptFeedback.blockReason}` };
      }
      return { status: ModerationStatus.APPROVED };
    } catch (error) {
      this.logger.error('Error calling Gemini API for text moderation', error.response?.data);
      return { status: ModerationStatus.APPROVED };
    }
  }
}
