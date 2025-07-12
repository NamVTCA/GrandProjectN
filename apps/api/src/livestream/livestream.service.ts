import { Injectable } from '@nestjs/common';
import { UserDocument } from '../auth/schemas/user.schema';

@Injectable()
export class LivestreamService {
    private activeStreams = new Map<string, { streamId: string, author: string }>();

    startStream(user: UserDocument): { streamId: string } {
        const streamId = `stream-${user._id}-${Date.now()}`;
        this.activeStreams.set(streamId, { streamId, author: user.username });
        console.log(`${user.username} started stream: ${streamId}`);
        return { streamId };
    }

    endStream(streamId: string) {
        this.activeStreams.delete(streamId);
        console.log(`Stream ${streamId} ended.`);
        return { message: 'Livestream đã kết thúc.' };
    }

    getActiveStreams() {
        return Array.from(this.activeStreams.values());
    }
}
