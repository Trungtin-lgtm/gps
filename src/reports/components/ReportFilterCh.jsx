import React, { useMemo, useState } from "react";
import { devicesActions, reportsActions } from "../../store";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "../../common/components/LocalizationProvider";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Toolbar,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import SelectField from "../../common/components/SelectField";
import { useRestriction } from "../../common/util/permissions";
import useReportStyles from "../common/useReportStyles";
import SplitButton from "../../common/components/SplitButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useLocation, useNavigate } from "react-router-dom";

export const REPORT_ALL_DEVICES_GROUP_ID = '__all_devices__';
export const REPORT_UNGROUPED_DEVICES_GROUP_ID = '__ungrouped_devices__';

const ReportFilterCh = ({
  includeGroups,
  groupOnly,
  ignoreDevice,
  multiDevice,
  description,
  calendarId,
  disabled,
  handleClick,
  children,
  loading,
  showOnly,
  from,
  to
}) => {
  const dispatch = useDispatch();
  const t = useTranslation();
  const devices = useSelector((state) => state.devices.items);
  const groups = useSelector((state) => state.groups.items);
  const deviceId = useSelector((state) => state.devices.selectedId);
  const deviceIds = useSelector((state) => state.devices.selectedIds);
  const groupIds = useSelector((state) => state.reports.groupIds);
  const period = useSelector((state) => state.reports.period);
  const readonly = useRestriction("readonly");
  const classes = useReportStyles();
  const [button, setButton] = useState("json");
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const selectableGroups = useMemo(() => {
    const groupList = Object.values(groups);
    if (!groupOnly) {
      return groupList.sort((a, b) => a.name.localeCompare(b.name));
    }

    const nonEmptyGroupIds = new Set(
      Object.values(devices)
        .map((device) => device.groupId)
        .filter(Boolean),
    );
    let addedParent = true;
    while (addedParent) {
      addedParent = false;
      for (const group of groupList) {
        if (
          nonEmptyGroupIds.has(group.id)
          && group.groupId
          && !nonEmptyGroupIds.has(group.groupId)
        ) {
          nonEmptyGroupIds.add(group.groupId);
          addedParent = true;
        }
      }
    }

    const options = groupList
      .filter((group) => nonEmptyGroupIds.has(group.id))
      .sort((a, b) => a.name.localeCompare(b.name));
    options.unshift({
      id: REPORT_ALL_DEVICES_GROUP_ID,
      name: t('notificationAlways'),
    });
    if (Object.values(devices).some((device) => !device.groupId)) {
      options.splice(1, 0, {
        id: REPORT_UNGROUPED_DEVICES_GROUP_ID,
        name: t('groupNoGroup'),
      });
    }
    return options;
  }, [devices, groups, groupOnly, t]);

  return (
    <div className={classes.filter}>
      {!ignoreDevice && !groupOnly && (
        <div
          className={classes.filterItem}
          style={{
            padding: "6px",
            backgroundColor: "white",
            borderRadius: "5px",
          }}
        >
          {!desktop && location.pathname ==="/replay" &&(
            <Toolbar sx={{marginBottom: "20px", marginTop:'-10px'}}>
              <IconButton
                edge="start"
                sx={{ mr: 2 }}
                onClick={() => navigate(-1)}
                style={{ backgroundColor: "#cccc" }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h6" sx={{color:'black'}}>{t("reportReplay")}</Typography>
            </Toolbar>
          )}
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
            fullWidth
            style={{ width: "15vw" }}
          />
        </div>
      )}
      {includeGroups && (
        <div
          className={classes.filterItem}
          style={{
            padding: "6px",
            backgroundColor: "white",
            borderRadius: "5px",
          }}
        >
          <SelectField
            label={
              <span style={{ fontWeight: "bold" }}>{t("settingsGroups")}</span>
            }
            data={selectableGroups}
            value={groupIds}
            onChange={(e) =>
              dispatch(reportsActions.updateGroupIds(e.target.value))
            }
            multiple
            fullWidth
          />
        </div>
      )}
      {button !== "schedule" ? (
        <>
          <div
            className={classes.filterItem}
            style={{
              padding: "6px",
              backgroundColor: "white",
              borderRadius: "5px",
            }}
          >
            <FormControl fullWidth>
              <InputLabel sx={{ fontWeight: "bold" }}>
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
          </div>
          {period === "custom" && (
            <div
              className={classes.filterItem}
              style={{
                padding: "6px",
                backgroundColor: "white",
                borderRadius: "5px",
              }}
            >
              <TextField
                label={
                  <span style={{ fontWeight: "bold" }}>{t("reportFrom")}</span>
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
        </>
      ) : (
        <>
          <div className={classes.filterItem}>
            <TextField
              value={description || ""}
              onChange={(event) => setDescription(event.target.value)}
              label={t("sharedDescription")}
              fullWidth
            />
          </div>
          <div className={classes.filterItem}>
            <SelectField
              value={calendarId}
              onChange={(event) => setCalendarId(Number(event.target.value))}
              endpoint="/api/calendars"
              label={t("sharedCalendar")}
              fullWidth
            />
          </div>
        </>
      )}
      {children}
      <div className={classes.filterItem}>
        {showOnly ? (
          <button
            fullWidth
            variant="contained"
            color="secondary"
            disabled={disabled}
            onClick={() => handleClick("json")}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              padding: "5px",
              borderRadius: "5px",
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
        ) : (
          <SplitButton
            fullWidth
            variant="contained"
            color="secondary"
            disabled={disabled}
            onClick={handleClick}
            selected={button}
            setSelected={(value) => setButton(value)}
            options={
              readonly
                ? {
                    json: t("reportShow"),
                    export: t("reportExport"),
                    mail: t("reportEmail"),
                  }
                : {
                    json: t("reportShow"),
                    export: t("reportExport"),
                    mail: t("reportEmail"),
                    schedule: t("reportSchedule"),
                  }
            }
          />
        )}
      </div>
    </div>
  );
};

export default ReportFilterCh;
