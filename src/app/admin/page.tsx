'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Users,
  FileText,
  BarChart3,
  Loader2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Plus,
  Mail,
  MailCheck,
  MailX,
  AlertCircle,
  Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportRow {
  id: string;
  created_at: string;
  file_name: string;
  file_type: string;
  slide_count: number;
  overall_score: number;
  overall_grade: string;
  user_email: string | null;
  email: string | null;
  lead_email: string | null;
  email_sent: boolean;
  email_sent_at: string | null;
  audience_type: string;
  presentation_purpose: string;
}

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  is_admin: boolean;
  created_at: string;
  report_count: number;
}

type Tab = 'reports' | 'users';

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('reports');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [totalReports, setTotalReports] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (tab === 'users') {
        const res = await fetch('/api/admin/users');
        if (res.status === 403) {
          router.push('/login?redirect=/admin');
          return;
        }
        if (!res.ok) throw new Error('Failed to load users');
        const data = await res.json();
        setUsers(data.users || []);
      }

      // Always load reports for stats
      const res = await fetch(`/api/admin/reports?page=${page}&limit=50`);
      if (res.status === 403) {
        router.push('/login?redirect=/admin');
        return;
      }
      if (!res.ok) throw new Error('Failed to load reports');
      const data = await res.json();
      setReports(data.reports || []);
      setTotalReports(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [tab, page, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPages = Math.ceil(totalReports / 50);
  const avgScore = reports.length > 0
    ? Math.round(reports.reduce((s, r) => s + r.overall_score, 0) / reports.length)
    : 0;
  const emailsSent = reports.filter(r => r.email_sent).length;
  const leadsCapt = reports.filter(r => r.lead_email).length;

  return (
    <div className="flex flex-col min-h-full">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard icon={<FileText className="h-3 w-3" />} label="Reports" value={totalReports} />
          <StatCard icon={<BarChart3 className="h-3 w-3" />} label="Avg Score" value={avgScore || '—'} />
          <StatCard icon={<MailCheck className="h-3 w-3" />} label="Emails Sent" value={emailsSent} />
          <StatCard icon={<Users className="h-3 w-3" />} label="Leads" value={leadsCapt} />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-4 border-b">
          <button
            onClick={() => { setTab('reports'); setPage(1); }}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === 'reports' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Reports
          </button>
          <button
            onClick={() => setTab('users')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === 'users' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Users
          </button>
          <div className="ml-auto">
            {tab === 'users' && (
              <Button size="sm" onClick={() => setShowCreateUser(true)}>
                <Plus className="h-4 w-4 mr-1" /> Create User
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-12 gap-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
            <Button size="sm" variant="outline" onClick={loadData}>Retry</Button>
          </div>
        ) : tab === 'reports' ? (
          <>
            <ReportsTable reports={reports} />
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <UsersTable users={users} onUpdated={loadData} />
        )}
      </main>

      <CreateUserDialog
        open={showCreateUser}
        onOpenChange={setShowCreateUser}
        onCreated={loadData}
      />
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          {icon} {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

const GRADE_COLORS: Record<string, string> = {
  Excellent: 'bg-emerald-100 text-emerald-800',
  Good: 'bg-blue-100 text-blue-800',
  'Needs Work': 'bg-amber-100 text-amber-800',
  'Critical Issues': 'bg-red-100 text-red-800',
};

function ReportsTable({ reports }: { reports: ReportRow[] }) {
  if (reports.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No reports yet. Presentations will appear here once scored.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-3 py-2 text-left font-medium">Date</th>
            <th className="px-3 py-2 text-left font-medium">Presentation</th>
            <th className="px-3 py-2 text-center font-medium">Score</th>
            <th className="px-3 py-2 text-center font-medium">Grade</th>
            <th className="px-3 py-2 text-center font-medium">Slides</th>
            <th className="px-3 py-2 text-left font-medium">User / Lead</th>
            <th className="px-3 py-2 text-center font-medium">Email Sent</th>
            <th className="px-3 py-2 text-center font-medium">View</th>
          </tr>
        </thead>
        <tbody>
          {reports.map(r => (
            <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
              <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </td>
              <td className="px-3 py-2.5 max-w-[200px]">
                <div className="truncate font-medium">{r.file_name}</div>
                <div className="text-[10px] text-muted-foreground">
                  {r.file_type.toUpperCase()} · {r.audience_type?.replace(/_/g, ' ') || '—'}
                </div>
              </td>
              <td className="px-3 py-2.5 text-center font-mono font-bold text-sm">
                {r.overall_score}
              </td>
              <td className="px-3 py-2.5 text-center">
                <Badge variant="secondary" className={cn('text-[10px]', GRADE_COLORS[r.overall_grade])}>
                  {r.overall_grade}
                </Badge>
              </td>
              <td className="px-3 py-2.5 text-center text-muted-foreground">
                {r.slide_count}
              </td>
              <td className="px-3 py-2.5 max-w-[180px]">
                {r.lead_email || r.user_email || r.email ? (
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="truncate">{r.lead_email || r.user_email || r.email}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Anonymous</span>
                )}
              </td>
              <td className="px-3 py-2.5 text-center">
                {r.email_sent ? (
                  <div className="flex items-center justify-center gap-1 text-emerald-600">
                    <MailCheck className="h-3.5 w-3.5" />
                    <span className="text-[10px]">
                      {r.email_sent_at ? new Date(r.email_sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Yes'}
                    </span>
                  </div>
                ) : (
                  <MailX className="h-3.5 w-3.5 text-muted-foreground/40 mx-auto" />
                )}
              </td>
              <td className="px-3 py-2.5 text-center">
                <a
                  href={`/report/${r.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UsersTable({ users, onUpdated }: { users: UserRow[]; onUpdated: () => void }) {
  const [editUser, setEditUser] = useState<UserRow | null>(null);

  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No users yet. Create one or users will appear after sign-up.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left font-medium">User</th>
              <th className="px-3 py-2 text-left font-medium">Email</th>
              <th className="px-3 py-2 text-center font-medium">Reports</th>
              <th className="px-3 py-2 text-center font-medium">Role</th>
              <th className="px-3 py-2 text-left font-medium">Joined</th>
              <th className="px-3 py-2 text-center font-medium">Edit</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
                        {(u.full_name || u.email)?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium">{u.full_name || '—'}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">{u.email}</td>
                <td className="px-3 py-2.5 text-center font-mono">{u.report_count}</td>
                <td className="px-3 py-2.5 text-center">
                  {u.is_admin ? (
                    <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">Admin</Badge>
                  ) : (
                    <span className="text-muted-foreground">User</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                  {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <button
                    onClick={() => setEditUser(u)}
                    className="inline-flex items-center text-primary hover:text-primary/80"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EditUserDialog
        user={editUser}
        open={!!editUser}
        onOpenChange={(open) => { if (!open) setEditUser(null); }}
        onUpdated={() => { setEditUser(null); onUpdated(); }}
      />
    </>
  );
}

function CreateUserDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user.');

      setSuccess(true);
      onCreated();

      // Reset after delay
      setTimeout(() => {
        setEmail('');
        setPassword('');
        setFullName('');
        setSuccess(false);
        onOpenChange(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Create a user account with email and password. They can log in immediately.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-4 text-center text-sm font-medium text-emerald-600">
            User created successfully!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="John Doe"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-background"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="user@company.com"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-background"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Password *</label>
              <input
                type="text"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-background"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Create User
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({
  user,
  open,
  onOpenChange,
  onUpdated,
}: {
  user: UserRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}) {
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPassword('');
      setError(null);
      setSuccess(false);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const body: Record<string, string> = {};
      if (password.trim()) body.password = password;
      if (fullName !== (user.full_name || '')) body.fullName = fullName;

      if (Object.keys(body).length === 0) {
        setError('No changes to save.');
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user.');

      setSuccess(true);
      onUpdated();

      setTimeout(() => {
        setSuccess(false);
        onOpenChange(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-4 text-center text-sm font-medium text-emerald-600">
            User updated successfully!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="John Doe"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-background"
              />
            </div>
            <div>
              <label className="text-xs font-medium">New Password</label>
              <input
                type="text"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                minLength={6}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-background"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Min. 6 characters. Leave blank to keep current password.</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Pencil className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
