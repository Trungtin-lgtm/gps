import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Table, TableRow, TableCell, TableHead, TableBody, IconButton, Tooltip,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import { sessionActions } from '../store';

const useStyles = makeStyles((theme) => ({
  columnAction: {
    width: '1%',
    paddingLeft: theme.spacing(1),
  },
}));

const LogsPage = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useTranslation();

  useEffect(() => {
    dispatch(sessionActions.enableLogs(true));
    return () => dispatch(sessionActions.enableLogs(false));
  }, []);

  const items = useSelector((state) => state.session.logs);

  const registerDevice = (uniqueId) => {
    const query = new URLSearchParams({ uniqueId });
    navigate(`/settings/device?${query.toString()}`);
  };

  return (
    <PageLayout
      menu={<ReportsMenu />}
      breadcrumbs={["reportTitle", "sharedLogs"]}
    >
      <Table
        sx={{
          minWidth: 650,
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          "& .MuiTableCell-root": {
            padding: "12px 16px",
            fontSize: "14px",
            borderBottom: "1px solid #e0e0e0",
          },
        }}
      >
        <TableHead
          sx={{
            background: "linear-gradient(90deg, #3c8dbc 0%, #5dade2 100%)",
            "& .MuiTableCell-root": {
              fontWeight: "bold",
              color: "#fff",
            },
          }}
        >
          <TableRow>
            <TableCell className={classes.columnAction} />
            <TableCell>{t("deviceIdentifier")}</TableCell>
            <TableCell>{t("positionProtocol")}</TableCell>
            <TableCell>{t("commandData")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item, index) => (
            /* eslint-disable react/no-array-index-key */ 
            <TableRow
              key={index}
              hover
              sx={{
                transition: "background-color 0.25s ease",
                backgroundColor: index % 2 === 0 ? "#f9fbfc" : "#eef9f3",
                "&:hover": {
                  backgroundColor: "#ffe0b2",
                },
              }}
            >
              <TableCell className={classes.columnAction} padding="none">
                {item.deviceId ? (
                  <IconButton color="success" size="small" disabled>
                    <CheckCircleOutlineIcon fontSize="small" />
                  </IconButton>
                ) : (
                  <Tooltip title={t("loginRegister")}>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => registerDevice(item.uniqueId)}
                    >
                      <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </TableCell>
              <TableCell>{item.uniqueId}</TableCell>
              <TableCell>{item.protocol}</TableCell>
              <TableCell>{item.data}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </PageLayout>
  );
};

export default LogsPage;
