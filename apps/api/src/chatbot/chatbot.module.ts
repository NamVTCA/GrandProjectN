import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [HttpModule],
  providers: [ChatbotService, ConfigService],
  exports: [ChatbotService],
})
export class ChatbotModule {}