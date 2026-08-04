import React from 'react';
import { Paper } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100vh',
    width: '100vw',
    // backgroundImage: 'url("/background.mp4")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  videoBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover', // scale vừa khung hình, giữ tỉ lệ
    zIndex: 0,
    filter: 'blur(0px) brightness(0.6)',
  },
  container: {
    position: 'relative',
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: theme.spacing(6),
    borderRadius: theme.spacing(2),
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 0 20px rgba(0,0,0,0.3)',
    textAlign: 'center',
  },
  form: {
    marginTop: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
}));

const LoginLayout = ({ children }) => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <video autoPlay muted loop playsInline className={classes.videoBg}>
        <source src="/background.mp4" type="video/mp4" />
      </video>
      <Paper className={classes.container}>
        {children}
      </Paper>
    </div>
  );
};

export default LoginLayout;
