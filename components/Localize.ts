import type { Language } from './I18n';
import type { AlertRule, EventStatus, MarketStatus, RiskEvent, Severity } from '@/lib/types';

export function marketStatusLabel(status: MarketStatus, language: Language) {
  if (language === 'en') return { healthy: 'Healthy', watch: 'Watch', critical: 'Critical' }[status];
  return { healthy: '健康', watch: '关注', critical: '严重' }[status];
}

export function severityLabel(severity: Severity, language: Language) {
  if (language === 'en') return { info: 'Info', warning: 'Warning', critical: 'Critical' }[severity];
  return { info: '提示', warning: '警告', critical: '严重' }[severity];
}

export function eventStatusLabel(status: EventStatus, language: Language) {
  if (language === 'en') return { open: 'Open', acknowledged: 'Acknowledged' }[status];
  return { open: '待处理', acknowledged: '已确认' }[status];
}

export function localizeRuleName(rule: AlertRule, language: Language) {
  if (language === 'en') return rule.name;
  return {
    utilization: '高利用率',
    oracleDeviation: '预言机价格偏差',
    badDebtDelta: '坏账增量',
    liquidityCoverage: '流动性覆盖率',
    topMarketShare: '风险集中度',
  }[rule.metric] ?? rule.name;
}

export function localizeEvent(event: RiskEvent, language: Language) {
  if (language === 'en') return { title: event.title, detail: event.detail };
  const symbol = event.symbol ?? '组合';
  const translations: Record<string, { title: string; detail: string }> = {
    utilization: {
      title: `${symbol} 利用率超过 70%`,
      detail: '告警阈值 68% · 当前值 70.5%',
    },
    oracle_deviation: {
      title: '检测到价格源偏差',
      detail: `${symbol} 预言机价差达到 1.8%`,
    },
    bad_debt: {
      title: `${symbol} 坏账增加`,
      detail: '30 分钟内风险敞口增加 42,800 美元',
    },
    liquidity: {
      title: `${symbol} 流动性缓冲收窄`,
      detail: '流动性覆盖率降至 1.35 倍以下',
    },
    revenue: {
      title: '收入快照已完成',
      detail: '24 小时协议收入为 128,420 美元',
    },
    volume: {
      title: `${symbol} 大额还款已确认`,
      detail: '280 万美元还款降低了市场利用率',
    },
    oracle_recovery: {
      title: `${symbol} 价格源已恢复`,
      detail: '全部配置的数据源均已恢复至容差范围内',
    },
  };
  if (translations[event.eventType]) return translations[event.eventType];
  if (event.eventType === 'simulation_tick') {
    const cycle = event.detail.match(/#(\d+)/)?.[1] ?? '—';
    const change = event.detail.match(/(-?\d+\.\d+)%/)?.[1] ?? '0.00';
    return {
      title: `${symbol} 监控周期已完成`,
      detail: `第 ${cycle} 次合成刷新记录了 ${change}% 的价格变化`,
    };
  }
  return { title: event.title, detail: event.detail };
}

export function localizeRevenueName(name: string, language: Language) {
  if (language === 'en') return name;
  return {
    'Lending markets': '借贷市场',
    'Energy services': '能源服务',
    Staking: '质押',
  }[name] ?? name;
}
