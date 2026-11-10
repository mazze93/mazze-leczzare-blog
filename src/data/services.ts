/** The public offer and server-side inquiry context share one versioned record. */
export const HARDENING_SPRINT = {
  id: 'github-hardening',
  version: '2026-10-30',
  name: 'GitHub Repository Hardening Sprint',
  priceUsd: 1250,
  depositUsd: 625,
  turnaround: 'Five business days after scope, access and the deposit are confirmed',
  path: '/hire/',
  requestPath: '/contact/?service=github-hardening',
  scope: 'One GitHub repository and up to three existing GitHub Actions workflows',
  inquiryTemplate: [
    'I would like to discuss the GitHub Repository Hardening Sprint ($1,250 USD).',
    '',
    'Repository URL or a brief description (no private code or credentials):',
    'Public or private repository, and GitHub plan:',
    'Number of GitHub Actions workflows:',
    'Does the current build/test workflow pass?',
    'Team size and who can approve repository settings:',
    'What would you most like to fix, and is there a deadline?',
  ].join('\n'),
} as const;

export type ServiceOffer = typeof HARDENING_SPRINT;

export function getServiceOffer(value: unknown): ServiceOffer | undefined {
  return value === HARDENING_SPRINT.id ? HARDENING_SPRINT : undefined;
}

export function serviceFromSearch(search: string): ServiceOffer | undefined {
  return getServiceOffer(new URLSearchParams(search).get('service'));
}

export function formatUsd(amount: number): string {
  return `$${amount.toLocaleString('en-US')} USD`;
}
