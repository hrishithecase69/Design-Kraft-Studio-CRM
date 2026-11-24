import React from 'react';
import { Search, X, RotateCcw, UserCheck, PhoneCall } from 'lucide-react';
import type { FilterState, Lead, RegionCode, SoftwareStack } from '../types/crm';
import { getLocalTimeInfo } from '../utils/time';

interface PipelineToolbarProps {
  allLeads: Lead[];
  filteredCount: number;
  filters: FilterState;
  onFiltersChange: (next: FilterState) => void;
  activeSetter: string;
  setterOptions: string[];
  onSetterChange: (setter: string) => void;
  onResetDemo: () => void;
  now: Date;
}

const REGIONS: Array<RegionCode | 'All'> = ['All', 'US', 'UK', 'Canada', 'Australia'];
const SOFTWARES: Array<SoftwareStack | 'All'> = ['All', 'Revit', 'AutoCAD', 'Revit + AutoCAD'];

export const PipelineToolbar: React.FC<PipelineToolbarProps> = ({
  allLeads,
  filteredCount,
  filters,
  onFiltersChange,
  activeSetter,
  setterOptions,
  onSetterChange,
  onResetDemo,
  now,
}) => {
  const activePipelineLeads = allLeads.filter((l) => l.stage !== 'Lost');
  const totalPipelineValue = activePipelineLeads.reduce(
    (sum, lead) => sum + lead.budgetAmount,
    0
  );
  const wonLeads = allLeads.filter((l) => l.stage === 'Won / Retainer');
  const wonValue = wonLeads.reduce((sum, lead) => sum + lead.budgetAmount, 0);
  const unclaimedCount = allLeads.filter((l) => !l.claimedBy && l.stage !== 'Lost').length;
  const openWindowCount = activePipelineLeads.filter(
    (l) => getLocalTimeInfo(l.timeZone, now).isInCallingWindow
  ).length;

  const hasActiveFilters =
    filters.search.trim() !== '' ||
    filters.region !== 'All' ||
    filters.software !== 'All' ||
    filters.callingWindowOnly ||
    filters.claimedFilter !== 'All';

  const formatUsd = (val: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <section aria-label="Pipeline metrics and filters" className="border-b border-[#262626] bg-[#0b0b0b]">
      {/* Structured 4-column KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-[#262626]">
        <div className="px-4 lg:px-6 py-3.5 border-r border-b lg:border-b-0 border-[#262626]">
          <div className="text-xs text-zinc-400">Active Pipeline</div>
          <div className="mt-1 flex items-baseline gap-2.5">
            <span className="text-xl font-mono font-semibold text-zinc-100 tabular-nums">
              {formatUsd(totalPipelineValue)}
            </span>
            <span className="text-xs font-mono text-zinc-500 tabular-nums">
              {activePipelineLeads.length} deals
            </span>
          </div>
        </div>

        <div className="px-4 lg:px-6 py-3.5 lg:border-r border-b lg:border-b-0 border-[#262626]">
          <div className="text-xs text-zinc-400">Won / Retainer MRR</div>
          <div className="mt-1 flex items-baseline gap-2.5">
            <span className="text-xl font-mono font-semibold text-emerald-400 tabular-nums">
              {formatUsd(wonValue)}
            </span>
            <span className="text-xs font-mono text-zinc-500 tabular-nums">
              {wonLeads.length} active
            </span>
          </div>
        </div>

        <div className="px-4 lg:px-6 py-3.5 border-r border-[#262626]">
          <div className="text-xs text-zinc-400">Calling Window (9 AM–6 PM)</div>
          <div className="mt-1 flex items-baseline gap-2.5">
            <span className="text-xl font-mono font-semibold text-zinc-100 tabular-nums">
              {openWindowCount}
            </span>
            <span className="text-xs font-mono text-zinc-500 tabular-nums">
              of {activePipelineLeads.length} reachable now
            </span>
          </div>
        </div>

        <div className="px-4 lg:px-6 py-3.5">
          <div className="text-xs text-zinc-400">Unclaimed Inbound</div>
          <div className="mt-1 flex items-baseline gap-2.5">
            <span
              className={`text-xl font-mono font-semibold tabular-nums ${
                unclaimedCount > 0 ? 'text-[#ea580c]' : 'text-zinc-100'
              }`}
            >
              {unclaimedCount}
            </span>
            <span className="text-xs font-mono text-zinc-500">
              {unclaimedCount > 0 ? 'ready to claim' : 'queue clear'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Setter Control Bar */}
      <div className="px-4 lg:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[260px]">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              placeholder="Search studio, contact, scope..."
              aria-label="Search leads"
              className="w-full h-8 pl-8 pr-7 bg-[#141414] border border-[#262626] rounded-sm text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#ea580c] transition-colors"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, search: '' })}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Region Segmented Filter */}
          <div
            role="group"
            aria-label="Filter by region"
            className="flex items-center bg-[#141414] border border-[#262626] p-0.5 rounded-sm"
          >
            {REGIONS.map((region) => (
              <button
                key={region}
                type="button"
                onClick={() => onFiltersChange({ ...filters, region })}
                className={`px-2.5 py-1 text-xs font-medium rounded-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  filters.region === region
                    ? 'bg-[#262626] text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {region}
              </button>
            ))}
          </div>

          {/* Software Filter */}
          <select
            aria-label="Filter by CAD/BIM software"
            value={filters.software}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                software: e.target.value as SoftwareStack | 'All',
              })
            }
            className="h-8 px-2.5 bg-[#141414] border border-[#262626] rounded-sm text-xs text-zinc-200 focus:outline-none focus:border-[#ea580c] cursor-pointer"
          >
            {SOFTWARES.map((sw) => (
              <option key={sw} value={sw} className="bg-[#141414]">
                {sw === 'All' ? 'Software: All' : sw}
              </option>
            ))}
          </select>

          {/* 9-6 Calling Window Toggle */}
          <button
            type="button"
            onClick={() =>
              onFiltersChange({
                ...filters,
                callingWindowOnly: !filters.callingWindowOnly,
              })
            }
            aria-pressed={filters.callingWindowOnly}
            className={`inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium rounded-sm border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filters.callingWindowOnly
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-[#141414] border-[#262626] text-zinc-400 hover:text-zinc-200 hover:border-[#3a3a3a]'
            }`}
          >
            <PhoneCall className="w-3 h-3" />
            <span>9–6 Window Only</span>
          </button>

          {/* Ownership Filter */}
          <select
            aria-label="Filter by ownership"
            value={filters.claimedFilter}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                claimedFilter: e.target.value as FilterState['claimedFilter'],
              })
            }
            className="h-8 px-2.5 bg-[#141414] border border-[#262626] rounded-sm text-xs text-zinc-200 focus:outline-none focus:border-[#ea580c] cursor-pointer"
          >
            <option value="All" className="bg-[#141414]">
              Owner: All
            </option>
            <option value="Unclaimed" className="bg-[#141414]">
              Unclaimed Only
            </option>
            <option value="Mine" className="bg-[#141414]">
              My Leads ({activeSetter})
            </option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() =>
                onFiltersChange({
                  search: '',
                  region: 'All',
                  software: 'All',
                  callingWindowOnly: false,
                  claimedFilter: 'All',
                })
              }
              className="text-xs text-[#ea580c] hover:text-[#f97316] px-1.5 py-1 whitespace-nowrap cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Right: Active Setter Identity + Reset */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-mono text-zinc-500 tabular-nums whitespace-nowrap">
            Showing {filteredCount}/{allLeads.length}
          </span>

          <span className="h-4 w-px bg-[#262626]" aria-hidden="true" />

          <div className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <label htmlFor="active-setter-select" className="text-xs text-zinc-400 whitespace-nowrap">
              Setter:
            </label>
            <select
              id="active-setter-select"
              value={activeSetter}
              onChange={(e) => onSetterChange(e.target.value)}
              className="h-8 px-2 bg-[#141414] border border-[#262626] rounded-sm text-xs font-mono text-zinc-100 focus:outline-none focus:border-[#ea580c] cursor-pointer"
            >
              {setterOptions.map((setter) => (
                <option key={setter} value={setter} className="bg-[#141414]">
                  {setter}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onResetDemo}
            title="Restore default 10 DKS sample leads"
            className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs text-zinc-400 hover:text-zinc-100 bg-[#141414] border border-[#262626] hover:border-[#3a3a3a] rounded-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset Data</span>
          </button>
        </div>
      </div>
    </section>
  );
};
