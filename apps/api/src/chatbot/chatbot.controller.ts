// apps/api/src/chatbot/chatbot.controller.ts

import { Controller, Post, Body } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post()
  async chatWithBot(@Body('message') message: string) {
    const reply = await this.chatbotService.AddRegister(message);
    return { reply }; // 👈 Quan trọng để frontend nhận được { reply: '...' }
  }
}
