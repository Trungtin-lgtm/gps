import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import FenceIcon from '@mui/icons-material/Fence';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AssessmentIcon from '@mui/icons-material/Assessment';

const OperationsFooter = ({ onEventsClick }) => {
  const navigate = useNavigate();
  return (
    <footer className="dashboard-footer">
      <Button startIcon={<ReplayIcon />} onClick={() => navigate('/replay')}>Phát lại hành trình</Button>
      <Button startIcon={<NotificationsActiveIcon />} onClick={onEventsClick}>Sự kiện</Button>
      <Button startIcon={<FenceIcon />} onClick={() => navigate('/geofences')}>Geofence</Button>
      <Button startIcon={<ReceiptLongIcon />} onClick={() => navigate('/reports/logs')}>Nhật ký</Button>
      <Button startIcon={<AssessmentIcon />} onClick={() => navigate('/reports/summary')}>Báo cáo</Button>
    </footer>
  );
};

export default OperationsFooter;
