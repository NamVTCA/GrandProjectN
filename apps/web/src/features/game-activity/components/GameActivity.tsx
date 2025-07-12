// File: src/features/game-activity/components/GameActivity.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import api from '../../../services/api';
import type { GameSearchResult } from '../types/Game';
import './GameActivity.scss';

const GameActivity: React.FC = () => {
  const { user, fetchUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<GameSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      setIsSearching(true);
      api.get(`/game-activity/search?q=${searchTerm}`)
        .then(res => setResults(res.data))
        .catch(console.error)
        .finally(() => setIsSearching(false));
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSetPlaying = async (gameId: number) => {
    try {
      await api.post('/game-activity/playing', { gameId });
      setSearchTerm('');
      setResults([]);
      fetchUser(); // Cập nhật lại thông tin user để hiển thị game đang chơi
    } catch (error) {
      console.error("Lỗi khi đặt trạng thái game:", error);
    }
  };

  const handleClearPlaying = async () => {
    try {
      // Backend không có endpoint riêng để xóa, ta sẽ gọi setPlaying với ID null/0
      await api.post('/game-activity/playing', { gameId: null });
      fetchUser();
    } catch (error) {
      console.error("Lỗi khi xóa trạng thái game:", error);
    }
  };

  if (user?.currentGame) {
    return (
      <div className="currently-playing">
        <img src={user.currentGame.boxArtUrl} alt={user.currentGame.name} />
        <div className="game-info">
          <span>Đang chơi</span>
          <strong>{user.currentGame.name}</strong>
        </div>
        <button onClick={handleClearPlaying} className="clear-btn">&times;</button>
      </div>
    );
  }

  return (
    <div className="game-search">
      <input
        type="text"
        placeholder="Bạn đang chơi game gì?"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {isSearching && <div className="search-result-item">Đang tìm...</div>}
      {results.length > 0 && (
        <div className="search-results">
          {results.map(game => (
            <div key={game.id} className="search-result-item" onClick={() => handleSetPlaying(game.id)}>
              {game.cover && <img src={`https://images.igdb.com/igdb/image/upload/t_cover_small/${game.cover.image_id}.jpg`} alt={game.name} />}
              <span>{game.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GameActivity;