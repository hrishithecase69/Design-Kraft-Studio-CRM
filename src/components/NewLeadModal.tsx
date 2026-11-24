import React, { useEffect, useState } from 'react';
import { X, Clock } from 'lucide-react';
import {
  PIPELINE_STAGES,
  type BillingType,
  type Lead,
  type PipelineStage,
  type ServiceDiscipline,
  type SoftwareStack,
} from '../types/crm';
import {
  getLocalTimeInfo,
  PROSPECT_TIMEZONE_PRESETS,
} from '../utils/time';

interface NewLeadModalProps {
  isOpen: boolean;
  initialStage: PipelineStage;
  now: Date;
  activeSetter: string;
  onClose: () => void;
  onCreateLead: (lead: Lead) => void;
}

export const NewLeadModal: React.FC<NewLeadModalProps> = ({
  isOpen,
  initialStage,
  now,
  activeSetter,
  onClose,
  onCreateLead,
}) => {
  const [studioName, setStudioName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('Principal Architect');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [tzPresetId, setTzPresetId] = useState(PROSPECT_TIMEZONE_PRESETS[0].id);
  const [budgetAmount, setBudgetAmount] = useState('3500');
  const [billingType, setBillingType] = useState<BillingType>('Monthly Retainer');
  const [software, setSoftware] = useState<SoftwareStack>('Revit');
  const [discipline, setDiscipline] =
    useState<ServiceDiscipline>('BIM Documentation');
  const [stage, setStage] = useState<PipelineStage>(initialStage);
  const [source, setSource] = useState('LinkedIn Outbound');
  const [projectScope, setProjectScope] = useState('');
  const [deliverableSpec, setDeliverableSpec] = useState('');
  const [claimImmediately, setClaimImmediately] = useState(false);

  useEffect(() => {
    setStage(initialStage);
  }, [initialStage, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const selectedPreset =
    PROSPECT_TIMEZONE_PRESETS.find((p) => p.id === tzPresetId) ??
    PROSPECT_TIMEZONE_PRESETS[0];
  const previewTime = getLocalTimeInfo(selectedPreset.timeZone, now);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studioName.trim() || !contactName.trim() || !email.trim()) return;

    const cleanPhone = phone.trim() || '+1 (212) 555-0199';
    const whatsappDigits = cleanPhone.replace(/[^\d]/g, '') || '12125550199';
    const numericBudget = Math.max(50, Number(budgetAmount) || 100);
    const createdIso = new Date().toISOString();
    const randomNum = Math.floor(1051 + Math.random() * 8900);

    const newLead: Lead = {
      id: `DKS-${randomNum}`,
      studioName: studioName.trim(),
      contactName: contactName.trim(),
      contactRole: contactRole.trim() || 'Director',
      email: email.trim(),
      phone: cleanPhone,
      whatsappNumber: whatsappDigits,
      region: selectedPreset.region,
      city: selectedPreset.city,
      timeZone: selectedPreset.timeZone,
      budgetAmount: numericBudget,
      billingType,
      software,
      discipline,
      stage: claimImmediately && stage === 'New Inbound' ? 'Claimed' : stage,
      claimedBy: claimImmediately ? activeSetter : null,
      source,
      projectScope:
        projectScope.trim() ||
        `${software} ${discipline.toLowerCase()} production support for upcoming studio deliverables.`,
      deliverableSpec:
        deliverableSpec.trim() || `${software} native files · Local redline standards`,
      createdAt: createdIso,
      lastContactedAt: null,
      nextFollowUp: 'First touch during 9–6 local window',
      activities: [
        {
          id: `act-${Date.now()}`,
          type: claimImmediately ? 'claimed' : 'note',
          timestamp: createdIso,
          author: claimImmediately ? activeSetter : 'Inbound System',
          summary: claimImmediately
            ? `Created and claimed lead (${activeSetter})`
            : `Added new B2B studio inquiry to ${stage}`,
        },
      ],
    };

    onCreateLead(newLead);

    // Reset form
    setStudioName('');
    setContactName('');
    setEmail('');
    setPhone('');
    setProjectScope('');
    setDeliverableSpec('');
    setClaimImmediately(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-lead-modal-title"
    >
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-2xl bg-[#141414] border border-[#262626] rounded-sm overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#262626] bg-[#101010] flex items-center justify-between">
          <div>
            <h2
              id="new-lead-modal-title"
              className="text-base font-semibold text-zinc-100"
            >
              Add B2B Architectural Lead
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Create a new drafting, BIM, or millwork opportunity in the DKS pipeline.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-[#222222] rounded-xs cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs text-zinc-300 mb-1">
                Architecture / Millwork Studio <span className="text-[#ea580c]">*</span>
              </label>
              <input
                type="text"
                required
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                placeholder="e.g. Mercer & Ward Architects"
                className="w-full h-9 px-3 bg-[#0e0e0e] border border-[#262626] rounded-xs text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#ea580c]"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-300 mb-1">
                Contact Person <span className="text-[#ea580c]">*</span>
              </label>
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Claire Sutton, AIA"
                className="w-full h-9 px-3 bg-[#0e0e0e] border border-[#262626] rounded-xs text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#ea580c]"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-300 mb-1">Role / Title</label>
              <input
                type="text"
                value={contactRole}
                onChange={(e) => setContactRole(e.target.value)}
                placeholder="e.g. Studio Director"
                className="w-full h-9 px-3 bg-[#0e0e0e] border border-[#262626] rounded-xs text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#ea580c]"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-300 mb-1">
                Work Email <span className="text-[#ea580c]">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="claire@mercerward.com"
                className="w-full h-9 px-3 bg-[#0e0e0e] border border-[#262626] rounded-xs text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#ea580c]"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-300 mb-1">
                Phone / WhatsApp
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (212) 555-0194"
                className="w-full h-9 px-3 bg-[#0e0e0e] border border-[#262626] rounded-xs text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#ea580c]"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-300 mb-1">
                Market & Timezone
              </label>
              <select
                value={tzPresetId}
                onChange={(e) => setTzPresetId(e.target.value)}
                className="w-full h-9 px-2.5 bg-[#0e0e0e] border border-[#262626] rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-[#ea580c] cursor-pointer"
              >
                {PROSPECT_TIMEZONE_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id} className="bg-[#141414]">
                    {preset.label}
                  </option>
                ))}
              </select>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
                <Clock className="w-3 h-3" />
                <span className="tabular-nums text-zinc-300">
                  {previewTime.time12} {previewTime.tzShort}
                </span>
                <span aria-hidden="true">·</span>
                <span
                  className={
                    previewTime.isInCallingWindow ? 'text-emerald-400' : 'text-zinc-500'
                  }
                >
                  {previewTime.isInCallingWindow ? '9–6 Open' : 'After Hours'}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-[#222222] pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs text-zinc-300 mb-1">
                Deal Value (USD)
              </label>
              <input
                type="number"
                min={50}
                step={50}
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                className="w-full h-9 px-3 bg-[#0e0e0e] border border-[#262626] rounded-xs text-xs font-mono text-zinc-100 focus:outline-none focus:border-[#ea580c]"
              />
              <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => {
                    setBudgetAmount('100');
                    setBillingType('Pilot Sheet');
                  }}
                  className="text-zinc-400 hover:text-[#ea580c] underline cursor-pointer"
                >
                  $100 Pilot
                </button>
                <span className="text-zinc-600">·</span>
                <button
                  type="button"
                  onClick={() => {
                    setBudgetAmount('4500');
                    setBillingType('Monthly Retainer');
                  }}
                  className="text-zinc-400 hover:text-[#ea580c] underline cursor-pointer"
                >
                  $4,500/mo
                </button>
                <span className="text-zinc-600">·</span>
                <button
                  type="button"
                  onClick={() => {
                    setBudgetAmount('7999');
                    setBillingType('Monthly Retainer');
                  }}
                  className="text-zinc-400 hover:text-[#ea580c] underline cursor-pointer"
                >
                  $7,999/mo
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-300 mb-1">
                Engagement Type
              </label>
              <select
                value={billingType}
                onChange={(e) => setBillingType(e.target.value as BillingType)}
                className="w-full h-9 px-2.5 bg-[#0e0e0e] border border-[#262626] rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-[#ea580c]"
              >
                <option value="Pilot Sheet">Pilot Sheet</option>
                <option value="Fixed Scope">Fixed Scope</option>
                <option value="Monthly Retainer">Monthly Retainer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-300 mb-1">
                CAD / BIM Software
              </label>
              <select
                value={software}
                onChange={(e) => setSoftware(e.target.value as SoftwareStack)}
                className="w-full h-9 px-2.5 bg-[#0e0e0e] border border-[#262626] rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-[#ea580c]"
              >
                <option value="Revit">Revit</option>
                <option value="AutoCAD">AutoCAD</option>
                <option value="Revit + AutoCAD">Revit + AutoCAD</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-300 mb-1">Discipline</label>
              <select
                value={discipline}
                onChange={(e) =>
                  setDiscipline(e.target.value as ServiceDiscipline)
                }
                className="w-full h-9 px-2.5 bg-[#0e0e0e] border border-[#262626] rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-[#ea580c]"
              >
                <option value="Architectural Drafting">Architectural Drafting</option>
                <option value="BIM Documentation">BIM Documentation</option>
                <option value="Millwork Detailing">Millwork Detailing</option>
                <option value="Permit & CD Sets">Permit & CD Sets</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-300 mb-1">
                Pipeline Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as PipelineStage)}
                className="w-full h-9 px-2.5 bg-[#0e0e0e] border border-[#262626] rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-[#ea580c]"
              >
                {PIPELINE_STAGES.map((st) => (
                  <option key={st} value={st} className="bg-[#141414]">
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-300 mb-1">Lead Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full h-9 px-2.5 bg-[#0e0e0e] border border-[#262626] rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-[#ea580c]"
              >
                <option value="DKS Website Form">DKS Website Form</option>
                <option value="LinkedIn Outbound">LinkedIn Outbound</option>
                <option value="Cold Email Campaign">Cold Email Campaign</option>
                <option value="Referral">Referral</option>
                <option value="AIA / RIBA Directory">AIA / RIBA Directory</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-zinc-300 mb-1">
                Project Scope & Sheet Requirements
              </label>
              <textarea
                rows={2}
                value={projectScope}
                onChange={(e) => setProjectScope(e.target.value)}
                placeholder="e.g. 24-sheet commercial tenant improvement permit set in Revit 2025..."
                className="w-full p-2.5 bg-[#0e0e0e] border border-[#262626] rounded-xs text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#ea580c] resize-none"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-300 mb-1">
                CAD / BIM Standard Notes
              </label>
              <input
                type="text"
                value={deliverableSpec}
                onChange={(e) => setDeliverableSpec(e.target.value)}
                placeholder="e.g. AIA layering · AWI Premium millwork sections · LOD 350"
                className="w-full h-9 px-3 bg-[#0e0e0e] border border-[#262626] rounded-xs text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#ea580c]"
              />
            </div>

            <label className="inline-flex items-center gap-2 text-xs text-zinc-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={claimImmediately}
                onChange={(e) => setClaimImmediately(e.target.checked)}
                className="accent-[#ea580c] w-3.5 h-3.5"
              />
              <span>Assign and claim immediately as {activeSetter}</span>
            </label>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-[#262626] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#ea580c] hover:bg-[#f97316] rounded-sm transition-colors cursor-pointer"
            >
              Create Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
