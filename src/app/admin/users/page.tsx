'use client';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

const ROLES = [
  { value: 'SuperAdmin', label: 'Super Admin', description: 'Full system access' },
  { value: 'AdmissionStaff', label: 'Admission Staff', description: 'Manage student applications' },
  { value: 'DocumentOfficer', label: 'Document Officer', description: 'Manage student documents' },
  { value: 'AccountsOfficer', label: 'Accounts Officer', description: 'Manage fees and payments' },
  { value: 'Principal', label: 'Principal', description: 'Monitoring and reports' },
  { value: 'Director', label: 'Director', description: 'Strategic oversight' },
];

export default function UsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'AdmissionStaff',
    is_active: true
  });

  useEffect(() => {
    if (user && user.role !== 'SuperAdmin') {
      router.push('/unauthorized');
      return;
    }
    fetchUsers();
  }, [user, router]);

  useEffect(() => {
    filterUsers();
  }, [users, filterRole, filterStatus, searchTerm]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
      } else {
        showToast('Failed to fetch users', 'error');
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      showToast('Failed to fetch users', 'error');
    }
  };

  const filterUsers = () => {
    let filtered = [...users];
    
    if (filterRole !== 'all') {
      filtered = filtered.filter(u => u.role === filterRole);
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(u => u.is_active === (filterStatus === 'active'));
    }
    
    if (searchTerm) {
      filtered = filtered.filter(u => 
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredUsers(filtered);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddUser = async () => {
    try {
      // Validate form
      if (!userForm.username || !userForm.email || !userForm.password) {
        showToast('Please fill in all required fields', 'error');
        return;
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userForm.username,
          email: userForm.email,
          password: userForm.password,
          role: userForm.role,
          is_active: userForm.is_active,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add user');
      }
      
      showToast(`User "${userForm.username}" added successfully!`, 'success');
      setShowAddModal(false);
      setUserForm({ username: '', email: '', password: '', role: 'AdmissionStaff', is_active: true });
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Add user error:', error);
      showToast(error instanceof Error ? error.message : 'Failed to add user', 'error');
    }
  };

  const handleEditUser = (usr: User) => {
    setEditingUser(usr);
    setUserForm({
      username: usr.username,
      email: usr.email,
      password: '', // Don't pre-fill password for security
      role: usr.role,
      is_active: usr.is_active
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async () => {
    try {
      if (!editingUser) return;

      // Validate form
      if (!userForm.username || !userForm.email) {
        showToast('Please fill in all required fields', 'error');
        return;
      }

      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userForm.username,
          email: userForm.email,
          password: userForm.password, // Only updated if provided
          role: userForm.role,
          is_active: userForm.is_active,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user');
      }
      
      showToast(`User "${userForm.username}" updated successfully!`, 'success');
      setShowEditModal(false);
      setEditingUser(null);
      setUserForm({ username: '', email: '', password: '', role: 'AdmissionStaff', is_active: true });
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Update user error:', error);
      showToast(error instanceof Error ? error.message : 'Failed to update user', 'error');
    }
  };

  const handleToggleStatus = async (usr: User) => {
    // Prevent SuperAdmin from deactivating themselves or other SuperAdmins
    if (usr.role === 'SuperAdmin') {
      showToast('Cannot deactivate SuperAdmin users', 'error');
      return;
    }
    
    try {
      const response = await fetch(`/api/users/${usr.id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user status');
      }
      
      const action = usr.is_active ? 'deactivated' : 'activated';
      showToast(`User "${usr.username}" ${action} successfully!`, 'success');
      
      // Update local state with the response from API
      setUsers(users.map(u => 
        u.id === usr.id ? { ...u, is_active: !u.is_active } : u
      ));
    } catch (error) {
      console.error('Toggle status error:', error);
      showToast(error instanceof Error ? error.message : 'Failed to update user status', 'error');
    }
  };

  if (!user) return null;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SuperAdmin': return 'bg-destructive/20 text-destructive';
      case 'AdmissionStaff': return 'bg-primary/20 text-primary';
      case 'DocumentOfficer': return 'bg-chart-3/20 text-chart-3';
      case 'AccountsOfficer': return 'bg-chart-4/20 text-chart-4';
      case 'Principal': return 'bg-chart-1/20 text-chart-1';
      case 'Director': return 'bg-chart-2/20 text-chart-2';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    inactive: users.filter(u => !u.is_active).length,
    byRole: ROLES.map(role => ({
      role: role.value,
      count: users.filter(u => u.role === role.value).length
    }))
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white border border-border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground mb-1">User Management</h1>
              <p className="text-sm text-muted-foreground">Create and manage system user accounts</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              + Add New User
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-semibold text-foreground">{stats.total}</p>
                </div>
                <div className="bg-primary/10 p-3 rounded-lg">
                  <span className="text-2xl">👥</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-chart-3">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-semibold text-foreground">{stats.active}</p>
                </div>
                <div className="bg-chart-3/10 p-3 rounded-lg">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-muted">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Inactive Users</p>
                  <p className="text-2xl font-semibold text-foreground">{stats.inactive}</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <span className="text-2xl">⏸️</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Filter Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="search-input" className="block text-sm font-medium text-foreground mb-2">Search</label>
                <input
                  id="search-input"
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="role-filter" className="block text-sm font-medium text-foreground mb-2">Role</label>
                <select
                  id="role-filter"
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  <option value="all">All Roles</option>
                  {ROLES.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-foreground mb-2">Status</label>
                <select
                  id="status-filter"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Users ({filteredUsers.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No users found matching your filters</p>
                </div>
              ) : (
                filteredUsers.map((usr) => (
                  <div key={usr.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-primary">
                          {usr.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-foreground">{usr.username}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getRoleColor(usr.role)}`}>
                            {usr.role}
                          </span>
                          {!usr.is_active && (
                            <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{usr.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleEditUser(usr)}
                        className="px-3 py-1 text-sm text-primary hover:bg-primary/10 rounded transition-colors"
                      >
                        Edit
                      </button>
                      {usr.role !== 'SuperAdmin' && (
                        <button
                          onClick={() => handleToggleStatus(usr)}
                          className={`px-3 py-1 text-sm rounded transition-colors ${
                            usr.is_active
                              ? 'text-muted-foreground hover:bg-muted'
                              : 'text-chart-3 hover:bg-chart-3/10'
                          }`}
                        >
                          {usr.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add User Modal */}
        {showAddModal && (
          <div className="fixed inset-y-0 right-0 left-0 lg:left-64 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Add New User</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="add-username" className="block text-sm font-medium text-foreground mb-2">Username</label>
                    <input
                      id="add-username"
                      type="text"
                      placeholder="e.g., john_doe"
                      value={userForm.username}
                      onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="add-email" className="block text-sm font-medium text-foreground mb-2">Email</label>
                    <input
                      id="add-email"
                      type="email"
                      placeholder="email@college.edu"
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="add-password" className="block text-sm font-medium text-foreground mb-2">Password</label>
                    <input
                      id="add-password"
                      type="password"
                      placeholder="Enter password"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="add-role" className="block text-sm font-medium text-foreground mb-2">Role</label>
                    <select
                      id="add-role"
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    >
                      {ROLES.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label} - {role.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="add-is_active"
                      checked={userForm.is_active}
                      onChange={(e) => setUserForm({ ...userForm, is_active: e.target.checked })}
                      className="w-4 h-4 border-border rounded"
                    />
                    <label htmlFor="add-is_active" className="text-sm text-foreground">Active User</label>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => {
                        setShowAddModal(false);
                        setUserForm({ username: '', email: '', password: '', role: 'AdmissionStaff', is_active: true });
                      }}
                      className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddUser}
                      className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                      Add User
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && editingUser && (
          <div className="fixed inset-y-0 right-0 left-0 lg:left-64 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Edit User</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="edit-username" className="block text-sm font-medium text-foreground mb-2">Username</label>
                    <input
                      id="edit-username"
                      type="text"
                      placeholder="e.g., john_doe"
                      value={userForm.username}
                      onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-email" className="block text-sm font-medium text-foreground mb-2">Email</label>
                    <input
                      id="edit-email"
                      type="email"
                      placeholder="email@college.edu"
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-password" className="block text-sm font-medium text-foreground mb-2">
                      Password <span className="text-muted-foreground">(leave blank to keep current)</span>
                    </label>
                    <input
                      id="edit-password"
                      type="password"
                      placeholder="Enter new password"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-role" className="block text-sm font-medium text-foreground mb-2">Role</label>
                    <select
                      id="edit-role"
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                      disabled={editingUser.role === 'SuperAdmin'}
                    >
                      {ROLES.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label} - {role.description}
                        </option>
                      ))}
                    </select>
                    {editingUser.role === 'SuperAdmin' && (
                      <p className="text-xs text-muted-foreground mt-1">SuperAdmin role cannot be changed</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit-is_active"
                      checked={userForm.is_active}
                      onChange={(e) => setUserForm({ ...userForm, is_active: e.target.checked })}
                      className="w-4 h-4 border-border rounded"
                      disabled={editingUser.role === 'SuperAdmin'}
                    />
                    <label htmlFor="edit-is_active" className="text-sm text-foreground">Active User</label>
                    {editingUser.role === 'SuperAdmin' && (
                      <span className="text-xs text-muted-foreground">(SuperAdmin always active)</span>
                    )}
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingUser(null);
                        setUserForm({ username: '', email: '', password: '', role: 'AdmissionStaff', is_active: true });
                      }}
                      className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateUser}
                      className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                      Update User
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-4 right-4 lg:right-8 z-50 animate-in slide-in-from-bottom-5">
            <div className={`px-6 py-4 rounded-lg shadow-lg border ${
              toast.type === 'success' 
                ? 'bg-chart-3/10 border-chart-3 text-chart-3' 
                : 'bg-destructive/10 border-destructive text-destructive'
            }`}>
              <div className="flex items-center space-x-3">
                <span className="text-xl">
                  {toast.type === 'success' ? '✅' : '❌'}
                </span>
                <p className="font-medium">{toast.message}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

