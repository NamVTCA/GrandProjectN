// File: src/components/layout/Rightbar.tsx
import React from 'react';
import GameActivity from '../../features/game-activity/components/GameActivity';
import './Rightbar.scss';

const Rightbar: React.FC = () => {
  return (
    <aside className="rightbar">
      <div className="rightbar-section">
        <h4>Đang chơi</h4>
        <GameActivity />
      </div>
      <div className="rightbar-section">
        <h4>Bạn bè Online</h4>
        <p className="placeholder-text">Chưa có bạn bè nào online.</p>
      </div>
      <div className="rightbar-section">
        <h4>Hoạt động gần đây</h4>
        <p className="placeholder-text">Chưa có hoạt động mới.</p>
      </div>
    </aside>
  );
};
export default Rightbar;