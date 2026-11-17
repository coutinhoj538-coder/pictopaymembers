import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, Leaf } from 'lucide-react';
import { PlatformShell } from '@/components/platform-shell';
import { AuthForm } from '@/components/auth-form';
import { metadata } from '@/lib/platform';
import cover from '@/assets/botanical-cover.jpg';

// The home route ships no og:image, so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  head: () => metadata('Bem-vindo', 'Acesse seus cursos com o e-mail utilizado na compra e continue seu aprendizado.'),
  component: Index,
});

// IMPORTANT: Replace this placeholder. See ./README.md for routing conventions.
function Index() {
  return (
    <PlatformShell><div className="welcome-heading"><div><span className="section-eyebrow">BEM-VINDO AO SEU ESPAÇO</span><h1>Conhecimento que floresce.</h1></div><span className="welcome-label"><Leaf /> Um novo capítulo começa aqui</span></div><section className="welcome-cover"><img src={cover} alt="Jardim tropical iluminado pelo sol" width={1536} height={1024} /><div className="cover-shade" /><div className="cover-copy"><span className="cover-eyebrow">ÁREA DE ALUNOS</span><h2>Aprender é cultivar<br />novas possibilidades.</h2><p>Seu conhecimento, no seu tempo.<br />Um espaço para crescer a cada aula.</p><a href="#acesso" className="cover-scroll"><ArrowDown /> Continue sua jornada</a></div><span className="cover-number">01 — SEU PRÓXIMO PASSO</span></section><section id="acesso"><AuthForm /></section></PlatformShell>
  );
}
