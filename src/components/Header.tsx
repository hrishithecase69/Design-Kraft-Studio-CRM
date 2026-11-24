import React from 'react';
import { Columns3, Table2, Plus, Clock, Globe } from 'lucide-react';
import type { ViewMode } from '../types/crm';
import {
  getISTClock,
  getLocalTimeInfo,
  PROSPECT_TIMEZONE_PRESETS,
} from '../utils/time';

interface HeaderProps {
  now: Date;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onNewLead: () => void;
  selectedTimeZone: string;
  selectedTimeZoneLabel: string | null;
  onTimeZoneChange: (tz: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  now,
  viewMode,
  onViewModeChange,
  onNewLead,
  selectedTimeZone,
  selectedTimeZoneLabel,
  onTimeZoneChange,
}) => {
  const ist = getISTClock(now);
  const prospect = getLocalTimeInfo(selectedTimeZone, now);

  return (
    <header className="sticky top-0 z-30 bg-[#0b0b0b]/95 backdrop-blur-sm border-b border-[#262626]">
      <div className="w-full px-4 lg:px-6 h-16 flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: DKS Brand Mark */}
        <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="shrink-0"
          >
            <rect
              x="1"
              y="1"
              width="26"
              height="26"
              rx="2"
              fill="#141414"
              stroke="#262626"
              strokeWidth="1.5"
            />
            <path
              d="M6.5 21.5V6.5H15.5L21.5 12.5V21.5H6.5Z"
              stroke="#f4f4f5"
              strokeWidth="1.5"
              strokeLinejoin="miter"
            />
            <path
              d="M15 6.5V13H21.5"
              stroke="#ea580c"
              strokeWidth="1.75"
              strokeLinejoin="miter"
            />
            <rect x="9.5" y="15.5" width="4.5" height="3" fill="#ea580c" />
          </svg>
          <span className="text-[15px] font-semibold tracking-tight text-zinc-100 whitespace-nowrap">
            Design Kraft Studio
          </span>
        </div>

        {/* Zone 2: Live Dual Clock (IST vs Prospect Timezone) */}
        <div className="hidden xl:flex items-center gap-5 px-3.5 py-1.5 bg-[#141414] border border-[#262626] rounded-sm shrink-0">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="text-[11px] font-mono text-zinc-400">IST</span>
            <span className="text-xs font-mono font-medium text-zinc-100 tabular-nums">
              {ist.time}
            </span>
          </div>

          <span className="h-4 w-px bg-[#262626]" aria-hidden="true" />

          <div className="flex items-center gap-2.5 whitespace-nowrap">
            <Globe className="w-3.5 h-3.5 text-[#ea580c] shrink-0" />
            <label htmlFor="prospect-tz-select" className="sr-only">
              Prospect comparison timezone
            </label>
            <select
              id="prospect-tz-select"
              value={selectedTimeZone}
              onChange={(e) => onTimeZoneChange(e.target.value)}
              className="bg-transparent text-[11px] font-mono text-zinc-300 hover:text-zinc-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#ea580c] cursor-pointer pr-1"
            >
              {PROSPECT_TIMEZONE_PRESETS.map((preset) => (
                <option
                  key={preset.id}
                  value={preset.timeZone}
                  className="bg-[#141414] text-zinc-100"
                >
                  {preset.label}
                </option>
              ))}
            </select>

            <span className="text-xs font-mono font-semibold text-zinc-100 tabular-nums">
              {prospect.timeWithSeconds}
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              {prospect.tzShort}
            </span>
            <span className="text-zinc-600" aria-hidden="true">
              ·
            </span>
            <span
              className={`text-[11px] font-mono font-medium ${
                prospect.isInCallingWindow ? 'text-emerald-400' : 'text-zinc-500'
              }`}
            >
              {selectedTimeZoneLabel
                ? `${selectedTimeZoneLabel} · ${prospect.isInCallingWindow ? '9–6 Open' : 'After Hours'}`
                : prospect.isInCallingWindow
                  ? '9–6 Open'
                  : 'After Hours'}
            </span>
          </div>
        </div>

        {/* Zone 3: View Mode Toggle + Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            role="group"
            aria-label="Pipeline view mode"
            className="flex items-center bg-[#141414] border border-[#262626] p-0.5 rounded-sm"
          >
            <button
              type="button"
              onClick={() => onViewModeChange('kanban')}
              aria-pressed={viewMode === 'kanban'}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ea580c] ${
                viewMode === 'kanban'
                  ? 'bg-[#262626] text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Kanban Board</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              aria-pressed={viewMode === 'table'}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ea580c] ${
                viewMode === 'table'
                  ? 'bg-[#262626] text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Table2 className="w-3.5 h-3.5" />
              <span>Datagrid Table</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onNewLead}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#ea580c] hover:bg-[#f97316] active:bg-[#c2410c] rounded-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ea580c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0b]"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Lead</span>
          </button>
        </div>
      </div>

      {/* Compact Clock Strip for screens < xl */}
      <div className="xl:hidden px-4 py-2 border-t border-[#1e1e1e] bg-[#101010] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-zinc-300">
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-500">IST</span>
          <span className="tabular-nums text-zinc-100">{ist.time}</span>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-[#ea580c]" />
          <select
            aria-label="Prospect timezone mobile"
            value={selectedTimeZone}
            onChange={(e) => onTimeZoneChange(e.target.value)}
            className="bg-transparent text-zinc-300 focus:outline-none cursor-pointer"
          >
            {PROSPECT_TIMEZONE_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.timeZone} className="bg-[#141414]">
                {preset.city}
              </option>
            ))}
          </select>
          <span className="tabular-nums text-zinc-100">{prospect.time12}</span>
          <span
            className={
              prospect.isInCallingWindow ? 'text-emerald-400' : 'text-zinc-500'
            }
          >
            {prospect.isInCallingWindow ? '9–6 Open' : 'After Hours'}
          </span>
        </div>
      </div>
    </header>
  );
};
