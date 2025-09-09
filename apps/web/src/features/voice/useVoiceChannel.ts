import { useCallback, useEffect, useRef, useState } from "react";
import { useSocket } from "../../hooks/useSocket";
import { publicUrl } from "../../untils/publicUrl";

export type RemoteMedia = { socketId: string; stream: MediaStream };

type Peer = {
  pc: RTCPeerConnection;
  audioSender?: RTCRtpSender | null;
  videoSender?: RTCRtpSender | null;
  makingOffer?: boolean;
};

type RemoteInfo = { username?: string; avatar?: string; sharing?: boolean };

export function useVoiceChannel(roomId: string) {
  const socket = useSocket("webrtc");

  const [joined, setJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [deafened, setDeafened] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [remotes, setRemotes] = useState<RemoteMedia[]>([]);
  const [remoteInfo, setRemoteInfo] = useState<Record<string, RemoteInfo>>({});

  const localMic = useRef<MediaStream | null>(null);
  const peers = useRef<Map<string, Peer>>(new Map());

  // ==== NEW: track video hiện tại (blank hoặc screen) ====
  const blankVideoRef = useRef<MediaStreamTrack | null>(null);
  const currentVideoTrackRef = useRef<MediaStreamTrack | null>(null);

  const getBlankVideoTrack = useCallback((): MediaStreamTrack => {
    if (blankVideoRef.current) return blankVideoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = 16; canvas.height = 9;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const s: MediaStream = (canvas as any).captureStream(5);
    blankVideoRef.current = s.getVideoTracks()[0];
    return blankVideoRef.current!;
  }, []);

  // đảm bảo luôn có giá trị khởi tạo cho currentVideoTrackRef
  const ensureCurrentVideoTrack = useCallback(() => {
    if (!currentVideoTrackRef.current) {
      currentVideoTrackRef.current = getBlankVideoTrack();
    }
    return currentVideoTrackRef.current!;
  }, [getBlankVideoTrack]);

  /* ---------- helpers ---------- */
  const setSharingFlag = useCallback((sid: string, on: boolean) => {
    setRemoteInfo((prev) => ({ ...prev, [sid]: { ...(prev[sid] || {}), sharing: on } }));
  }, []);

  const upsertTrack = (s: MediaStream, track: MediaStreamTrack) => {
    const sameId = s.getTracks().find((t) => t.id === track.id);
    if (sameId) return;
    const sameKind = s.getTracks().find((t) => t.kind === track.kind);
    if (sameKind && sameKind.id !== track.id) s.removeTrack(sameKind);
    s.addTrack(track);
  };

  const addTrackToRemote = useCallback((socketId: string, track: MediaStreamTrack) => {
    if (!track) return;
    setRemotes((prev) => {
      const idx = prev.findIndex((r) => r.socketId === socketId);
      if (idx >= 0) {
        const s = prev[idx].stream;
        upsertTrack(s, track);
        return [...prev];
      }
      const s = new MediaStream([track]);
      return [...prev, { socketId, stream: s }];
    });
  }, []);

  const syncReceivers = useCallback((peerId: string) => {
    const p = peers.current.get(peerId);
    if (!p) return;
    p.pc.getReceivers().forEach((rec) => { if (rec.track) addTrackToRemote(peerId, rec.track); });
  }, [addTrackToRemote]);

  const safeMakeOffer = useCallback(async (targetId: string) => {
    const p = peers.current.get(targetId);
    if (!p || p.makingOffer) return;
    p.makingOffer = true;
    try {
      const offer = await p.pc.createOffer();
      await p.pc.setLocalDescription(offer);
      socket?.emit("offer", { targetSocketId: targetId, sdp: offer });
    } finally {
      p.makingOffer = false;
    }
  }, [socket]);

  const createPeer = useCallback((targetId: string) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });

    const audioTrans = pc.addTransceiver("audio", { direction: "sendrecv" });
    const videoTrans = pc.addTransceiver("video", { direction: "sendrecv" });

    pc.onnegotiationneeded = () => safeMakeOffer(targetId);
    pc.onicecandidate = (e) => { if (e.candidate) socket?.emit("ice-candidate", { targetSocketId: targetId, candidate: e.candidate }); };
    pc.ontrack = (e) => addTrackToRemote(targetId, e.track);

    const peer: Peer = { pc, audioSender: audioTrans.sender, videoSender: videoTrans.sender, makingOffer: false };

    // audio: gắn ngay mic (nếu có)
    const micTrack = localMic.current?.getAudioTracks()[0] || null;
    peer.audioSender?.replaceTrack(micTrack);

    // 🔑 video: gắn track hiện tại (nếu đang share thì là screen; nếu không thì blank)
    const current = ensureCurrentVideoTrack();
    peer.videoSender?.replaceTrack(current);

    peers.current.set(targetId, peer);
    return peer;
  }, [addTrackToRemote, safeMakeOffer, socket, ensureCurrentVideoTrack]);

  const callPeer = useCallback(async (targetId: string) => {
    const _ = peers.current.get(targetId) || createPeer(targetId);
    await safeMakeOffer(targetId);
  }, [createPeer, safeMakeOffer]);

  /* ---------- socket events ---------- */
  useEffect(() => {
    if (!socket) return;

    const onExisting = (arr: Array<{ socketId: string; user?: any; sharing?: boolean }> | string[]) => {
      const ids: string[] = [];
      setRemoteInfo((prev) => {
        const copy = { ...prev };
        (arr || []).forEach((it: any) => {
          if (typeof it === "string") {
            ids.push(it);
            copy[it] = copy[it] || {};
          } else {
            ids.push(it.socketId);
            copy[it.socketId] = {
              ...(copy[it.socketId] || {}),
              username: it.user?.username || it.user?.name,
              avatar: it.user?.avatar ? publicUrl(it.user.avatar) : it.user?.avatarUrl ? publicUrl(it.user.avatarUrl) : undefined,
              sharing: !!it.sharing || false, // nếu server có trạng thái
            };
          }
        });
        return copy;
      });
      ids.forEach((id) => callPeer(id));
    };

    const onUserJoined = ({ socketId, user }: { socketId: string; user?: any }) => {
      setRemoteInfo((prev) => ({
        ...prev,
        [socketId]: {
          ...(prev[socketId] || {}),
          username: user?.username || user?.name,
          avatar: user?.avatar ? publicUrl(user.avatar) : user?.avatarUrl ? publicUrl(user.avatarUrl) : undefined,
          sharing: false,
        },
      }));
      callPeer(socketId);
    };

    const onUserLeft = ({ socketId }: { socketId: string }) => {
      peers.current.get(socketId)?.pc.close();
      peers.current.delete(socketId);
      setRemotes((prev) => prev.filter((r) => r.socketId !== socketId));
      setRemoteInfo((prev) => { const c = { ...prev }; delete c[socketId]; return c; });
    };

    const onOffer = async ({ fromSocketId, sdp }: any) => {
      const peer = peers.current.get(fromSocketId) || createPeer(fromSocketId);
      await peer.pc.setRemoteDescription(new RTCSessionDescription(sdp));
      syncReceivers(fromSocketId);
      const answer = await peer.pc.createAnswer();
      await peer.pc.setLocalDescription(answer);
      socket.emit("answer", { targetSocketId: fromSocketId, sdp: answer });
    };

    const onAnswer = async ({ fromSocketId, sdp }: any) => {
      const peer = peers.current.get(fromSocketId);
      if (peer) {
        await peer.pc.setRemoteDescription(new RTCSessionDescription(sdp));
        syncReceivers(fromSocketId);
      }
    };

    const onIce = async ({ fromSocketId, candidate }: any) => {
      const peer = peers.current.get(fromSocketId);
      if (peer && candidate) await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
    };

    const onScreenShare = ({ socketId, on }: { socketId: string; on: boolean }) => {
      setSharingFlag(socketId, !!on);
      if (on) syncReceivers(socketId);
    };

    socket.on("existing-participants", onExisting);
    socket.on("user-joined", onUserJoined);
    socket.on("user-left", onUserLeft);
    socket.on("offer", onOffer);
    socket.on("answer", onAnswer);
    socket.on("ice-candidate", onIce);
    socket.on("screen-share", onScreenShare);

    return () => {
      socket.off("existing-participants", onExisting);
      socket.off("user-joined", onUserJoined);
      socket.off("user-left", onUserLeft);
      socket.off("offer", onOffer);
      socket.off("answer", onAnswer);
      socket.off("ice-candidate", onIce);
      socket.off("screen-share", onScreenShare);
    };
  }, [socket, callPeer, createPeer, setSharingFlag, syncReceivers]);

  /* ---------- public API ---------- */
  const join = useCallback(async () => {
    if (joined || !socket) return;
    localMic.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    setMicOn(true); setDeafened(false);
    const track = localMic.current.getAudioTracks()[0] || null;
    peers.current.forEach((p) => p.audioSender?.replaceTrack(track));
    socket.emit("join-call", { roomId });
    setJoined(true);
  }, [joined, socket, roomId]);

  const leave = useCallback(() => {
    if (!joined || !socket) return;
    socket.emit("leave-call", { roomId });
    peers.current.forEach((p) => p.pc.close());
    peers.current.clear();
    setRemotes([]);
    localMic.current?.getTracks().forEach((t) => t.stop());
    localMic.current = null;
    setSharing(false);
    setJoined(false);
    setRemoteInfo({});
    currentVideoTrackRef.current = null;
  }, [joined, socket, roomId]);

  const toggleMic = useCallback(() => {
    const next = !micOn; setMicOn(next);
    localMic.current?.getAudioTracks().forEach((t) => (t.enabled = next));
  }, [micOn]);

  const toggleDeafen = useCallback(() => {
    const next = !deafened; setDeafened(next);
    setRemotes((rs) => { rs.forEach((r) => r.stream.getAudioTracks().forEach((t) => (t.enabled = !next))); return [...rs]; });
  }, [deafened]);

  // === share OFF: chuyển về blank và lưu vào currentVideoTrackRef ===
  const stopShare = useCallback(() => {
    const blank = getBlankVideoTrack();
    currentVideoTrackRef.current = blank;
    peers.current.forEach((p) => p.videoSender?.replaceTrack(blank));
    setSharing(false);
    socket?.emit("screen-share", { roomId, on: false });
  }, [socket, roomId, getBlankVideoTrack]);

  // === share ON: lưu screen track vào currentVideoTrackRef và áp cho tất cả peers ===
  const startShare = useCallback(() => {
    if (sharing) return;
    (async () => {
      const display: MediaStream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: false });
      const track = display.getVideoTracks()[0];
      if (!track) return;
      currentVideoTrackRef.current = track;
      peers.current.forEach((p) => p.videoSender?.replaceTrack(track));
      track.onended = () => stopShare();
      setSharing(true);
      socket?.emit("screen-share", { roomId, on: true });
    })();
  }, [sharing, stopShare, socket, roomId]);

  // bảo đảm có track hiện tại ngay từ đầu
  useEffect(() => { ensureCurrentVideoTrack(); }, [ensureCurrentVideoTrack]);

  return {
    joined, micOn, deafened, sharing, remotes, remoteInfo,
    join, leave, toggleMic, toggleDeafen, startShare, stopShare,
  };
}
