import React from 'react';
import {
  Modal,
  Box,
  Typography,
  Button,
  Fade,
  Backdrop,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useTranslation } from './LocalizationProvider';
import { useCatch } from '../../reactHelper';

const useStyles = makeStyles((theme) => ({
  modalBox: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.spacing(2),
    boxShadow: theme.shadows[5],
    padding: theme.spacing(4),
    width: '90%',
    maxWidth: 400,
    outline: 'none',
  },
  buttons: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: theme.spacing(3),
    gap: theme.spacing(2),
  },
}));

const RemoveDialog = ({
  open, endpoint, itemId, onResult,
}) => {
  const classes = useStyles();
  const t = useTranslation();

  const handleRemove = useCatch(async () => {
    const response = await fetch(`/api/${endpoint}/${itemId}`, { method: 'DELETE' });
    if (response.ok) {
      onResult(true);
    } else {
      throw Error(await response.text());
    }
  });

  return (
    <Modal
      open={open}
      onClose={() => onResult(false)}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{ timeout: 300 }}
    >
      <Fade in={open}>
        <Box className={classes.modalBox}>
          <Typography variant="h6" component="h2" gutterBottom>
            {t('sharedRemoveConfirm')}
          </Typography>
          <Box className={classes.buttons}>
            <Button variant="outlined" onClick={() => onResult(false)}>
              {t('sharedCancel')}
            </Button>
            <Button variant="contained" color="error" onClick={handleRemove}>
              {t('sharedRemove')}
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default RemoveDialog;
