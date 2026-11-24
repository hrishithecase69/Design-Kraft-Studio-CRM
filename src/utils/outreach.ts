import type { BillingType, Lead, PipelineStage } from '../types/crm';

export function formatBudget(amount: number, billingType: BillingType): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);

  if (billingType === 'Monthly Retainer') {
    return `${formatted}/mo`;
  }
  return formatted;
}

export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1000) {
    const k = amount / 1000;
    return `$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return `$${amount}`;
}

export function buildWhatsAppUrl(lead: Lead, setterName: string): string {
  const firstName = lead.contactName.split(' ')[0];
  const message = `Hi ${firstName}, this is ${setterName} from Design Kraft Studio (DKS). Following up regarding ${lead.discipline.toLowerCase()} & ${lead.software} support for ${lead.studioName}. Would you have 10 minutes today to walk through your upcoming sheet set or a $100 pilot sheet?`;
  const cleanDigits = lead.whatsappNumber.replace(/[^\d]/g, '');
  return `https://wa.me/${cleanDigits}?text=${encodeURIComponent(message)}`;
}

export function buildEmailUrl(lead: Lead, setterName: string): string {
  const firstName = lead.contactName.split(' ')[0];
  const subject = `Design Kraft Studio — ${lead.software} ${lead.discipline} for ${lead.studioName}`;
  const body = `Hi ${firstName},

Reaching out from Design Kraft Studio (DKS) regarding ${lead.projectScope}.

Our architectural drafting and BIM pod works natively in ${lead.software} and aligns to your local redline standards (${lead.city}). We can kick off with a single $100 Pilot Sheet turnaround within 48 hours or structure a dedicated monthly production pod.

Are you open to a brief 15-minute scope review this week?

Best regards,
${setterName}
Design Kraft Studio (DKS)`;

  return `mailto:${encodeURIComponent(lead.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function getStageAccentStyle(stage: PipelineStage): {
  text: string;
  border: string;
  dot: string;
  bar: string;
} {
  switch (stage) {
    case 'New Inbound':
      return {
        text: 'text-orange-400',
        border: 'border-orange-500/40',
        dot: 'bg-[#ea580c]',
        bar: 'bg-[#ea580c]',
      };
    case 'Claimed':
      return {
        text: 'text-amber-300',
        border: 'border-amber-500/35',
        dot: 'bg-amber-400',
        bar: 'bg-amber-400',
      };
    case 'Contacted':
      return {
        text: 'text-sky-300',
        border: 'border-sky-500/35',
        dot: 'bg-sky-400',
        bar: 'bg-sky-400',
      };
    case 'Call Scheduled':
      return {
        text: 'text-indigo-300',
        border: 'border-indigo-500/35',
        dot: 'bg-indigo-400',
        bar: 'bg-indigo-400',
      };
    case 'Scoped':
      return {
        text: 'text-cyan-300',
        border: 'border-cyan-500/35',
        dot: 'bg-cyan-400',
        bar: 'bg-cyan-400',
      };
    case 'Proposal Sent':
      return {
        text: 'text-yellow-300',
        border: 'border-yellow-500/35',
        dot: 'bg-yellow-400',
        bar: 'bg-yellow-400',
      };
    case 'Won / Retainer':
      return {
        text: 'text-emerald-400',
        border: 'border-emerald-500/35',
        dot: 'bg-emerald-500',
        bar: 'bg-emerald-500',
      };
    case 'Lost':
      return {
        text: 'text-zinc-500',
        border: 'border-zinc-700',
        dot: 'bg-zinc-600',
        bar: 'bg-zinc-600',
      };
  }
}
