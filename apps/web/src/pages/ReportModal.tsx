import React, { useState } from "react";
import { Link } from "react-router-dom";

interface ReportModalProps {
  onClose: () => void;
  onSubmit: (reason: string) => void;
  postId?: string;
  userId?: string;
}

const ReportModal: React.FC<ReportModalProps> = ({ 
  onClose, 
  onSubmit, 
  postId, 
  userId 
}) => {
  const [reason, setReason] = useState("");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content report-modal" onClick={(e) => e.stopPropagation()}>
        <h3>🚩 Gửi báo cáo</h3>
        
        {postId && (
          <p className="report-link">
            <Link to={`/posts/${postId}`} target="_blank">
              Xem bài viết được báo cáo
            </Link>
          </p>
        )}
        
        {userId && (
          <p className="report-link">
            <Link to={`/profile/${userId}`} target="_blank">
              Xem hồ sơ người dùng
            </Link>
          </p>
        )}
        
        <textarea
          placeholder="Nhập lý do bạn muốn báo cáo..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
        />
        
        <div className="modal-actions">
          <button onClick={onClose}>Hủy</button>
          <button
            onClick={() => {
              if (!reason.trim()) {
                alert("Vui lòng nhập lý do báo cáo");
                return;
              }
              onSubmit(reason);
            }}
          >
            Gửi báo cáo
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;