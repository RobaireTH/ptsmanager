import { useState } from 'react';
import { LoginPage } from './LoginPage';
import { SignupPage } from './SignupPage';

interface AuthPageProps {
  onLogin: (role: 'teacher' | 'parent' | 'admin', userData: any) => void;
}

export function AuthPage({ onLogin }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);

  return isLogin ? (
    <LoginPage 
      onLogin={onLogin}
      onSwitchToSignup={() => setIsLogin(false)}
    />
  ) : (
    <SignupPage 
      onLogin={onLogin}
      onSwitchToLogin={() => setIsLogin(true)}
    />
  );
}