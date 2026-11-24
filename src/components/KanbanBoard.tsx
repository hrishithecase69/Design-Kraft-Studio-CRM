import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { PIPELINE_STAGES, type Lead, type PipelineStage } from '../types/crm';
import { formatCurrencyCompact, getStageAccentStyle } from '../utils/outreach';
import { LeadCard } from './LeadCard';

interface KanbanBoardProps {
  leads: Lead[];
  now: Date;
  activeSetter: string;
  selectedLeadId: string | null;
  onSelectLead: (lead: Lead) => void;
  onHoverTimeZone: (tz: string | null, label: string | null) => void;
  onClaimLead: (leadId: string) => void;
  onQuickOutreach: (lead: Lead, channel: 'whatsapp' | 'email') => void;
  onMoveStage: (leadId: string, nextStage: PipelineStage) => void;
  onAddLeadInStage: (stage: PipelineStage) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  leads,
  now,
  activeSetter,
  selectedLeadId,
  onSelectLead,
  onHoverTimeZone,
  onClaimLead,
  onQuickOutreach,
  onMoveStage,
  onAddLeadInStage,
}) => {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, leadId: string) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>, stage: PipelineStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stage) {
      setDragOverStage(stage);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLElement>, stage: PipelineStage) => {
    const related = e.relatedTarget as Node | null;
    if (!e.currentTarget.contains(related) && dragOverStage === stage) {
      setDragOverStage(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>, targetStage: PipelineStage) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    if (leadId) {
      onMoveStage(leadId, targetStage);
    }
    setDraggedLeadId(null);
    setDragOverStage(null);
  };

  return (
    <div
      className="flex-1 overflow-x-auto overflow-y-hidden bg-[#0b0b0b]"
      aria-label="8-stage architectural sales Kanban pipeline"
    >
      <div className="inline-flex h-full min-h-[calc(100vh-195px)] px-4 lg:px-6 py-4 gap-3.5 align-top">
        {PIPELINE_STAGES.map((stage, index) => {
          const stageLeads = leads.filter((l) => l.stage === stage);
          const stageSum = stageLeads.reduce((acc, l) => acc + l.budgetAmount, 0);
          const accent = getStageAccentStyle(stage);
          const isDropTarget = dragOverStage === stage;

          return (
            <section
              key={stage}
              onDragOver={(e) => handleDragOver(e, stage)}
              onDragLeave={(e) => handleDragLeave(e, stage)}
              onDrop={(e) => handleDrop(e, stage)}
              aria-label={`${stage} stage (${stageLeads.length} leads)`}
              className={`w-[304px] shrink-0 flex flex-col rounded-sm border transition-colors duration-150 ${
                isDropTarget
                  ? 'bg-[#17120e] border-[#ea580c]'
                  : 'bg-[#0f0f0f] border-[#1f1f1f]'
              }`}
            >
              {/* Thin top stage rail */}
              <div className={`h-[2px] w-full ${accent.bar} opacity-80`} />

              {/* Column Header */}
              <div className="px-3.5 py-3 border-b border-[#1f1f1f] flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-zinc-500 tabular-nums">
                      0{index + 1}
                    </span>
                    <h2 className="text-xs font-semibold text-zinc-100 truncate">
                      {stage}
                    </h2>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] font-mono text-zinc-500 tabular-nums">
                    <span>
                      {stageLeads.length} {stageLeads.length === 1 ? 'lead' : 'leads'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-zinc-300">
                      {stageSum > 0 ? formatCurrencyCompact(stageSum) : '$0'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onAddLeadInStage(stage)}
                  title={`Add lead to ${stage}`}
                  aria-label={`Add lead to ${stage}`}
                  className="p-1.5 text-zinc-500 hover:text-zinc-100 hover:bg-[#1a1a1a] rounded-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Cards Stack */}
              <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto">
                {stageLeads.length === 0 ? (
                  <div
                    className={`h-28 border border-dashed rounded-sm flex flex-col items-center justify-center text-center px-4 transition-colors ${
                      isDropTarget
                        ? 'border-[#ea580c]/70 text-orange-300 bg-[#ea580c]/5'
                        : 'border-[#242424] text-zinc-600'
                    }`}
                  >
                    <span className="text-xs font-medium">
                      {isDropTarget ? `Drop to move to ${stage}` : 'No leads in stage'}
                    </span>
                    <span className="mt-1 text-[11px] font-mono text-zinc-600">
                      Drag a card here
                    </span>
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      now={now}
                      activeSetter={activeSetter}
                      isSelected={lead.id === selectedLeadId}
                      onSelect={onSelectLead}
                      onHoverTimeZone={onHoverTimeZone}
                      onClaim={onClaimLead}
                      onQuickOutreach={onQuickOutreach}
                      onDragStart={handleDragStart}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
