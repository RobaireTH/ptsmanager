import { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { TeacherDashboard } from './components/TeacherDashboard';
import { ParentDashboard } from './components/ParentDashboard';
import { AdminDashboard } from './components/AdminDashboard';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'auth' | 'dashboard'>('landing');
  const [user, setUser] = useState<{ role: 'teacher' | 'parent' | 'admin'; data: any } | null>(null);

  const handleGetStarted = () => {
    setCurrentView('auth');
  };

  const handleLogin = (role: 'teacher' | 'parent' | 'admin', userData: any) => {
    // Update mock data with Nigerian education system and multiple children
    const mockUserData = {
      teacher: {
        id: 'T001',
        name: 'Mrs. Adebayo Oluwaseun',
        email: userData.email || 'oluwaseun.adebayo@faith-life.edu.ng',
        subjects: ['Mathematics', 'Further Mathematics'],
        classes: ['JSS1 A', 'JSS2 B', 'SS1 C']
      },
      parent: {
        id: 'P001',
        name: 'Mr. Babatunde Ogunkoya',
        email: userData.email || 'babatunde.ogunkoya@gmail.com',
        phone: '+234 803 123 4567',
        children: [
          { id: 'S001', name: 'Temilade Ogunkoya', class: 'JSS2 A', rollNo: 'JSS2A/001' },
          { id: 'S002', name: 'Olumide Ogunkoya', class: 'SS1 B', rollNo: 'SS1B/015' }
        ]
      },
      admin: {
        id: 'A001',
        name: 'Dr. Folake Adeyemi',
        email: userData.email || 'admin@faith-life.edu.ng',
        role: 'Principal'
      }
    };

    setUser({ role, data: mockUserData[role] });
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('landing');
  };

  if (currentView === 'landing') {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  if (currentView === 'auth') {
    return <AuthPage onLogin={handleLogin} />;
  }

  if (currentView === 'dashboard' && user) {
    switch (user.role) {
      case 'teacher':
        return <TeacherDashboard userData={user.data} onLogout={handleLogout} />;
      case 'parent':
        return <ParentDashboard userData={user.data} onLogout={handleLogout} />;
      case 'admin':
        return <AdminDashboard userData={user.data} onLogout={handleLogout} />;
      default:
        return <AuthPage onLogin={handleLogin} />;
    }
  }

  return <LandingPage onGetStarted={handleGetStarted} />;
}