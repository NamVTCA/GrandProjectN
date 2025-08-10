import { useState } from "react";
import { Link } from "react-router-dom";
import type { Group } from "../types/Group";
import { toAssetUrl } from "../../../untils/img";
import CoverAvatarEditMenu from "./CoverAvatarEditMenu";
import api from "../../../services/api";
import "./GroupCard.scss";

type Props = {
  group: Group;
  isMember?: boolean;                  
  isOwner?: boolean;
  joinStatus?: "MEMBER" | "PENDING" | "NONE"; 
  onGroupUpdate?: () => void;
};

const AVATAR_FALLBACK = "https://placehold.co/80x80/2a2a2a/ffffff?text=G";

export default function GroupCard({
  group,
  isMember = false,
  isOwner = false,
  joinStatus,
  onGroupUpdate,
}: Props) {
  const [avatar, setAvatar] = useState<string | undefined>(group.avatar);
  const [status, setStatus] = useState<"MEMBER" | "PENDING" | "NONE">(
    joinStatus ?? (isMember ? "MEMBER" : "NONE")
  );
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    try {
      setJoining(true);
      await api.post(`/groups/${group._id}/join`);
      setStatus("PENDING");              
      onGroupUpdate?.();                 
    } catch (e: any) {
      setStatus("PENDING");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="group-item">
      <Link to={`/groups/${group._id}`} className="group-item__thumb">
        <img
          src={avatar ? toAssetUrl(avatar) : AVATAR_FALLBACK}
          alt={group.name}
          loading="lazy"
        />
      </Link>

      <div className="group-item__content">
        <Link to={`/groups/${group._id}`} className="group-item__title">
          {group.name}
        </Link>
        <div className="group-item__meta">
          {group.privacy === "public" ? "Nhóm Công khai" : "Nhóm Riêng tư"}
          <span className="dot">•</span>
          <span>{group.memberCount} thành viên</span>
          {status === "MEMBER" && <span className="chip">Bạn là thành viên</span>}
        </div>
      </div>

      <div className="group-item__actions">
        {status === "MEMBER" ? (
          isOwner && (
            <CoverAvatarEditMenu
              groupId={group._id}
              onCoverUploaded={() => onGroupUpdate?.()}
              onAvatarUploaded={(url) => {
                setAvatar(url);
                onGroupUpdate?.();
              }}
            />
          )
        ) : status === "PENDING" ? (
          <button className="join-btn" disabled>Đã gửi yêu cầu</button>
        ) : (
          <button className="join-btn" onClick={handleJoin} disabled={joining}>
            {joining ? "Đang gửi..." : "Tham gia"}
          </button>
        )}
      </div>
    </div>
  );
}
