import { Controller, Post, Get, Delete, Body, UseGuards } from '@nestjs/common';
import { LivestreamService } from './livestream.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserDocument } from '../auth/schemas/user.schema';
import { PremiumGuard } from '../auth/guards/premium.guard';

@UseGuards(JwtAuthGuard)
@Controller('livestreams')
export class LivestreamController {
    constructor(private livestreamService: LivestreamService) {}

    @Post('start')
    startStream(@GetUser() user: UserDocument) {
        return this.livestreamService.startStream(user);
    }

    @Post('start-hd')
    @UseGuards(PremiumGuard)
    startHdStream(@GetUser() user: UserDocument) {
        return this.livestreamService.startStream(user);
    }

    @Delete('end')
    endStream(@Body('streamId') streamId: string) {
        return this.livestreamService.endStream(streamId);
    }

    @Get('active')
    getActiveStreams() {
        return this.livestreamService.getActiveStreams();
    }
}