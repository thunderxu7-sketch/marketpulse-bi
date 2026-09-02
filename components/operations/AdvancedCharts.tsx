'use client';

import ReactEChartsCore from 'echarts-for-react/esm/core';
import * as echarts from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { FlowPoint, LiquidationPoint, RevenuePoint } from '@/lib/types';

echarts.use([BarChart, LineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);

const colors = ['#0c7368', '#61b8aa', '#d39a4a', '#6f8ea7', '#c95c5c', '#8b73b6'];
const axis = '#829491';
const grid = '#e6eeec';

function compact(value: number) {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (absolute >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toFixed(0);
}

function date(value: string, locale: string, hour = false) {
  const options: Intl.DateTimeFormatOptions = hour ? { hour: '2-digit', minute: '2-digit', hour12: false } : { month: 'short', day: 'numeric' };
  return new Date(value).toLocaleString(locale, options);
}

const base = {
  animationDuration: 450,
  color: colors,
  grid: { top: 40, right: 16, bottom: 30, left: 16, containLabel: true },
  tooltip: { trigger: 'axis', backgroundColor: 'rgba(16, 47, 45, .96)', borderWidth: 0, textStyle: { color: '#fff', fontSize: 11 } },
  legend: { top: 0, right: 0, itemWidth: 10, itemHeight: 7, textStyle: { color: axis, fontSize: 9 } },
};

function axes(labels: string[]) {
  return {
    xAxis: { type: 'category', data: labels, boundaryGap: true, axisTick: { show: false }, axisLine: { lineStyle: { color: grid } }, axisLabel: { color: axis, fontSize: 9 } },
    yAxis: { type: 'value', axisLabel: { color: axis, fontSize: 9, formatter: compact }, splitLine: { lineStyle: { color: grid, type: 'dashed' } } },
  };
}

export function PriceDeviationChart({ history, locale, labels }: {
  history: Array<{ time: string; BTC: number; ETH: number; USDT: number; USDC: number; TRX: number; wstETH: number }>;
  locale: string;
  labels: { deviation: string };
}) {
  const keys = ['BTC', 'ETH', 'USDT', 'USDC', 'TRX', 'wstETH'] as const;
  const option = {
    ...base,
    ...axes(history.map((item) => date(item.time, locale, true))),
    tooltip: { ...base.tooltip, valueFormatter: (value: number) => `${value.toFixed(1)} bps` },
    yAxis: { ...axes([]).yAxis, name: labels.deviation, nameTextStyle: { color: axis, fontSize: 9 } },
    series: keys.map((key, index) => ({
      name: key,
      type: 'line',
      smooth: 0.35,
      showSymbol: false,
      lineStyle: { width: key === 'wstETH' ? 2.5 : 1.4, color: colors[index] },
      data: history.map((item) => item[key]),
    })),
  };
  return <ReactEChartsCore echarts={echarts} option={option} notMerge lazyUpdate style={{ height: 304 }} />;
}

export function DebtCoverageChart({ segments, labels }: {
  segments: Array<{ version: string; network: string; badDebt: number; provisioned: number; recoverable: number }>;
  labels: { badDebt: string; provisioned: string; recoverable: string };
}) {
  const option = {
    ...base,
    ...axes(segments.map((item) => `${item.version} · ${item.network}`)),
    tooltip: { ...base.tooltip, valueFormatter: (value: number) => `$${compact(value)}` },
    series: [
      { name: labels.badDebt, type: 'bar', barMaxWidth: 24, data: segments.map((item) => item.badDebt), itemStyle: { color: '#c95c5c', borderRadius: [4, 4, 0, 0] } },
      { name: labels.provisioned, type: 'bar', barMaxWidth: 24, data: segments.map((item) => item.provisioned), itemStyle: { color: '#d39a4a', borderRadius: [4, 4, 0, 0] } },
      { name: labels.recoverable, type: 'bar', barMaxWidth: 24, data: segments.map((item) => item.recoverable), itemStyle: { color: '#0c7368', borderRadius: [4, 4, 0, 0] } },
    ],
  };
  return <ReactEChartsCore echarts={echarts} option={option} notMerge lazyUpdate style={{ height: 310 }} />;
}

export function FundFlowChart({ history, locale, labels }: { history: FlowPoint[]; locale: string; labels: Record<'deposits' | 'withdrawals' | 'borrows' | 'repayments', string> }) {
  const option = {
    ...base,
    ...axes(history.map((item) => date(item.date, locale))),
    tooltip: { ...base.tooltip, valueFormatter: (value: number) => `$${compact(value)}` },
    series: [
      { name: labels.deposits, type: 'bar', stack: 'in', barMaxWidth: 14, data: history.map((item) => item.deposits) },
      { name: labels.repayments, type: 'bar', stack: 'in', barMaxWidth: 14, data: history.map((item) => item.repayments) },
      { name: labels.withdrawals, type: 'line', smooth: 0.3, showSymbol: false, lineStyle: { width: 2 }, data: history.map((item) => item.withdrawals) },
      { name: labels.borrows, type: 'line', smooth: 0.3, showSymbol: false, lineStyle: { width: 2 }, data: history.map((item) => item.borrows) },
    ],
  };
  return <ReactEChartsCore echarts={echarts} option={option} notMerge lazyUpdate style={{ height: 316 }} />;
}

export function RevenueChart({ history, locale, labels, multiplier = 1 }: { history: RevenuePoint[]; locale: string; labels: Record<'lending' | 'liquidation' | 'automation' | 'treasury', string>; multiplier?: number }) {
  const series = (key: keyof RevenuePoint, name: string) => ({ name, type: 'bar', stack: 'revenue', barMaxWidth: 22, data: history.map((item) => Number(item[key]) * multiplier) });
  const option = {
    ...base,
    ...axes(history.map((item) => date(item.date, locale))),
    tooltip: { ...base.tooltip, valueFormatter: (value: number) => `$${compact(value)}` },
    series: [series('lending', labels.lending), series('liquidation', labels.liquidation), series('automation', labels.automation), series('treasury', labels.treasury)],
  };
  return <ReactEChartsCore echarts={echarts} option={option} notMerge lazyUpdate style={{ height: 316 }} />;
}

export function LiquidationChart({ history, locale, labels, mode }: { history: LiquidationPoint[]; locale: string; labels: { repaid: string; reward: string; events: string }; mode: 'repaid' | 'reward' }) {
  const values = history.map((item) => mode === 'repaid' ? item.repaid : item.reward);
  const option = {
    ...base,
    ...axes(history.map((item) => date(item.date, locale))),
    tooltip: { ...base.tooltip, valueFormatter: (value: number) => `$${compact(value)}` },
    series: [
      { name: mode === 'repaid' ? labels.repaid : labels.reward, type: 'bar', barMaxWidth: 20, itemStyle: { borderRadius: [4, 4, 0, 0] }, data: values },
      { name: labels.events, type: 'line', yAxisIndex: 1, smooth: 0.3, showSymbol: false, lineStyle: { width: 2, color: '#d39a4a' }, data: history.map((item) => item.events) },
    ],
    yAxis: [axes([]).yAxis, { type: 'value', axisLabel: { color: axis, fontSize: 9 }, splitLine: { show: false } }],
  };
  return <ReactEChartsCore echarts={echarts} option={option} notMerge lazyUpdate style={{ height: 316 }} />;
}
