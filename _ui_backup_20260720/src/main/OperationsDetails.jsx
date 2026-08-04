import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button, Divider, IconButton, Stack, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EditIcon from '@mui/icons-material/Edit';
import { devicesActions } from '../store';
import PositionValue from '../common/components/PositionValue';
import { useDeviceReadonly } from '../common/util/permissions';

const InfoRow = ({ label, children }) => (
  <div className="operation-detail-row">
    <Typography variant="caption">{label}</Typography>
    <div>{children || '—'}</div>
  </div>
);

const OperationsDetails = ({ deviceId, position }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const readonly = useDeviceReadonly();
  const device = useSelector((state) => state.devices.items[deviceId]);

  if (!device) {
    return (
      <div className="operation-detail-empty">
        <InfoOutlinedIcon />
        <Typography>Chọn một thiết bị để xem thông tin</Typography>
      </div>
    );
  }

  const battery = position?.attributes?.batteryLevel;
  return (
    <div className="operation-detail-content">
      <div className="operation-detail-heading">
        <div>
          <Typography variant="h6" noWrap>{device.name}</Typography>
          <span className={`operation-status operation-status-${device.status}`}>{device.status === 'online' ? 'Online' : 'Offline'}</span>
        </div>
        <IconButton size="small" onClick={() => dispatch(devicesActions.selectId(null))}><CloseIcon /></IconButton>
      </div>
      <Divider />
      <div className="operation-detail-fields">
        <InfoRow label="Định danh"><Typography variant="body2">{device.uniqueId}</Typography></InfoRow>
        <InfoRow label="Cập nhật">
          {position && <PositionValue position={position} property="fixTime" />}
        </InfoRow>
        <InfoRow label="Pin"><Typography variant="body2">{Number.isFinite(battery) ? `${battery}%` : '—'}</Typography></InfoRow>
        <InfoRow label="GPS">
          <Typography variant="body2">{position ? `${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}` : '—'}</Typography>
        </InfoRow>
        <InfoRow label="Tốc độ">{position && <PositionValue position={position} property="speed" />}</InfoRow>
        <InfoRow label="Địa chỉ">{position && <PositionValue position={position} property="address" />}</InfoRow>
        <InfoRow label="Quãng đường">{position && <PositionValue position={position} attribute="totalDistance" />}</InfoRow>
      </div>
      <Divider />
      <Stack className="operation-detail-actions" spacing={0.75} sx={{ p: 1.5 }}>
        <Button startIcon={<InfoOutlinedIcon />} onClick={() => position && navigate(`/position/${position.id}`)} disabled={!position}>Chi tiết</Button>
        {!readonly && <Button startIcon={<EditIcon />} onClick={() => navigate(`/settings/device/${deviceId}`)}>Chỉnh sửa</Button>}
      </Stack>
    </div>
  );
};

export default OperationsDetails;
