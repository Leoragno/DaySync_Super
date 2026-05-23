import { createEntity } from './base';

export const QuickNotesAPI = createEntity('quick_notes', {
  defaultSort: 'created_at',
  defaultSortAsc: false,
});
