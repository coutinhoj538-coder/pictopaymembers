import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
export type ModuleCover = { path: string | null; url: string | null };
export function ModuleCoverField({
  value,
  onChange,
  onBusy,
}: {
  value: ModuleCover;
  onChange: (value: ModuleCover) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  async function upload(file: File) {
    const extensions: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };
    const extension = extensions[file.type];
    if (!extension || file.size > 5 * 1024 * 1024) {
      setError("Escolha uma imagem JPG, PNG ou WebP de até 5 MB.");
      return;
    }
    setBusy(true);
    onBusy(true);
    setError("");
    try {
      const path = `module-covers/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("course-files")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      const { data, error: signingError } = await supabase.storage
        .from("course-files")
        .createSignedUrl(path, 3600);
      if (signingError) throw signingError;
      onChange({ path, url: data.signedUrl });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível enviar a imagem.");
    } finally {
      setBusy(false);
      onBusy(false);
      if (input.current) input.current.value = "";
    }
  }
  return (
    <div className="module-cover-field">
      <label>
        Capa do módulo
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
        />
      </label>
      {value.url && (
        <img className="module-cover-image" src={value.url} alt="Prévia da capa do módulo" />
      )}
      {value.path && (
        <Button
          type="button"
          variant="ghost"
          disabled={busy}
          onClick={() => onChange({ path: null, url: null })}
        >
          Remover capa
        </Button>
      )}
      <p className="small-note">
        {busy
          ? "Enviando imagem…"
          : "JPG, PNG ou WebP até 5 MB. A capa será aplicada ao salvar o módulo."}
      </p>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </div>
  );
}
