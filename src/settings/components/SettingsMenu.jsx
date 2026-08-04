import React, { useContext } from 'react';
import {
  Divider, List, ListSubheader, Tooltip,
} from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import PeopleIcon from '@mui/icons-material/People';
import TodayIcon from '@mui/icons-material/Today';
import HelpIcon from '@mui/icons-material/Help';
import CampaignIcon from '@mui/icons-material/Campaign';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import DevicesIcon from '@mui/icons-material/Devices';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import DriveFolderUploadIcon from '@mui/icons-material/DriveFolderUpload';
import CarRepairIcon from '@mui/icons-material/CarRepair';
import EngineeringIcon from '@mui/icons-material/Engineering';
import BeenhereIcon from '@mui/icons-material/Beenhere';
import DvrIcon from '@mui/icons-material/Dvr';
import DisplaySettingsIcon from '@mui/icons-material/DisplaySettings';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { PageLayoutMiniContext } from '../../common/components/PageLayout';
import {
  useAdministrator, useManager, useRestriction,
} from '../../common/util/permissions';
import useFeatures from '../../common/util/useFeatures';
import MenuItem from '../../common/components/MenuItem';

const sectionHeaderSx = {
  backgroundColor: 'transparent',
  color: 'rgba(0, 0, 0, 0.58)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  lineHeight: '28px',
  px: 2,
  textTransform: 'uppercase',
};

const SettingsSection = ({ mini, title, children }) => (
  <>
    {!mini && (
      <ListSubheader component="div" disableSticky sx={sectionHeaderSx}>
        {title}
      </ListSubheader>
    )}
    {children}
  </>
);

const SettingsMenu = () => {
  const t = useTranslation();
  const location = useLocation();
  const mini = useContext(PageLayoutMiniContext);

  const readonly = useRestriction('readonly');
  const admin = useAdministrator();
  const manager = useManager();
  const userId = useSelector((state) => state.session.user.id);
  const supportLink = useSelector((state) => state.session.server.attributes.support);

  const features = useFeatures();

  const accountPath = `/settings/user/${userId}`;
  const accountSelected = location.pathname === accountPath
    || location.pathname.startsWith(`${accountPath}/`);
  const usersSelected = location.pathname.startsWith('/settings/user') && !accountSelected;

  const label = (key, fallback) => t(key) || fallback;

  return (
    <div style={{ overflow: 'auto', overflowX: 'hidden', color: 'black' }}>
      <List
        disablePadding
        sx={{
          '& .MuiListItemButton-root': { minHeight: 42, px: 2 },
          '& .MuiListItemIcon-root': { minWidth: 42 },
        }}
      >
        <SettingsSection mini={mini} title={label('settingsSectionPersonal', 'Personal')}>
          <MenuItem
            title={label('settingsDisplayMap', t('sharedPreferences'))}
            link="/settings/preferences"
            icon={<Tooltip title={label('settingsDisplayMap', t('sharedPreferences'))}><DisplaySettingsIcon sx={{ color: 'black' }} /></Tooltip>}
            selected={location.pathname === '/settings/preferences'}
          />
          {!readonly && (
            <MenuItem
              title={t('settingsUser')}
              link={accountPath}
              icon={<Tooltip title={t('settingsUser')}><PeopleOutlineIcon sx={{ color: 'black' }} /></Tooltip>}
              selected={accountSelected}
            />
          )}
        </SettingsSection>

        {!readonly && (
          <SettingsSection mini={mini} title={label('settingsSectionOperations', 'Operations')}>
            <MenuItem
              title={t('deviceTitle')}
              link="/settings/devices"
              icon={<Tooltip title={t('deviceTitle')}><DevicesIcon sx={{ color: 'black' }} /></Tooltip>}
              selected={location.pathname.startsWith('/settings/device')}
            />
            <MenuItem
              title={label('settingsNotificationRules', t('sharedNotifications'))}
              link="/settings/notifications"
              icon={<Tooltip title={label('settingsNotificationRules', t('sharedNotifications'))}><NotificationsNoneIcon sx={{ color: 'black' }} /></Tooltip>}
              selected={location.pathname.startsWith('/settings/notification')}
            />
            <MenuItem
              title={t('sharedGeofences')}
              link="/geofences"
              icon={<Tooltip title={t('sharedGeofences')}><DriveFileRenameOutlineIcon sx={{ color: 'black' }} /></Tooltip>}
              selected={location.pathname === '/geofences' || location.pathname.startsWith('/settings/geofence')}
            />
            {!features.disableGroups && (
              <MenuItem
                title={t('settingsGroups')}
                link="/settings/groups"
                icon={<Tooltip title={t('settingsGroups')}><DriveFolderUploadIcon sx={{ color: 'black' }} /></Tooltip>}
                selected={location.pathname.startsWith('/settings/group')}
              />
            )}
            {!features.disableDrivers && (
              <MenuItem
                title={t('sharedDrivers')}
                link="/settings/drivers"
                icon={<Tooltip title={t('sharedDrivers')}><CarRepairIcon sx={{ color: 'black' }} /></Tooltip>}
                selected={location.pathname.startsWith('/settings/driver')}
              />
            )}
            {!features.disableMaintenance && (
              <MenuItem
                title={t('sharedMaintenance')}
                link="/settings/maintenances"
                icon={<Tooltip title={t('sharedMaintenance')}><EngineeringIcon sx={{ color: 'black' }} /></Tooltip>}
                selected={location.pathname.startsWith('/settings/maintenance')}
              />
            )}
          </SettingsSection>
        )}

        {!readonly && (
          <SettingsSection mini={mini} title={label('settingsSectionAdvanced', 'Advanced')}>
            {!features.disableCalendars && (
              <MenuItem
                title={t('sharedCalendars')}
                link="/settings/calendars"
                icon={<Tooltip title={t('sharedCalendars')}><TodayIcon sx={{ color: 'black' }} /></Tooltip>}
                selected={location.pathname.startsWith('/settings/calendar')}
              />
            )}
            {!features.disableComputedAttributes && (
              <MenuItem
                title={t('sharedComputedAttributes')}
                link="/settings/attributes"
                icon={<Tooltip title={t('sharedComputedAttributes')}><StorageIcon sx={{ color: 'black' }} /></Tooltip>}
                selected={location.pathname.startsWith('/settings/attribute')}
              />
            )}
            {!features.disableSavedCommands && (
              <MenuItem
                title={t('sharedSavedCommands')}
                link="/settings/commands"
                icon={<Tooltip title={t('sharedSavedCommands')}><BeenhereIcon sx={{ color: 'black' }} /></Tooltip>}
                selected={location.pathname.startsWith('/settings/command')}
              />
            )}
            {supportLink && (
              <MenuItem
                title={t('settingsSupport')}
                link={supportLink}
                icon={<Tooltip title={t('settingsSupport')}><HelpIcon sx={{ color: 'black' }} /></Tooltip>}
              />
            )}
          </SettingsSection>
        )}

        {manager && (
          <>
            <Divider sx={{ my: 0.5 }} />
            <SettingsSection mini={mini} title={label('settingsSectionAdministration', 'Administration')}>
              <MenuItem
                title={t('settingsUsers')}
                link="/settings/users"
                icon={<Tooltip title={t('settingsUsers')}><PeopleIcon sx={{ color: 'black' }} /></Tooltip>}
                selected={usersSelected}
              />
              <MenuItem
                title={label('settingsSystemAnnouncement', t('serverAnnouncement'))}
                link="/settings/announcement"
                icon={<Tooltip title={label('settingsSystemAnnouncement', t('serverAnnouncement'))}><CampaignIcon sx={{ color: 'black' }} /></Tooltip>}
                selected={location.pathname === '/settings/announcement'}
              />
              {admin && (
                <MenuItem
                  title={t('settingsServer')}
                  link="/settings/server"
                  icon={<Tooltip title={t('settingsServer')}><DvrIcon sx={{ color: 'black' }} /></Tooltip>}
                  selected={location.pathname === '/settings/server'}
                />
              )}
            </SettingsSection>
          </>
        )}

        <Divider sx={{ my: 0.5 }} />
        <button
          type="button"
          onClick={() => localStorage.setItem('miniDrawer', 'false')}
          style={{ background: 'none', border: 'none', padding: 0, width: '100%' }}
        >
          <MenuItem
            title={t('exit')}
            link="/"
            icon={<Tooltip title={t('exit')}><CloseIcon sx={{ color: 'black' }} /></Tooltip>}
          />
        </button>
      </List>
    </div>
  );
};

export default SettingsMenu;
