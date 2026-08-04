import React, { useState } from 'react';
import {
  Table, TableRow, TableCell, TableHead, TableBody,
  useTheme,
} from '@mui/material';
import { useEffectAsync } from '../reactHelper';
import { useTranslation } from '../common/components/LocalizationProvider';
import { formatBoolean } from '../common/util/formatter';
import { prefixString } from '../common/util/stringUtils';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import CollectionFab from './components/CollectionFab';
import CollectionActions from './components/CollectionActions';
import TableShimmer from '../common/components/TableShimmer';
import SearchHeader, { filterByKeyword } from './components/SearchHeader';
import { useRestriction } from '../common/util/permissions';
import useSettingsStyles from './common/useSettingsStyles';

const CommandsPage = () => {
  const classes = useSettingsStyles();
  const t = useTranslation();

  const [timestamp, setTimestamp] = useState(Date.now());
  const [items, setItems] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const limitCommands = useRestriction('limitCommands');
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  useEffectAsync(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/commands');
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
      breadcrumbs={["settingsTitle", "sharedSavedCommands"]}
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
            <TableCell>{t("sharedDescription")}</TableCell>
            <TableCell>{t("sharedType")}</TableCell>
            <TableCell>{t("commandSendSms")}</TableCell>
            {!limitCommands && <TableCell className={classes.columnAction} />}
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
                <TableCell>{item.description}</TableCell>
                <TableCell>{t(prefixString("command", item.type))}</TableCell>
                <TableCell>{formatBoolean(item.textChannel, t)}</TableCell>
                {!limitCommands && (
                  <TableCell className={classes.columnAction} padding="none">
                    <CollectionActions
                      itemId={item.id}
                      editPath="/settings/command"
                      endpoint="commands"
                      setTimestamp={setTimestamp}
                    />
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : (
            <TableShimmer columns={limitCommands ? 3 : 4} endAction />
          )}
        </TableBody>
      </Table>
      <CollectionFab editPath="/settings/command" disabled={limitCommands} />
    </PageLayout>
  );
};

export default CommandsPage;
