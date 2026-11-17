import { useState, type FormEvent } from "react";
import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  BookOpen,
  Layers3,
  Pencil,
  Play,
  Plus,
  Save,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { PlatformShell } from "@/components/platform-shell";
import { Button } from "@/components/ui/button";
import { libraryQuery, lessonQuery } from "@/lib/course-queries";
import { saveCourse, saveModule, saveLesson, saveMaterial } from "@/lib/courses.functions";
import { metadata, CHECKOUT_URL } from "@/lib/platform";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => metadata("Administração", "Gestão de cursos, módulos, aulas e materiais."),
  loader: async ({ context }) => {
    const data = await context.queryClient.ensureQueryData(libraryQuery());
    if (!data.isAdmin) throw redirect({ to: "/library" });
  },
  component: Admin,
});
type CourseRecord = {
  id: string;
  title: string;
  description: string;
  checkout_product_id: string | null;
  published: boolean;
};

function Admin() {
  const { data } = useSuspenseQuery(libraryQuery());
  const [selected, setSelected] = useState<string | null>(data.courses[0]?.id ?? null);
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const client = useQueryClient();
  const course = data.courses.find((c) => c.id === selected);
  const modules = data.courses.flatMap((c) => c.modules);
  const lessons = modules.flatMap((m) => m.lessons);
  const refresh = async () => {
    await client.invalidateQueries({ queryKey: ["library"] });
    if (editingLesson) await client.invalidateQueries({ queryKey: ["lesson", editingLesson] });
  };
  if (!data.isAdmin) return null;
  return (
    <PlatformShell admin>
      <div className="page-heading">
        <div>
          <span className="section-eyebrow">CONTROLE COM CLAREZA</span>
          <h1>Administração</h1>
          <p>Organize seu conteúdo. Crie experiências que transformam.</p>
        </div>
        <span className="admin-status">
          <ShieldCheck /> Acesso administrativo
        </span>
      </div>
      <section className="stats-grid" aria-label="Resumo do conteúdo">
        <div className="stat-card">
          <span className="stat-icon">
            <BookOpen />
          </span>
          <div>
            <strong>{data.courses.length}</strong>
            <span>Cursos cadastrados</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon blue">
            <Layers3 />
          </span>
          <div>
            <strong>{modules.length}</strong>
            <span>Módulos</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon green">
            <Play />
          </span>
          <div>
            <strong>{lessons.length}</strong>
            <span>Aulas cadastradas</span>
          </div>
        </div>
      </section>
      <div className="section-heading">
        <div>
          <span className="section-eyebrow">SEU CATÁLOGO</span>
          <h2>Gerenciar conteúdo</h2>
        </div>
        <Button
          onClick={() => {
            setSelected(null);
            setEditingLesson(null);
          }}
        >
          <Plus />
          Novo curso
        </Button>
      </div>
      <div className="admin-layout">
        <aside className="admin-course-list" aria-label="Cursos para editar">
          <h3>
            Cursos <span>{data.courses.length}</span>
          </h3>
          {data.courses.map((c) => (
            <Button
              key={c.id}
              variant="nav"
              aria-pressed={selected === c.id}
              className={selected === c.id ? "nav-active" : ""}
              onClick={() => {
                setSelected(c.id);
                setEditingLesson(null);
              }}
            >
              <BookOpen />
              <span>
                {c.title}
                <small>{c.published ? "Publicado" : "Rascunho"} · Editar curso completo</small>
              </span>
            </Button>
          ))}
          {!data.courses.length && <p>Comece criando seu primeiro curso.</p>}
        </aside>
        <div className="admin-editor">
          <CourseForm
            key={selected ?? "new"}
            course={course}
            onSaved={async (id) => {
              await refresh();
              setSelected(id);
            }}
          />
          {course && (
            <>
              <section className="editor-band">
                <div className="section-heading">
                  <h3>Módulos e aulas</h3>
                  <span className="quiet-label">{course.modules.length} módulos</span>
                </div>
                <ModuleForm
                  courseId={course.id}
                  position={course.modules.reduce((max, m) => Math.max(max, m.position + 1), 0)}
                  onSaved={refresh}
                />
                {[...course.modules]
                  .sort((a, b) => a.position - b.position)
                  .map((module) => (
                    <details className="admin-module" key={module.id} open>
                      <summary>
                        <span>
                          <Layers3 />
                          {module.title}
                        </span>
                        <span>{module.lessons.length} aulas</span>
                      </summary>
                      <details className="module-edit">
                        <summary>
                          <Pencil /> Editar módulo
                        </summary>
                        <ModuleEditor
                          key={`${module.id}-${module.title}-${module.position}`}
                          module={module}
                          courseId={course.id}
                          onSaved={refresh}
                        />
                      </details>
                      <div className="saved-lessons">
                        {[...module.lessons]
                          .sort((a, b) => a.position - b.position)
                          .map((lesson) => (
                            <div className="admin-lesson" key={lesson.id}>
                              <Button
                                variant="nav"
                                aria-pressed={editingLesson === lesson.id}
                                onClick={() =>
                                  setEditingLesson(editingLesson === lesson.id ? null : lesson.id)
                                }
                              >
                                <Pencil />
                                <span>
                                  {lesson.title}
                                  <small>
                                    {lesson.published ? "Publicada" : "Rascunho"} · Editar aula
                                  </small>
                                </span>
                              </Button>
                              <Button variant="ghost" size="icon" asChild>
                                <Link
                                  to="/lesson/$id"
                                  params={{ id: lesson.id }}
                                  aria-label={`Visualizar ${lesson.title}`}
                                >
                                  <ArrowUpRight />
                                </Link>
                              </Button>
                            </div>
                          ))}
                      </div>
                      {module.lessons.some((lesson) => lesson.id === editingLesson) &&
                        editingLesson && (
                          <div className="module-lesson-editor">
                            <Button variant="ghost" onClick={() => setEditingLesson(null)}>
                              Fechar edição da aula
                            </Button>
                            <LessonEditor
                              key={editingLesson}
                              id={editingLesson}
                              onSaved={refresh}
                            />
                          </div>
                        )}
                      <LessonForm
                        moduleId={module.id}
                        position={module.lessons.reduce(
                          (max, l) => Math.max(max, l.position + 1),
                          0,
                        )}
                        onSaved={refresh}
                      />
                    </details>
                  ))}
              </section>
            </>
          )}
          <div className="admin-notice">
            <ShieldCheck />
            <p>
              O acesso dos alunos continua vinculado às compras aprovadas e às permissões
              existentes.{" "}
              <a href={CHECKOUT_URL}>
                Abrir PictoPay <ArrowUpRight />
              </a>
            </p>
          </div>
        </div>
      </div>
    </PlatformShell>
  );
}
function useSaveAction() {
  const [busy, setBusy] = useState(false);
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
      toast.success("Alterações salvas.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  };
  return { busy, run };
}
function CourseForm({
  course,
  onSaved,
}: {
  course: CourseRecord | undefined;
  onSaved: (id: string) => Promise<void>;
}) {
  const save = useServerFn(saveCourse);
  const { busy, run } = useSaveAction();
  const [title, setTitle] = useState(course?.title ?? "");
  const [description, setDescription] = useState(course?.description ?? "");
  const [product, setProduct] = useState(course?.checkout_product_id ?? "");
  const [published, setPublished] = useState(course?.published ?? false);
  return (
    <form
      className="editor-form"
      onSubmit={(e) => {
        e.preventDefault();
        void run(async () => {
          const saved = await save({
            data: {
              ...(course ? { id: course.id } : {}),
              title,
              description,
              checkout_product_id: product,
              published,
            },
          });
          await onSaved(saved.id);
        });
      }}
    >
      <div>
        <span className="section-eyebrow">INFORMAÇÕES DO CURSO</span>
        <h2>{course ? "Editar curso" : "Novo curso"}</h2>
      </div>
      <label>
        Título
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nome do curso"
        />
      </label>
      <label>
        Descrição
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="O que seus alunos vão aprender?"
        />
      </label>
      <label>
        ID do produto no PictoPay
        <input
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          placeholder="Identificador do produto vinculado"
        />
      </label>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
        />
        Curso publicado
      </label>
      <div className="editor-actions">
        <Button type="submit" disabled={busy}>
          <Save />
          {busy ? "Salvando..." : "Salvar curso"}
        </Button>
      </div>
    </form>
  );
}
function ModuleForm({
  courseId,
  position,
  onSaved,
}: {
  courseId: string;
  position: number;
  onSaved: () => Promise<void>;
}) {
  const save = useServerFn(saveModule);
  const { busy, run } = useSaveAction();
  const [title, setTitle] = useState("");
  return (
    <form
      className="editor-row"
      onSubmit={(e) => {
        e.preventDefault();
        void run(async () => {
          await save({ data: { course_id: courseId, title, position } });
          setTitle("");
          await onSaved();
        });
      }}
    >
      <input
        required
        aria-label="Título do novo módulo"
        placeholder="Nome do novo módulo"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Button variant="outline" disabled={busy}>
        <Plus />
        {busy ? "Salvando..." : "Adicionar módulo"}
      </Button>
    </form>
  );
}
function ModuleEditor({
  module,
  courseId,
  onSaved,
}: {
  module: { id: string; title: string; position: number };
  courseId: string;
  onSaved: () => Promise<void>;
}) {
  const save = useServerFn(saveModule);
  const { busy, run } = useSaveAction();
  const [title, setTitle] = useState(module.title);
  const [position, setPosition] = useState(module.position);
  return (
    <form
      className="editor-form"
      onSubmit={(event) => {
        event.preventDefault();
        void run(async () => {
          await save({ data: { id: module.id, course_id: courseId, title, position } });
          await onSaved();
        });
      }}
    >
      <label>
        Título do módulo
        <input required value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label>
        Ordem do módulo
        <input
          type="number"
          required
          min={0}
          step={1}
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
        />
      </label>
      <div className="editor-actions">
        <Button disabled={busy}>
          <Save />
          {busy ? "Salvando..." : "Salvar módulo"}
        </Button>
      </div>
    </form>
  );
}
type LessonRecord = {
  id: string;
  title: string;
  video_url: string;
  provider: string;
  published: boolean;
  position: number;
};
function LessonForm({
  moduleId,
  position,
  lesson,
  onSaved,
}: {
  moduleId: string;
  position: number;
  lesson?: LessonRecord;
  onSaved: () => Promise<void>;
}) {
  const save = useServerFn(saveLesson);
  const { busy, run } = useSaveAction();
  const [title, setTitle] = useState(lesson?.title ?? "");
  const [url, setUrl] = useState(lesson?.video_url ?? "");
  const [provider, setProvider] = useState<"direct" | "storage">(
    lesson?.provider === "storage" ? "storage" : "direct",
  );
  const [published, setPublished] = useState(lesson?.published ?? false);
  const [order, setOrder] = useState(lesson?.position ?? position);
  function submit(e: FormEvent) {
    e.preventDefault();
    void run(async () => {
      await save({
        data: {
          ...(lesson ? { id: lesson.id } : {}),
          module_id: moduleId,
          title,
          video_url: url,
          provider,
          published,
          position: order,
        },
      });
      if (!lesson) {
        setTitle("");
        setUrl("");
        setPublished(false);
      }
      await onSaved();
    });
  }
  return (
    <form className="editor-form lesson-form" onSubmit={submit}>
      <h4>{lesson ? "Editar aula" : "Nova aula"}</h4>
      <label>
        Título da aula
        <input required value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <div className="form-columns">
        <label>
          Origem do vídeo
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as "direct" | "storage")}
          >
            <option value="direct">Link HTTPS ou YouTube</option>
            <option value="storage">Arquivo no armazenamento</option>
          </select>
        </label>
        <label>
          Ordem
          <input
            type="number"
            min={0}
            step={1}
            required
            value={lesson ? order : position}
            onChange={(e) => setOrder(Number(e.target.value))}
            readOnly={!lesson}
          />
        </label>
      </div>
      <label>
        {provider === "direct"
          ? "Link do vídeo (YouTube, MP4 ou WebM)"
          : "Caminho do arquivo em course-files"}
        <input
          type={provider === "direct" ? "url" : "text"}
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={provider === "direct" ? "https://..." : "pasta/video.mp4"}
        />
      </label>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
        />
        Aula publicada
      </label>
      <div className="editor-actions">
        <Button variant={lesson ? "default" : "outline"} disabled={busy}>
          {lesson ? <Save /> : <Plus />}
          {busy ? "Salvando..." : lesson ? "Salvar aula" : "Adicionar aula"}
        </Button>
      </div>
    </form>
  );
}
function LessonEditor({ id, onSaved }: { id: string; onSaved: () => Promise<void> }) {
  const { data, isPending, error } = useQuery(lessonQuery(id));
  if (isPending)
    return (
      <section className="editor-band" role="status">
        Carregando aula...
      </section>
    );
  if (error || !data)
    return (
      <section className="editor-band" role="alert">
        Não foi possível carregar a aula. Tente selecioná-la novamente.
      </section>
    );
  return (
    <section className="editor-band">
      <LessonForm
        key={`${id}-${data.title}-${data.video_url}-${data.position}-${data.published}`}
        moduleId={data.module_id}
        position={data.position}
        lesson={data}
        onSaved={onSaved}
      />
      <div className="editor-band">
        <h3>Materiais complementares</h3>
        {data.materials.map((m) => (
          <a className="material-link" key={m.id} href={m.url} download>
            {m.title}
            <ArrowUpRight />
          </a>
        ))}
        <MaterialForm lessonId={id} onSaved={onSaved} />
      </div>
    </section>
  );
}
function MaterialForm({ lessonId, onSaved }: { lessonId: string; onSaved: () => Promise<void> }) {
  const save = useServerFn(saveMaterial);
  const { busy, run } = useSaveAction();
  const [title, setTitle] = useState("");
  const [path, setPath] = useState("");
  return (
    <form
      className="editor-form"
      onSubmit={(e) => {
        e.preventDefault();
        void run(async () => {
          await save({ data: { lesson_id: lessonId, title, file_path: path } });
          setTitle("");
          setPath("");
          await onSaved();
        });
      }}
    >
      <label>
        Nome do material
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex.: Apostila da aula"
        />
      </label>
      <label>
        Caminho do arquivo em course-files
        <input
          required
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="pasta/apostila.pdf"
        />
      </label>
      <p className="small-note">
        Vincule um arquivo já disponível no armazenamento privado do projeto. O download mantém a
        proteção de acesso existente.
      </p>
      <div className="editor-actions">
        <Button variant="outline" disabled={busy}>
          <Plus />
          {busy ? "Salvando..." : "Vincular material"}
        </Button>
      </div>
    </form>
  );
}
