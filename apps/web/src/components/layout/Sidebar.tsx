import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaUsers,
  FaComments,
  FaStore,
  FaBoxOpen,
  FaSignOutAlt,
} from "react-icons/fa";
import { useAuth } from "../../features/auth/AuthContext";
import UserAvatar from "../common/UserAvatar";
import UnreadBadge from "../../features/chat/components/UnreadBadge";
import "./Sidebar.scss";

// Kiểu cho sự kiện tổng chưa đọc
declare global {
  interface WindowEventMap {
    "chat-unread-total": CustomEvent<{ total: number }>;
  }
}

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const [chatTotalUnread, setChatTotalUnread] = useState(0);

  // Lắng nghe tổng chưa đọc do ChatPage dispatch
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ total: number }>;
      setChatTotalUnread(ce.detail?.total ?? 0);
    };
    window.addEventListener("chat-unread-total", handler);
    return () => window.removeEventListener("chat-unread-total", handler);
  }, []);

  const navItems = [
    { path: "/", label: "Trang chủ", icon: <FaHome /> },
    { path: "/groups", label: "Nhóm", icon: <FaUsers /> },
    { path: "/chat", label: "Chat", icon: <FaComments />, showChatBadge: true },
    { path: "/shop", label: "Cửa hàng", icon: <FaStore /> },
    { path: "/inventory", label: "Kho đồ", icon: <FaBoxOpen /> },
  ];

  const profilePath = (user as any)?.username
    ? `/profile/${(user as any).username}`
    : "/profile";

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="logo">
          <h1>Grand</h1>
        </div>

        <nav className="main-nav">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? "active" : ""}`
                  }
                  end
                >
                  <span className="icon">{item.icon}</span>
                  <span className="label nav-label-with-badge">
                    {item.label}
                    {item.showChatBadge && (
                      <UnreadBadge
                        count={chatTotalUnread}
                        className="badge-space" // SCSS margin-left
                        // dot  // bật nếu muốn chỉ chấm đỏ
                        size="md"
                      />
                    )}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="sidebar-footer">
        {user && (
          <NavLink to={profilePath} className="user-profile-link">
            <UserAvatar
              size={32}
              src={
                (user as any)?.avatarUrl ||
                (user as any)?.avatar ||
                (user as any)?.avatar_url
              }
            />
            <span className="username">
              {(user as any)?.username || "User"}
            </span>
          </NavLink>
        )}
        <button
          onClick={logout}
          className="logout-button"
          title="Đăng xuất"
          aria-label="Đăng xuất"
        >
          <FaSignOutAlt />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
