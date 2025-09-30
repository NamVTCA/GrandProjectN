import React, { useEffect, useRef, useState } from "react";
import { useVoiceChannel } from "../../features/voice/useVoiceChannel";
import s from "./voice-dock.module.scss";

type Props = { roomId: string; onClose?: () => void; autoJoin?: boolean };

/* ========= Buttons style ========= */
const btn: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #2d2f36",
  background: "#1f2126",
  color: "#fff",
  fontSize: 13,
  cursor: "pointer",
};
const btnPrimary: React.CSSProperties = { ...btn, background: "#2563eb", borderColor: "#1e40af" };
const btnDanger: React.CSSProperties = { ...btn, background: "#ef4444", borderColor: "#b91c1c" };
const iconBtn: React.CSSProperties = {
  ...btn,
  width: 36,
  height: 36,
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 10,
};
const chip: React.CSSProperties = {
  padding: "2px 8px",
  fontSize: 12,
  borderRadius: 999,
  background: "#2a2d34",
  color: "#cbd5e1",
};

/* ========= Inline icons (SVG) ========= */
const MicIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3z" fill="currentColor" />
    <path d="M19 11a7 7 0 0 1-14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 18v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 21h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const MicOffIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3z" fill="currentColor" />
    <path d="M19 11a7 7 0 0 1-14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 18v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 21h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M3 3L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const HeadsetIcon: React.FC<{ size?: number; crossed?: boolean }> = ({ size = 18, crossed = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 12a8 8 0 0 1 16 0v7a2 2 0 0 1-2 2h-2v-6h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M4 13h4v6H6a2 2 0 0 1-2-2v-4z" stroke="currentColor" strokeWidth="2" />
    {crossed ? <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /> : null}
  </svg>
);

const ScreenIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="4" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M8 20h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const StopIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <rect x="8" y="8" width="8" height="8" fill="currentColor" />
  </svg>
);

/** Gắn srcObject 1 lần, giữ mounted; ẩn/hiện bằng opacity/visibility để tránh nháy */
const MediaVideo: React.FC<{ stream: MediaStream; show: boolean; className?: string; muted?: boolean }> = ({
  stream,
  show,
  className,
  muted = true,
}) => {
  const vref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = vref.current;
    if (!el) return;
    if (el.srcObject !== stream) {
      el.srcObject = stream;
    }
    const onReady = () => el.play?.().catch(() => {});
    el.addEventListener("loadedmetadata", onReady);
    el.addEventListener("canplay", onReady);
    return () => {
      el.removeEventListener("loadedmetadata", onReady);
      el.removeEventListener("canplay", onReady);
    };
  }, [stream]);

  return (
    <div className={`${s.vdRatio} ${className ?? ""}`} data-show={show ? "1" : "0"}>
      <video ref={vref} autoPlay playsInline muted={muted} />
    </div>
  );
};

const VoiceDock: React.FC<Props> = ({ roomId, onClose, autoJoin }) => {
  const {
    joined,
    micOn,
    deafened,
    sharing,
    remotes,
    remoteInfo,
    join,
    leave,
    toggleMic,
    toggleDeafen,
    startShare,
    stopShare,
  } = useVoiceChannel(roomId);

  const [focusId, setFocusId] = useState<string | null>(null);

  useEffect(() => {
    if (autoJoin && !joined) join();
  }, [autoJoin, joined, join]);

  return (
    <>
      <div
        style={{
          position: "fixed",
          right: 16,
          bottom: 16,
          zIndex: 40,
          width: 380,
          maxHeight: "72vh",
          borderRadius: 16,
          boxShadow: "0 10px 30px rgba(0,0,0,.35)",
          border: "1px solid #2b2e37",
          background: "#121419",
          overflow: "hidden",
          color: "#e5e7eb",
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            background: "linear-gradient(90deg,#111827,#0b1220)",
            borderBottom: "1px solid #242633",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 14 }}>
            Voice — <span style={{ color: "#9ca3af", fontWeight: 500 }}>{roomId}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={chip}>{joined ? "Đang tham gia" : "Chưa tham gia"}</span>
            {onClose && (
              <button style={btn} onClick={onClose} title="Đóng">
                ✖
              </button>
            )}
          </div>
        </div>

        {/* Controls */}
        <div style={{ padding: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
          {!joined ? (
            <button style={btnPrimary} onClick={join}>
              Tham gia
            </button>
          ) : (
            <button style={btnDanger} onClick={leave}>
              Rời
            </button>
          )}

          {/* Mic toggle — icon-only */}
          <button
            style={iconBtn}
            onClick={toggleMic}
            title={micOn ? "Tắt mic" : "Bật mic"}
            aria-label={micOn ? "Tắt mic" : "Bật mic"}
          >
            {micOn ? <MicIcon /> : <MicOffIcon />}
          </button>

          {/* Deafen toggle — icon-only */}
          <button
            style={iconBtn}
            onClick={toggleDeafen}
            title={deafened ? "Bật nghe" : "Tắt nghe"}
            aria-label={deafened ? "Bật nghe" : "Tắt nghe"}
          >
            <HeadsetIcon crossed={deafened} />
          </button>

          {/* Share screen / Stop share — icon-only */}
          {joined && !sharing && (
            <button
              style={iconBtn}
              onClick={startShare}
              title="Chia sẻ màn hình"
              aria-label="Chia sẻ màn hình"
            >
              <ScreenIcon />
            </button>
          )}
          {joined && sharing && (
            <button
              style={iconBtn}
              onClick={stopShare}
              title="Dừng chia sẻ"
              aria-label="Dừng chia sẻ"
            >
              <StopIcon />
            </button>
          )}
        </div>

        {/* Remote tiles */}
        <div style={{ padding: "0 12px 12px", maxHeight: "50vh", overflow: "auto" }}>
          {remotes.length === 0 && (
            <div style={{ fontSize: 13, color: "#9ca3af", padding: "8px 2px" }}>
              Chưa có ai khác trong phòng…
            </div>
          )}

          {remotes.map((r) => {
            const info = remoteInfo[r.socketId] || {};
            const isSharing = !!info.sharing;
            return (
              <div
                key={r.socketId}
                style={{
                  border: "1px solid #2b2e37",
                  borderRadius: 12,
                  padding: 10,
                  marginTop: 10,
                  background: "#0f1218",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <img
                    src={info.avatar || "/images/default-user.svg"}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/images/default-user.svg";
                    }}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "1px solid #2b2e37",
                    }}
                  />
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{info.username || r.socketId}</div>
                  {isSharing && <span style={chip}>đang chia sẻ màn hình</span>}
                  {isSharing && (
                    <button
                      style={{ ...btn, marginLeft: "auto" }}
                      onClick={() => setFocusId(r.socketId)}
                      title="Xem toàn màn hình"
                    >
                      ⤢ Expand
                    </button>
                  )}
                </div>

                {/* audio luôn phát */}
                <audio
                  autoPlay
                  playsInline
                  ref={(el) => {
                    if (el) {
                      el.srcObject = r.stream;
                      el.play?.().catch(() => {});
                    }
                  }}
                />

                {/* video LUÔN mounted, chỉ ẩn/hiện bằng CSS để không reset srcObject */}
                <MediaVideo stream={r.stream} show={isSharing} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Fullscreen viewer */}
      {focusId &&
        (() => {
          const r = remotes.find((x) => x.socketId === focusId);
          const info = remoteInfo[focusId] || {};
          const isSharing = !!info.sharing;
          if (!r) return null;
          return (
            <div
              onClick={() => setFocusId(null)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,.92)",
                zIndex: 100,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ padding: 10, display: "flex", alignItems: "center", gap: 10 }}>
                <img
                  src={info.avatar || "/images/default-user.svg"}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/images/default-user.svg";
                  }}
                  style={{ width: 32, height: 32, borderRadius: "50%" }}
                />
                <div style={{ fontWeight: 700 }}>{info.username || focusId}</div>
                <button onClick={() => setFocusId(null)} style={{ ...btn, marginLeft: "auto" }}>
                  ✖ Close
                </button>
              </div>
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 10 }}>
                <div style={{ width: "100%", maxWidth: 1600 }}>
                  <MediaVideo stream={r.stream} show={isSharing} muted />
                </div>
                {!isSharing && <div style={{ color: "#9ca3af", marginLeft: 12 }}>Đang chờ chia sẻ màn hình…</div>}
              </div>
            </div>
          );
        })()}
    </>
  );
};

export default VoiceDock;
