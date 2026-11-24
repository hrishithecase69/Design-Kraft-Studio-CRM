import React from 'react';
import {
  Mail,
  MessageCircle,
  UserPlus,
  Clock,
  PhoneCall,
  GripVertical,
} from 'lucide-react';
import type { Lead } from '../types/crm';
import { getLocalTimeInfo } from '../utils/time';
import {
  buildEmailUrl,
  buildWhatsAppUrl,
  formatBudget,
} from '../utils/outreach';

interface LeadCardProps {
  lead: Lead;
  now: Date;
  activeSetter: string;
  isSelected: boolean;
  onSelect: (lead: Lead) => void;
  onHoverTimeZone: (tz: string | null, label: string | null) => void;
  onClaim: (leadId: string) => void;
  onQuickOutreach: (lead: Lead, channel: 'whatsapp' | 'email') => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, leadId: string) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  now,
  activeSetter,
  isSelected,
  onSelect,
  onHoverTimeZone,
  onClaim,
  onQuickOutreach,
  onDragStart,
}) => {
  const localTime = getLocalTimeInfo(lead.timeZone, now);
  const whatsappUrl = buildWhatsAppUrl(lead, activeSetter);
  const emailUrl = buildEmailUrl(lead, activeSetter);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead.id)}
      onClick={() => onSelect(lead)}
      onMouseEnter={() => onHoverTimeZone(lead.timeZone, lead.studioName)}
      onMouseLeave={() => onHoverTimeZone(null, null)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(lead);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Inspect ${lead.studioName} — ${lead.contactName}`}
      className={`group bg-[#141414] border rounded-sm p-3.5 transition-colors duration-150 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ea580c] ${
        isSelected
          ? 'border-[#ea580c] bg-[#191614]'
          : 'border-[#262626] hover:border-[#404040] hover:bg-[#171717]'
      }`}
    >
      {/* Row 1: Studio Name + Drag Grip & ID */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[13px] font-semibold text-zinc-100 leading-snug group-hover:text-white transition-colors">
          {lead.studioName}
        </h3>
        <div className="flex items-center gap-1 shrink-0 pt-0.5">
          <span className="text-[10px] font-mono text-zinc-500 tabular-nums">
            {lead.id}
          </span>
          <GripVertical
            className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 cursor-grab active:cursor-grabbing"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Row 2: Contact Person & Role */}
      <div className="mt-1 text-xs text-zinc-400 truncate">
        <span className="text-zinc-300">{lead.contactName}</span>
        <span className="text-zinc-600 mx-1.5" aria-hidden="true">
          ·
        </span>
        <span>{lead.contactRole}</span>
      </div>

      {/* Row 3: Budget + Software & Billing Metadata (unboxed text, tabular-nums) */}
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="text-sm font-mono font-semibold text-zinc-100 tabular-nums">
          {formatBudget(lead.budgetAmount, lead.billingType)}
        </span>
        <div className="text-[11px] font-mono text-zinc-400 truncate">
          <span>{lead.software}</span>
          <span className="text-zinc-600 mx-1" aria-hidden="true">
            /
          </span>
          <span className="text-zinc-500">{lead.region}</span>
        </div>
      </div>

      {/* Row 4: Discipline & Billing Type */}
      <div className="mt-1 text-[11px] text-zinc-500 truncate">
        <span>{lead.discipline}</span>
        <span className="mx-1.5 text-zinc-600" aria-hidden="true">
          ·
        </span>
        <span>{lead.billingType}</span>
      </div>

      {/* Row 5: Prospect Local Time & 9 AM–6 PM Calling Window Indicator */}
      <div className="mt-3 px-2.5 py-1.5 bg-[#0e0e0e] border border-[#222222] rounded-xs flex items-center justify-between gap-2 text-[11px] font-mono">
        <div className="flex items-center gap-1.5 text-zinc-300 min-w-0">
          <Clock className="w-3 h-3 text-zinc-500 shrink-0" />
          <span className="tabular-nums text-zinc-100">{localTime.time12}</span>
          <span className="text-zinc-500 truncate">{localTime.tzShort}</span>
        </div>
        <div
          className={`inline-flex items-center gap-1 shrink-0 font-medium ${
            localTime.isInCallingWindow ? 'text-emerald-400' : 'text-zinc-500'
          }`}
        >
          {localTime.isInCallingWindow && (
            <PhoneCall className="w-2.5 h-2.5 shrink-0" />
          )}
          <span>{localTime.isInCallingWindow ? '9–6 Open' : 'Closed'}</span>
        </div>
      </div>

      {/* Row 6: Quick Actions Footer */}
      <div className="mt-3 pt-2.5 border-t border-[#222222] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              onQuickOutreach(lead, 'whatsapp');
            }}
            title={`WhatsApp ${lead.contactName}`}
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-zinc-300 hover:text-emerald-300 bg-[#1a1a1a] hover:bg-emerald-500/10 border border-[#262626] hover:border-emerald-500/35 rounded-xs transition-colors whitespace-nowrap"
          >
            <MessageCircle className="w-3 h-3" />
            <span>WA</span>
          </a>

          <a
            href={emailUrl}
            onClick={(e) => {
              e.stopPropagation();
              onQuickOutreach(lead, 'email');
            }}
            title={`Email ${lead.email}`}
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-zinc-300 hover:text-sky-300 bg-[#1a1a1a] hover:bg-sky-500/10 border border-[#262626] hover:border-sky-500/35 rounded-xs transition-colors whitespace-nowrap"
          >
            <Mail className="w-3 h-3" />
            <span>Email</span>
          </a>
        </div>

        {!lead.claimedBy ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClaim(lead.id);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#fb923c] hover:text-white bg-[#ea580c]/15 hover:bg-[#ea580c] border border-[#ea580c]/50 rounded-xs transition-colors whitespace-nowrap cursor-pointer"
          >
            <UserPlus className="w-3 h-3" />
            <span>Claim Lead</span>
          </button>
        ) : (
          <span className="text-[11px] font-mono text-zinc-400 truncate">
            {lead.claimedBy}
          </span>
        )}
      </div>
    </div>
  );
};
