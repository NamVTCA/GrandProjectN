import React from "react";

const STATIC = import.meta.env.VITE_API_STATIC_URL || "http://localhost:8888";
const toAssetUrl = (u?: string) => (!u ? "" : u.startsWith("http") ? u : `${STATIC}${u}`);

type Props = {
  avatarUrl: string;
  frameAssetUrl?: string;
  size?: number;            // px, mặc định 96
  frameScale?: number;      // 1 = vừa khít, >1 phóng to khung
  offsetX?: number;         // px (+ sang phải, - sang trái)
  offsetY?: number;         // px (+ xuống, - lên)
  rounded?: boolean;        // avatar tròn (true) hay bo góc (false)
  className?: string;
  style?: React.CSSProperties;
  frameFit?: "contain" | "cover"; // cách fit khung, mặc định 'contain'
};

export default function AvatarWithFrame({
  avatarUrl,
  frameAssetUrl,
  size = 96,
  frameScale = 1.35,
  offsetX = 0,
  offsetY = 0,
  rounded = true,
  className = "",
  style,
  frameFit = "contain",
}: Props) {
  const frameSrc = frameAssetUrl ? toAssetUrl(frameAssetUrl) : undefined;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "inline-block",
        ...style,
      }}
    >
      <img
        src={avatarUrl}
        alt="Avatar"
        style={{
          width: "100%",
          height: "100%",
          borderRadius: rounded ? "50%" : 8,
          objectFit: "cover",
          display: "block",
          position: "relative",
          zIndex: 1,
        }}
      />

      {frameSrc && (
        <img
          src={frameSrc}
          alt="Frame"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: frameFit,          // 'contain' giữ đúng tỷ lệ khung
            transformOrigin: "center",
            transform: `translate(${offsetX}px, ${offsetY}px) scale(${frameScale})`,
            pointerEvents: "none",
            zIndex: 2,
            willChange: "transform",
          }}
        />
      )}
    </div>
  );
}
