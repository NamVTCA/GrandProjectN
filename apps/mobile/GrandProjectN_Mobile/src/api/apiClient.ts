// src/api/apiClient.ts

import axios from 'axios';

const apiClient = axios.create({
  // ❗️ QUAN TRỌNG: Thay đổi địa chỉ IP này!
  // 1. Mở terminal/CMD trên máy tính của bạn.
  // 2. Gõ `ipconfig` (Windows) hoặc `ifconfig` (macOS/Linux).
  // 3. Tìm địa chỉ IPv4 của bạn (ví dụ: 192.168.1.10).
  // 4. Thay thế `YOUR_COMPUTER_IP` bằng địa chỉ đó.
  // KHÔNG DÙNG `localhost` hoặc `127.0.0.1` vì điện thoại không hiểu.
  baseURL: 'http://192.168.1.28:8888/api',

  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;