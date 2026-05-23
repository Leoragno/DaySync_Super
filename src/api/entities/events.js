import { createEntity } from './base';

export const EventsAPI = createEntity('events', {
  defaultSort: 'date',
  defaultSortAsc: false,
});
