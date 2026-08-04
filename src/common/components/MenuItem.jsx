import makeStyles from '@mui/styles/makeStyles';
import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { Link } from 'react-router-dom';
import React, { useContext } from 'react';
import { PageLayoutMiniContext } from './PageLayout';

const useStyles = makeStyles(() => ({
  menuItemText: {
    whiteSpace: 'nowrap',
  },
}));

const MenuItem = ({
  title, link, icon, selected, compact = false, railAligned = false, onClick,
}) => {
  const classes = useStyles();
  const mini = useContext(PageLayoutMiniContext);
  const compactMode = compact || mini;
  let itemSx;
  let iconSx;

  if (compactMode) {
    itemSx = { minHeight: 54, px: 0, justifyContent: 'center' };
    iconSx = { minWidth: 0, justifyContent: 'center' };
  } else if (railAligned) {
    itemSx = { minHeight: 54, px: 2, justifyContent: 'flex-start' };
    iconSx = { minWidth: 48, justifyContent: 'center' };
  }

  return (
    <ListItemButton
      key={link}
      component={Link}
      to={link}
      selected={selected}
      onClick={onClick}
      sx={itemSx}
    >
      <ListItemIcon sx={iconSx}>
        {icon}
      </ListItemIcon>
      {!compactMode && <ListItemText primary={title} className={classes.menuItemText} />}
    </ListItemButton>
  );
};

export default MenuItem;
