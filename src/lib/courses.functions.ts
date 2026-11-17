import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { validateVideoUrl } from './platform';

export const getLibrary = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data: courses, error } = await context.supabase.from('courses').select('*, modules(id, title, position, lessons(id, title, published, position))').order('created_at');
  if (error) throw new Error(error.message);
  const { data: progress, error: progressError } = await context.supabase.from('lesson_progress').select('*').eq('user_id', context.userId);
  if (progressError) throw new Error(progressError.message);
  const { data: isAdmin, error: roleError } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
  if (roleError) throw new Error(roleError.message);
  return { courses: courses ?? [], progress: progress ?? [], isAdmin: !!isAdmin };
});

export const getLesson = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input)).handler(async ({ data, context }) => {
  const { data: lesson, error } = await context.supabase.from('lessons').select('*, materials(*), modules(title, course_id, courses(title))').eq('id', data.id).single();
  if (error || !lesson) throw new Error('Esta aula não está disponível para sua conta.');
  let url = lesson.video_url;
  if (lesson.provider === 'storage' && url) {
    const { data: signed, error: signedError } = await context.supabase.storage.from('course-files').createSignedUrl(url, 3600);
    if (signedError) throw new Error(signedError.message);
    url = signed?.signedUrl ?? '';
  }
  const materials = await Promise.all(lesson.materials.map(async material => {
    const { data: signed, error: signedError } = await context.supabase.storage.from('course-files').createSignedUrl(material.file_path, 3600);
    if (signedError) throw new Error(signedError.message);
    return { ...material, url: signed?.signedUrl ?? '' };
  }));
  const { data: progress } = await context.supabase.from('lesson_progress').select('*').eq('user_id', context.userId).eq('lesson_id', data.id).maybeSingle();
  return { ...lesson, playbackUrl: url, materials, progress };
});

export const saveProgress = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.object({ id: z.string().uuid(), seconds: z.number().finite().nonnegative(), completed: z.boolean() }).parse(input)).handler(async ({ data, context }) => {
  const { error } = await context.supabase.from('lesson_progress').upsert({ user_id: context.userId, lesson_id: data.id, seconds: data.seconds, completed: data.completed, updated_at: new Date().toISOString() });
  if (error) throw new Error('Não foi possível salvar seu progresso.');
  return { saved: true };
});

export const saveCourse = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.object({ id: z.string().uuid().optional(), title: z.string().trim().min(1), description: z.string(), checkout_product_id: z.string().trim(), published: z.boolean() }).parse(input)).handler(async ({ data, context }) => {
  const row = { ...data, checkout_product_id: data.checkout_product_id || null };
  const query = data.id ? context.supabase.from('courses').update(row).eq('id', data.id) : context.supabase.from('courses').insert(row);
  const { data: course, error } = await query.select().single();
  if (error) throw new Error(error.message);
  return course;
});

export const saveModule = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.object({ course_id: z.string().uuid(), title: z.string().trim().min(1), position: z.number().int().nonnegative() }).parse(input)).handler(async ({ data, context }) => {
  const { data: module, error } = await context.supabase.from('modules').insert(data).select().single();
  if (error) throw new Error(error.message);
  return module;
});

export const saveLesson = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.object({ id: z.string().uuid().optional(), module_id: z.string().uuid(), title: z.string().trim().min(1), video_url: z.string().min(1), provider: z.enum(['direct', 'storage']), published: z.boolean(), position: z.number().int().nonnegative() }).parse(input)).handler(async ({ data, context }) => {
  if (data.provider === 'direct') validateVideoUrl(data.video_url);
  const query = data.id ? context.supabase.from('lessons').update(data).eq('id', data.id) : context.supabase.from('lessons').insert(data);
  const { data: lesson, error } = await query.select().single();
  if (error) throw new Error(error.message);
  return lesson;
});

export const saveMaterial = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.object({ lesson_id: z.string().uuid(), title: z.string().min(1), file_path: z.string().min(1) }).parse(input)).handler(async ({ data, context }) => {
  const { error } = await context.supabase.from('materials').insert(data);
  if (error) throw new Error(error.message);
  return { saved: true };
});