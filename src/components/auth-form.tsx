import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowRight, LockKeyhole, Mail, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAccount } from './auth-context';
export function AuthForm() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [failed, setFailed] = useState(false);
  const navigate = useNavigate(); const { user } = useAccount();
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage(''); setFailed(false);
    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error; setMessage('Confira seu e-mail para redefinir a senha.');
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error; setMessage('Confira seu e-mail e confirme o cadastro antes de entrar.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error; await navigate({ to: '/library' });
      }
    } catch (error) { setFailed(true); setMessage(error instanceof Error ? error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message : 'Não foi possível continuar.'); }
    finally { setBusy(false); }
  }
  if (user) return <div className="signed-in-prompt"><h2>Seu próximo aprendizado começa aqui.</h2><Button asChild size="lg"><Link to="/library">Abrir meus cursos <ArrowRight /></Link></Button></div>;
  return <div className="access-section"><div className="access-heading"><span className="section-eyebrow">SEU ACESSO</span><h2>{mode === 'signup' ? 'Crie sua conta.' : mode === 'forgot' ? 'Recupere sua senha.' : 'Bom ter você por aqui.'}</h2><p>Entre com o mesmo e-mail utilizado na compra.</p><div className="access-security"><LockKeyhole /><span>Conteúdos exclusivos.<br />Uma conta só sua.</span></div></div><form onSubmit={submit} className="access-form"><div className="form-tabs"><Button type="button" variant="tab" aria-pressed={mode !== 'signup'} onClick={() => { setMode('login'); setMessage(''); }}>Entrar</Button><Button type="button" variant="tab" aria-pressed={mode === 'signup'} onClick={() => { setMode('signup'); setMessage(''); }}>Criar conta</Button></div><label htmlFor="email">E-mail da compra</label><div className="input-with-icon"><Mail /><input id="email" type="email" autoComplete="email" required placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} /></div>{mode !== 'forgot' && <><div className="label-row"><label htmlFor="password">Senha</label>{mode === 'login' && <Button type="button" variant="link" size="sm" onClick={() => { setMode('forgot'); setMessage(''); }}>Esqueci minha senha</Button>}</div><div className="input-with-icon"><LockKeyhole /><input id="password" type={visible ? 'text' : 'password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={mode === 'signup' ? 8 : undefined} required placeholder={mode === 'signup' ? 'Pelo menos 8 caracteres' : 'Sua senha'} value={password} onChange={e => setPassword(e.target.value)} /><Button type="button" variant="ghost" size="icon" aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff /> : <Eye />}</Button></div></>}{message && <p role={failed ? 'alert' : 'status'} className={failed ? 'form-error' : 'form-success'}>{message}</p>}<Button size="lg" className="submit-access" disabled={busy}>{busy ? 'Aguarde…' : mode === 'signup' ? 'Criar minha conta' : mode === 'forgot' ? 'Enviar link de recuperação' : 'Entrar na minha conta'}<ArrowRight /></Button></form></div>;
}