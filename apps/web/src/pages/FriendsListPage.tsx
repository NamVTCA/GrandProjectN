import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { blockUser, unblockUser, getBlockStatus } from '../services/user';
import { useAuth } from '../features/auth/AuthContext';
import { publicUrl } from '../untils/publicUrl';
import './FriendsListPage.scss';

interface Friend {
  _id: string;
  username: string;
  fullName?: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: number;
}

const FriendsListPage: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blockStatus, setBlockStatus] = useState<Record<string, boolean>>({});
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const response = await api.get('/friends/list');
      const friendsData = response.data.friends || response.data;
      
      // Transform data to match our interface
      const formattedFriends = friendsData.map((friend: any) => ({
        _id: friend._id || friend.id,
        username: friend.username || friend.name,
        fullName: friend.fullName || friend.username,
        avatar: friend.avatar || friend.profilePicture,
        isOnline: friend.isOnline || false,
        lastSeen: friend.lastSeen
      }));
      
      setFriends(formattedFriends);
      
      // Fetch block status for each friend
      const blockStatusMap: Record<string, boolean> = {};
      for (const friend of formattedFriends) {
        try {
          const status = await getBlockStatus(friend._id);
          blockStatusMap[friend._id] = status.blockedByMe;
        } catch (err) {
          console.error(`Error fetching block status for ${friend._id}:`, err);
          blockStatusMap[friend._id] = false;
        }
      }
      setBlockStatus(blockStatusMap);
    } catch (err) {
      console.error('Error fetching friends:', err);
      setError('Failed to load friends list');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (friendId: string) => {
    try {
      await blockUser(friendId);
      setBlockStatus(prev => ({ ...prev, [friendId]: true }));
      // Show success notification
      alert('User blocked successfully');
    } catch (err) {
      console.error('Error blocking user:', err);
      alert('Failed to block user');
    }
  };

  const handleUnblockUser = async (friendId: string) => {
    try {
      await unblockUser(friendId);
      setBlockStatus(prev => ({ ...prev, [friendId]: false }));
      // Show success notification
      alert('User unblocked successfully');
    } catch (err) {
      console.error('Error unblocking user:', err);
      alert('Failed to unblock user');
    }
  };

  const handleUnfriend = async (friendId: string) => {
    if (!window.confirm('Are you sure you want to remove this friend?')) {
      return;
    }

    try {
      await api.delete(`/friends/${friendId}`);
      setFriends(prev => prev.filter(friend => friend._id !== friendId));
      // Show success notification
      alert('Friend removed successfully');
    } catch (err) {
      console.error('Error removing friend:', err);
      alert('Failed to remove friend');
    }
  };

  const handleChat = async (friendId: string, username: string, avatar?: string) => {
    // Emit event to open DM (handled by ChatPage)
    window.dispatchEvent(new CustomEvent('open-dm', {
      detail: { userId: friendId, username, avatar }
    }));
  };

  const handleViewProfile = (friendId: string, username: string) => {
    navigate(`/profile/${username || friendId}`);
  };

  if (loading) {
    return (
      <div className="friends-list-page">
        <div className="friends-header">
          <h2>Friends List</h2>
        </div>
        <div className="loading">Loading friends...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="friends-list-page">
        <div className="friends-header">
          <h2>Friends List</h2>
        </div>
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="friends-list-page">
      <div className="friends-header">
        <h2>Friends List</h2>
        <span className="friends-count">{friends.length} friends</span>
      </div>

      <div className="friends-list">
        {friends.length === 0 ? (
          <div className="no-friends">You don't have any friends yet.</div>
        ) : (
          friends.map(friend => (
            <div key={friend._id} className="friend-item">
              <div className="friend-info">
                <div className="friend-avatar">
                  <img 
                    src={friend.avatar ? publicUrl(friend.avatar) : '/images/default-user.png'} 
                    alt={friend.username}
                  />
                  <span className={`status-indicator ${friend.isOnline ? 'online' : 'offline'}`}></span>
                </div>
                <div className="friend-details">
                  <h3 className="friend-name">{friend.fullName}</h3>
                  <p className="friend-username">@{friend.username}</p>
                  <p className="friend-status">
                    {friend.isOnline ? 'Online' : `Last seen ${formatLastSeen(friend.lastSeen)}`}
                  </p>
                </div>
              </div>
              
              <div className="friend-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => handleChat(friend._id, friend.username, friend.avatar)}
                >
                  Chat
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleViewProfile(friend._id, friend.username)}
                >
                  Profile
                </button>
                {blockStatus[friend._id] ? (
                  <button
                    className="btn btn-warning"
                    onClick={() => handleUnblockUser(friend._id)}
                  >
                    Unblock
                  </button>
                ) : (
                  <button
                    className="btn btn-danger"
                    onClick={() => handleBlockUser(friend._id)}
                  >
                    Block
                  </button>
                )}
                <button
                  className="btn btn-danger"
                  onClick={() => handleUnfriend(friend._id)}
                >
                  Unfriend
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const formatLastSeen = (timestamp?: number): string => {
  if (!timestamp) return 'a long time ago';
  
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours < 24) return `${hours} hours ago`;
  return `${days} days ago`;
};

export default FriendsListPage;