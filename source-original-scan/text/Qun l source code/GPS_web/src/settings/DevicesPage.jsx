import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Table, TableRow, TableCell, TableHead, TableBody, Button, TableFooter, FormControlLabel, Switch,
  useTheme,
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import { useEffectAsync } from '../reactHelper';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import CollectionFab from './components/CollectionFab';
import CollectionActions from './components/CollectionActions';
import TableShimmer from '../common/components/TableShimmer';
import SearchHeader, { filterByKeyword } from './components/SearchHeader';
import { formatTime } from '../common/util/formatter';
import { useDeviceReadonly, useManager } from '../common/util/permissions';
import useSettingsStyles from './common/useSettingsStyles';
import DeviceUsersValue from './components/DeviceUsersValue';
import usePersistedState from '../common/util/usePersistedState';

const DevicesPage = () => {
  const classes = useSettingsStyles();
  const navigate = useNavigate();
  const t = useTranslation();

  const groups = useSelector((state) => state.groups.items);

  const manager = useManager();
  const deviceReadonly = useDeviceReadonly();

  const [timestamp, setTimestamp] = useState(Date.now());
  const [items, setItems] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showAll, setShowAll] = usePersistedState('showAllDevices', false);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  useEffectAsync(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ all: showAll });
      const response = await fetch(`/api/devices?${query.toString()}`);
      if (response.ok) {
        setItems(await response.json());
      } else {
        throw Error(await response.text());
      }
    } finally {
      setLoading(false);
    }
  }, [timestamp, showAll]);

  const handleExport = () => {
    window.location.assign('/api/reports/devices/xlsx');
  };

  const actionConnections = {
    key: 'connections',
    title: t('sharedConnections'),
    icon: <LinkIcon fontSize="small" />,
    handler: (deviceId) => navigate(`/settings/device/${deviceId}/connections`),
  };

  return (
    <PageLayout
      menu={<SettingsMenu />}
      breadcrumbs={["settingsTitle", "deviceTitle"]}
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
            <TableCell>{t("deviceIdentifier")}</TableCell>
            <TableCell>{t("groupParent")}</TableCell>
            <TableCell>{t("sharedPhone")}</TableCell>
            <TableCell>{t("deviceModel")}</TableCell>
            <TableCell>{t("deviceContact")}</TableCell>
            <TableCell>{t("userExpirationTime")}</TableCell>
            {manager && <TableCell>{t("settingsUsers")}</TableCell>}
            <TableCell className={classes.columnAction} />
          </TableRow>
        </TableHead>
        <TableBody>
          {!loading ? (
            items.filter(filterByKeyword(searchKeyword)).map((item, index) => (
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
                <TableCell>{item.uniqueId}</TableCell>
                <TableCell>
                  {item.groupId ? groups[item.groupId]?.name : null}
                </TableCell>
                <TableCell>{item.phone}</TableCell>
                <TableCell>{item.model}</TableCell>
                <TableCell>{item.contact}</TableCell>
                <TableCell>{formatTime(item.expirationTime, "date")}</TableCell>
                {manager && (
                  <TableCell>
                    <DeviceUsersValue deviceId={item.id} />
                  </TableCell>
                )}
                <TableCell className={classes.columnAction} padding="none">
                  <CollectionActions
                    itemId={item.id}
                    editPath="/settings/device"
                    endpoint="devices"
                    setTimestamp={setTimestamp}
                    customActions={[actionConnections]}
                    readonly={deviceReadonly}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableShimmer columns={manager ? 8 : 7} endAction />
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>
              <Button onClick={handleExport} variant="text">
                {t("reportExport")}
              </Button>
            </TableCell>
            <TableCell colSpan={manager ? 8 : 7} align="right">
              <FormControlLabel
                control={
                  <Switch
                    checked={showAll}
                    onChange={(e) => setShowAll(e.target.checked)}
                    size="small"
                  />
                }
                label={t("notificationAlways")}
                labelPlacement="start"
                disabled={!manager}
              />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
      <CollectionFab editPath="/settings/device" />
    </PageLayout>
  );
};

export default DevicesPage;
