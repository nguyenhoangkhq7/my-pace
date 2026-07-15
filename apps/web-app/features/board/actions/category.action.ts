'use server';

import { serverFetch } from '@/lib/server-fetchClient';
import { Category } from '@/features/board/types';

export async function getCategoriesAction() {
  return await serverFetch<Category[]>('categories');
}

export async function createCategoryAction(data: Partial<Category>) {
  return await serverFetch<Category>('categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCategoryAction(id: string, data: Partial<Category>) {
  return await serverFetch<Category>(`categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCategoryAction(id: string) {
  return await serverFetch<void>(`categories/${id}`, {
    method: 'DELETE',
  });
}
