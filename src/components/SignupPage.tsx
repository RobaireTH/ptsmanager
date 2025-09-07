import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { UserCheck, Users, Shield } from 'lucide-react';
import schoolLogo from 'figma:asset/6c5b559c47b3a60a366fb3371a7065b4c91fe552.png';
import studentsImage from 'figma:asset/a9fb3a683259798a4a27feea2731b90f66e5a88e.png';

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
    role: '' as 'teacher' | 'parent' | 'admin' | ''
  });

  const roleIcons = {
    teacher: UserCheck,
    parent: Users,
    admin: Shield
  };

  const roleDescriptions = {
    teacher: "Access student grades, class schedules, and educational resources",
    parent: "Monitor your child's progress, attendance, and school activities",
    admin: "Manage school operations, staff, and administrative functions"
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = 
    formData.name.trim() !== '' &&
    formData.email.trim() !== '' &&
    formData.password.trim() !== '' &&
    formData.confirmPassword.trim() !== '' &&
    formData.role !== '' &&
    formData.password === formData.confirmPassword;

  const handleSignup = () => {
    if (!isFormValid || !formData.role) return;

    // Mock user data based on selected role
    const mockUserData = {
      teacher: {
        id: 'T001',
        name: formData.name || 'Mrs. Adebayo Oluwaseun',
        email: formData.email || 'oluwaseun.adebayo@faith-life.edu.ng',
        subjects: ['Mathematics', 'Further Mathematics'],
        classes: ['JSS1 A', 'JSS2 B', 'SS1 C']
      },
      parent: {
        id: 'P001',
        name: formData.name || 'Mr. Babatunde Ogunkoya',
        email: formData.email || 'babatunde.ogunkoya@gmail.com',
        phone: formData.phone || '+234 803 123 4567',
        children: [
          { id: 'S001', name: 'Temilade Ogunkoya', class: 'JSS2 A', rollNo: 'JSS2A/001' },
          { id: 'S002', name: 'Olumide Ogunkoya', class: 'SS1 B', rollNo: 'SS1B/015' }
        ]
      },
      admin: {
        id: 'A001',
        name: formData.name || 'Dr. Folake Adeyemi',
        email: formData.email || 'admin@faith-life.edu.ng',
        role: 'Principal'
      }
    };

    const role = formData.role as 'teacher' | 'parent' | 'admin';
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

          {formData.role === 'parent' && (
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            />
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-destructive text-sm">Passwords do not match</p>
            )}
          </div>

          <Button 
            className="w-full" 
            onClick={handleSignup}
            disabled={!isFormValid}
          >
            Create Account
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