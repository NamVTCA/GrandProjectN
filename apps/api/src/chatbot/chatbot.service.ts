import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { GoogleAuth } from 'google-auth-library';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private readonly projectId: string;
  private readonly location: string;
  private readonly model: string;
  private readonly keyFile: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.projectId = this.configService.get<string>('GCP_PROJECT_ID') ?? '';
    this.location = this.configService.get<string>('GCP_LOCATION') ?? 'us-central1';
    this.model = 'gemini-1.5-flash';
    this.keyFile = this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS') ?? '';
  }

  async getResponse(message: string): Promise<string> {
    try {
      // Lấy access token từ service account JSON
      const auth = new GoogleAuth({
        keyFile: this.keyFile,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
      const client = await auth.getClient();
      const token = await client.getAccessToken();

      // Endpoint Vertex AI
      const apiUrl = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${this.model}:generateContent`;

      const payload = {
        contents: [
          {
            parts: [
              {
                text: `Bạn là một trợ lý ảo thân thiện trong mạng xã hội GrandProject. Hãy trả lời ngắn gọn và tự nhiên: "${message}"`,
              },
            ],
          },
        ],
      };

      const response = await firstValueFrom(
        this.httpService.post(apiUrl, payload, {
          headers: {
            Authorization: `Bearer ${token.token}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      return response.data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Không có phản hồi.';
    } catch (error) {
      this.logger.error(
        'Error calling Gemini 1.5 Flash',
        error.response?.data || error.message,
      );
      return 'Rất tiếc, đã có lỗi xảy ra. Vui lòng thử lại sau.';
    }
  }
}
