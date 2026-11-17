import { useState } from "react";
import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
const api = vi.hoisted(() => ({ upload: vi.fn(), createSignedUrl: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { storage: { from: () => api } } }));
import { ModuleCoverField, type ModuleCover } from "@/components/module-cover-field";
const busy = vi.fn();
function Field() {
  const [cover, setCover] = useState<ModuleCover>({ path: null, url: null });
  return <ModuleCoverField value={cover} onChange={setCover} onBusy={busy} />;
}
beforeEach(() => {
  vi.resetAllMocks();
  api.upload.mockResolvedValue({ error: null });
  api.createSignedUrl.mockResolvedValue({
    data: { signedUrl: "https://example.com/signed-cover" },
    error: null,
  });
});
it("uploads a supported image to private storage and allows removing the selection", async () => {
  render(<Field />);
  const file = new File(["image"], "capa.png", { type: "image/png" });
  fireEvent.change(screen.getByLabelText("Capa do módulo"), { target: { files: [file] } });
  await waitFor(() =>
    expect(api.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^module-covers\/[a-z0-9-]+\.png$/),
      file,
      { contentType: "image/png", upsert: false },
    ),
  );
  expect(await screen.findByRole("img")).toHaveAttribute("src", "https://example.com/signed-cover");
  expect(busy).toHaveBeenLastCalledWith(false);
  fireEvent.click(screen.getByRole("button", { name: "Remover capa" }));
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
});
it("rejects unsupported files without uploading", () => {
  render(<Field />);
  fireEvent.change(screen.getByLabelText("Capa do módulo"), {
    target: { files: [new File(["x"], "file.svg", { type: "image/svg+xml" })] },
  });
  expect(screen.getByRole("alert")).toHaveTextContent("JPG, PNG ou WebP");
  expect(api.upload).not.toHaveBeenCalled();
});
it("reports upload errors and releases the form", async () => {
  api.upload.mockResolvedValue({ error: new Error("Falha no envio") });
  render(<Field />);
  fireEvent.change(screen.getByLabelText("Capa do módulo"), {
    target: { files: [new File(["x"], "capa.jpg", { type: "image/jpeg" })] },
  });
  expect(await screen.findByRole("alert")).toHaveTextContent("Falha no envio");
  expect(busy).toHaveBeenLastCalledWith(false);
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
});
