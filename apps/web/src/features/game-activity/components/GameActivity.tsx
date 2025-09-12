import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import api from '../../../services/api';
import type { GameSearchResult } from '../types/Game';
import './GameActivity.scss';

const DEBOUNCE = 400;

const GameActivity: React.FC = () => {
  const { user, fetchUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<GameSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    const id = setTimeout(async () => {
      try {
        setIsSearching(true);
        const q = encodeURIComponent(searchTerm.trim());
        const res = await api.get(`/game-activity/search?q=${q}`);
        setResults(res?.data ?? []);
      } catch (err) {
        console.error(err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, DEBOUNCE);

    return () => clearTimeout(id);
  }, [searchTerm]);

  const handleSetPlaying = async (gameId: number) => {
    try {
      await api.post('/game-activity/playing', { gameId });
      await fetchUser();
      setSearchTerm('');
      setResults([]);
      setEditing(false);
    } catch (error) {
      console.error('Lỗi khi đặt trạng thái game:', error);
    }
  };

  const handleClearPlaying = async () => {
    try {
      // Ưu tiên endpoint DELETE nếu backend có
      await api.delete('/game-activity/playing');
    } catch (err) {
      // Fallback nếu backend chỉ hỗ trợ POST null
      try {
        await api.post('/game-activity/playing', { gameId: null });
      } catch (err2) {
        console.error('Lỗi khi xoá trạng thái game:', err2);
        return;
      }
    } finally {
      await fetchUser();
      setEditing(true);
    }
  };

  return (
    <div className="game-activity">
      {user?.currentGame && !editing && (
        <div className="currently-playing">
          {user.currentGame.boxArtUrl ? (
            <img
              className="cover"
              src={user.currentGame.boxArtUrl}
              alt={user.currentGame.name}
            />
          ) : (
            <div className="cover cover-fallback" />
          )}

          <div className="info">
            <div className="top">
              <strong className="name" title={user.currentGame.name}>
                {user.currentGame.name}
              </strong>
              <button className="btn-link" onClick={() => setEditing(true)}>
                Đổi
              </button>
            </div>
          </div>

          <button
            aria-label="Xoá game đang chơi"
            className="clear-btn"
            onClick={handleClearPlaying}
          >
            ×
          </button>
        </div>
      )}

      {(!user?.currentGame || editing) && (
        <div className="game-search" aria-busy={isSearching}>
          <input
            type="text"
            placeholder="Bạn đang chơi game gì?"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />

          {isSearching && <div className="search-hint">Đang tìm...</div>}

          {!!results.length && (
            <div className="search-results">
              {results.map((game) => (
                <div
                  key={game.id}
                  className="search-result-item"
                  onClick={() => handleSetPlaying(game.id)}
                >
                  {game.cover?.image_id ? (
                    <img
                      src={`https://images.igdb.com/igdb/image/upload/t_cover_small/${game.cover.image_id}.jpg`}
                      alt={game.name}
                    />
                  ) : (
                    <div className="cover-fallback small" />
                  )}
                  <span>{game.name}</span>
                </div>
              ))}
            </div>
          )}

          {user?.currentGame && (
            <div className="search-actions">
              <button
                className="btn"
                onClick={() => {
                  setEditing(false);
                  setResults([]);
                  setSearchTerm('');
                }}
              >
                Huỷ
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GameActivity;
