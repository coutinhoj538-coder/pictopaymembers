import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState, type FormEvent } from 'react';
import { PlatformShell } from '@/components/platform-shell';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { metadata } from '@/lib/platform';
export const Route = createFileRoute('/reset-password')({ head: () => metadata('Nova senha', 'Defina uma nova senha para acessar seus cursos.'), component: Reset });
function Reset() {
  const [valid, setValid] = useState(false); const [password, setPassword] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  useEffect(() => { const params = new URLSearchParams(window.location.hash.slice(1)); const recovery = params.get('type') === 'recovery'; void supabase.auth.getUser().then(({ data }) => setValid(recovery && !!data.user)); }, []);
  async function submit(e: FormEvent) { e.preventDefault(); if (!valid) return; setBusy(true); const { error } = await supabase.auth.updateUser({ password }); setBusy(false); setMessage(error?.message ?? 'Senha atualizada.'); if (!error) setDone(true); }
  return <PlatformShell><div className="reset-section"><span className="section-eyebrow">SUA CONTA</span><h1>Defina sua nova senha.</h1>{valid && !done ? <form onSubmit={submit}><label htmlFor="new-password">Nova senha</label><input id="new-password" required minLength={8} type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} /><Button disabled={busy}>{busy ? 'Salvando…' : 'Salvar nova senha'}</Button></form> : <p>{done ? 'Sua senha foi alterada.' : 'Abra o link de recuperação recebido por e-mail.'}</p>}{message && <p role="status">{message}</p>}<Button asChild variant="link"><Link to="/auth">Voltar para entrar</Link></Button></div></PlatformShell>;
}