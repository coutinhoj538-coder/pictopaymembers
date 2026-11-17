import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { ArrowLeft, Download, CheckCircle2 } from 'lucide-react';
import { PlatformShell } from '@/components/platform-shell';
import { VideoPlayer } from '@/components/video-player';
import { Button } from '@/components/ui/button';
import { lessonQuery } from '@/lib/course-queries';
import { saveProgress } from '@/lib/courses.functions';
import { metadata } from '@/lib/platform';
import { toast } from 'sonner';
export const Route = createFileRoute('/_authenticated/lesson/$id')({ head: () => metadata('Minha aula', 'Assista à sua aula e acompanhe seu progresso.'), loader: ({ context, params }) => context.queryClient.ensureQueryData(lessonQuery(params.id)), component: Lesson });
function Lesson() {
  const { id } = Route.useParams(); const { data } = useSuspenseQuery(lessonQuery(id)); const save = useServerFn(saveProgress); const client = useQueryClient();
  async function progress(seconds: number, completed: boolean) { try { await save({ data: { id, seconds, completed: completed || !!data.progress?.completed } }); void client.invalidateQueries({ queryKey: ['library'] }); if (completed) void client.invalidateQueries({ queryKey: ['lesson', id] }); } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível salvar o progresso.'); } }
  return <PlatformShell><Button asChild variant="ghost"><Link to="/library"><ArrowLeft /> Meus cursos</Link></Button><div className="page-heading"><div><span className="section-eyebrow">{data.modules?.courses?.title}</span><h1>{data.title}</h1><p>{data.modules?.title}</p></div></div><VideoPlayer key={id} src={data.playbackUrl} initialSeconds={data.progress?.seconds ?? 0} onProgress={(seconds, completed) => void progress(seconds, completed)} /><div className="lesson-actions"><span>{data.progress?.completed ? 'Aula concluída' : 'Seu progresso é salvo durante a aula.'}</span><Button variant="outline" onClick={() => void progress(data.progress?.seconds ?? 0, true)}><CheckCircle2 />{data.progress?.completed ? 'Concluída' : 'Concluir aula'}</Button></div><section className="materials-section"><h2>Materiais complementares</h2>{data.materials.length ? data.materials.map(material => <Button asChild variant="outline" key={material.id}><a href={material.url} download><Download />{material.title}</a></Button>) : <p>Nenhum material nesta aula.</p>}</section></PlatformShell>;
}