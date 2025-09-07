import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import schoolLogo from 'figma:asset/6c5b559c47b3a60a366fb3371a7065b4c91fe552.png';
import studentsImage from 'figma:asset/a9fb3a683259798a4a27feea2731b90f66e5a88e.png';

interface LoginPageProps {
  onLogin: (role: 'teacher' | 'parent' | 'admin', userData: any) => void;
  onSwitchToSignup: () => void;
}

export function LoginPage({ onLogin, onSwitchToSignup }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = () => {
    // Mock login - determine role based on email domain/pattern
    let role: 'teacher' | 'parent' | 'admin' = 'parent';
    
    if (email.includes('admin') || email.includes('principal')) {
      role = 'admin';
    } else if (email.includes('teacher') || email.endsWith('@faith-life.edu.ng')) {
      role = 'teacher';
    }

    // Mock user data based on determined role
    const mockUserData = {
      teacher: {
        id: 'T001',
        name: 'Mrs. Adebayo Oluwaseun',
        email: email || 'oluwaseun.adebayo@faith-life.edu.ng',
        subjects: ['Mathematics', 'Further Mathematics'],
        classes: ['JSS1 A', 'JSS2 B', 'SS1 C']
      },
      parent: {
        id: 'P001',
        name: 'Mr. Babatunde Ogunkoya',
        email: email || 'babatunde.ogunkoya@gmail.com',
        phone: '+234 803 123 4567',
        children: [
          { id: 'S001', name: 'Temilade Ogunkoya', class: 'JSS2 A', rollNo: 'JSS2A/001' },
          { id: 'S002', name: 'Olumide Ogunkoya', class: 'SS1 B', rollNo: 'SS1B/015' }
        ]
      },
      admin: {
        id: 'A001',
        name: 'Dr. Folake Adeyemi',
        email: email || 'admin@faith-life.edu.ng',
        role: 'Principal'
      }
    };

    onLogin(role, mockUserData[role]);
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
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
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
              onClick={() => {
                // TODO: Implement forgot password functionality
                alert('Forgot password functionality will be implemented soon!');
              }}
            >
              Forgot password?
            </button>
          </div>

          <Button 
            className="w-full" 
            onClick={handleLogin}
            disabled={!email || !password}
          >
            Sign In
          </Button>

          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              Demo: Use any email/password combination
            </p>
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