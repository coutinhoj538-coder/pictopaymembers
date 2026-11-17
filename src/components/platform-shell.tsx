import { useState, type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  BookOpen,
  ArrowUpRight,
  Layers3,
  LogOut,
  ShieldCheck,
  CircleHelp,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccount } from "./auth-context";
import { supabase } from "@/integrations/supabase/client";
import { CHECKOUT_URL } from "@/lib/platform";
import { toast } from "sonner";

export function PlatformShell({
  children,
  admin = false,
}: {
  children: ReactNode;
  admin?: boolean;
}) {
  const { user } = useAccount();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const isAdmin = pathname === "/admin";
  return (
    <div className="platform">
      <a className="skip-link" href="#main-content">
        Ir para o conteúdo
      </a>
      <aside className="side-nav">
        <Link to={user ? "/library" : "/"} className="brand">
          <span className="brand-mark">
            <Layers3 />
          </span>
          <span>
            PictoPay<span className="brand-subtitle">MEMBERS</span>
          </span>
        </Link>
        <Button
          className="mobile-menu"
          variant="ghost"
          size="icon"
          aria-label={open ? "Fechar navegação" : "Abrir navegação"}
          aria-expanded={open}
          aria-controls="platform-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </Button>
        <nav
          id="platform-navigation"
          aria-label="Navegação principal"
          className={open ? "navigation navigation-open" : "navigation"}
        >
          <div className="nav-caption">SEU ESPAÇO</div>
          <Button asChild variant="nav" className={!isAdmin ? "nav-active" : ""}>
            <Link
              to={user ? "/library" : "/"}
              aria-current={!isAdmin ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              <LayoutDashboard />
              Visão geral
            </Link>
          </Button>
          {user && (
            <Button variant="nav" asChild>
              <Link to="/library" hash="meus-cursos" onClick={() => setOpen(false)}>
                <BookOpen />
                Meus cursos
              </Link>
            </Button>
          )}
          {admin && (
            <>
              <div className="nav-caption admin-caption">GESTÃO</div>
              <Button asChild variant="nav" className={isAdmin ? "nav-active" : ""}>
                <Link
                  to="/admin"
                  aria-current={isAdmin ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  <ShieldCheck />
                  Administração
                </Link>
              </Button>
            </>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="support-note">
            <CircleHelp />
            <div>
              Precisa de uma ajuda?
              <a href={CHECKOUT_URL}>
                Acessar PictoPay <ArrowUpRight />
              </a>
            </div>
          </div>
          <span className="sidebar-footer">
            <span className="status-dot" /> Seu próximo passo começa aqui
          </span>
        </div>
      </aside>
      <div className="page-column">
        <header className="topbar">
          <span className="breadcrumb">
            <span className="topbar-label">ÁREA DE MEMBROS</span>
            <span>/</span>
            {isAdmin
              ? "Administração"
              : pathname.startsWith("/lesson")
                ? "Sala de aula"
                : "Visão geral"}
          </span>
          <div className="account-area">
            {user && (
              <>
                <span className="account-email">{user.email}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Sair"
                  aria-label="Sair"
                  onClick={async () => {
                    const { error } = await supabase.auth.signOut();
                    if (error) toast.error(error.message);
                  }}
                >
                  <LogOut />
                </Button>
              </>
            )}
            <span className="account-avatar" aria-label="Perfil">
              {user?.email?.slice(0, 1).toUpperCase() || <Layers3 />}
            </span>
          </div>
        </header>
        <main id="main-content" className="main-content">
          {children}
        </main>
        <footer className="page-footer">
          <span>PictoPay Members · Aprenda no seu ritmo</span>
          <span>
            <ShieldCheck /> Seu acesso, protegido.
          </span>
        </footer>
      </div>
    </div>
  );
}
