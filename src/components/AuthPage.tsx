import { useState } from 'react';
import { LoginPage } from './LoginPage';
import { SignupPage } from './SignupPage';
import { ForgotPasswordPage } from './ForgotPasswordPage';

interface AuthPageProps {
  onLogin: (role: 'teacher' | 'parent' | 'admin', userData: any) => void;
}

export function AuthPage({ onLogin }: AuthPageProps) {
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');

  return view === 'login' ? (
    <LoginPage 
      onLogin={onLogin}
      onSwitchToSignup={() => setView('signup')}
      onSwitchToForgot={() => setView('forgot')}
    />
  ) : view === 'signup' ? (
    <SignupPage 
      onLogin={onLogin}
      onSwitchToLogin={() => setView('login')}
    />
  ) : (
    <ForgotPasswordPage
      onSwitchToLogin={() => setView('login')}
    />
  );
}
