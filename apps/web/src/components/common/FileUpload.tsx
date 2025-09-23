import React, { useState } from "react";
import api from "../../services/api";

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  // Hàm xử lý thay đổi file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Hàm xử lý upload file
  const handleUpload = async () => {
    if (!file) {
      setMessage("Vui lòng chọn một file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);

    try {
      const response = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage("Tải lên thành công!");
      console.log(response.data);
    } catch (error) {
      setMessage("Tải lên thất bại!");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? "Đang tải lên..." : "Tải lên"}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}
