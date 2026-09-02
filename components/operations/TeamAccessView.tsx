'use client';

import { Check, Clock3, Search, Shield, UserCheck, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { useI18n } from '@/components/I18n';
import type { TeamMember, TeamRole } from '@/lib/types';
import { localizeTeamName, MetricStrip, OperationsState, roleLabel, statusLabel, StatusBadge, useOperationsData } from './shared';

const permissions: Record<TeamRole, boolean[]> = {
  owner: [true, true, true, true, true],
  risk: [true, true, true, false, true],
  operator: [true, false, true, false, true],
  viewer: [true, false, false, false, false],
};

export default function TeamAccessView() {
  const { language, locale } = useI18n();
  const { data, loading, error, reload } = useOperationsData();
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const c = language === 'zh' ? {
    eyebrow: '设置与权限 / 团队', title: '团队与权限管理', description: '以角色矩阵管理监控、规则、处置、成员和导出权限，并持久记录角色变更。',
    members: '团队成员', active: '活跃成员', privileged: '高权限角色', invitations: '待接受邀请', totalSeats: '5 / 10 席位', last30: '过去 30 天登录', ownerRisk: '负责人 + 风险分析师', waiting: '等待加入', matrix: '权限矩阵', matrixTitle: '角色能力边界', capability: '功能权限', view: '查看看板', configure: '配置规则', respond: '处置事件', manage: '管理成员', export: '导出数据',
    directory: '成员目录', directoryTitle: '账户与角色', search: '搜索成员或邮箱', name: '成员', role: '角色', status: '状态', lastActive: '最近活跃', created: '加入时间', changeRole: '修改角色', ownerLocked: '负责人角色受保护',
    activity: '权限审计', activityTitle: '最近角色活动', updatedRisk: '风险负责人将告警规则编辑权限授予运营值班台', invitedAudit: '平台负责人邀请审计观察员加入只读角色', reviewed: '系统完成季度权限复核，未发现孤立管理员账户', ago1: '34 分钟前', ago2: '3 天前', ago3: '7 天前',
  } : {
    eyebrow: 'Settings & access / Team', title: 'Team and access management', description: 'Manage dashboard, rule, response, member, and export permissions through a role matrix with durable role changes.',
    members: 'Team members', active: 'Active members', privileged: 'Privileged roles', invitations: 'Pending invitations', totalSeats: '5 / 10 seats', last30: 'Signed in during 30d', ownerRisk: 'Owner + risk analyst', waiting: 'Awaiting acceptance', matrix: 'Permission matrix', matrixTitle: 'Role capability boundaries', capability: 'Capability', view: 'View dashboards', configure: 'Configure rules', respond: 'Respond to events', manage: 'Manage members', export: 'Export data',
    directory: 'Member directory', directoryTitle: 'Accounts and roles', search: 'Search member or email', name: 'Member', role: 'Role', status: 'Status', lastActive: 'Last active', created: 'Joined', changeRole: 'Change role', ownerLocked: 'Owner role is protected',
    activity: 'Access audit', activityTitle: 'Recent role activity', updatedRisk: 'Risk Lead granted alert-rule editing to Operations Desk', invitedAudit: 'Platform Owner invited Audit Observer with viewer access', reviewed: 'Quarterly access review completed with no orphaned administrator accounts', ago1: '34 minutes ago', ago2: '3 days ago', ago3: '7 days ago',
  };
  const members = useMemo(() => (data?.teamMembers ?? []).filter((member) => `${member.name} ${member.email} ${localizeTeamName(member.id, member.name, language)}`.toLowerCase().includes(search.toLowerCase())), [data, language, search]);
  const activeCount = data?.teamMembers.filter((member) => member.status === 'active').length ?? 0;
  const privileged = data?.teamMembers.filter((member) => member.role === 'owner' || member.role === 'risk').length ?? 0;
  const invited = data?.teamMembers.filter((member) => member.status === 'invited').length ?? 0;
  const capabilities = [c.view, c.configure, c.respond, c.manage, c.export];
  const roles: TeamRole[] = ['owner', 'risk', 'operator', 'viewer'];
  const updateRole = async (member: TeamMember, role: TeamRole) => {
    if (role === 'owner' || member.role === 'owner' || role === member.role) return;
    setBusyId(member.id);
    const response = await fetch(`/api/team/${member.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
    if (response.ok) await reload();
    setBusyId(null);
  };
  return (
    <AppShell eyebrow={c.eyebrow} title={c.title} description={c.description}>
      <OperationsState loading={loading} error={error} language={language} onRetry={() => void reload()} />
      {data ? <>
        <MetricStrip items={[
          { label: c.members, value: data.teamMembers.length, detail: c.totalSeats },
          { label: c.active, value: activeCount, detail: c.last30, tone: 'positive' },
          { label: c.privileged, value: privileged, detail: c.ownerRisk },
          { label: c.invitations, value: invited, detail: c.waiting, tone: invited ? 'amber' : '' },
        ]} />
        <section className="panel permission-panel"><div className="panel-heading"><div><p className="eyebrow">{c.matrix}</p><h2>{c.matrixTitle}</h2></div><Shield size={18} /></div><div className="permission-matrix"><div className="permission-row permission-head"><strong>{c.capability}</strong>{roles.map((role) => <span key={role}>{roleLabel(role, language)}</span>)}</div>{capabilities.map((capability, index) => <div className="permission-row" key={capability}><strong>{capability}</strong>{roles.map((role) => <span className={permissions[role][index] ? 'granted' : 'denied'} key={role}>{permissions[role][index] ? <Check size={14} /> : '—'}</span>)}</div>)}</div></section>
        <section className="ops-split-grid team-bottom-grid">
          <article className="panel data-panel ops-table-panel member-panel"><div className="ops-toolbar"><div><p className="eyebrow">{c.directory}</p><h2>{c.directoryTitle}</h2></div><label className="search-field compact-search"><Search size={14} /><input aria-label={c.search} placeholder={c.search} value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>
            <div className="table-wrap ops-table"><table><thead><tr><th>{c.name}</th><th>{c.role}</th><th>{c.status}</th><th>{c.lastActive}</th><th>{c.created}</th></tr></thead><tbody>{members.map((member) => <tr key={member.id}>
              <td><span className="member-avatar">{localizeTeamName(member.id, member.name, language)[0]}</span><div><strong>{localizeTeamName(member.id, member.name, language)}</strong><small>{member.email}</small></div></td><td>{member.role === 'owner' ? <span className="locked-role" title={c.ownerLocked}>{roleLabel(member.role, language)}</span> : <select aria-label={`${c.changeRole}: ${member.name}`} disabled={busyId === member.id} value={member.role} onChange={(event) => void updateRole(member, event.target.value as TeamRole)}><option value="risk">{roleLabel('risk', language)}</option><option value="operator">{roleLabel('operator', language)}</option><option value="viewer">{roleLabel('viewer', language)}</option></select>}</td><td><StatusBadge status={member.status} label={statusLabel(member.status, language)} /></td><td>{new Date(member.lastActiveAt).toLocaleString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}</td><td>{new Date(member.createdAt).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
            </tr>)}</tbody></table></div>
          </article>
          <article className="panel audit-panel"><div className="panel-heading"><div><p className="eyebrow">{c.activity}</p><h2>{c.activityTitle}</h2></div><UserCheck size={18} /></div><div className="audit-list">{[[c.updatedRisk, c.ago1], [c.invitedAudit, c.ago2], [c.reviewed, c.ago3]].map(([copy, time], index) => <div key={copy}><span className="audit-icon">{index === 2 ? <Shield size={15} /> : <Users size={15} />}</span><p>{copy}<small><Clock3 size={11} />{time}</small></p></div>)}</div></article>
        </section>
      </> : null}
    </AppShell>
  );
}
