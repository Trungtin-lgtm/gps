import React, { useState } from 'react';
import {
  FormControl, InputLabel, Select, MenuItem, Button, TextField, Typography,
  useTheme,
  useMediaQuery,
  Paper,
  Toolbar,
  IconButton,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { useTranslation } from '../../common/components/LocalizationProvider';
import useReportStyles from '../common/useReportStyles';
import { devicesActions, reportsActions } from '../../store';
import SelectField from '../../common/components/SelectField';
import { useRestriction } from '../../common/util/permissions';
import { useLocation, useNavigate } from 'react-router-dom';
import ReportFilterCh from './ReportFilterCh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const ReportFilter = ({
  children, handleSubmit, handleSchedule, showOnly, ignoreDevice, multiDevice, includeGroups, loading,
}) => {
  const classes = useReportStyles();
  const dispatch = useDispatch();
  const t = useTranslation();

  const readonly = useRestriction('readonly');

  const devices = useSelector((state) => state.devices.items);
  const groups = useSelector((state) => state.groups.items);

  const deviceId = useSelector((state) => state.devices.selectedId);
  const deviceIds = useSelector((state) => state.devices.selectedIds);
  const groupIds = useSelector((state) => state.reports.groupIds);
  const period = useSelector((state) => state.reports.period);
  const from = useSelector((state) => state.reports.from);
  const to = useSelector((state) => state.reports.to);
  const [button, setButton] = useState('json');

  const [description, setDescription] = useState();
  const [calendarId, setCalendarId] = useState();

  const scheduleDisabled = button === 'schedule' && (!description || !calendarId);
  const disabled = (!ignoreDevice && !deviceId && !deviceIds.length && !groupIds.length) || scheduleDisabled || loading;

  const location = useLocation();
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const navigate = useNavigate();
  
  const handleClick = (type) => {
    if (type === 'schedule') {
      handleSchedule(deviceIds, groupIds, {
        description,
        calendarId,
        attributes: {},
      });
    } else {
      let selectedFrom;
      let selectedTo;
      switch (period) {
        case 'today':
          selectedFrom = dayjs().startOf('day');
          selectedTo = dayjs().endOf('day');
          break;
        case 'yesterday':
          selectedFrom = dayjs().subtract(1, 'day').startOf('day');
          selectedTo = dayjs().subtract(1, 'day').endOf('day');
          break;
        case 'thisWeek':
          selectedFrom = dayjs().startOf('week');
          selectedTo = dayjs().endOf('week');
          break;
        case 'previousWeek':
          selectedFrom = dayjs().subtract(1, 'week').startOf('week');
          selectedTo = dayjs().subtract(1, 'week').endOf('week');
          break;
        case 'thisMonth':
          selectedFrom = dayjs().startOf('month');
          selectedTo = dayjs().endOf('month');
          break;
        case 'previousMonth':
          selectedFrom = dayjs().subtract(1, 'month').startOf('month');
          selectedTo = dayjs().subtract(1, 'month').endOf('month');
          break;
        default:
          selectedFrom = dayjs(from, 'YYYY-MM-DDTHH:mm');
          selectedTo = dayjs(to, 'YYYY-MM-DDTHH:mm');
          break;
      }

      handleSubmit({
        deviceId,
        deviceIds,
        groupIds,
        from: selectedFrom.toISOString(),
        to: selectedTo.toISOString(),
        calendarId,
        type,
      });
    }
  };

  return (
    <>
      {desktop && location.pathname === "/replay" && (
        <div
          style={{
            display: "flex",
            width: period === "custom" ? "80vw" : "50vw",
            alignItems: "center",
            gap: 5,
            position: "fixed",
            top: 15,
            left: 20,
          }}
        >
          <div style={{ width: "300px" }}>
            <Toolbar>
              <IconButton
                edge="start"
                sx={{ mr: 2 }}
                onClick={() => navigate(-1)}
                style={{ backgroundColor: "#cccc" }}
              >
                <ArrowBackIcon sx={{ color: "black" }} />
              </IconButton>
              <Typography variant="h6" sx={{color:'black'}}>{t("reportReplay")}</Typography>
            </Toolbar>
          </div>
          {!ignoreDevice && (
            <div
              style={{
                padding: "6px",
                width: "500px",
                backgroundColor: "white",
                borderRadius: "5px",
                marginTop: "10px",
              }}
            >
              <SelectField
                label={
                  <span style={{ fontWeight: "bold" }}>
                    {t(multiDevice ? "deviceTitle" : "reportDevice")}
                  </span>
                }
                data={Object.values(devices).sort((a, b) =>
                  a.name.localeCompare(b.name)
                )}
                value={multiDevice ? deviceIds : deviceId}
                onChange={(e) =>
                  dispatch(
                    multiDevice
                      ? devicesActions.selectIds(e.target.value)
                      : devicesActions.selectId(e.target.value)
                  )
                }
                multiple={multiDevice}
                style={{ width: "100%" }}
                fullWidth
              />
            </div>
          )}
          <div style={{ width: "55%", display:'flex' }}>
            <FormControl
              fullWidth
              sx={{
                padding: "6px",
                backgroundColor: "white",
                borderRadius: "5px",
                marginTop: "10px",
                width: period === "custom" ? "25%" : "100%",
                marginRight:'5px'
              }}
            >
              <InputLabel sx={{ fontWeight: "bold", color: "black" }}>
                {t("reportPeriod")}
              </InputLabel>
              <Select
                label={t("reportPeriod")}
                value={period}
                onChange={(e) =>
                  dispatch(reportsActions.updatePeriod(e.target.value))
                }
              >
                <MenuItem value="today">{t("reportToday")}</MenuItem>
                <MenuItem value="yesterday">{t("reportYesterday")}</MenuItem>
                <MenuItem value="thisWeek">{t("reportThisWeek")}</MenuItem>
                <MenuItem value="previousWeek">
                  {t("reportPreviousWeek")}
                </MenuItem>
                <MenuItem value="thisMonth">{t("reportThisMonth")}</MenuItem>
                <MenuItem value="previousMonth">
                  {t("reportPreviousMonth")}
                </MenuItem>
                <MenuItem value="custom">{t("reportCustom")}</MenuItem>
              </Select>
            </FormControl>

            {period === "custom" && (
              <div
                className={classes.filterItem}
                style={{
                  padding: "6px",
                  backgroundColor: "white",
                  borderRadius: "5px",
                  marginTop: "10px",
                  marginRight:'5px'
                }}
              >
                <TextField
                  label={
                    <span style={{ fontWeight: "bold" }}>
                      {t("reportFrom")}
                    </span>
                  }
                  type="datetime-local"
                  value={from}
                  onChange={(e) =>
                    dispatch(reportsActions.updateFrom(e.target.value))
                  }
                  fullWidth
                />
              </div>
            )}
            {period === "custom" && (
              <div
                className={classes.filterItem}
                style={{
                  padding: "6px",
                  backgroundColor: "white",
                  borderRadius: "5px",
                  marginTop: "10px",
                }}
              >
                <TextField
                  label={
                    <span style={{ fontWeight: "bold" }}>{t("reportTo")}</span>
                  }
                  type="datetime-local"
                  value={to}
                  onChange={(e) =>
                    dispatch(reportsActions.updateTo(e.target.value))
                  }
                  fullWidth
                />
              </div>
            )}
          </div>

          <div
            style={{
              borderRadius: "5px",
              display: "flex",
              alignItems: "center",
              marginTop:'9px'
            }}
          >
            <button
              fullWidth
              variant="contained"
              color="secondary"
              disabled={disabled}
              onClick={() => handleClick("json")}
              style={{
                width: "7vw",
                border: "none",
                padding: "15px",
                borderRadius: "5px",
                backgroundColor: "#cccc"
              }}
            >
              <Typography
                variant="button"
                noWrap
                sx={{ color: "black", fontSize: "13px" }}
              >
                {t(loading ? "sharedLoading" : "reportShow")}
              </Typography>
            </button>
          </div>
        </div>
      )}
      {desktop && location.pathname !== "/replay" && (
        <ReportFilterCh
          includeGroups={includeGroups}
          ignoreDevice={ignoreDevice}
          multiDevice={multiDevice}
          description={description}
          calendarId={calendarId}
          disabled={disabled}
          handleClick={handleClick}
          children={children}
          loading={loading}
          showOnly={showOnly}
          from={from}
          to={to}
        />
      )}
      {!desktop && (
        <ReportFilterCh
          includeGroups={includeGroups}
          ignoreDevice={ignoreDevice}
          multiDevice={multiDevice}
          description={description}
          calendarId={calendarId}
          disabled={disabled}
          handleClick={handleClick}
          children={children}
          loading={loading}
          showOnly={showOnly}
          from={from}
          to={to}
        />
      )}
    </>
  );
};

export default ReportFilter;
