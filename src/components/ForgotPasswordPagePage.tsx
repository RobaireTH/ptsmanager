import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Mail } from 'lucide-react';
import schoolLogo from 'figma:asset/6c5b559c47b3a60a366fb3371a7065b4c91fe552.png';
import studentsImage from 'figma:asset/a9fb3a683259798a4a27feea2731b90f66e5a88e.png';
import { requestPasswordReset } from '../lib/api';

interface ForgotPasswordPageProps {
  onSwitchToLogin: () => void;
}

export function ForgotPasswordPage({ onSwitchToLogin }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to send reset link. Please try again.');
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
              Reset your password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sent ? (
              <div className="space-y-4 text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-foreground">
                  If an account exists for <span className="font-medium">{email}</span>, we have sent a password reset link.
                  Please check your inbox (and spam folder).
                </p>
                <Button className="w-full" onClick={onSwitchToLogin}>
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <>
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
                {error && (
                  <p className="text-destructive text-sm">{error}</p>
                )}
                <Button 
                  className="w-full" 
                  onClick={handleSubmit}
                  disabled={loading || !email.trim()}
                >
                  {loading ? 'Sending...' : 'Send reset link'}
                </Button>
                <div className="text-center">
                  <button 
                    onClick={onSwitchToLogin}
                    className="text-primary hover:underline font-medium"
                  >
                    Back to Sign In
                  </button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

