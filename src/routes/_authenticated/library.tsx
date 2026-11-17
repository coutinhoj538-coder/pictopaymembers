import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  BookOpen,
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  RefreshCw,
  Play,
  Search,
  Sparkles,
  Clock3,
  Trophy,
} from "lucide-react";
import { PlatformShell } from "@/components/platform-shell";
import { CourseArt } from "@/components/course-art";
import { useAccount } from "@/components/auth-context";
import { Button } from "@/components/ui/button";
import { libraryQuery } from "@/lib/course-queries";
import { metadata, CHECKOUT_URL } from "@/lib/platform";
export const Route = createFileRoute("/_authenticated/library")({
  head: () => metadata("Meu aprendizado", "Seus cursos liberados e seu progresso de aprendizado."),
  loader: ({ context }) => context.queryClient.ensureQueryData(libraryQuery()),
  component: Library,
});
function Library() {
  const { data, refetch, isFetching } = useSuspenseQuery(libraryQuery());
  const { user } = useAccount();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const courses = data.courses.map((course) => {
    const modules = [...course.modules].sort((a, b) => a.position - b.position);
    const lessons = modules.flatMap((m) => [...m.lessons].sort((a, b) => a.position - b.position));
    const completed = lessons.filter((l) =>
      data.progress.some((p) => p.lesson_id === l.id && p.completed),
    ).length;
    const percent = lessons.length ? Math.round((completed / lessons.length) * 100) : 0;
    const latest = [...data.progress]
      .filter((p) => lessons.some((l) => l.id === p.lesson_id))
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];
    const resume =
      lessons.find((l) => l.id === latest?.lesson_id && !latest?.completed) ??
      lessons.find((l) => !data.progress.some((p) => p.lesson_id === l.id && p.completed)) ??
      lessons[0];
    return { ...course, modules, lessons, completed, percent, latest, resume };
  });
  const total = courses.reduce((sum, c) => sum + c.lessons.length, 0);
  const completed = courses.reduce((sum, c) => sum + c.completed, 0);
  const percent = total ? Math.round((completed / total) * 100) : 0;
  const continuing = courses
    .filter((c) => c.latest && c.percent < 100 && c.resume)
    .sort((a, b) => (b.latest?.updated_at ?? "").localeCompare(a.latest?.updated_at ?? ""))[0];
  const next = continuing ?? courses.find((c) => c.resume && c.percent < 100);
  const name =
    (typeof user?.user_metadata?.["full_name"] === "string"
      ? user.user_metadata["full_name"].split(" ")[0]
      : "") ||
    user?.email?.split("@")[0] ||
    "aluno";
  const visible = courses.filter(
    (c) =>
      c.title.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")) &&
      (filter === "all" || (filter === "done" ? c.percent === 100 : c.percent < 100)),
  );
  const activity = [...data.progress]
    .filter((p) => courses.some((c) => c.lessons.some((l) => l.id === p.lesson_id)))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 4);
  return (
    <PlatformShell admin={data.isAdmin}>
      <div className="page-heading">
        <div>
          <span className="section-eyebrow">BOM TER VOCÊ POR AQUI</span>
          <h1>
            Olá, {name} <span className="heading-dot">✦</span>
          </h1>
          <p>Um novo passo. Novas possibilidades para você.</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label="Atualizar cursos"
          title="Atualizar cursos"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          <RefreshCw className={isFetching ? "animate-spin" : ""} />
        </Button>
      </div>
      <section className="learning-hero">
        <div className="hero-copy">
          <span className="hero-pill">
            <Sparkles /> SEU FUTURO COMEÇA AGORA
          </span>
          <h2>
            Invista em você.
            <br />
            <span>O próximo nível espera.</span>
          </h2>
          <p>Seu conhecimento é seu maior potencial. Continue sua jornada, uma aula de cada vez.</p>
          {next?.resume ? (
            <Button asChild size="lg">
              <Link to="/lesson/$id" params={{ id: next.resume.id }}>
                <Play />
                {continuing ? "Continuar aprendendo" : "Começar a aprender"}
                <ArrowRight />
              </Link>
            </Button>
          ) : (
            <Button asChild size="lg" variant="outline">
              <a href="#meus-cursos">
                Explorar meus cursos <ArrowRight />
              </a>
            </Button>
          )}
        </div>
        <div className="hero-progress">
          <div className="progress-orbit">
            <strong>
              {percent}
              <small>%</small>
            </strong>
            <span>do seu aprendizado</span>
          </div>
          <span className="hero-progress-caption">
            <span className="status-dot" /> Cada passo conta
          </span>
        </div>
      </section>
      <section className="stats-grid" aria-label="Resumo do aprendizado">
        <div className="stat-card">
          <span className="stat-icon">
            <BookOpen />
          </span>
          <div>
            <strong>{courses.length}</strong>
            <span>Cursos disponíveis</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon blue">
            <CheckCircle2 />
          </span>
          <div>
            <strong>
              {completed}
              <small> / {total}</small>
            </strong>
            <span>Aulas concluídas</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon green">
            <Trophy />
          </span>
          <div>
            <strong>{courses.filter((c) => c.lessons.length && c.percent === 100).length}</strong>
            <span>Cursos concluídos</span>
          </div>
        </div>
      </section>
      {continuing?.resume && (
        <section className="continue-section">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">MANTENHA O RITMO</span>
              <h2>Continue aprendendo</h2>
            </div>
            <span className="quiet-label">
              <Clock3 /> De onde você parou
            </span>
          </div>
          <Link className="continue-card" to="/lesson/$id" params={{ id: continuing.resume.id }}>
            <CourseArt title={continuing.title} />
            <div>
              <span className="course-badge">EM ANDAMENTO</span>
              <h3>{continuing.resume.title}</h3>
              <p>{continuing.title}</p>
              <div className="course-progress">
                <progress aria-label="Progresso do curso" max={100} value={continuing.percent} />
                <strong>{continuing.percent}%</strong>
              </div>
            </div>
            <span className="continue-play">
              <Play />
            </span>
          </Link>
        </section>
      )}
      <section id="meus-cursos" className="courses-section">
        <div className="section-heading">
          <div>
            <span className="section-eyebrow">CONHECIMENTO QUE TRANSFORMA</span>
            <h2>Meus cursos</h2>
          </div>
          <label className="course-search">
            <Search />
            <input
              type="search"
              aria-label="Buscar meus cursos"
              placeholder="Buscar curso..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
        <div className="course-filters" aria-label="Filtrar cursos">
          {(
            [
              ["all", "Todos os cursos"],
              ["progress", "A continuar"],
              ["done", "Concluídos"],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              variant="ghost"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {label}
            </Button>
          ))}
        </div>
        {!courses.length ? (
          <div className="empty-state">
            <span className="empty-icon">
              <BookOpen />
            </span>
            <h2>Seu próximo capítulo está a caminho.</h2>
            <p>Nenhum curso foi liberado para este e-mail ainda.</p>
            <p className="small-note">Após a confirmação da compra, seu curso aparece aqui.</p>
            <Button asChild variant="outline">
              <a href={CHECKOUT_URL}>
                Acessar meu checkout <ArrowRight />
              </a>
            </Button>
            <span className="empty-security">
              <LockKeyhole /> Acesso exclusivo para compras aprovadas
            </span>
          </div>
        ) : !visible.length ? (
          <div className="empty-state">
            <Search />
            <h3>Nenhum curso encontrado</h3>
            <p>Tente outro nome ou selecione todos os cursos.</p>
          </div>
        ) : (
          <div className="course-list">
            {visible.map((course) => (
              <article key={course.id} className="course-item">
                <CourseArt title={course.title} index={courses.indexOf(course)} />
                <div className="course-body">
                  <div className="course-meta">
                    <span className="course-badge">
                      {!course.published
                        ? "RASCUNHO"
                        : course.percent === 100 && course.lessons.length
                          ? "CONCLUÍDO"
                          : course.latest
                            ? "EM ANDAMENTO"
                            : Date.now() - new Date(course.created_at).getTime() >= 0 &&
                                Date.now() - new Date(course.created_at).getTime() < 30 * 86400000
                              ? "NOVO"
                              : "PARA COMEÇAR"}
                    </span>
                    <span>{course.lessons.length} aulas</span>
                  </div>
                  <h3>{course.title}</h3>
                  <p className="course-description">
                    {course.description || "Seu próximo passo de aprendizado começa aqui."}
                  </p>
                  <div className="course-progress">
                    <span>
                      {course.completed} de {course.lessons.length} aulas
                    </span>
                    <strong>{course.percent}%</strong>
                    <progress
                      aria-label={`Progresso em ${course.title}`}
                      max={100}
                      value={course.percent}
                    />
                  </div>
                  {course.resume ? (
                    <Button asChild className="course-cta">
                      <Link to="/lesson/$id" params={{ id: course.resume.id }}>
                        {course.percent === 100
                          ? "Revisitar curso"
                          : course.latest
                            ? "Continuar curso"
                            : "Começar curso"}
                        <ArrowRight />
                      </Link>
                    </Button>
                  ) : (
                    <p className="small-note">As aulas serão disponibilizadas em breve.</p>
                  )}
                  <details className="course-modules">
                    <summary>
                      Ver módulos e aulas <span>{course.modules.length} módulos</span>
                    </summary>
                    {course.modules.map((module) => (
                      <div className="module-group" key={module.id}>
                        <h4>{module.title}</h4>
                        {[...module.lessons]
                          .sort((a, b) => a.position - b.position)
                          .map((lesson) => (
                            <Button key={lesson.id} variant="nav" asChild>
                              <Link to="/lesson/$id" params={{ id: lesson.id }}>
                                {data.progress.some(
                                  (p) => p.lesson_id === lesson.id && p.completed,
                                ) ? (
                                  <CheckCircle2 />
                                ) : (
                                  <Play />
                                )}
                                {lesson.title}
                                <ArrowRight />
                              </Link>
                            </Button>
                          ))}
                      </div>
                    ))}
                  </details>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="activity-section">
        <div className="section-heading">
          <div>
            <span className="section-eyebrow">SUA EVOLUÇÃO</span>
            <h2>Atividades recentes</h2>
          </div>
          <Clock3 />
        </div>
        {activity.length ? (
          <ul className="activity-list">
            {activity.map((item) => {
              const course = courses.find((c) => c.lessons.some((l) => l.id === item.lesson_id))!;
              const lesson = course.lessons.find((l) => l.id === item.lesson_id)!;
              return (
                <li key={item.lesson_id}>
                  <span className="activity-icon">
                    {item.completed ? <CheckCircle2 /> : <Play />}
                  </span>
                  <div>
                    <Link to="/lesson/$id" params={{ id: lesson.id }}>
                      {lesson.title}
                    </Link>
                    <p>
                      {course.title} · {item.completed ? "Aula concluída" : "Aula em andamento"}
                    </p>
                  </div>
                  <time dateTime={item.updated_at}>
                    {new Date(item.updated_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      timeZone: "America/Sao_Paulo",
                    })}
                  </time>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>Suas atividades aparecerão aqui quando você começar a assistir às aulas.</p>
        )}
      </section>
    </PlatformShell>
  );
}
