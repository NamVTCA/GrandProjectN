import API_URL from "../config/api";

// Lấy danh sách bài viết (feed)
export async function getFeed(token: string) {
  const res = await fetch(`${API_URL}/posts/feed`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Tạo bài viết
export async function createPost(content: string, mediaUrls: string[], token: string) {
  const res = await fetch(`${API_URL}/posts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content, mediaUrls, visibility: "PUBLIC" }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Upload file (ảnh/video)
export async function uploadFile(uri: string, token: string): Promise<string[]> {
  const formData = new FormData();
  formData.append("files", {
    uri,
    name: uri.split("/").pop() || "upload.jpg",
    type: uri.endsWith(".mp4") ? "video/mp4" : "image/jpeg",
  } as any);

  const res = await fetch(`${API_URL}/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
    body: formData,
  });

  if (!res.ok) throw new Error(await res.text());
  const data = await res.json(); // { urls: [...] }
  return data.urls || [];
}

// React (like, love, haha…)
export async function reactToPost(postId: string, type: string, token: string) {
  const res = await fetch(`${API_URL}/posts/${postId}/react`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Lấy comments của bài viết
export async function getComments(postId: string) {
  const res = await fetch(`${API_URL}/posts/${postId}/comments`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Thêm comment
export async function addComment(postId: string, content: string, token: string) {
  const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Xóa bài viết
export async function deletePost(postId: string, token: string) {
  const res = await fetch(`${API_URL}/posts/${postId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Cập nhật bài viết
export async function updatePost(postId: string, content: string, mediaUrls: string[], token: string) {
  const res = await fetch(`${API_URL}/posts/${postId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content, mediaUrls }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Repost (chia sẻ)
export async function repostPost(postId: string, token: string) {
  const res = await fetch(`${API_URL}/posts/${postId}/repost`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
