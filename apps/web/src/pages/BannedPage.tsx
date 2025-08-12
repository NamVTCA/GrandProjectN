import React from "react";

const BannedPage: React.FC = () => {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      backgroundColor: "#f8d7da",
      color: "#721c24",
      fontFamily: "sans-serif"
    }}>
      <h1>🚫 Tài khoản của bạn đã bị khóa</h1>
      <p>Vui lòng liên hệ với quản trị viên nếu bạn nghĩ đây là nhầm lẫn.</p>
    </div>
  );
};

export default BannedPage;
