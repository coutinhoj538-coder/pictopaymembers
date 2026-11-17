import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, Sparkles } from "lucide-react";
import { PlatformShell } from "@/components/platform-shell";
import { AuthForm } from "@/components/auth-form";
import { metadata } from "@/lib/platform";
import cover from "@/assets/botanical-cover.jpg";

// The home route ships no og:image, so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  head: () =>
    metadata(
      "Bem-vindo",
      "Acesse seus cursos com o e-mail utilizado na compra e continue seu aprendizado.",
    ),
  component: Index,
});

// IMPORTANT: Replace this placeholder. See ./README.md for routing conventions.
function Index() {
  return (
    <PlatformShell>
      <div className="welcome-heading">
        <div>
          <span className="section-eyebrow">BEM-VINDO AO SEU ESPAÇO</span>
          <h1>Seu próximo nível começa aqui.</h1>
        </div>
        <span className="welcome-label">
          <Sparkles /> Aprenda. Evolua. Transforme.
        </span>
      </div>
      <section className="welcome-cover">
        <img src={cover} alt="Jardim tropical iluminado pelo sol" width={1536} height={1024} />
        <div className="cover-shade" />
        <div className="cover-copy">
          <span className="cover-eyebrow">ÁREA DE ALUNOS</span>
          <h2>
            Grandes mudanças.
            <br />
            Um passo de cada vez.
          </h2>
          <p>
            Seu conhecimento, no seu tempo.
            <br />
            Uma experiência para ir além.
          </p>
          <a href="#acesso" className="cover-scroll">
            <ArrowDown /> Continue sua jornada
          </a>
        </div>
        <span className="cover-number">PICTOPAY MEMBERS / SEU PRÓXIMO PASSO</span>
      </section>
      <section id="acesso">
        <AuthForm />
      </section>
    </PlatformShell>
  );
}
