import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, TableRow, TableCell, TableHead, TableBody,
  useTheme,
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import PublishIcon from '@mui/icons-material/Publish';
import { useEffectAsync } from '../reactHelper';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import CollectionFab from './components/CollectionFab';
import CollectionActions from './components/CollectionActions';
import TableShimmer from '../common/components/TableShimmer';
import SearchHeader, { filterByKeyword } from './components/SearchHeader';
import { useRestriction } from '../common/util/permissions';
import useSettingsStyles from './common/useSettingsStyles';

const GroupsPage = () => {
  const classes = useSettingsStyles();
  const navigate = useNavigate();
  const t = useTranslation();

  const limitCommands = useRestriction('limitCommands');

  const [timestamp, setTimestamp] = useState(Date.now());
  const [items, setItems] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  useEffectAsync(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/groups');
      if (response.ok) {
        setItems(await response.json());
      } else {
        throw Error(await response.text());
      }
    } finally {
      setLoading(false);
    }
  }, [timestamp]);

  const actionCommand = {
    key: 'command',
    title: t('deviceCommand'),
    icon: <PublishIcon fontSize="small" />,
    handler: (groupId) => navigate(`/settings/group/${groupId}/command`),
  };

  const actionConnections = {
    key: 'connections',
    title: t('sharedConnections'),
    icon: <LinkIcon fontSize="small" />,
    handler: (groupId) => navigate(`/settings/group/${groupId}/connections`),
  };

  return (
    <PageLayout
      menu={<SettingsMenu />}
      breadcrumbs={["settingsTitle", "settingsGroups"]}
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
                <TableCell className={classes.columnAction} padding="none">
                  <CollectionActions
                    itemId={item.id}
                    editPath="/settings/group"
                    endpoint="groups"
                    setTimestamp={setTimestamp}
                    customActions={
                      limitCommands
                        ? [actionConnections]
                        : [actionConnections, actionCommand]
                    }
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableShimmer columns={2} endAction />
          )}
        </TableBody>
      </Table>
      <CollectionFab editPath="/settings/group" />
    </PageLayout>
  );
};

export default GroupsPage;
