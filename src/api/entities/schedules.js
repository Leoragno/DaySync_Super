import { createEntity } from './base';

export const SchedulesAPI = createEntity('schedules', {
  defaultSort: 'hour',
  defaultSortAsc: true,
});
