'use client';

import React, { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import zoomPlugin from 'chartjs-plugin-zoom';
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  zoomPlugin,
  annotationPlugin
);

export default function ChartComponent({ data, options, onChartRef }) {
  const chartRef = useRef(null);

  React.useEffect(() => {
    if (chartRef.current && onChartRef) {
      onChartRef(chartRef.current);
    }
  }, [onChartRef]);

  return (
    <div className="h-80 mb-4">
      <Line ref={chartRef} data={data} options={options} />
    </div>
  );
}
