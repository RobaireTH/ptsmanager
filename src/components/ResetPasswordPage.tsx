import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import schoolLogo from 'figma:asset/6c5b559c47b3a60a366fb3371a7065b4c91fe552.png';
import studentsImage from 'figma:asset/a9fb3a683259798a4a27feea2731b90f66e5a88e.png';
import { resetPassword } from '../lib/api';

interface ResetPasswordPageProps {
  onSwitchToLogin: () => void;
}

export function ResetPasswordPage({ onSwitchToLogin }: ResetPasswordPageProps) {
  const [token, setToken] = useState('');
  // Auto-populate token from URL (?token=...) if present
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('token');
      if (t) setToken(t);
    } catch {
      /* ignore */
    }
  }, []);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordMeetsPolicy = password.length >= 8 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password);
  const canSubmit = token.trim() && passwordMeetsPolicy && password === confirm;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      await resetPassword(token.trim(), password);
      setSuccess(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to reset password. Please try again.');
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
              Create a new password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {success ? (
              <div className="space-y-4 text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-foreground">
                  Your password has been reset successfully. You can now sign in with your new password.
                </p>
                <Button className="w-full" onClick={onSwitchToLogin}>
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="token">Reset Token</Label>
                  <Input
                    id="token"
                    placeholder="Paste the reset token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPass ? 'text' : 'password'}
                      placeholder="Enter a new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPass((s) => !s)}
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {password && !passwordMeetsPolicy && (
                    <p className="text-destructive text-sm">Password must be at least 8 characters and include lowercase, uppercase letters, and numbers</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Re-enter your new password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                      className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirm((s) => !s)}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirm && confirm !== password && (
                    <p className="text-destructive text-sm">Passwords do not match</p>
                  )}
                </div>

                {error && <p className="text-destructive text-sm">{error}</p>}

                <Button className="w-full" onClick={handleSubmit} disabled={loading || !canSubmit}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

