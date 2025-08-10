import React, { useRef, useState } from "react";
import { FaCamera } from "react-icons/fa";
import api from "../../../services/api";

type Props = {
  groupId: string;                                      
  onCoverUploaded?: (url: string) => void;              
  onAvatarUploaded?: (url: string) => void;             
};

export default function CoverAvatarEditMenu({
  groupId,
  onCoverUploaded,
  onAvatarUploaded,
}: Props) {
  const [open, setOpen] = useState(false);              // mở/đóng menu
  const [loading, setLoading] = useState<null | "cover" | "avatar">(null);

  // 2 input file ẩn riêng cho cover & avatar
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const pickCover = () => coverInputRef.current?.click();
  const pickAvatar = () => avatarInputRef.current?.click();

  const upload = async (file: File, kind: "cover" | "avatar") => {
    setLoading(kind);
    try {
      const form = new FormData();
      form.append("file", file);
      const url =
        kind === "cover"
          ? (await api.post(`/groups/${groupId}/cover-image`, form, {
              headers: { "Content-Type": "multipart/form-data" },
            })).data?.coverImage
          : (await api.post(`/groups/${groupId}/avatar`, form, {
              headers: { "Content-Type": "multipart/form-data" },
            })).data?.avatar;

      if (url) {
        if (kind === "cover") onCoverUploaded?.(url);
        else onAvatarUploaded?.(url);
      }
    } catch (e) {
      console.error(e);
      alert("Tải ảnh thất bại. Thử lại nhé!");
    } finally {
      setLoading(null);
    }
  };

  const onPickCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) upload(f, "cover");
    e.target.value = "";
  };
  const onPickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) upload(f, "avatar");
    e.target.value = "";
  };

  return (
    <div className="edit-menu">
      <button
        type="button"
        className="edit-cover-btn"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <FaCamera style={{ marginRight: 6 }} />
        Chỉnh sửa
      </button>

      {open && (
        <div className="edit-dropdown" role="menu">
          <button
            type="button"
            className="edit-dropdown__item"
            onClick={pickCover}
            disabled={loading === "cover"}
          >
            {loading === "cover" ? "Đang tải ảnh bìa..." : "Đổi ảnh bìa"}
          </button>
          <button
            type="button"
            className="edit-dropdown__item"
            onClick={pickAvatar}
            disabled={loading === "avatar"}
          >
            {loading === "avatar" ? "Đang tải avatar..." : "Đổi ảnh đại diện"}
          </button>
        </div>
      )}

      {/* input ẩn */}
      <input
        ref={coverInputRef}
        hidden
        type="file"
        accept="image/*"
        onChange={onPickCover}
      />
      <input
        ref={avatarInputRef}
        hidden
        type="file"
        accept="image/*"
        onChange={onPickAvatar}
      />

      {/* click ngoài để đóng menu (nhẹ nhàng) */}
      {open && (
        <div
          className="edit-menu__backdrop"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
    </div>
  );
}
