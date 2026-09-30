import type {Note} from '../types/note';

const SEEDED_AT = '2026-09-30T09:00:00.000Z';

export const seedNotes: Note[] = [
  {
    id: 'welcome-soft-notes',
    title: 'Have a good day',
    body: 'A quiet place for the thoughts worth keeping.',
    icon: 'spark',
    accent: '#72B8FF',
    tags: ['welcome'],
    isFavorite: true,
    isArchived: false,
    deletedAt: null,
    createdAt: SEEDED_AT,
    updatedAt: '2026-09-30T09:03:00.000Z',
  },
  {
    id: 'buy-fresh-cherries',
    title: 'Buy fresh cherries',
    body: 'Pick up a bag from the market on the way home.',
    icon: 'heart',
    accent: '#FF8FB4',
    tags: ['personal', 'errands'],
    isFavorite: false,
    isArchived: false,
    deletedAt: null,
    createdAt: SEEDED_AT,
    updatedAt: '2026-09-29T15:22:00.000Z',
  },
  {
    id: 'launch-day-checklist',
    title: 'Launch day checklist',
    body: 'Run the smoke test\nCheck analytics\nSend the launch note',
    icon: 'check',
    accent: '#9C82FF',
    tags: ['work'],
    isFavorite: true,
    isArchived: false,
    deletedAt: null,
    createdAt: SEEDED_AT,
    updatedAt: '2026-09-28T11:10:00.000Z',
  },
];

