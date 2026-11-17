import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/course-queries", () => ({
  libraryQuery: () => ({ queryKey: ["library"] }),
  lessonQuery: () => ({}),
}));
vi.mock("@/lib/courses.functions", () => ({
  saveCourse: vi.fn(),
  saveModule: vi.fn(),
  saveLesson: vi.fn(),
  saveMaterial: vi.fn(),
}));
vi.mock("@/components/platform-shell", () => ({ PlatformShell: () => null }));
import { Route } from "@/routes/_authenticated/admin";

const loader = Route.options.loader as unknown as (args: {
  context: { queryClient: { ensureQueryData: () => Promise<{ isAdmin: boolean }> } };
}) => Promise<void>;
describe("Administration access", () => {
  it("redirects a student away from the administration page", async () => {
    await expect(
      loader({ context: { queryClient: { ensureQueryData: async () => ({ isAdmin: false }) } } }),
    ).rejects.toMatchObject({ options: { to: "/library" } });
  });
  it("allows an account whose existing role check grants admin access", async () => {
    await expect(
      loader({ context: { queryClient: { ensureQueryData: async () => ({ isAdmin: true }) } } }),
    ).resolves.toBeUndefined();
  });
});
