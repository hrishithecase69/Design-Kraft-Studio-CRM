import React, { useState } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Mail,
  MessageCircle,
  UserPlus,
  PhoneCall,
  Clock,
  ChevronRight,
} from 'lucide-react';
import {
  PIPELINE_STAGES,
  type Lead,
  type PipelineStage,
  type SortDirection,
  type SortField,
} from '../types/crm';
import { formatRelativeTimestamp, getLocalTimeInfo } from '../utils/time';
import {
  buildEmailUrl,
  buildWhatsAppUrl,
  formatBudget,
  getStageAccentStyle,
} from '../utils/outreach';

interface DatagridTableProps {
  leads: Lead[];
  now: Date;
  activeSetter: string;
  selectedLeadId: string | null;
  onSelectLead: (lead: Lead) => void;
  onHoverTimeZone: (tz: string | null, label: string | null) => void;
  onClaimLead: (leadId: string) => void;
  onQuickOutreach: (lead: Lead, channel: 'whatsapp' | 'email') => void;
  onMoveStage: (leadId: string, nextStage: PipelineStage) => void;
  onNewLead: () => void;
}

export const DatagridTable: React.FC<DatagridTableProps> = ({
  leads,
  now,
  activeSetter,
  selectedLeadId,
  onSelectLead,
  onHoverTimeZone,
  onClaimLead,
  onQuickOutreach,
  onMoveStage,
  onNewLead,
}) => {
  const [sortField, setSortField] = useState<SortField>('stage');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'budgetAmount' ? 'desc' : 'asc');
    }
  };

  const sortedLeads = [...leads].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    switch (sortField) {
      case 'studioName':
        return a.studioName.localeCompare(b.studioName) * dir;
      case 'budgetAmount':
        return (a.budgetAmount - b.budgetAmount) * dir;
      case 'region':
        return a.region.localeCompare(b.region) * dir;
      case 'stage':
        return (
          (PIPELINE_STAGES.indexOf(a.stage) - PIPELINE_STAGES.indexOf(b.stage)) *
          dir
        );
      case 'lastContactedAt': {
        const ta = a.lastContactedAt ? new Date(a.lastContactedAt).getTime() : 0;
        const tb = b.lastContactedAt ? new Date(b.lastContactedAt).getTime() : 0;
        return (ta - tb) * dir;
      }
    }
  });

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-zinc-600" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-[#ea580c]" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#ea580c]" />
    );
  };

  if (leads.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center">
        <p className="text-sm font-medium text-zinc-200">
          No architectural leads match your current filters
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Clear active filters or add a new studio inquiry to the pipeline.
        </p>
        <button
          type="button"
          onClick={onNewLead}
          className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-[#ea580c] hover:bg-[#f97316] rounded-sm transition-colors cursor-pointer"
        >
          Add New Lead
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-x-auto px-4 lg:px-6 py-4">
      <div className="border border-[#262626] rounded-sm bg-[#141414] overflow-hidden">
        <table className="w-full text-left border-collapse min-w-[1120px]">
          <thead>
            <tr className="border-b border-[#262626] bg-[#101010] text-[11px] font-mono text-zinc-400">
              <th className="py-2.5 px-3.5 font-medium">
                <button
                  type="button"
                  onClick={() => handleSort('studioName')}
                  className="inline-flex items-center gap-1.5 hover:text-zinc-100 cursor-pointer"
                >
                  <span>Studio & Contact</span>
                  {renderSortIcon('studioName')}
                </button>
              </th>
              <th className="py-2.5 px-3 font-medium">
                <button
                  type="button"
                  onClick={() => handleSort('region')}
                  className="inline-flex items-center gap-1.5 hover:text-zinc-100 cursor-pointer"
                >
                  <span>Local Time & 9–6 Window</span>
                  {renderSortIcon('region')}
                </button>
              </th>
              <th className="py-2.5 px-3 font-medium">Software / Discipline</th>
              <th className="py-2.5 px-3 font-medium">
                <button
                  type="button"
                  onClick={() => handleSort('stage')}
                  className="inline-flex items-center gap-1.5 hover:text-zinc-100 cursor-pointer"
                >
                  <span>Pipeline Stage</span>
                  {renderSortIcon('stage')}
                </button>
              </th>
              <th className="py-2.5 px-3 font-medium text-right">
                <button
                  type="button"
                  onClick={() => handleSort('budgetAmount')}
                  className="inline-flex items-center gap-1.5 hover:text-zinc-100 cursor-pointer ml-auto"
                >
                  <span>Budget</span>
                  {renderSortIcon('budgetAmount')}
                </button>
              </th>
              <th className="py-2.5 px-3 font-medium">Setter</th>
              <th className="py-2.5 px-3 font-medium">
                <button
                  type="button"
                  onClick={() => handleSort('lastContactedAt')}
                  className="inline-flex items-center gap-1.5 hover:text-zinc-100 cursor-pointer"
                >
                  <span>Last Touch</span>
                  {renderSortIcon('lastContactedAt')}
                </button>
              </th>
              <th className="py-2.5 px-3.5 font-medium text-right">Quick Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#222222] text-xs">
            {sortedLeads.map((lead) => {
              const localTime = getLocalTimeInfo(lead.timeZone, now);
              const stageAccent = getStageAccentStyle(lead.stage);
              const isSelected = lead.id === selectedLeadId;
              const whatsappUrl = buildWhatsAppUrl(lead, activeSetter);
              const emailUrl = buildEmailUrl(lead, activeSetter);

              return (
                <tr
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  onMouseEnter={() => onHoverTimeZone(lead.timeZone, lead.studioName)}
                  onMouseLeave={() => onHoverTimeZone(null, null)}
                  className={`transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#1c1612]'
                      : 'hover:bg-[#1a1a1a]'
                  }`}
                >
                  {/* Studio & Contact */}
                  <td className="py-3 px-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-zinc-500 tabular-nums">
                        {lead.id}
                      </span>
                      <span className="font-semibold text-zinc-100 text-[13px]">
                        {lead.studioName}
                      </span>
                    </div>
                    <div className="mt-0.5 text-zinc-400">
                      <span className="text-zinc-300">{lead.contactName}</span>
                      <span className="mx-1.5 text-zinc-600" aria-hidden="true">
                        ·
                      </span>
                      <span>{lead.contactRole}</span>
                    </div>
                  </td>

                  {/* Region + Local Time + 9-6 Calling Window */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-mono">
                      <Clock className="w-3 h-3 text-zinc-500 shrink-0" />
                      <span className="text-zinc-100 tabular-nums font-medium">
                        {localTime.time12}
                      </span>
                      <span className="text-zinc-500">{localTime.tzShort}</span>
                      <span className="text-zinc-600" aria-hidden="true">
                        ·
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${
                          localTime.isInCallingWindow
                            ? 'text-emerald-400'
                            : 'text-zinc-500'
                        }`}
                      >
                        {localTime.isInCallingWindow && (
                          <PhoneCall className="w-2.5 h-2.5" />
                        )}
                        {localTime.isInCallingWindow ? 'In Window' : 'After Hours'}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-zinc-500">
                      {lead.city}, {lead.region}
                    </div>
                  </td>

                  {/* Software & Discipline */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-mono text-zinc-200">{lead.software}</div>
                    <div className="mt-0.5 text-[11px] text-zinc-500">
                      {lead.discipline}
                    </div>
                  </td>

                  {/* Stage Selector */}
                  <td
                    className="py-3 px-3 whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <select
                      aria-label={`Change pipeline stage for ${lead.studioName}`}
                      value={lead.stage}
                      onChange={(e) =>
                        onMoveStage(lead.id, e.target.value as PipelineStage)
                      }
                      className={`h-7 px-2 bg-[#0e0e0e] border rounded-xs text-[11px] font-mono font-medium cursor-pointer focus:outline-none focus:border-[#ea580c] ${stageAccent.border} ${stageAccent.text}`}
                    >
                      {PIPELINE_STAGES.map((stage) => (
                        <option
                          key={stage}
                          value={stage}
                          className="bg-[#141414] text-zinc-100"
                        >
                          {stage}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Budget */}
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <div className="font-mono font-semibold text-zinc-100 tabular-nums text-[13px]">
                      {formatBudget(lead.budgetAmount, lead.billingType)}
                    </div>
                    <div className="mt-0.5 text-[11px] text-zinc-500">
                      {lead.billingType}
                    </div>
                  </td>

                  {/* Setter */}
                  <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                    {lead.claimedBy ? (
                      <span className="text-zinc-300">{lead.claimedBy}</span>
                    ) : (
                      <span className="text-orange-400">Unclaimed</span>
                    )}
                  </td>

                  {/* Last Touch */}
                  <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-zinc-400 tabular-nums">
                    {formatRelativeTimestamp(lead.lastContactedAt)}
                  </td>

                  {/* Quick Actions */}
                  <td
                    className="py-3 px-3.5 text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => onQuickOutreach(lead, 'whatsapp')}
                        title={`WhatsApp ${lead.contactName}`}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-zinc-300 hover:text-emerald-300 bg-[#1a1a1a] hover:bg-emerald-500/10 border border-[#262626] hover:border-emerald-500/35 rounded-xs transition-colors"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>WA</span>
                      </a>

                      <a
                        href={emailUrl}
                        onClick={() => onQuickOutreach(lead, 'email')}
                        title={`Email ${lead.email}`}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-zinc-300 hover:text-sky-300 bg-[#1a1a1a] hover:bg-sky-500/10 border border-[#262626] hover:border-sky-500/35 rounded-xs transition-colors"
                      >
                        <Mail className="w-3 h-3" />
                        <span>Email</span>
                      </a>

                      {!lead.claimedBy ? (
                        <button
                          type="button"
                          onClick={() => onClaimLead(lead.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#fb923c] hover:text-white bg-[#ea580c]/15 hover:bg-[#ea580c] border border-[#ea580c]/50 rounded-xs transition-colors cursor-pointer"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>Claim</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSelectLead(lead)}
                          aria-label={`Inspect ${lead.studioName}`}
                          className="inline-flex items-center gap-0.5 px-2 py-1 text-[11px] text-zinc-400 hover:text-zinc-100 bg-[#1a1a1a] border border-[#262626] rounded-xs transition-colors cursor-pointer"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
