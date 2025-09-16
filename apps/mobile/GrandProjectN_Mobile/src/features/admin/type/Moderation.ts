// Định nghĩa cấu trúc cho một tác giả đơn giản
interface ModerationAuthor {
  _id: string;
  username: string;
  avatar?: string;
}

// Định nghĩa cấu trúc cho một bài đăng trong hàng đợi
export interface ModeratedPost {
  _id: string;
  content: string;
  author: ModerationAuthor;
  createdAt: string;
}

// Định nghĩa cấu trúc cho một bình luận trong hàng đợi
export interface ModeratedComment {
  _id: string;
  content: string;
  author: ModerationAuthor;
  post: {
    _id: string;
    content: string; // Nội dung của bài đăng gốc để có ngữ cảnh
  };
  createdAt: string;
}
