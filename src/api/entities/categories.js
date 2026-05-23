import { createEntity } from './base';

export const CategoriesAPI = createEntity('categories', {
  defaultSort: 'name',
  defaultSortAsc: true,
});
