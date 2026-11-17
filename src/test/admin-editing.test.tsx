import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { ComponentType, ReactNode } from "react";
const mocks = vi.hoisted(() => ({ saveModule: vi.fn(), invalidate: vi.fn() }));
vi.mock("@/lib/courses.functions", () => ({
  saveModule: mocks.saveModule,
  saveCourse: vi.fn(),
  saveLesson: vi.fn(),
  saveMaterial: vi.fn(),
}));
vi.mock("@/lib/course-queries", () => ({ libraryQuery: () => ({}), lessonQuery: () => ({}) }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidate }),
  useQuery: () => ({ isPending: true }),
  useSuspenseQuery: () => ({
    data: {
      isAdmin: true,
      courses: [
        {
          id: "course",
          title: "Curso existente",
          description: "Descrição",
          published: true,
          checkout_product_id: "product",
          modules: [
            {
              id: "module",
              title: "Módulo existente",
              position: 1,
              lessons: [{ id: "lesson", title: "Aula existente", published: true, position: 0 }],
            },
          ],
        },
      ],
    },
  }),
}));
vi.mock("@/components/platform-shell", () => ({
  PlatformShell: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock("@tanstack/react-router", async (original) => ({
  ...(await original<object>()),
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}));
import { Route } from "@/routes/_authenticated/admin";
it("edits an existing module by its ID and exposes lesson and course editing", async () => {
  mocks.saveModule.mockResolvedValue({ id: "module" });
  mocks.invalidate.mockResolvedValue(undefined);
  const Admin = Route.options.component as ComponentType;
  render(<Admin />);
  expect(screen.getByLabelText("Título")).toHaveValue("Curso existente");
  fireEvent.click(screen.getByText("Editar módulo", { exact: true }));
  fireEvent.change(screen.getByLabelText("Título do módulo"), {
    target: { value: "Módulo atualizado" },
  });
  fireEvent.change(screen.getByLabelText("Ordem do módulo"), { target: { value: "3" } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar módulo" }));
  await waitFor(() =>
    expect(mocks.saveModule).toHaveBeenCalledWith({
      data: { id: "module", course_id: "course", title: "Módulo atualizado", position: 3 },
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: /Aula existente.*Editar aula/ }));
  expect(screen.getByRole("button", { name: "Fechar edição da aula" })).toBeInTheDocument();
});
