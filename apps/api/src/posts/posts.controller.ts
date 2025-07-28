import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserDocument } from '../auth/schemas/user.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ReactToPostDto } from './dto/react-to-post.dto'; // <-- IMPORT DTO MỚI
import { RepostDto } from './dto/repost.dto'; // <-- IMPORT DTO MỚI
import { UpdatePostDto } from './dto/update-post.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@GetUser() user: UserDocument, @Body() createPostDto: CreatePostDto) {
    return this.postsService.createPost(user, createPostDto);
  }

  @Get()
  findAll() {
    return this.postsService.findAllPosts();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findPostById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: UserDocument) {
    return this.postsService.deletePost(id, user);
  }

  // --- Bình luận ---
  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  addComment(
    @Param('id') postId: string,
    @GetUser() user: UserDocument,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.postsService.addComment(postId, user, createCommentDto);
  }

  @Get(':id/comments')
  findComments(@Param('id') postId: string) {
    return this.postsService.findCommentsByPost(postId);
  }

  // --- THAY ĐỔI ENDPOINT TỪ `/like` SANG `/react` ---
  @UseGuards(JwtAuthGuard)
  @Post(':id/react') // <-- Đổi tên endpoint
  @HttpCode(HttpStatus.OK)
  toggleReaction(
    @Param('id') postId: string,
    @GetUser() user: UserDocument,
    @Body() reactToPostDto: ReactToPostDto, // <-- Sử dụng DTO mới
  ) {
    return this.postsService.toggleReaction(postId, user, reactToPostDto);
  }

  // --- NÂNG CẤP ENDPOINT REPOST ---
  @UseGuards(JwtAuthGuard)
  @Post(':id/repost')
  repost(
    @Param('id') originalPostId: string,
    @GetUser() user: UserDocument,
    @Body() repostDto: RepostDto, // <-- Sử dụng DTO mới
  ) {
    return this.postsService.repost(originalPostId, user, repostDto);
  }

  @Get('user/:authorId')
  findPostsByAuthor(@Param('authorId') authorId: string) {
    return this.postsService.findPostsByAuthor(authorId);
  }

  // --- CÁC ENDPOINT MỚI ---
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  updatePost(
    @Param('id') postId: string,
    @GetUser() user: UserDocument,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.updatePost(postId, user, updatePostDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('comments/:id')
  updateComment(
    @Param('id') commentId: string,
    @GetUser() user: UserDocument,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.postsService.updateComment(commentId, user, updateCommentDto);
  }
  @UseGuards(JwtAuthGuard)
  @Delete('comments/:id')
  deleteComment(@Param('id') id: string) {
    return this.postsService.deleteComment(id);
  }
}
