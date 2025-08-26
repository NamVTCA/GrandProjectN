

type Size = "sm" | "md";

interface Props {
  count?: number;      // số chưa đọc
  size?: Size;         // "sm" | "md"
  dot?: boolean;       // true => chỉ chấm đỏ, không hiện số
  className?: string;  // thêm class ngoài (vd: margin-left)
}

export default function UnreadBadge({
  count = 0,
  size = "sm",
  dot = false,
  className = "",
}: Props) {
  if (!count || count <= 0) return null;

  if (dot) {
    return (
      <span
        aria-label="Chưa đọc"
        className={`unread-badge-dot ${className}`}
      />
    );
  }

  return (
    <span
      aria-label={`${count} tin chưa đọc`}
      className={`unread-badge ${size === "md" ? "unread-badge--md" : "unread-badge--sm"} ${className}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
