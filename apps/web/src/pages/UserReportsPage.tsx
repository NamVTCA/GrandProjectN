import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './UserReportsPage.scss';
import api from '../services/api';

interface Report {
  _id: string;
  type: string;
  reason: string;
  createdAt: string;
  reporter: {
    username: string;
    avatar: string;
  };
}

const UserReportsPage: React.FC = () => {
  const { userId } = useParams();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get<Report[]>(`/reports/target/${userId}`);
        setReports(res.data);
      } catch (err) {
        console.error('Error fetching reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [userId]);

  if (loading) return <p>Đang tải...</p>;

  if (reports.length === 0) return <p>Không có báo cáo nào cho người dùng này.</p>;

  return (
    <div className="user-reports">
      <h2>Báo cáo về người dùng</h2>
      {reports.map(report => (
        <div className="report-item" key={report._id}>
          <div className="report-header">
            <img src={report.reporter.avatar} alt="avatar" className="avatar" />
            <span>@{report.reporter.username}</span>
            <span className="type">({report.type})</span>
            <span className="time">{new Date(report.createdAt).toLocaleString()}</span>
          </div>
          <div className="report-reason">{report.reason}</div>
        </div>
      ))}
    </div>
  );
};

export default UserReportsPage;
