import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, TableRow, TableCell, TableHead, TableBody, Switch, TableFooter, FormControlLabel,
  useTheme,
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import LinkIcon from '@mui/icons-material/Link';
import { useCatch, useEffectAsync } from '../reactHelper';
import { formatBoolean, formatTime } from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import CollectionFab from './components/CollectionFab';
import CollectionActions from './components/CollectionActions';
import TableShimmer from '../common/components/TableShimmer';
import { useManager } from '../common/util/permissions';
import SearchHeader, { filterByKeyword } from './components/SearchHeader';
import useSettingsStyles from './common/useSettingsStyles';

const UsersPage = () => {
  const classes = useSettingsStyles();
  const navigate = useNavigate();
  const t = useTranslation();

  const manager = useManager();

  const [timestamp, setTimestamp] = useState(Date.now());
  const [items, setItems] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [temporary, setTemporary] = useState(false);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const handleLogin = useCatch(async (userId) => {
    const response = await fetch(`/api/session/${userId}`);
    if (response.ok) {
      window.location.replace('/');
    } else {
      throw Error(await response.text());
    }
  });

  const actionLogin = {
    key: 'login',
    title: t('loginLogin'),
    icon: <LoginIcon fontSize="small" />,
    handler: handleLogin,
  };

  const actionConnections = {
    key: 'connections',
    title: t('sharedConnections'),
    icon: <LinkIcon fontSize="small" />,
    handler: (userId) => navigate(`/settings/user/${userId}/connections`),
  };

  useEffectAsync(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        setItems(await response.json());
      } else {
        throw Error(await response.text());
      }
    } finally {
      setLoading(false);
    }
  }, [timestamp]);

  return (
    <PageLayout
      menu={<SettingsMenu />}
      breadcrumbs={["settingsTitle", "settingsUsers"]}
    >
      <SearchHeader keyword={searchKeyword} setKeyword={setSearchKeyword} />
      <Table
        className={classes.table}
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
            <TableCell>{t("sharedName")}</TableCell>
            <TableCell>{t("userEmail")}</TableCell>
            <TableCell>{t("userAdmin")}</TableCell>
            <TableCell>{t("sharedDisabled")}</TableCell>
            <TableCell>{t("userExpirationTime")}</TableCell>
            <TableCell className={classes.columnAction} />
          </TableRow>
        </TableHead>
        <TableBody>
          {!loading ? (
            items
              .filter((u) => temporary || !u.temporary)
              .filter(filterByKeyword(searchKeyword))
              .map((item, index) => (
                <TableRow
                  key={item.id}
                  hover
                  sx={{
                    transition: "background-color 0.25s ease",
                    backgroundColor: index % 2 === 0
                      ? isDarkMode ? '#2c2c2c' : '#f9fbfc'
                      : isDarkMode ? '#1e1e1e' : '#eef9f3',
                    "&:hover": {
                      backgroundColor: isDarkMode ? '#1a1a1a' : '#ffe0b2',
                    },
                  }}
                >
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.email}</TableCell>
                  <TableCell>{formatBoolean(item.administrator, t)}</TableCell>
                  <TableCell>{formatBoolean(item.disabled, t)}</TableCell>
                  <TableCell>
                    {formatTime(item.expirationTime, "date")}
                  </TableCell>
                  <TableCell className={classes.columnAction} padding="none">
                    <CollectionActions
                      itemId={item.id}
                      editPath="/settings/user"
                      endpoint="users"
                      setTimestamp={setTimestamp}
                      customActions={
                        manager
                          ? [actionLogin, actionConnections]
                          : [actionConnections]
                      }
                    />
                  </TableCell>
                </TableRow>
              ))
          ) : (
            <TableShimmer columns={6} endAction />
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={6} align="right">
              <FormControlLabel
                control={
                  <Switch
                    value={temporary}
                    onChange={(e) => setTemporary(e.target.checked)}
                    size="small"
                  />
                }
                label={t("userTemporary")}
                labelPlacement="start"
              />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
      <CollectionFab editPath="/settings/user" />
    </PageLayout>
  );
};

export default UsersPage;
