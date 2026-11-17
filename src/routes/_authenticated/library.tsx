import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { BookOpen, ArrowRight, CheckCircle2, LockKeyhole, RefreshCw } from 'lucide-react';
import { PlatformShell } from '@/components/platform-shell';
import { Button } from '@/components/ui/button';
import { libraryQuery } from '@/lib/course-queries';
import { metadata, CHECKOUT_URL } from '@/lib/platform';
export const Route = createFileRoute('/_authenticated/library')({ head: () => metadata('Meus cursos', 'Seus cursos liberados e seu progresso de aprendizado.'), loader: ({ context }) => context.queryClient.ensureQueryData(libraryQuery()), component: Library });
function Library() {
  const { data, refetch, isFetching } = useSuspenseQuery(libraryQuery());
  return <PlatformShell admin={data.isAdmin}><div className="page-heading"><div><span className="section-eyebrow">SUA JORNADA</span><h1>Meus cursos</h1><p>Um aprendizado de cada vez.</p></div><Button variant="outline" size="icon" aria-label="Atualizar cursos" title="Atualizar cursos" disabled={isFetching} onClick={() => void refetch()}><RefreshCw /></Button></div>{data.courses.length === 0 ? <div className="empty-state"><span className="empty-icon"><BookOpen /></span><h2>Seu próximo capítulo está a caminho.</h2><p>Nenhum curso foi liberado para este e-mail ainda.</p><p className="small-note">Após a confirmação da compra, seu curso aparece aqui.</p><Button asChild variant="outline"><a href={CHECKOUT_URL}>Acessar meu checkout <ArrowRight /></a></Button><span className="empty-security"><LockKeyhole /> Acesso exclusivo para compras aprovadas</span></div> : <div className="course-list">{data.courses.map(course => {
    const lessons = course.modules.flatMap(m => m.lessons);
    const completed = lessons.filter(l => data.progress.some(p => p.lesson_id === l.id && p.completed)).length;
    const percent = lessons.length ? Math.round(completed / lessons.length * 100) : 0;
    return <article key={course.id} className="course-item"><div className="course-title"><BookOpen /><div><span className="section-eyebrow">{course.published ? 'SEU CURSO' : 'RASCUNHO'}</span><h2>{course.title}</h2><p>{course.description}</p></div></div><div className="course-progress"><span>{completed} de {lessons.length} aulas concluídas</span><progress max={100} value={percent} /><strong>{percent}%</strong></div>{course.modules.sort((a,b) => a.position-b.position).map(module => <div className="module-group" key={module.id}><h3>{module.title}</h3>{module.lessons.sort((a,b) => a.position-b.position).map(lesson => <Button key={lesson.id} variant="nav" asChild><Link to="/lesson/$id" params={{ id: lesson.id }}>{data.progress.some(p => p.lesson_id === lesson.id && p.completed) ? <CheckCircle2 /> : <BookOpen />}{lesson.title}<ArrowRight /></Link></Button>)}</div>)}</article>;
  })}</div>}</PlatformShell>;
}