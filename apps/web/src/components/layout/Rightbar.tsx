import React from 'react';
import './Rightbar.scss';

const Rightbar: React.FC = () => {
  return (
    <aside className="rightbar">
      <div className="rightbar-section">
        <h4>Bạn bè Online</h4>
        {/* Danh sách bạn bè sẽ được thêm vào đây */}
      </div>
      <div className="rightbar-section">
        <h4>Hoạt động gần đây</h4>
        {/* Hoạt động sẽ được thêm vào đây */}
      </div>
    </aside>
  );
};
export default Rightbar;