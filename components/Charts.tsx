'use client';

import ReactEChartsCore from 'echarts-for-react/esm/core';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { Snapshot } from '@/lib/types';

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  CanvasRenderer,
]);

const axis = '#81918f';
const grid = '#e5eceb';

function compactUsd(value: number) {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (absolute >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  if (absolute >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export function PortfolioTrendChart({
  snapshots,
  locale,
  depositsLabel,
  borrowsLabel,
}: {
  snapshots: Snapshot[];
  locale: string;
  depositsLabel: string;
  borrowsLabel: string;
}) {
  const option = {
    animationDuration: 550,
    grid: { top: 24, right: 12, bottom: 32, left: 12, containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(16, 47, 45, .96)',
      borderWidth: 0,
      textStyle: { color: '#fff', fontSize: 11 },
      valueFormatter: (value: number) => compactUsd(value),
    },
    legend: {
      top: 0,
      right: 0,
      itemWidth: 11,
      itemHeight: 7,
      textStyle: { color: axis, fontSize: 10 },
    },
    xAxis: {
      type: 'category',
      data: snapshots.map((snapshot) => new Date(snapshot.capturedAt).toLocaleDateString(locale, { month: 'short', day: 'numeric' })),
      boundaryGap: false,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: grid } },
      axisLabel: { color: axis, fontSize: 9, interval: 6 },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: axis, fontSize: 9, formatter: compactUsd },
      splitLine: { lineStyle: { color: grid, type: 'dashed' } },
    },
    series: [
      {
        name: depositsLabel,
        type: 'line',
        smooth: 0.35,
        showSymbol: false,
        lineStyle: { width: 3, color: '#0c7368' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(12, 115, 104, .24)' },
            { offset: 1, color: 'rgba(12, 115, 104, 0)' },
          ]),
        },
        data: snapshots.map((snapshot) => snapshot.totalDeposits),
      },
      {
        name: borrowsLabel,
        type: 'line',
        smooth: 0.35,
        showSymbol: false,
        lineStyle: { width: 2, color: '#78bcb1' },
        data: snapshots.map((snapshot) => snapshot.totalBorrows),
      },
    ],
  };
  return <ReactEChartsCore echarts={echarts} option={option} notMerge lazyUpdate opts={{ renderer: 'canvas' }} style={{ height: 286 }} />;
}

export function RevenueMixChart({ values, revenueLabel }: { values: Array<{ name: string; value: number }>; revenueLabel: string }) {
  const option = {
    animationDuration: 500,
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(16, 47, 45, .96)',
      borderWidth: 0,
      textStyle: { color: '#fff', fontSize: 11 },
      valueFormatter: (value: number) => compactUsd(value),
    },
    legend: {
      bottom: 0,
      left: 'center',
      itemWidth: 9,
      itemHeight: 9,
      textStyle: { color: axis, fontSize: 9 },
    },
    series: [{
      name: revenueLabel,
      type: 'pie',
      radius: ['55%', '76%'],
      center: ['50%', '43%'],
      avoidLabelOverlap: true,
      itemStyle: { borderColor: '#fff', borderWidth: 3, borderRadius: 5 },
      label: { show: false },
      emphasis: { scaleSize: 4 },
      color: ['#0c7368', '#53b7a8', '#c7a86a'],
      data: values,
    }],
  };
  return <ReactEChartsCore echarts={echarts} option={option} notMerge lazyUpdate opts={{ renderer: 'canvas' }} style={{ height: 260 }} />;
}
