import dayjs from 'dayjs';
import React, { useState } from 'react';
import {
  FormControl, InputLabel, Select, MenuItem, useTheme,
} from '@mui/material';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend ,BarElement} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import ReportFilter from './components/ReportFilter';
import { formatTime } from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import usePositionAttributes from '../common/attributes/usePositionAttributes';
import { useCatch } from '../reactHelper';
import { useAttributePreference } from '../common/util/preferences';
import {
  altitudeFromMeters, distanceFromMeters, speedFromKnots, volumeFromLiters,
} from '../common/util/converter';
import useReportStyles from './common/useReportStyles';

// Register chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, zoomPlugin, BarElement);

const ChartReportPage = () => {
  const classes = useReportStyles();
  const theme = useTheme();
  const t = useTranslation();

  const positionAttributes = usePositionAttributes(t);

  const distanceUnit = useAttributePreference('distanceUnit');
  const altitudeUnit = useAttributePreference('altitudeUnit');
  const speedUnit = useAttributePreference('speedUnit');
  const volumeUnit = useAttributePreference('volumeUnit');

  const [items, setItems] = useState([]);
  const [types, setTypes] = useState(['speed']);
  const [type, setType] = useState('speed');
  const [timeType, setTimeType] = useState('fixTime');

  const values = items.map((it) => it[type]);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue;

  const handleSubmit = useCatch(async ({ deviceId, from, to }) => {
    const query = new URLSearchParams({ deviceId, from, to });
    const response = await fetch(`/api/reports/route?${query.toString()}`, {
      headers: { Accept: 'application/json' },
    });
    if (response.ok) {
      const positions = await response.json();
      const keySet = new Set();
      const keyList = [];
      const formattedPositions = positions.map((position) => {
        const data = { ...position, ...position.attributes };
        const formatted = {};
        formatted.fixTime = dayjs(position.fixTime).valueOf();
        formatted.deviceTime = dayjs(position.deviceTime).valueOf();
        formatted.serverTime = dayjs(position.serverTime).valueOf();
        Object.keys(data).filter((key) => !['id', 'deviceId'].includes(key)).forEach((key) => {
          const value = data[key];
          if (typeof value === 'number') {
            keySet.add(key);
            const definition = positionAttributes[key] || {};
            switch (definition.dataType) {
              case 'speed':
                formatted[key] = speedFromKnots(value, speedUnit).toFixed(2);
                break;
              case 'altitude':
                formatted[key] = altitudeFromMeters(value, altitudeUnit).toFixed(2);
                break;
              case 'distance':
                formatted[key] = distanceFromMeters(value, distanceUnit).toFixed(2);
                break;
              case 'volume':
                formatted[key] = volumeFromLiters(value, volumeUnit).toFixed(2);
                break;
              case 'hours':
                formatted[key] = (value / 1000).toFixed(2);
                break;
              default:
                formatted[key] = value;
                break;
            }
          }
        });
        return formatted;
      });
      Object.keys(positionAttributes).forEach((key) => {
        if (keySet.has(key)) {
          keyList.push(key);
          keySet.delete(key);
        }
      });
      setTypes([...keyList, ...keySet]);
      setItems(formattedPositions);
    } else {
      throw Error(await response.text());
    }
  });
  const sampleRate = Math.ceil(items.length / 200000); // tối đa 200000 điểm
  const sampledItems = items.filter((_, index) => index % sampleRate === 0);
  
  // Chart.js data structure
  const chartData = {
    labels: sampledItems.map(item => formatTime(item[timeType], 'time')),
    datasets: [
      {
        label: positionAttributes[type]?.name || type,
        data: sampledItems.map(item => item[type]),
        fill: false,
        borderColor: theme.palette.primary.main,
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem) => {
            const value = tooltipItem.raw;
            return typeof value === 'number' 
              ? `Value: ${value.toFixed(2)}`
              : `Value: ${value}`;
          }
        },
      },

      zoom: {
        limits: {
          x: { min: 0, minRange: 1 }, // không cho pan/zoom âm và nhỏ hơn 1 đơn vị
          y: { min: minValue - valueRange / 5, max: maxValue + valueRange / 5 }
        },
        zoom: {
          wheel: {
            enabled: true, // cho phép zoom bằng cuộn chuột
          },
          pinch: {
            enabled: true, // cho phép zoom bằng cảm ứng (mobile)
          },
          mode: 'xy', // zoom cả X và Y
        },
        pan: {
          enabled: true, // cho phép kéo chart
          mode: 'xy',
        },
      },
    },
    scales: {
      x: {
        type: 'category',
        labels: sampledItems.map(item => dayjs(item[timeType]).format('YYYY-MM-DD HH:mm:ss')),  // Format lại để hiển thị cả ngày và giờ
        min: 0,
        max: 300,
      },
      y: {
        min: minValue - valueRange / 5,
        max: maxValue + valueRange / 5,
        ticks: {
          callback: (value) => value.toFixed(2),
        },
      },
    },
  };
  

  return (
    <PageLayout
      menu={<ReportsMenu />}
      breadcrumbs={["reportTitle", "reportChart"]}
    >
      <div
        className={classes.header}
        style={{ backgroundColor: "#3c8dbc", marginBottom: "10px" }}
      >
        <ReportFilter handleSubmit={handleSubmit} showOnly>
          <div className={classes.filterItem} style={{ padding: '6px', backgroundColor: "white", borderRadius: "5px" }}>
            <FormControl fullWidth>
              <InputLabel sx={{ fontWeight: 'bold' }}>{t("reportChartType")}</InputLabel>
              <Select
                label={t("reportChartType")}
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={!items.length}
              >
                {types.map((key) => (
                  <MenuItem key={key} value={key}>
                    {positionAttributes[key]?.name || key}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
          <div className={classes.filterItem} style={{ padding: '6px', backgroundColor: "white", borderRadius: "5px" }}>
            <FormControl fullWidth>
              <InputLabel sx={{ fontWeight: 'bold' }}>{t("reportTimeType")}</InputLabel>
              <Select
                label={t("reportTimeType")}
                value={timeType}
                onChange={(e) => setTimeType(e.target.value)}
                disabled={!items.length}
              >
                <MenuItem value="fixTime">{t("positionFixTime")}</MenuItem>
                <MenuItem value="deviceTime">{t("positionDeviceTime")}</MenuItem>
                <MenuItem value="serverTime">{t("positionServerTime")}</MenuItem>
              </Select>
            </FormControl>
          </div>
        </ReportFilter>
      </div>
      {items.length > 0 && (
        <div className={classes.chart}>
          <Line data={chartData} options={chartOptions} />
        </div>
      )}
    </PageLayout>
  );
};

export default ChartReportPage;
