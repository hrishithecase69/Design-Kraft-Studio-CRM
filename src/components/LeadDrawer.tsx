import React, { useEffect, useState } from 'react';
import {
  X,
  MessageCircle,
  Mail,
  UserPlus,
  Copy,
  Check,
  Clock,
  PhoneCall,
  Calendar,
  FileText,
  Send,
  Pencil,
  Trash2,
  Layers,
  MapPin,
} from 'lucide-react';
import {
  PIPELINE_STAGES,
  type ActivityType,
  type BillingType,
  type CallOutcome,
  type Lead,
  type PipelineStage,
  type SoftwareStack,
} from '../types/crm';
import {
  formatActivityDate,
  getISTClock,
  getLocalTimeInfo,
} from '../utils/time';
import {
  buildEmailUrl,
  buildWhatsAppUrl,
  formatBudget,
  getStageAccentStyle,
} from '../utils/outreach';

interface LeadDrawerProps {
  lead: Lead | null;
  now: Date;
  activeSetter: string;
  onClose: () => void;
  onClaimLead: (leadId: string) => void;
  onMoveStage: (leadId: string, nextStage: PipelineStage) => void;
  onQuickOutreach: (lead: Lead, channel: 'whatsapp' | 'email') => void;
  onAddActivity: (
    leadId: string,
    payload: {
      type: ActivityType;
      summary: string;
      outcome?: CallOutcome;
      details?: string;
    }
  ) => void;
  onUpdateLead: (
    leadId: string,
    updates: Partial<
      Pick<
        Lead,
        | 'budgetAmount'
        | 'billingType'
        | 'software'
        | 'projectScope'
        | 'deliverableSpec'
        | 'nextFollowUp'
      >
    >
  ) => void;
  onDeleteLead: (leadId: string) => void;
}

const LOG_TYPES: Array<{ value: ActivityType; label: string }> = [
  { value: 'call', label: 'Call' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'note', label: 'Note' },
];

const CALL_OUTCOMES: CallOutcome[] = [
  'Connected',
  'Call Booked',
  'Scope Confirmed',
  'Follow-up Sent',
  'Voicemail',
  'No Answer',
];

export const LeadDrawer: React.FC<LeadDrawerProps> = ({
  lead,
  now,
  activeSetter,
  onClose,
  onClaimLead,
  onMoveStage,
  onQuickOutreach,
  onAddActivity,
  onUpdateLead,
  onDeleteLead,
}) => {
  const [noteType, setNoteType] = useState<ActivityType>('call');
  const [outcome, setOutcome] = useState<CallOutcome>('Connected');
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [copiedField, setCopiedField] = useState<'email' | 'phone' | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Edit form state
  const [editBudget, setEditBudget] = useState('');
  const [editBilling, setEditBilling] = useState<BillingType>('Monthly Retainer');
  const [editSoftware, setEditSoftware] = useState<SoftwareStack>('Revit');
  const [editFollowUp, setEditFollowUp] = useState('');
  const [editScope, setEditScope] = useState('');
  const [editDeliverable, setEditDeliverable] = useState('');

  useEffect(() => {
    if (!lead) return;
    setEditBudget(String(lead.budgetAmount));
    setEditBilling(lead.billingType);
    setEditSoftware(lead.software);
    setEditFollowUp(lead.nextFollowUp ?? '');
    setEditScope(lead.projectScope);
    setEditDeliverable(lead.deliverableSpec);
    setIsEditing(false);
    setConfirmDelete(false);
  }, [lead?.id]);

  useEffect(() => {
    if (!lead) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lead, onClose]);

  if (!lead) return null;

  const localTime = getLocalTimeInfo(lead.timeZone, now);
  const istClock = getISTClock(now);
  const whatsappUrl = buildWhatsAppUrl(lead, activeSetter);
  const emailUrl = buildEmailUrl(lead, activeSetter);

  const handleCopy = async (value: string, field: 'email' | 'phone') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1600);
    } catch {
      // Clipboard API may be restricted in some iframe contexts
    }
  };

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSummary = summary.trim();
    if (!trimmedSummary) return;

    onAddActivity(lead.id, {
      type: noteType,
      summary: trimmedSummary,
      outcome: noteType === 'note' ? undefined : outcome,
      details: details.trim() || undefined,
    });
    setSummary('');
    setDetails('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedBudget = Math.max(0, Number(editBudget) || lead.budgetAmount);
    onUpdateLead(lead.id, {
      budgetAmount: parsedBudget,
      billingType: editBilling,
      software: editSoftware,
      nextFollowUp: editFollowUp.trim() || null,
      projectScope: editScope.trim() || lead.projectScope,
      deliverableSpec: editDeliverable.trim() || lead.deliverableSpec,
    });
    setIsEditing(false);
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'call':
        return <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />;
      case 'meeting':
        return <Calendar className="w-3.5 h-3.5 text-indigo-400" />;
      case 'whatsapp':
        return <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />;
      case 'email':
        return <Mail className="w-3.5 h-3.5 text-sky-400" />;
      case 'claimed':
        return <UserPlus className="w-3.5 h-3.5 text-[#ea580c]" />;
      case 'stage_change':
        return <Layers className="w-3.5 h-3.5 text-amber-400" />;
      case 'note':
      default:
        return <FileText className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-studio-title"
    >
      {/* Backdrop Scrim */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/65 transition-opacity"
        aria-hidden="true"
      />

      {/* Slide-Over Panel */}
      <aside className="relative z-10 w-full max-w-[560px] h-full bg-[#141414] border-l border-[#262626] flex flex-col overflow-hidden">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-[#262626] bg-[#101010] flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
              <span>{lead.id}</span>
              <span aria-hidden="true">·</span>
              <span>{lead.source}</span>
              <span aria-hidden="true">·</span>
              <span className="text-zinc-300">
                {lead.claimedBy ? `Setter: ${lead.claimedBy}` : 'Unclaimed'}
              </span>
            </div>
            <h2
              id="drawer-studio-title"
              className="mt-1 text-lg font-semibold text-zinc-100 leading-tight"
            >
              {lead.studioName}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              <span className="text-zinc-200 font-medium">{lead.contactName}</span>
              <span className="mx-1.5 text-zinc-600" aria-hidden="true">
                ·
              </span>
              <span>{lead.contactRole}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close lead details"
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-[#222222] rounded-xs transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Drawer Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Live Prospect Clock vs IST Bar */}
          <div className="p-3.5 bg-[#0e0e0e] border border-[#262626] rounded-sm flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <MapPin className="w-3.5 h-3.5 text-[#ea580c]" />
                <span>
                  {lead.city}, {lead.region}
                </span>
                <span className="text-zinc-600" aria-hidden="true">
                  ·
                </span>
                <span className="font-mono text-[11px] text-zinc-500">
                  {localTime.offsetFromIST}
                </span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-2.5 font-mono">
                <span className="text-base font-semibold text-zinc-100 tabular-nums">
                  {localTime.timeWithSeconds}
                </span>
                <span className="text-xs text-zinc-400">
                  {localTime.tzShort} ({localTime.dayShort})
                </span>
              </div>
            </div>

            <div className="text-right">
              <div
                className={`inline-flex items-center gap-1.5 text-xs font-mono font-medium ${
                  localTime.isInCallingWindow ? 'text-emerald-400' : 'text-zinc-500'
                }`}
              >
                {localTime.isInCallingWindow ? (
                  <PhoneCall className="w-3.5 h-3.5" />
                ) : (
                  <Clock className="w-3.5 h-3.5" />
                )}
                <span>{localTime.windowLabel}</span>
              </div>
              <div className="mt-1 text-[11px] font-mono text-zinc-500 tabular-nums">
                IST: {istClock.time}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onQuickOutreach(lead, 'whatsapp')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/35 rounded-sm transition-colors whitespace-nowrap"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>

            <a
              href={emailUrl}
              onClick={() => onQuickOutreach(lead, 'email')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/35 rounded-sm transition-colors whitespace-nowrap"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Send Email</span>
            </a>

            <button
              type="button"
              onClick={() => handleCopy(lead.phone, 'phone')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono text-zinc-300 bg-[#1a1a1a] hover:bg-[#222222] border border-[#262626] rounded-sm transition-colors whitespace-nowrap cursor-pointer"
            >
              {copiedField === 'phone' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
              )}
              <span>{lead.phone}</span>
            </button>

            <button
              type="button"
              onClick={() => handleCopy(lead.email, 'email')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono text-zinc-300 bg-[#1a1a1a] hover:bg-[#222222] border border-[#262626] rounded-sm transition-colors whitespace-nowrap cursor-pointer"
            >
              {copiedField === 'email' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
              )}
              <span className="max-w-[180px] truncate">{lead.email}</span>
            </button>

            {lead.claimedBy !== activeSetter && (
              <button
                type="button"
                onClick={() => onClaimLead(lead.id)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#ea580c] hover:bg-[#f97316] rounded-sm transition-colors whitespace-nowrap cursor-pointer ml-auto"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>
                  {lead.claimedBy ? `Take Over (${activeSetter})` : 'Claim Lead'}
                </span>
              </button>
            )}
          </div>

          {/* Pipeline Stage Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-400">
                Pipeline Stage
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                Stage {PIPELINE_STAGES.indexOf(lead.stage) + 1} of{' '}
                {PIPELINE_STAGES.length}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {PIPELINE_STAGES.map((stage) => {
                const isActive = lead.stage === stage;
                const style = getStageAccentStyle(stage);
                return (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => onMoveStage(lead.id, stage)}
                    className={`px-2 py-1.5 text-[11px] font-mono rounded-xs border text-left truncate transition-colors cursor-pointer ${
                      isActive
                        ? `bg-[#1d1917] ${style.border} ${style.text} font-semibold`
                        : 'bg-[#0f0f0f] border-[#222222] text-zinc-400 hover:text-zinc-200 hover:border-[#333333]'
                    }`}
                  >
                    {stage}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Commercial & Technical Dossier */}
          <div className="border-t border-[#262626] pt-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-zinc-200">
                Project & Technical Specifications
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing((v) => !v)}
                className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-[#ea580c] transition-colors cursor-pointer"
              >
                <Pencil className="w-3 h-3" />
                <span>{isEditing ? 'Cancel' : 'Edit Spec'}</span>
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="space-y-3 bg-[#0f0f0f] p-3.5 border border-[#262626] rounded-sm">
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                      Budget (USD)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editBudget}
                      onChange={(e) => setEditBudget(e.target.value)}
                      className="w-full h-8 px-2.5 bg-[#141414] border border-[#262626] rounded-xs text-xs font-mono text-zinc-100 focus:outline-none focus:border-[#ea580c]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                      Billing Model
                    </label>
                    <select
                      value={editBilling}
                      onChange={(e) => setEditBilling(e.target.value as BillingType)}
                      className="w-full h-8 px-2 bg-[#141414] border border-[#262626] rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-[#ea580c]"
                    >
                      <option value="Pilot Sheet">Pilot Sheet</option>
                      <option value="Fixed Scope">Fixed Scope</option>
                      <option value="Monthly Retainer">Monthly Retainer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                      Software
                    </label>
                    <select
                      value={editSoftware}
                      onChange={(e) =>
                        setEditSoftware(e.target.value as SoftwareStack)
                      }
                      className="w-full h-8 px-2 bg-[#141414] border border-[#262626] rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-[#ea580c]"
                    >
                      <option value="Revit">Revit</option>
                      <option value="AutoCAD">AutoCAD</option>
                      <option value="Revit + AutoCAD">Revit + AutoCAD</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                    Next Follow-Up
                  </label>
                  <input
                    type="text"
                    value={editFollowUp}
                    onChange={(e) => setEditFollowUp(e.target.value)}
                    placeholder="e.g. Tomorrow · 10:30 AM ET"
                    className="w-full h-8 px-2.5 bg-[#141414] border border-[#262626] rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-[#ea580c]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                    Project Scope
                  </label>
                  <textarea
                    rows={2}
                    value={editScope}
                    onChange={(e) => setEditScope(e.target.value)}
                    className="w-full p-2.5 bg-[#141414] border border-[#262626] rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-[#ea580c]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                    CAD / BIM Deliverable Standard
                  </label>
                  <input
                    type="text"
                    value={editDeliverable}
                    onChange={(e) => setEditDeliverable(e.target.value)}
                    className="w-full h-8 px-2.5 bg-[#141414] border border-[#262626] rounded-xs text-xs font-mono text-zinc-100 focus:outline-none focus:border-[#ea580c]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#ea580c] hover:bg-[#f97316] rounded-xs cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-[#222222]">
                  <div>
                    <dt className="text-[11px] text-zinc-500">Deal Value</dt>
                    <dd className="mt-0.5 text-sm font-mono font-semibold text-zinc-100 tabular-nums">
                      {formatBudget(lead.budgetAmount, lead.billingType)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-zinc-500">Model</dt>
                    <dd className="mt-0.5 text-xs font-medium text-zinc-200">
                      {lead.billingType}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-zinc-500">Software</dt>
                    <dd className="mt-0.5 text-xs font-mono text-zinc-200">
                      {lead.software}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-zinc-500">Discipline</dt>
                    <dd className="mt-0.5 text-xs text-zinc-200">
                      {lead.discipline}
                    </dd>
                  </div>
                </dl>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-zinc-500 block mb-0.5">Scope Summary</span>
                    <p className="text-zinc-200 leading-relaxed">{lead.projectScope}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 block mb-0.5">
                      Deliverable Standard
                    </span>
                    <p className="font-mono text-[11px] text-zinc-300">
                      {lead.deliverableSpec}
                    </p>
                  </div>
                  {lead.nextFollowUp && (
                    <div>
                      <span className="text-zinc-500 block mb-0.5">
                        Next Action
                      </span>
                      <p className="font-mono text-[11px] text-orange-300">
                        {lead.nextFollowUp}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Log Call / Meeting Note Form */}
          <div className="border-t border-[#262626] pt-5">
            <h3 className="text-xs font-semibold text-zinc-200 mb-3">
              Log Call, Meeting, or Outreach Note
            </h3>
            <form
              onSubmit={handleSubmitNote}
              className="bg-[#0e0e0e] border border-[#262626] rounded-sm p-3.5 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div
                  role="group"
                  aria-label="Activity type"
                  className="flex items-center gap-1"
                >
                  {LOG_TYPES.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setNoteType(item.value)}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-xs transition-colors cursor-pointer ${
                        noteType === item.value
                          ? 'bg-[#262626] text-zinc-100'
                          : 'text-zinc-500 hover:text-zinc-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {noteType !== 'note' && (
                  <select
                    aria-label="Interaction outcome"
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value as CallOutcome)}
                    className="h-7 px-2 bg-[#141414] border border-[#262626] rounded-xs text-[11px] font-mono text-zinc-200 focus:outline-none focus:border-[#ea580c] cursor-pointer"
                  >
                    {CALL_OUTCOMES.map((opt) => (
                      <option key={opt} value={opt} className="bg-[#141414]">
                        {opt}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Headline (e.g. Spoke with Principal — requested $100 pilot sheet)"
                required
                className="w-full h-9 px-3 bg-[#141414] border border-[#262626] rounded-xs text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#ea580c]"
              />

              <textarea
                rows={2}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Optional technical details, Revit version, sheet count, or next step..."
                className="w-full p-3 bg-[#141414] border border-[#262626] rounded-xs text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#ea580c] resize-none"
              />

              <div className="flex items-center justify-between pt-0.5">
                <span className="text-[11px] font-mono text-zinc-500">
                  Logging as {activeSetter}
                </span>
                <button
                  type="submit"
                  disabled={!summary.trim()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#ea580c] hover:bg-[#f97316] disabled:opacity-40 disabled:cursor-not-allowed rounded-xs transition-colors cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>Log Activity</span>
                </button>
              </div>
            </form>
          </div>

          {/* Activity Timeline */}
          <div className="border-t border-[#262626] pt-5">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-xs font-semibold text-zinc-200">
                Activity Timeline
              </h3>
              <span className="text-[11px] font-mono text-zinc-500 tabular-nums">
                {lead.activities.length}{' '}
                {lead.activities.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>

            {lead.activities.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4">
                No calls or notes logged yet.
              </p>
            ) : (
              <ol className="space-y-4">
                {lead.activities.map((entry) => (
                  <li
                    key={entry.id}
                    className="relative pl-7 pb-4 border-b border-[#1f1f1f] last:border-b-0 last:pb-0"
                  >
                    <span className="absolute left-0 top-0.5 w-5 h-5 rounded-xs bg-[#1a1a1a] border border-[#262626] flex items-center justify-center">
                      {getActivityIcon(entry.type)}
                    </span>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-xs font-medium text-zinc-100">
                        {entry.summary}
                      </span>
                      <time className="text-[11px] font-mono text-zinc-500 tabular-nums">
                        {formatActivityDate(entry.timestamp)} IST
                      </time>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] font-mono text-zinc-500">
                      <span>{entry.author}</span>
                      {entry.outcome && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-zinc-300">{entry.outcome}</span>
                        </>
                      )}
                    </div>
                    {entry.details && (
                      <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
                        {entry.details}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-3 border-t border-[#262626] bg-[#101010] flex items-center justify-between shrink-0">
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Lead</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400">Delete this lead?</span>
              <button
                type="button"
                onClick={() => onDeleteLead(lead.id)}
                className="px-2.5 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xs cursor-pointer"
              >
                Confirm Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-[#1a1a1a] border border-[#262626] rounded-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </aside>
    </div>
  );
};
