import { queryOptions } from '@tanstack/react-query';
import { getLibrary, getLesson } from './courses.functions';
export const libraryQuery = () => queryOptions({ queryKey: ['library'], queryFn: () => getLibrary() });
export const lessonQuery = (id: string) => queryOptions({ queryKey: ['lesson', id], queryFn: () => getLesson({ data: { id } }) });