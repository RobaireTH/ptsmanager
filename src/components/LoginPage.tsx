import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
// Replaced missing Figma-exported image with local logo
import schoolLogo from '../assets/logo.jpg';
import studentsImage from '../assets/a9fb3a683259798a4a27feea2731b90f66e5a88e.png';
// @ts-ignore - TypeScript module resolution for JS file
import { getParentById, initializeLocalStorage } from '../utils/localStorage';
import { login as apiLogin, getMe } from '../lib/api';
import { Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
  onLogin: (role: 'teacher' | 'parent' | 'admin', userData: any) => void;
  onSwitchToSignup: () => void;
  onSwitchToForgot: () => void;
}

export function LoginPage({ onLogin, onSwitchToSignup, onSwitchToForgot }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const tokenRes = await apiLogin(email, password);
      // Persist tokens BEFORE calling getMe so requests use the fresh Authorization header
      localStorage.setItem('authToken', tokenRes.access_token);
      localStorage.setItem('refreshToken', tokenRes.refresh_token);
      const me = await getMe(tokenRes.access_token);
      localStorage.setItem('userRole', me.role);
      localStorage.setItem('userData', JSON.stringify(me));
      onLogin(me.role as 'teacher' | 'parent' | 'admin', me);
    } catch (e: any) {
      const msg = e?.message || 'Sign in failed. Check your email and password.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `linear-gradient(rgba(29, 78, 216, 0.8), rgba(30, 58, 138, 0.8)), url(${studentsImage})` 
        }}
      />
      <div className="relative z-10 w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-primary">
              <img src={schoolLogo} alt="Faith-Life International College Logo" className="h-8 w-8" />
              Faith-Life International College
            </CardTitle>
            <CardDescription>
              Welcome back! Sign in to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me and Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="remember" 
                checked={rememberMe}
                onCheckedChange={(checked: boolean) => setRememberMe(checked)}
              />
              <Label 
                htmlFor="remember" 
                className="text-sm font-normal cursor-pointer"
              >
                Remember me
              </Label>
            </div>
            <button 
              type="button"
              className="text-sm text-primary hover:underline font-medium"
              onClick={onSwitchToForgot}
            >
              Forgot password?
            </button>
          </div>

          <Button 
            className="w-full" 
            onClick={handleLogin}
            disabled={!email || !password || loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              Don't have an account?{' '}
              <button 
                onClick={onSwitchToSignup}
                className="text-primary hover:underline font-medium"
              >
                Sign up here
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}