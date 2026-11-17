import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentType, ReactNode } from "react";

const state = vi.hoisted(() => ({
  data: {
    isAdmin: false,
    courses: [] as Record<string, unknown>[],
    progress: [] as Record<string, unknown>[],
  },
}));
vi.mock("@tanstack/react-query", () => ({
  useSuspenseQuery: () => ({ data: state.data, refetch: vi.fn(), isFetching: false }),
}));
vi.mock("@/lib/course-queries", () => ({ libraryQuery: () => ({}) }));
vi.mock("@/components/platform-shell", () => ({
  PlatformShell: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock("@/components/auth-context", () => ({
  useAccount: () => ({
    user: { email: "aluna@example.com", user_metadata: { full_name: "Jussara Coutinho" } },
  }),
}));
vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  Link: ({
    children,
    to,
    params,
    ...props
  }: {
    children: ReactNode;
    to: string;
    params?: { id: string };
  }) => (
    <a href={params ? `/lesson/${params.id}` : to} {...props}>
      {children}
    </a>
  ),
}));
import { Route } from "@/routes/_authenticated/library";
const Dashboard = Route.options.component as ComponentType;

beforeEach(() => {
  state.data = {
    isAdmin: false,
    courses: [
      {
        id: "course-a",
        title: "Fotografia",
        description: "Luz e composição",
        published: true,
        created_at: "2026-01-01",
        modules: [
          {
            id: "module-a",
            title: "Fundamentos",
            position: 0,
            lessons: [
              { id: "lesson-2", title: "Composição", published: true, position: 1 },
              { id: "lesson-1", title: "Luz", published: true, position: 0 },
            ],
          },
        ],
      },
      {
        id: "course-b",
        title: "Design",
        description: "Projetos criativos",
        published: true,
        created_at: "2026-01-01",
        modules: [
          {
            id: "module-b",
            title: "Introdução",
            position: 0,
            lessons: [{ id: "lesson-3", title: "Cores", published: true, position: 0 }],
          },
        ],
      },
    ],
    progress: [
      { lesson_id: "lesson-1", completed: true, seconds: 30, updated_at: "2026-11-17T12:00:00Z" },
    ],
  };
});
describe("Member dashboard", () => {
  it("resumes the next unfinished lesson and preserves cached lesson ordering", () => {
    const original = JSON.stringify(state.data);
    render(<Dashboard />);
    expect(screen.getByRole("heading", { name: /Olá, Jussara/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continuar aprendendo" })).toHaveAttribute(
      "href",
      "/lesson/lesson-2",
    );
    expect(screen.getByRole("progressbar", { name: "Progresso em Fotografia" })).toHaveAttribute(
      "value",
      "50",
    );
    expect(JSON.stringify(state.data)).toBe(original);
  });
  it("searches and filters actual courses, including no matching results", () => {
    state.data.progress.push({
      lesson_id: "lesson-2",
      completed: true,
      seconds: 30,
      updated_at: "2026-11-17T13:00:00Z",
    });
    render(<Dashboard />);
    fireEvent.click(screen.getByRole("button", { name: "Concluídos" }));
    expect(screen.getByRole("heading", { name: "Fotografia" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Design" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "inexistente" } });
    expect(screen.getByText("Nenhum curso encontrado")).toBeInTheDocument();
  });
  it("keeps the purchase link and an honest empty state when no courses are granted", () => {
    state.data.courses = [];
    state.data.progress = [];
    render(<Dashboard />);
    expect(
      screen.getByText("Nenhum curso foi liberado para este e-mail ainda."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Acessar meu checkout/ })).toHaveAttribute(
      "href",
      "https://pictopay.lovable.app/",
    );
    expect(screen.queryByRole("link", { name: "Continuar aprendendo" })).not.toBeInTheDocument();
  });
  it("shows recent activity linked to accessible lessons only", () => {
    state.data.progress.push({
      lesson_id: "unavailable",
      completed: true,
      seconds: 10,
      updated_at: "2026-11-17T13:00:00Z",
    });
    render(<Dashboard />);
    const section = screen
      .getByRole("heading", { name: "Atividades recentes" })
      .closest("section")!;
    expect(within(section).getByRole("link", { name: "Luz" })).toHaveAttribute(
      "href",
      "/lesson/lesson-1",
    );
    expect(within(section).getAllByRole("listitem")).toHaveLength(1);
  });
});
