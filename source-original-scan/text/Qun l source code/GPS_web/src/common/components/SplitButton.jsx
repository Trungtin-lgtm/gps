import React, { useRef, useState } from 'react';
import {
  Button, ButtonGroup, Menu, MenuItem, Typography,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

const SplitButton = ({
  fullWidth, variant, color, disabled, onClick, options, selected, setSelected,
}) => {
  const anchorRef = useRef();
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  return (
    <>
      <ButtonGroup fullWidth={fullWidth} sx={{ height: '100%',border:'none'}} variant={variant} color={color} ref={anchorRef}>
        <button style={{width: '80%', height: '100%', border:'none'}} disabled={disabled} onClick={() => onClick(selected)}>
          <Typography variant="button" noWrap>{options[selected]}</Typography>
        </button>
        <button style={{width: '20%', height: '100%', border:'none'}} onClick={() => setMenuAnchorEl(anchorRef.current)}>
          <ArrowDropDownIcon />
        </button>
      </ButtonGroup>
      <Menu
        open={!!menuAnchorEl}
        anchorEl={menuAnchorEl}
        onClose={() => setMenuAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        {Object.entries(options).map(([key, value]) => (
          <MenuItem
            key={key}
            onClick={() => {
              setSelected(key);
              setMenuAnchorEl(null);
            }}
          >
            {value}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default SplitButton;
