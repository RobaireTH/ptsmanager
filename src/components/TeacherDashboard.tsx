import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Users, MessageSquare, Send, Bell, AlertCircle } from 'lucide-react';
import { 
  getStudents,
  getClasses,
  getMessages,
  Student,
  Message
} from '../lib/api';

interface TeacherDashboardProps {
  userData: any;
  onLogout: () => void;
}

export function TeacherDashboard({ userData, onLogout }: TeacherDashboardProps) {
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  // const [classes, setClasses] = useState<Class[]>([]); // reserved for future filtering
  const [messages, setMessages] = useState<Message[]>([]);

  // Load data from API on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentsData, _classesData, messagesData] = await Promise.all([
        getStudents(),
        getClasses(),
        getMessages()
      ]);
      setStudents(studentsData);
      setMessages(messagesData);
      
  // Could compute teacher-specific classes here later
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = 0; // backend Message lacks status field currently

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src="" alt={userData.name} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(userData.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-lg sm:text-xl">Welcome back, {userData.name}</h1>
                <p className="text-muted-foreground text-sm sm:text-base">Teacher Dashboard - Faith-Life International College</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-end">
            {/* Notifications */}
            {/* Notifications placeholder (backend not implemented) */}
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" onClick={onLogout} className="whitespace-nowrap">
              Logout
            </Button>
          </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-muted-foreground">Total Students</p>
                  <p className="font-medium">105</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-secondary" />
                <div>
                  <p className="text-muted-foreground">Unread Messages</p>
                  <p className="font-medium">{unreadCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <div className="container mx-auto px-4 py-2">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {error}
              </div>
            </div>
          </div>
        )}

        {/* Loading Display */}
        {loading && (
          <div className="container mx-auto px-4 py-2">
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
                Loading...
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="overflow-x-auto">
            <TabsList className="grid grid-cols-4 min-w-fit w-full sm:w-auto">
              <TabsTrigger value="students" className="px-2 py-1 text-xs sm:text-sm sm:px-4 sm:py-2">Students</TabsTrigger>
              <TabsTrigger value="messages" className="relative px-2 py-1 text-xs sm:text-sm sm:px-4 sm:py-2">
                Messages
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs">
                    {unreadCount}
                  </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          </div>

          {/* Students Tab */}
          <TabsContent value="students">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Student Management</CardTitle>
                    <CardDescription>Manage your students and track their progress</CardDescription>
                  </div>
                  {/* Class filter placeholder */}
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profile</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Class ID</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="" alt={student.name} />
                            <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                              {getInitials(student.name)}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.class_id ?? '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">View Profile</Button>
                            <Button size="sm" variant="outline">Contact Parent</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab removed */}

          {/* Messages Tab */}
          <TabsContent value="messages">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Messages</CardTitle>
                    <CardDescription>Communicate with parents and administration</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {messages.map((message) => (
            <div key={message.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{message.subject}</p>
                <p className="text-muted-foreground text-xs">ID: {message.id}</p>
                            </div>
                            <div className="text-right">
                <p className="text-muted-foreground text-xs">{new Date(message.created_at).toLocaleString()}</p>
                            </div>
                          </div>
              <p className="text-sm whitespace-pre-wrap">{message.body || '—'}</p>
                          <Button size="sm" variant="outline">Reply</Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Send Message</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Recipient selection placeholder */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Subject</p>
                    <Input placeholder="Message subject" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Message</p>
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <Button className="w-full flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Send Message
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Attendance Tab removed */}
        </Tabs>
      </div>
    </div>
  );
}