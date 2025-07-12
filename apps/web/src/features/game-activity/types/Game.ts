// Định nghĩa cấu trúc dữ liệu cho một game từ kết quả tìm kiếm IGDB
export interface GameSearchResult {
  id: number;
  name: string;
  cover?: {
    image_id: string;
  };
}
