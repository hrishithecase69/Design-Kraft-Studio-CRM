export type PipelineStage =
  | 'New Inbound'
  | 'Claimed'
  | 'Contacted'
  | 'Call Scheduled'
  | 'Scoped'
  | 'Proposal Sent'
  | 'Won / Retainer'
  | 'Lost';

export const PIPELINE_STAGES: PipelineStage[] = [
  'New Inbound',
  'Claimed',
  'Contacted',
  'Call Scheduled',
  'Scoped',
  'Proposal Sent',
  'Won / Retainer',
  'Lost',
];

export type SoftwareStack = 'Revit' | 'AutoCAD' | 'Revit + AutoCAD';

export type RegionCode = 'US' | 'UK' | 'Canada' | 'Australia';

export type BillingType = 'Pilot Sheet' | 'Fixed Scope' | 'Monthly Retainer';

export type ServiceDiscipline =
  | 'Architectural Drafting'
  | 'BIM Documentation'
  | 'Millwork Detailing'
  | 'Permit & CD Sets';

export type ActivityType =
  | 'call'
  | 'meeting'
  | 'email'
  | 'whatsapp'
  | 'stage_change'
  | 'claimed'
  | 'note';

export type CallOutcome =
  | 'Connected'
  | 'Voicemail'
  | 'No Answer'
  | 'Call Booked'
  | 'Scope Confirmed'
  | 'Follow-up Sent';

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  timestamp: string; // ISO string
  author: string;
  summary: string;
  outcome?: CallOutcome;
  details?: string;
}

export interface Lead {
  id: string;
  studioName: string;
  contactName: string;
  contactRole: string;
  email: string;
  phone: string;
  whatsappNumber: string; // digits with country code, no plus
  region: RegionCode;
  city: string;
  timeZone: string; // IANA timezone string
  budgetAmount: number; // USD numeric value
  billingType: BillingType;
  software: SoftwareStack;
  discipline: ServiceDiscipline;
  stage: PipelineStage;
  claimedBy: string | null;
  source: string;
  projectScope: string;
  deliverableSpec: string;
  createdAt: string;
  lastContactedAt: string | null;
  nextFollowUp: string | null;
  activities: ActivityEntry[];
}

export type ViewMode = 'kanban' | 'table';

export type SortField = 'studioName' | 'budgetAmount' | 'stage' | 'region' | 'lastContactedAt';
export type SortDirection = 'asc' | 'desc';

export interface FilterState {
  search: string;
  region: RegionCode | 'All';
  software: SoftwareStack | 'All';
  callingWindowOnly: boolean;
  claimedFilter: 'All' | 'Unclaimed' | 'Mine';
}

export interface ToastMessage {
  id: string;
  message: string;
  detail?: string;
}
