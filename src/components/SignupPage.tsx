import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { PhoneInput } from './ui/phone-input';
import { UserCheck, Users, Eye, EyeOff } from 'lucide-react';
// Replaced missing Figma asset with existing logo asset
import schoolLogo from '../assets/logo.jpg';
import studentsImage from '../assets/a9fb3a683259798a4a27feea2731b90f66e5a88e.png';
import { createUser, login as apiLogin, getMe, getClasses, createTeacherWithUser } from '../lib/api';

interface SignupPageProps {
  onLogin: (role: 'teacher' | 'parent' | 'admin', userData: any) => void;
  onSwitchToLogin: () => void;
}

export function SignupPage({ onLogin, onSwitchToLogin }: SignupPageProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: '' as 'teacher' | 'parent' | '',
    classId: '' as string
  });
  const [classes, setClasses] = useState<any[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const roleIcons = {
    teacher: UserCheck,
    parent: Users,
  } as const;

  const roleDescriptions = {
    teacher: "Access student grades, class schedules, and educational resources",
    parent: "Monitor your child's progress, attendance, and school activities",
  } as const;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const passwordMeetsPolicy = formData.password.length >= 8 && /[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password) && /\d/.test(formData.password);

  // Load classes when component mounts
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const classesData = await getClasses();
        setClasses(classesData);
      } catch (err) {
        console.error('Error loading classes:', err);
      }
    };
    loadClasses();
  }, []);

  const isFormValid = 
    formData.name.trim() !== '' &&
    formData.email.trim() !== '' &&
    formData.password.trim() !== '' &&
    formData.confirmPassword.trim() !== '' &&
    formData.role !== '' &&
    formData.password === formData.confirmPassword &&
    passwordMeetsPolicy &&
    (formData.role !== 'teacher' || formData.classId !== '');

  const handleSignup = async () => {
    if (!isFormValid || !formData.role) return;

    setLoading(true);
    try {
      if (formData.role === 'teacher') {
        // Create teacher with user and class assignment
        await createTeacherWithUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          classId: parseInt(formData.classId),
        });
      } else {
        // Create regular user for parents
        await createUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        });
      }

      // Auto-login
      const tokenRes = await apiLogin(formData.email, formData.password);
      // Persist tokens BEFORE fetching profile to ensure correct Authorization
      localStorage.setItem('authToken', tokenRes.access_token);
      localStorage.setItem('refreshToken', tokenRes.refresh_token);
      const me = await getMe(tokenRes.access_token);

      localStorage.setItem('userRole', me.role);
      localStorage.setItem('userData', JSON.stringify(me));

      onLogin(me.role as 'teacher' | 'parent' | 'admin', me);
    } catch (err: any) {
      const msg = err?.message || 'Failed to sign up. Please try again.';
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
            Create your account to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role">I am a...</Label>
            <Select value={formData.role} onValueChange={(value: any) => handleInputChange('role', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roleIcons).map(([role, Icon]) => (
                  <SelectItem key={role} value={role}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.role && (
              <p className="text-muted-foreground text-sm">{roleDescriptions[formData.role]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
            />
          </div>

          {formData.role === 'teacher' && (
            <div className="space-y-2">
              <Label htmlFor="class">Select Class</Label>
              <Select value={formData.classId} onValueChange={(value) => handleInputChange('classId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.name} {cls.room && `(${cls.room})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.role === 'teacher' && !formData.classId && (
                <p className="text-destructive text-sm">Please select a class to continue</p>
              )}
            </div>
          )}

          {formData.role === 'parent' && (
            <PhoneInput
              id="phone"
              label="Phone Number"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={(value) => handleInputChange('phone', value)}
              required
            />
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
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
            {formData.password && !passwordMeetsPolicy && (
              <p className="text-destructive text-sm">Password must be at least 8 characters and include lowercase, uppercase letters, and numbers</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
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
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-destructive text-sm">Passwords do not match</p>
            )}
          </div>

          <Button 
            className="w-full" 
            onClick={handleSignup}
            disabled={!isFormValid || loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>

          <div className="text-center">
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <button 
                onClick={onSwitchToLogin}
                className="text-primary hover:underline font-medium"
              >
                Sign in here
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}