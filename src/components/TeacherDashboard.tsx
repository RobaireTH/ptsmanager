import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Users,
  MessageSquare,
  Send,
  Bell,
  AlertCircle,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
} from "lucide-react";
import {
  getStudents,
  getClasses,
  getMessages,
  createMessage,
  createResult,
  getResults,
  getParents,
  getAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getDailyAttendance,
  getAttendanceSummary,
  Student,
  Message,
  Result,
  Parent,
  AttendanceWithDetails,
  AttendanceSummary,
} from "../lib/api";
import useWebSocket from "react-use-websocket";

interface TeacherDashboardProps {
  userData: any;
  onLogout: () => void;
}

export function TeacherDashboard({
  userData,
  onLogout,
}: TeacherDashboardProps) {
  const [activeTab, setActiveTab] = useState("students");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  // const [classes, setClasses] = useState<Class[]>([]); // reserved for future filtering
  const [messages, setMessages] = useState<Message[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<number | "">("");
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [isAddingResultFor, setIsAddingResultFor] = useState<Student | null>(
    null,
  );
  const [newResult, setNewResult] = useState<{
    subject: string;
    term: string;
    score: string;
    grade: string;
    date: string;
    comments: string;
  }>({
    subject: "",
    term: "1st-term",
    score: "",
    grade: "",
    date: "",
    comments: "",
  });

  // Attendance state
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceWithDetails[]
  >([]);
  const [attendanceSummary, setAttendanceSummary] =
    useState<AttendanceSummary | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [dailyAttendance, setDailyAttendance] = useState<any[]>([]);
  const [isRecordingAttendance, setIsRecordingAttendance] = useState(false);

  // Load data from API on mount
  useEffect(() => {
    loadData();
    loadAttendanceData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        studentsData,
        _classesData,
        messagesData,
        resultsData,
        parentsData,
      ] = await Promise.all([
        getStudents(),
        getClasses(),
        getMessages(),
        getResults(),
        getParents(),
      ]);
      setStudents(studentsData);
      setMessages(messagesData);
      setResults(resultsData);
      setParents(parentsData);

      // Could compute teacher-specific classes here later
    } catch (err: any) {
      setError(err.message || "Failed to load data");
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceData = async () => {
    try {
      const [attendanceData, summaryData, dailyData] = await Promise.all([
        getAttendance(),
        getAttendanceSummary(),
        getDailyAttendance(selectedDate),
      ]);
      setAttendanceRecords(attendanceData);
      setAttendanceSummary(summaryData);
      setDailyAttendance(dailyData);
    } catch (err: any) {
      console.error("Error loading attendance data:", err);
    }
  };

  const unreadCount = 0; // backend Message lacks status field currently

  // Map student -> parent ids (assuming student.parent_id links to Parent.id)
  const studentParentMap = useMemo(() => {
    const map: Record<number, Parent | undefined> = {};
    parents.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [parents]);

  // WebSocket connection (auth-less demo). Use userData.id for personal channel.
  const wsUrl = useMemo(() => {
    // Derive base from API_BASE logic: reuse same origin (empty) or window.location
    const loc = typeof window !== "undefined" ? window.location : null;
    const proto = loc?.protocol === "https:" ? "wss" : "ws";
    const host = loc?.host || "";
    return host ? `${proto}://${host}/api/ws/${userData.id}` : "";
  }, [userData.id]);

  const { sendJsonMessage, lastMessage } = useWebSocket(wsUrl || null, {
    retryOnError: true,
    shouldReconnect: () => true,
  });

  // Append incoming WebSocket JSON-formatted messages
  useEffect(() => {
    if (!lastMessage) return;
    try {
      const data = JSON.parse(lastMessage.data);
      // Expect shape matching backend message broadcast
      if (data && data.id && data.subject) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === data.id)) return prev; // dedupe
          return [data as Message, ...prev];
        });
      }
    } catch {
      // ignore non-JSON frames
    }
  }, [lastMessage]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    if (!selectedParentId) return;
    setSending(true);
    try {
      const subject = newMessage.split("\n")[0].slice(0, 80) || "Message";
      const created = await createMessage({
        subject,
        body: newMessage,
        recipient_id: Number(selectedParentId),
        recipient_role: "parent",
      });
      setMessages((prev) => [created, ...prev]);
      setNewMessage("");
      // Optional: push a small ack frame (not required as server pushes to parent)
      sendJsonMessage({ type: "sent", id: created.id });
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
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
                <h1 className="text-lg sm:text-xl">
                  Welcome back, {userData.name}
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Teacher Dashboard - Faith-Life International College
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-end">
              {/* Notifications */}
              {/* Notifications placeholder (backend not implemented) */}
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                onClick={onLogout}
                className="whitespace-nowrap"
              >
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
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <div className="overflow-x-auto">
            <TabsList className="grid grid-cols-4 min-w-fit w-full sm:w-auto">
              <TabsTrigger
                value="students"
                className="px-2 py-1 text-xs sm:text-sm sm:px-4 sm:py-2"
              >
                Students
              </TabsTrigger>
              <TabsTrigger
                value="attendance"
                className="px-2 py-1 text-xs sm:text-sm sm:px-4 sm:py-2"
              >
                Attendance
              </TabsTrigger>
              <TabsTrigger
                value="results"
                className="px-2 py-1 text-xs sm:text-sm sm:px-4 sm:py-2"
              >
                Results
              </TabsTrigger>
              <TabsTrigger
                value="messages"
                className="relative px-2 py-1 text-xs sm:text-sm sm:px-4 sm:py-2"
              >
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
                    <CardDescription>
                      Manage your students and track their progress
                    </CardDescription>
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
                    {students.length === 0 && !loading && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-muted-foreground py-6"
                        >
                          Nothing to see here
                        </TableCell>
                      </TableRow>
                    )}
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
                        <TableCell>{student.class_id ?? "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              View Profile
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setIsAddingResultFor(student);
                                setNewResult({
                                  subject: "",
                                  term: "1st-term",
                                  score: "",
                                  grade: "",
                                  date: "",
                                  comments: "",
                                });
                              }}
                            >
                              Add Result
                            </Button>
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
                    <CardDescription>
                      Communicate with parents and administration
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {messages.length === 0 && !loading && (
                        <div className="text-sm text-muted-foreground border rounded-lg p-6 text-center">
                          No messages yet
                        </div>
                      )}
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className="border rounded-lg p-4 space-y-2"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{message.subject}</p>
                              <p className="text-muted-foreground text-xs">
                                ID: {message.id}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-muted-foreground text-xs">
                                {new Date(message.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">
                            {message.body || "—"}
                          </p>
                          <Button size="sm" variant="outline">
                            Reply
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Send Message</CardTitle>
                  <CardDescription>
                    Select a parent and compose your message
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Parent</p>
                    <select
                      className="w-full border rounded h-9 px-2"
                      value={selectedParentId}
                      onChange={(e) =>
                        setSelectedParentId(
                          e.target.value ? Number(e.target.value) : "",
                        )
                      }
                    >
                      <option value="">Select parent</option>
                      {parents.map((p) => (
                        <option key={p.id} value={p.id}>
                          Parent #{p.id}
                        </option>
                      ))}
                    </select>
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
                  <Button
                    disabled={
                      sending || !newMessage.trim() || !selectedParentId
                    }
                    onClick={handleSendMessage}
                    className="w-full flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {sending ? "Sending..." : "Send Message"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance">
            <div className="grid gap-6">
              {/* Attendance Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Attendance Summary
                  </CardTitle>
                  <CardDescription>
                    Overview of class attendance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {attendanceSummary && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {attendanceSummary.total}
                        </p>
                        <p className="text-sm text-gray-600">Total Records</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {attendanceSummary.present}
                        </p>
                        <p className="text-sm text-gray-600">Present</p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <p className="text-2xl font-bold text-red-600">
                          {attendanceSummary.absent}
                        </p>
                        <p className="text-sm text-gray-600">Absent</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-600">
                          {attendanceSummary.late}
                        </p>
                        <p className="text-sm text-gray-600">Late</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">
                          {attendanceSummary.percentage}%
                        </p>
                        <p className="text-sm text-gray-600">Attendance Rate</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Daily Attendance */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5" />
                        Daily Attendance
                      </CardTitle>
                      <CardDescription>
                        Mark and manage daily attendance
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="w-40"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {dailyAttendance.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student Name</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dailyAttendance.map((record) => (
                            <TableRow
                              key={`${record.student_id}-${record.date}`}
                            >
                              <TableCell className="font-medium">
                                {record.student_name}
                              </TableCell>
                              <TableCell>{record.class_name}</TableCell>
                              <TableCell>
                                {record.status === "not_recorded" ? (
                                  <Badge
                                    variant="outline"
                                    className="text-gray-600"
                                  >
                                    Not Recorded
                                  </Badge>
                                ) : (
                                  <Badge
                                    className={getAttendanceStatusColor(
                                      record.status,
                                    )}
                                  >
                                    {record.status.charAt(0).toUpperCase() +
                                      record.status.slice(1)}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="max-w-32 truncate">
                                {record.notes || "-"}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {record.status === "not_recorded" ? (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 w-8 p-0"
                                        onClick={() =>
                                          handleMarkAttendance(
                                            record.student_id,
                                            "present",
                                          )
                                        }
                                        disabled={isRecordingAttendance}
                                      >
                                        <CheckCircle className="h-3 w-3 text-green-600" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 w-8 p-0"
                                        onClick={() =>
                                          handleMarkAttendance(
                                            record.student_id,
                                            "absent",
                                          )
                                        }
                                        disabled={isRecordingAttendance}
                                      >
                                        <XCircle className="h-3 w-3 text-red-600" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 w-8 p-0"
                                        onClick={() =>
                                          handleMarkAttendance(
                                            record.student_id,
                                            "late",
                                          )
                                        }
                                        disabled={isRecordingAttendance}
                                      >
                                        <Clock className="h-3 w-3 text-yellow-600" />
                                      </Button>
                                    </>
                                  ) : (
                                    <select
                                      value={record.status}
                                      onChange={(e) =>
                                        handleUpdateAttendance(
                                          record.attendance_id,
                                          e.target.value as any,
                                        )
                                      }
                                      className="text-xs border rounded px-2 py-1"
                                    >
                                      <option value="present">Present</option>
                                      <option value="absent">Absent</option>
                                      <option value="late">Late</option>
                                      <option value="excused">Excused</option>
                                    </select>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No students found for the selected date
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Attendance History */}
              <Card>
                <CardHeader>
                  <CardTitle>Attendance History</CardTitle>
                  <CardDescription>Recent attendance records</CardDescription>
                </CardHeader>
                <CardContent>
                  {attendanceRecords.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {attendanceRecords.slice(0, 10).map((record) => (
                            <TableRow key={record.id}>
                              <TableCell>
                                {new Date(record.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>{record.student_name}</TableCell>
                              <TableCell>{record.class_name}</TableCell>
                              <TableCell>
                                <Badge
                                  className={getAttendanceStatusColor(
                                    record.status,
                                  )}
                                >
                                  {record.status.charAt(0).toUpperCase() +
                                    record.status.slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-32 truncate">
                                {record.notes || "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No attendance records found
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle>Student Results</CardTitle>
                <CardDescription>
                  Manage and view student academic results
                </CardDescription>
              </CardHeader>
              <CardContent>
                {results.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Term</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.map((result) => {
                          const student = students.find(
                            (s) => s.id === result.student_id,
                          );
                          return (
                            <TableRow key={result.id}>
                              <TableCell>
                                {student?.name || "Unknown"}
                              </TableCell>
                              <TableCell>{result.subject}</TableCell>
                              <TableCell>{result.term}</TableCell>
                              <TableCell>{result.score}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    result.grade.startsWith("A")
                                      ? "default"
                                      : "outline"
                                  }
                                >
                                  {result.grade}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {result.date
                                  ? new Date(result.date).toLocaleDateString()
                                  : "-"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No results found
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Result Dialog */}
      {isAddingResultFor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
            <div>
              <h3 className="text-lg font-medium">
                Add Result for {isAddingResultFor.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                Fill in the details below
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Subject</p>
              <Input
                value={newResult.subject}
                onChange={(e) =>
                  setNewResult({ ...newResult, subject: e.target.value })
                }
                placeholder="e.g., Mathematics"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Term</p>
                <select
                  className="w-full border rounded h-9 px-2"
                  value={newResult.term}
                  onChange={(e) =>
                    setNewResult({ ...newResult, term: e.target.value })
                  }
                >
                  <option value="1st-term">1st Term</option>
                  <option value="2nd-term">2nd Term</option>
                  <option value="3rd-term">3rd Term</option>
                </select>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Score</p>
                <Input
                  type="number"
                  value={newResult.score}
                  onChange={(e) =>
                    setNewResult({ ...newResult, score: e.target.value })
                  }
                  placeholder="e.g., 85"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Grade</p>
                <Input
                  value={newResult.grade}
                  onChange={(e) =>
                    setNewResult({ ...newResult, grade: e.target.value })
                  }
                  placeholder="e.g., A"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Date (optional)</p>
                <Input
                  type="date"
                  value={newResult.date}
                  onChange={(e) =>
                    setNewResult({ ...newResult, date: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Comments (optional)</p>
              <Textarea
                value={newResult.comments}
                onChange={(e) =>
                  setNewResult({ ...newResult, comments: e.target.value })
                }
                placeholder="Teacher remarks"
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsAddingResultFor(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (
                    !newResult.subject ||
                    !newResult.term ||
                    !newResult.score ||
                    !newResult.grade
                  )
                    return;
                  try {
                    await createResult({
                      student_id: isAddingResultFor.id,
                      class_id: isAddingResultFor.class_id || undefined,
                      subject: newResult.subject,
                      term: newResult.term,
                      score: Number(newResult.score),
                      grade: newResult.grade,
                      date: newResult.date || undefined,
                      comments: newResult.comments || undefined,
                    });
                    // reload results list
                    const fresh = await getResults();
                    setResults(fresh);
                    setIsAddingResultFor(null);
                  } catch (e: any) {
                    console.error(e);
                  }
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Attendance handler functions
  const handleDateChange = async (date: string) => {
    setSelectedDate(date);
    try {
      const dailyData = await getDailyAttendance(date);
      setDailyAttendance(dailyData);
    } catch (err) {
      console.error("Error loading daily attendance:", err);
    }
  };

  const handleMarkAttendance = async (
    studentId: number,
    status: "present" | "absent" | "late" | "excused",
  ) => {
    setIsRecordingAttendance(true);
    try {
      await createAttendance({
        student_id: studentId,
        date: selectedDate,
        status: status,
      });

      // Refresh daily attendance and summary
      await Promise.all([loadAttendanceData(), handleDateChange(selectedDate)]);
    } catch (err: any) {
      console.error("Error marking attendance:", err);
    } finally {
      setIsRecordingAttendance(false);
    }
  };

  const handleUpdateAttendance = async (
    attendanceId: number,
    status: "present" | "absent" | "late" | "excused",
  ) => {
    try {
      await updateAttendance(attendanceId, { status });

      // Refresh data
      await Promise.all([loadAttendanceData(), handleDateChange(selectedDate)]);
    } catch (err: any) {
      console.error("Error updating attendance:", err);
    }
  };

  const getAttendanceStatusColor = (status: string): string => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800";
      case "absent":
        return "bg-red-100 text-red-800";
      case "late":
        return "bg-yellow-100 text-yellow-800";
      case "excused":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
}
