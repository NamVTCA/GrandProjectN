import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Image, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../../auth/AuthContext';
import api from '../../../services/api';
import type { GameSearchResult } from '../types/Game';

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
      await api.delete('/game-activity/playing');
    } catch (err) {
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
    <View style={styles.container}>
      {user?.currentGame && !editing && (
        <View style={styles.currentlyPlaying}>
          {user.currentGame.boxArtUrl ? (
            <Image
              style={styles.cover}
              source={{ uri: user.currentGame.boxArtUrl }}
            />
          ) : (
            <View style={[styles.cover, styles.coverFallback]} />
          )}

          <View style={styles.info}>
            <View style={styles.top}>
              <Text style={styles.name} numberOfLines={1}>
                {user.currentGame.name}
              </Text>
              <TouchableOpacity onPress={() => setEditing(true)}>
                <Text style={styles.btnLink}>Đổi</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.clearBtn}
            onPress={handleClearPlaying}
          >
            <Text style={styles.clearBtnText}>×</Text>
          </TouchableOpacity>
        </View>
      )}

      {(!user?.currentGame || editing) && (
        <View style={styles.gameSearch}>
          <TextInput
            style={styles.input}
            placeholder="Bạn đang chơi game gì?"
            value={searchTerm}
            onChangeText={setSearchTerm}
            autoFocus
          />

          {isSearching && <Text style={styles.searchHint}>Đang tìm...</Text>}

          {!!results.length && (
            <ScrollView style={styles.searchResults}>
              {results.map((game) => (
                <TouchableOpacity
                  key={game.id}
                  style={styles.searchResultItem}
                  onPress={() => handleSetPlaying(game.id)}
                >
                  {game.cover?.image_id ? (
                    <Image
                      style={styles.smallCover}
                      source={{
                        uri: `https://images.igdb.com/igdb/image/upload/t_cover_small/${game.cover.image_id}.jpg`
                      }}
                    />
                  ) : (
                    <View style={[styles.coverFallback, styles.smallCoverFallback]} />
                  )}
                  <Text style={styles.gameName}>{game.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {user?.currentGame && (
            <View style={styles.searchActions}>
              <TouchableOpacity
                style={styles.btn}
                onPress={() => {
                  setEditing(false);
                  setResults([]);
                  setSearchTerm('');
                }}
              >
                <Text style={styles.btnText}>Huỷ</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  currentlyPlaying: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#2A2A35',
    borderRadius: 8,
    marginBottom: 16,
  },
  cover: {
    width: 48,
    height: 64,
    borderRadius: 4,
  },
  coverFallback: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnLink: {
    color: '#31D0AA',
    fontSize: 12,
    fontWeight: '600',
  },
  clearBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  gameSearch: {
    position: 'relative',
  },
  input: {
    width: '100%',
    backgroundColor: '#2A2A35',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
  },
  searchHint: {
    marginTop: 6,
    fontSize: 12,
    color: '#9AA0A6',
  },
  searchResults: {
    maxHeight: 300,
    marginTop: 8,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#2A2A35',
    borderRadius: 8,
    marginBottom: 8,
  },
  smallCover: {
    width: 32,
    height: 42,
    borderRadius: 4,
  },
  smallCoverFallback: {
    width: 32,
    height: 42,
    borderRadius: 4,
  },
  gameName: {
    marginLeft: 10,
    color: '#FFFFFF',
  },
  searchActions: {
    marginTop: 8,
  },
  btn: {
    padding: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
});

export default GameActivity;