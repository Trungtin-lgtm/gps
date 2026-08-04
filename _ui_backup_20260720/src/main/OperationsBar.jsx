import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Avatar, InputAdornment, OutlinedInput, Paper, Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const OperationsBar = ({ keyword, setKeyword, resultCount }) => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.session.user);

  return (
    <Paper className="operations-header-bar" elevation={0}>
      <OutlinedInput
        className="operations-device-search"
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        placeholder="Tìm kiếm thiết bị GPS..."
        inputProps={{ 'aria-label': 'Tìm kiếm thiết bị GPS' }}
        size="small"
        startAdornment={(
          <InputAdornment position="start">
            <SearchIcon fontSize="small" />
          </InputAdornment>
        )}
        endAdornment={(
          <InputAdornment position="end">
            <span className="operations-search-count">{resultCount} thiết bị</span>
          </InputAdornment>
        )}
      />

      <button
        type="button"
        className="operations-account"
        onClick={() => navigate(`/settings/user/${user.id}`)}
      >
        <Avatar>{(user.name || user.email || 'A').charAt(0).toUpperCase()}</Avatar>
        <span>
          <Typography className="operations-account-name" noWrap>{user.name || 'Tài khoản'}</Typography>
          <Typography className="operations-account-email" noWrap>{user.email || user.login}</Typography>
        </span>
      </button>

      <img className="operations-brand-logo" src="/aipt-group-logo.png" alt="AIPT Group" />
    </Paper>
  );
};

export default OperationsBar;
