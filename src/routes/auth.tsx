import { createFileRoute } from '@tanstack/react-router';
import { AuthForm } from '@/components/auth-form';
import { PlatformShell } from '@/components/platform-shell';
import { metadata } from '@/lib/platform';
export const Route = createFileRoute('/auth')({ head: () => metadata('Entrar', 'Entre ou cadastre sua conta com o e-mail da compra.'), component: () => <PlatformShell><AuthForm /></PlatformShell> });