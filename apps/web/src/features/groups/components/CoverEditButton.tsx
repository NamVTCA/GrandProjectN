import React, { useRef, useState } from "react";
import { FaCamera } from "react-icons/fa";
import api from "../../../services/api";

type Props = {
  groupId: string;                                 
  onUploaded?: (newCoverImage: string) => void;     
};

export default function CoverEditButton({ groupId, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);  
  const [loading, setLoading] = useState(false);    

  // Mở hộp thoại chọn file
  const pickFile = () => inputRef.current?.click();

  // Xử lý khi chọn file
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file); // field "file"
      const res = await api.post(`/groups/${groupId}/cover-image`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const url = res.data?.coverImage as string; // lấy đúng field "coverImage"
      if (url) onUploaded?.(url);
    } catch (err) {
      console.error(err);
      alert("Tải ảnh thất bại. Thử lại nhé!");
    } finally {
      setLoading(false);
      if (e.target) e.target.value = ""; // reset input
    }
  };

  return (
    <>
      {/* Nút hiển thị đè lên ảnh bìa */}
      <button
        type="button"
        className="edit-cover-btn"
        onClick={pickFile}
        disabled={loading}
        aria-label="Chỉnh sửa ảnh bìa"
        title="Chỉnh sửa ảnh bìa"
      >
        <FaCamera style={{ marginRight: 6 }} />
        {loading ? "Đang tải..." : "Chỉnh sửa"}
      </button>

      {/* Input file ẩn */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onFile}
      />
    </>
  );
}
