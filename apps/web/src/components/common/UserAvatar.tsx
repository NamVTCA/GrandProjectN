const STATIC = import.meta.env.VITE_API_STATIC_URL || "http://localhost:8888";
const toAssetUrl = (u?: string) => (!u ? "" : u.startsWith("http") ? u : `${STATIC}${u}`);

export default function UserAvatar({ src, size = 36 }: { src?: string; size?: number }) {
  const url = src ? toAssetUrl(src) : "";

  return (
    <img
      src={url}
      alt="avatar"
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
