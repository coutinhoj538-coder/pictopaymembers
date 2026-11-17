import type { ReactNode } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { BookOpen, ArrowUpRight, Leaf, LogOut, ShieldCheck, CircleHelp, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAccount } from './auth-context';
import { supabase } from '@/integrations/supabase/client';
import { CHECKOUT_URL } from '@/lib/platform';
import { toast } from 'sonner';
export function PlatformShell({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { user } = useAccount();
  const { pathname } = useLocation();
  return <div className="platform"><aside className="side-nav"><Link to="/" className="brand"><span className="brand-mark"><Leaf /></span><span>Área de alunos<small>SEU ESPAÇO DE CONHECIMENTO</small></span></Link><div className="nav-caption">APRENDIZADO</div><Button asChild variant="nav" className={pathname !== '/admin' ? 'nav-active' : ''}><Link to={user ? '/library' : '/'}><BookOpen />Meus cursos</Link></Button>{admin && <Button asChild variant="nav" className={pathname === '/admin' ? 'nav-active' : ''}><Link to="/admin"><ShieldCheck />Administração</Link></Button>}<div className="sidebar-bottom"><div className="support-note"><CircleHelp /><div>Dúvidas sobre sua compra?<a href={CHECKOUT_URL}>Acessar PictoPay <ArrowUpRight /></a></div></div><span className="sidebar-footer"><span className="status-dot" /> Um espaço para aprender</span></div></aside><div className="page-column"><header className="topbar"><span className="breadcrumb"><Home /> <span>/</span> {pathname === '/admin' ? 'Administração' : 'Meus cursos'}</span><div className="account-area">{user && <><span className="account-email">{user.email}</span><Button variant="ghost" size="icon" title="Sair" aria-label="Sair" onClick={async () => { const { error } = await supabase.auth.signOut(); if (error) toast.error(error.message); }}><LogOut /></Button></>}<span className="account-avatar">{user?.email?.slice(0, 1).toUpperCase() || <Leaf />}</span></div></header><main className="main-content">{children}</main><footer className="page-footer"><span>Área de alunos</span><span><ShieldCheck /> Seu acesso, protegido.</span></footer></div></div>;
}