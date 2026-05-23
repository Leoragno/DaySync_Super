import { createEntity } from './base';

export const NotesAPI = createEntity('notes', {
  defaultSort: 'created_at',
  defaultSortAsc: false,
});
