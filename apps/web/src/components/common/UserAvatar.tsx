const STATIC = import.meta.env.VITE_API_STATIC_URL || "http://localhost:8888";
const toAssetUrl = (u?: string) =>
  !u ? "" : u.startsWith("http") ? u : `${STATIC}${u}`;

interface UserAvatarProps {
  src?: string;
  size?: number;
  className?: string; // 👈 thêm className
}

export default function UserAvatar({
  src,
  size = 36,
  className,
}: UserAvatarProps) {
  const url = src ? toAssetUrl(src) : "";

  return (
    <img
      src={url || "https://placehold.co/36x36/242526/e4e6eb?text=?"} // fallback luôn có ảnh
      alt="avatar"
      className={className} // 👈 nhận className ngoài
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
        display: "block",
      }}
    />
  );
}
