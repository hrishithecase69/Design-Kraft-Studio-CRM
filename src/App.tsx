import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { INITIAL_LEADS } from './data/initialLeads';
import type {
  ActivityType,
  CallOutcome,
  FilterState,
  Lead,
  PipelineStage,
  ToastMessage,
  ViewMode,
} from './types/crm';
import { getLocalTimeInfo } from './utils/time';
import { Header } from './components/Header';
import { PipelineToolbar } from './components/PipelineToolbar';
import { KanbanBoard } from './components/KanbanBoard';
import { DatagridTable } from './components/DatagridTable';
import { LeadDrawer } from './components/LeadDrawer';
import { NewLeadModal } from './components/NewLeadModal';

const STORAGE_KEY_LEADS = 'dks.crm.leads.v1';
const STORAGE_KEY_SETTER = 'dks.crm.setter.v1';
const SETTER_OPTIONS = ['Rohan K.', 'Meera S.', 'Vikram D.', 'Ananya P.'];

function loadStoredLeads(): Lead[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LEADS);
    if (!raw) return INITIAL_LEADS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as Lead[];
    }
  } catch {
    // Ignore storage parse failures
  }
  return INITIAL_LEADS;
}

function loadStoredSetter(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SETTER);
    if (saved && SETTER_OPTIONS.includes(saved)) {
      return saved;
    }
  } catch {
    // Ignore storage read errors
  }
  return SETTER_OPTIONS[0];
}

export function App() {
  const [leads, setLeads] = useState<Lead[]>(loadStoredLeads);
  const [activeSetter, setActiveSetter] = useState<string>(loadStoredSetter);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [manualTimeZone, setManualTimeZone] = useState<string>('America/New_York');
  const [hoveredTimeZone, setHoveredTimeZone] = useState<{
    tz: string;
    label: string;
  } | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newLeadInitialStage, setNewLeadInitialStage] =
    useState<PipelineStage>('New Inbound');
  const [now, setNow] = useState<Date>(() => new Date());
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    region: 'All',
    software: 'All',
    callingWindowOnly: false,
    claimedFilter: 'All',
  });

  // Live 1-second clock tick for IST vs Prospect timezones
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Persist leads to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(leads));
    } catch {
      // Ignore quota errors
    }
  }, [leads]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTER, activeSetter);
    } catch {
      // Ignore storage errors
    }
  }, [activeSetter]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const showToast = (message: string, detail?: string) => {
    setToast({ id: String(Date.now()), message, detail });
  };

  const selectedLead = useMemo(
    () => leads.find((l) => l.id === selectedLeadId) ?? null,
    [leads, selectedLeadId]
  );

  // Sync header prospect clock to hovered lead, then open drawer lead, then manual selector
  const activeProspectTimeZone =
    hoveredTimeZone?.tz ?? selectedLead?.timeZone ?? manualTimeZone;
  const activeProspectLabel =
    hoveredTimeZone?.label ?? selectedLead?.studioName ?? null;

  const filteredLeads = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return leads.filter((lead) => {
      if (filters.region !== 'All' && lead.region !== filters.region) {
        return false;
      }
      if (filters.software !== 'All' && lead.software !== filters.software) {
        return false;
      }
      if (filters.claimedFilter === 'Unclaimed' && lead.claimedBy !== null) {
        return false;
      }
      if (filters.claimedFilter === 'Mine' && lead.claimedBy !== activeSetter) {
        return false;
      }
      if (
        filters.callingWindowOnly &&
        !getLocalTimeInfo(lead.timeZone, now).isInCallingWindow
      ) {
        return false;
      }
      if (q) {
        const haystack = [
          lead.id,
          lead.studioName,
          lead.contactName,
          lead.contactRole,
          lead.city,
          lead.region,
          lead.software,
          lead.discipline,
          lead.projectScope,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [leads, filters, activeSetter, now]);

  const handleClaimLead = (leadId: string) => {
    const ts = new Date().toISOString();
    let studioLabel = '';
    let movedToClaimed = false;

    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id !== leadId) return lead;
        studioLabel = lead.studioName;
        const shouldAdvance = lead.stage === 'New Inbound';
        movedToClaimed = shouldAdvance;
        return {
          ...lead,
          claimedBy: activeSetter,
          stage: shouldAdvance ? 'Claimed' : lead.stage,
          activities: [
            {
              id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              type: 'claimed',
              timestamp: ts,
              author: activeSetter,
              summary: shouldAdvance
                ? `Claimed by ${activeSetter} and moved to Claimed`
                : `Lead ownership assigned to ${activeSetter}`,
            },
            ...lead.activities,
          ],
        };
      })
    );

    if (studioLabel) {
      showToast(
        `Claimed ${studioLabel}`,
        movedToClaimed
          ? `Assigned to ${activeSetter} · Moved to Claimed`
          : `Assigned to ${activeSetter}`
      );
    }
  };

  const handleMoveStage = (leadId: string, nextStage: PipelineStage) => {
    const ts = new Date().toISOString();
    let changedStudio: string | null = null;

    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id !== leadId || lead.stage === nextStage) return lead;
        changedStudio = lead.studioName;
        const previousStage = lead.stage;
        const assignedSetter =
          !lead.claimedBy && nextStage !== 'New Inbound'
            ? activeSetter
            : lead.claimedBy;

        return {
          ...lead,
          stage: nextStage,
          claimedBy: assignedSetter,
          activities: [
            {
              id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              type: 'stage_change',
              timestamp: ts,
              author: activeSetter,
              summary: `Moved from ${previousStage} to ${nextStage}`,
            },
            ...lead.activities,
          ],
        };
      })
    );

    if (changedStudio) {
      showToast(`${changedStudio}`, `Stage updated to ${nextStage}`);
    }
  };

  const handleQuickOutreach = (lead: Lead, channel: 'whatsapp' | 'email') => {
    const ts = new Date().toISOString();
    const label = channel === 'whatsapp' ? 'WhatsApp' : 'Email';

    setLeads((prev) =>
      prev.map((item) => {
        if (item.id !== lead.id) return item;
        return {
          ...item,
          lastContactedAt: ts,
          activities: [
            {
              id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              type: channel,
              timestamp: ts,
              author: activeSetter,
              summary: `Initiated 1-click ${label} outreach to ${item.contactName}`,
              outcome: 'Follow-up Sent',
            },
            ...item.activities,
          ],
        };
      })
    );

    showToast(
      `${label} outreach opened`,
      `Logged touchpoint for ${lead.studioName}`
    );
  };

  const handleAddActivity = (
    leadId: string,
    payload: {
      type: ActivityType;
      summary: string;
      outcome?: CallOutcome;
      details?: string;
    }
  ) => {
    const ts = new Date().toISOString();
    const isContactTouch =
      payload.type === 'call' ||
      payload.type === 'meeting' ||
      payload.type === 'whatsapp' ||
      payload.type === 'email';

    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id !== leadId) return lead;
        return {
          ...lead,
          lastContactedAt: isContactTouch ? ts : lead.lastContactedAt,
          activities: [
            {
              id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              type: payload.type,
              timestamp: ts,
              author: activeSetter,
              summary: payload.summary,
              outcome: payload.outcome,
              details: payload.details,
            },
            ...lead.activities,
          ],
        };
      })
    );

    showToast('Activity logged', payload.summary);
  };

  const handleUpdateLead = (
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
  ) => {
    setLeads((prev) =>
      prev.map((lead) => (lead.id === leadId ? { ...lead, ...updates } : lead))
    );
    showToast('Specifications updated');
  };

  const handleCreateLead = (newLead: Lead) => {
    setLeads((prev) => [newLead, ...prev]);
    setSelectedLeadId(newLead.id);
    showToast(`Added ${newLead.studioName}`, `Placed in ${newLead.stage}`);
  };

  const handleDeleteLead = (leadId: string) => {
    const target = leads.find((l) => l.id === leadId);
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    setSelectedLeadId(null);
    if (target) {
      showToast(`Removed ${target.studioName}`);
    }
  };

  const handleResetDemo = () => {
    setLeads(INITIAL_LEADS);
    setSelectedLeadId(null);
    setFilters({
      search: '',
      region: 'All',
      software: 'All',
      callingWindowOnly: false,
      claimedFilter: 'All',
    });
    showToast('Demo pipeline restored', '10 B2B architectural leads loaded');
  };

  const openNewLeadModal = (stage: PipelineStage = 'New Inbound') => {
    setNewLeadInitialStage(stage);
    setIsNewModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0b0b] text-zinc-100">
      <Header
        now={now}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onNewLead={() => openNewLeadModal('New Inbound')}
        selectedTimeZone={activeProspectTimeZone}
        selectedTimeZoneLabel={activeProspectLabel}
        onTimeZoneChange={(tz) => {
          setHoveredTimeZone(null);
          setManualTimeZone(tz);
        }}
      />

      <PipelineToolbar
        allLeads={leads}
        filteredCount={filteredLeads.length}
        filters={filters}
        onFiltersChange={setFilters}
        activeSetter={activeSetter}
        setterOptions={SETTER_OPTIONS}
        onSetterChange={setActiveSetter}
        onResetDemo={handleResetDemo}
        now={now}
      />

      <main className="flex-1 flex flex-col min-h-0">
        {viewMode === 'kanban' ? (
          <KanbanBoard
            leads={filteredLeads}
            now={now}
            activeSetter={activeSetter}
            selectedLeadId={selectedLeadId}
            onSelectLead={(lead) => setSelectedLeadId(lead.id)}
            onHoverTimeZone={(tz, label) =>
              setHoveredTimeZone(tz && label ? { tz, label } : null)
            }
            onClaimLead={handleClaimLead}
            onQuickOutreach={handleQuickOutreach}
            onMoveStage={handleMoveStage}
            onAddLeadInStage={(stage) => openNewLeadModal(stage)}
          />
        ) : (
          <DatagridTable
            leads={filteredLeads}
            now={now}
            activeSetter={activeSetter}
            selectedLeadId={selectedLeadId}
            onSelectLead={(lead) => setSelectedLeadId(lead.id)}
            onHoverTimeZone={(tz, label) =>
              setHoveredTimeZone(tz && label ? { tz, label } : null)
            }
            onClaimLead={handleClaimLead}
            onQuickOutreach={handleQuickOutreach}
            onMoveStage={handleMoveStage}
            onNewLead={() => openNewLeadModal('New Inbound')}
          />
        )}
      </main>

      <LeadDrawer
        lead={selectedLead}
        now={now}
        activeSetter={activeSetter}
        onClose={() => setSelectedLeadId(null)}
        onClaimLead={handleClaimLead}
        onMoveStage={handleMoveStage}
        onQuickOutreach={handleQuickOutreach}
        onAddActivity={handleAddActivity}
        onUpdateLead={handleUpdateLead}
        onDeleteLead={handleDeleteLead}
      />

      <NewLeadModal
        isOpen={isNewModalOpen}
        initialStage={newLeadInitialStage}
        now={now}
        activeSetter={activeSetter}
        onClose={() => setIsNewModalOpen(false)}
        onCreateLead={handleCreateLead}
      />

      {/* Quiet Toast Feedback */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 max-w-sm bg-[#141414] border border-[#3a3a3a] rounded-sm px-4 py-3 flex items-start gap-3 shadow-2xl"
        >
          <CheckCircle2 className="w-4 h-4 text-[#ea580c] shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="text-xs font-semibold text-zinc-100">
              {toast.message}
            </div>
            {toast.detail && (
              <div className="mt-0.5 text-[11px] font-mono text-zinc-400">
                {toast.detail}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="text-zinc-500 hover:text-zinc-200 cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
