import React, { useState, useEffect } from 'react';
import { UserProfile, SystemPromptConfig, ModerationLog, UserBooking } from '../types';
import { 
  getUsers, 
  saveUsers, 
  getSystemPromptConfig, 
  saveSystemPromptConfig, 
  getModerationLogs, 
  getGeminiKeyOverride, 
  saveGeminiKeyOverride, 
  getAllBookingsLocal, 
  getUserBookingsLocal,
  updateBookingStatusLocal, 
  deleteUserBookingLocal, 
  saveUserBookingLocal 
} from '../utils/localStorage';
import { 
  getAllUsersFromFirestore, 
  saveUserProfileToFirestore, 
  getAllBookingsFromFirestore, 
  updateBookingInFirestore 
} from '../lib/firebase';
import { 
  Shield, Users, Activity, Sliders, AlertTriangle, Key, Search, UserX, UserCheck, 
  Save, RefreshCw, CheckCircle2, LayoutGrid, Table as TableIcon, X, 
  Eye, Database, Calendar, Clock, MapPin, Award, Sparkles, Filter, Check, 
  XCircle, Trash2, Edit3, MessageSquare, Star, ArrowUpRight
} from 'lucide-react';

interface AdminPanelProps {
  onShowToast: (msg: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onShowToast }) => {
  const [usersList, setUsersList] = useState<UserProfile[]>(getUsers());
  const [loadingSync, setLoadingSync] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('Local Storage');

  // Active Admin Section Tab: 'users' | 'bookings' | 'prompts' | 'moderation'
  const [activeTab, setActiveTab] = useState<'users' | 'bookings' | 'prompts' | 'moderation'>('users');

  // View Mode: 'cards' or 'table'
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // User Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deactivated'>('all');
  const [goalFilter, setGoalFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'name' | 'goal'>('newest');

  // Booking Desk State
  const [bookingsList, setBookingsList] = useState<UserBooking[]>(getAllBookingsLocal());
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('all');
  const [bookingTypeFilter, setBookingTypeFilter] = useState<string>('all');
  const [editingAdminNoteId, setEditingAdminNoteId] = useState<string | null>(null);
  const [tempAdminNote, setTempAdminNote] = useState<string>('');

  // Selected User for Detail Inspection Modal
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // System Prompt State
  const [promptConfig, setPromptConfig] = useState<SystemPromptConfig>(getSystemPromptConfig());
  const [keyOverride, setKeyOverride] = useState<string>(getGeminiKeyOverride());

  // Moderation Logs
  const [modLogs] = useState<ModerationLog[]>(getModerationLogs());

  // Sync users & bookings with Firestore on mount
  const syncUsersWithFirestore = async () => {
    setLoadingSync(true);
    try {
      // 1. Sync Users
      const firestoreUsers = await getAllUsersFromFirestore();
      const localUsers = getUsers();
      const userMap = new Map<string, UserProfile>();
      localUsers.forEach((u) => userMap.set(u.id, u));
      firestoreUsers.forEach((u) => userMap.set(u.id, u));

      const mergedList = Array.from(userMap.values());
      setUsersList(mergedList);
      saveUsers(mergedList);

      // 2. Sync Bookings
      const firestoreBookings = await getAllBookingsFromFirestore();
      const localBookings = getAllBookingsLocal();
      const bookingMap = new Map<string, UserBooking>();
      localBookings.forEach((b) => bookingMap.set(b.id, b));
      firestoreBookings.forEach((b) => bookingMap.set(b.id, b));

      const mergedBookings = Array.from(bookingMap.values()).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setBookingsList(mergedBookings);
      mergedBookings.forEach((b) => saveUserBookingLocal(b));

      setLastSyncedTime(new Date().toLocaleTimeString());
      onShowToast('Synced live users & booking records with Firebase!');
    } catch (err) {
      console.warn('Sync error:', err);
      onShowToast('Loaded records from system storage.');
    } finally {
      setLoadingSync(false);
    }
  };

  useEffect(() => {
    syncUsersWithFirestore();
  }, []);

  // --- BOOKING DESK HANDLERS ---
  const handleApproveBooking = async (bookingId: string) => {
    const updated = updateBookingStatusLocal(bookingId, 'Approved');
    if (updated) {
      setBookingsList(getAllBookingsLocal());
      await updateBookingInFirestore(updated);
      onShowToast(`Booking #${bookingId.slice(-6)} Approved! Status updated for user.`);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    const updated = updateBookingStatusLocal(bookingId, 'Cancelled');
    if (updated) {
      setBookingsList(getAllBookingsLocal());
      await updateBookingInFirestore(updated);
      onShowToast(`Booking #${bookingId.slice(-6)} Cancelled.`);
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    const updated = updateBookingStatusLocal(bookingId, 'Completed');
    if (updated) {
      setBookingsList(getAllBookingsLocal());
      await updateBookingInFirestore(updated);
      onShowToast(`Booking #${bookingId.slice(-6)} marked as Completed!`);
    }
  };

  const handleToggleFeaturedBooking = async (bookingId: string) => {
    const target = bookingsList.find((b) => b.id === bookingId);
    if (!target) return;
    const newFeatured = !target.isFeatured;
    const updated = updateBookingStatusLocal(bookingId, target.status, target.adminNote, newFeatured);
    if (updated) {
      setBookingsList(getAllBookingsLocal());
      await updateBookingInFirestore(updated);
      onShowToast(newFeatured ? 'Set as VIP Priority Booking!' : 'Removed VIP priority badge.');
    }
  };

  const handleSaveAdminNote = async (bookingId: string) => {
    const target = bookingsList.find((b) => b.id === bookingId);
    if (!target) return;
    const updated = updateBookingStatusLocal(bookingId, target.status, tempAdminNote, target.isFeatured);
    if (updated) {
      setBookingsList(getAllBookingsLocal());
      await updateBookingInFirestore(updated);
      setEditingAdminNoteId(null);
      setTempAdminNote('');
      onShowToast('Admin note saved and visible in member My Bookings!');
    }
  };

  const handleDeleteBooking = (bookingId: string) => {
    deleteUserBookingLocal(bookingId);
    setBookingsList(getAllBookingsLocal());
    onShowToast('Booking deleted from records.');
  };

  // Filtered & Sorted Users
  const filteredUsers = usersList
    .filter((u) => {
      // Search Query Match (Name, Email, Goal, Level, or ID)
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        u.goal.toLowerCase().includes(q) ||
        u.level.toLowerCase().includes(q);

      // Role Match
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;

      // Status Match
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && u.isActive) ||
        (statusFilter === 'deactivated' && !u.isActive);

      // Goal Match
      const matchesGoal = goalFilter === 'all' || u.goal === goalFilter;

      return matchesQuery && matchesRole && matchesStatus && matchesGoal;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'goal') return a.goal.localeCompare(b.goal);
      // default newest
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });

  // Toggle user active status
  const handleToggleUserActive = async (userId: string) => {
    const updated = usersList.map((u) => {
      if (u.id === userId) {
        const newStatus = !u.isActive;
        const updatedUser = { ...u, isActive: newStatus };
        // Sync to Firestore asynchronously
        saveUserProfileToFirestore(updatedUser).catch((e) =>
          console.warn('Firestore update status fallback:', e)
        );
        return updatedUser;
      }
      return u;
    });

    setUsersList(updated);
    saveUsers(updated);
    if (selectedUser?.id === userId) {
      setSelectedUser({ ...selectedUser, isActive: !selectedUser.isActive });
    }
    onShowToast('User account status updated and saved!');
  };

  // Toggle User Role (User <-> Admin)
  const handleToggleUserRole = async (userId: string) => {
    const updated = usersList.map((u) => {
      if (u.id === userId) {
        const newRole: 'user' | 'admin' = u.role === 'admin' ? 'user' : 'admin';
        const updatedUser = { ...u, role: newRole };
        saveUserProfileToFirestore(updatedUser).catch((e) =>
          console.warn('Firestore role change fallback:', e)
        );
        return updatedUser;
      }
      return u;
    });

    setUsersList(updated);
    saveUsers(updated);
    if (selectedUser?.id === userId) {
      setSelectedUser({
        ...selectedUser,
        role: selectedUser.role === 'admin' ? 'user' : 'admin',
      });
    }
    onShowToast('User role updated!');
  };

  // Save Prompts
  const handleSavePrompts = () => {
    saveSystemPromptConfig(promptConfig);
    onShowToast('System Prompts updated live! Applied to next Gemini request.');
  };

  // Save Key Override
  const handleSaveKeyOverride = () => {
    saveGeminiKeyOverride(keyOverride);
    onShowToast('Gemini API Key override saved!');
  };

  // Calculate BMI helper
  const calculateBMI = (weightKg: number, heightCm: number) => {
    if (!heightCm || !weightKg) return { bmi: 22.5, category: 'Normal' };
    const heightM = heightCm / 100;
    const bmiVal = Number((weightKg / (heightM * heightM)).toFixed(1));
    let category = 'Normal';
    if (bmiVal < 18.5) category = 'Underweight';
    else if (bmiVal >= 25 && bmiVal < 29.9) category = 'Overweight';
    else if (bmiVal >= 30) category = 'Obese';
    return { bmi: bmiVal, category };
  };

  return (
    <section id="admin-panel" className="py-16 bg-[#0D0F12] min-h-screen relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Shield className="w-4 h-4" />
            <span>PULSE MATRIX CLUB ADMINISTRATION</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
            SYSTEM CONTROL <span className="text-amber-400">& MEMBER MONITORING</span>
          </h2>
          <p className="text-sm text-gray-400 mt-3">
            Real-time user tracking connected with backend storage, card analytics, AI moderation logs, and prompt tuning.
          </p>
        </div>

        {/* 1. OVERVIEW ANALYTICS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 text-center relative overflow-hidden group hover:border-amber-500/40 transition">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
              <Users className="w-12 h-12 text-amber-400" />
            </div>
            <p className="text-xs text-gray-400 font-mono uppercase">Total Registered</p>
            <p className="text-3xl font-black text-white font-mono mt-1">{usersList.length}</p>
            <p className="text-[10px] text-emerald-400 mt-1 font-semibold flex items-center justify-center space-x-1">
              <Database className="w-3 h-3" />
              <span>Firebase Synced</span>
            </p>
          </div>

          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 text-center relative overflow-hidden group hover:border-emerald-500/40 transition">
            <p className="text-xs text-gray-400 font-mono uppercase">Active Accounts</p>
            <p className="text-3xl font-black text-emerald-400 font-mono mt-1">
              {usersList.filter((u) => u.isActive).length}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              {usersList.filter((u) => !u.isActive).length} Deactivated
            </p>
          </div>

          <div className="bg-gray-900/80 border border-amber-500/30 rounded-2xl p-5 text-center relative overflow-hidden group hover:border-amber-400 transition bg-amber-500/5">
            <p className="text-xs text-amber-400 font-mono uppercase font-bold">Pending Approvals</p>
            <p className="text-3xl font-black text-amber-400 font-mono mt-1 animate-pulse">
              {bookingsList.filter((b) => b.status === 'Pending Approval').length}
            </p>
            <p className="text-[10px] text-amber-300 mt-1">Awaiting Desk Review</p>
          </div>

          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 text-center relative overflow-hidden group hover:border-emerald-500/40 transition">
            <p className="text-xs text-gray-400 font-mono uppercase">Total Bookings</p>
            <p className="text-3xl font-black text-white font-mono mt-1">
              {bookingsList.length}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">Coaches & Classes</p>
          </div>

          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 text-center relative overflow-hidden group hover:border-cyan-500/40 transition col-span-2 md:col-span-1">
            <p className="text-xs text-gray-400 font-mono uppercase">Sync Status</p>
            <p className="text-lg font-black text-cyan-400 font-mono mt-2 truncate">{lastSyncedTime}</p>
            <button
              onClick={syncUsersWithFirestore}
              disabled={loadingSync}
              className="mt-1 text-[10px] text-gray-400 hover:text-white underline inline-flex items-center space-x-1"
            >
              <RefreshCw className={`w-3 h-3 ${loadingSync ? 'animate-spin text-amber-400' : ''}`} />
              <span>{loadingSync ? 'Refreshing...' : 'Force Refresh Backend'}</span>
            </button>
          </div>
        </div>

        {/* 2. ADMIN SECTION NAVIGATION TABS */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center space-x-2 border ${
              activeTab === 'users'
                ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Member Directory ({usersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center space-x-2 border relative ${
              activeTab === 'bookings'
                ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Booking Approvals Desk ({bookingsList.length})</span>
            {bookingsList.filter((b) => b.status === 'Pending Approval').length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce">
                {bookingsList.filter((b) => b.status === 'Pending Approval').length} PENDING
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('prompts')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center space-x-2 border ${
              activeTab === 'prompts'
                ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>AI System Prompts</span>
          </button>

          <button
            onClick={() => setActiveTab('moderation')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center space-x-2 border ${
              activeTab === 'moderation'
                ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-white hover:bg-gray-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Safety & Logs</span>
          </button>
        </div>

        {/* TAB 1: MEMBER DIRECTORY & USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div>
            <div className="bg-gray-900/90 backdrop-blur-md border border-gray-800 rounded-3xl p-6 mb-8 shadow-2xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-800/80">
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-wider flex items-center space-x-2">
                    <Search className="w-5 h-5 text-amber-400" />
                    <span>Backend Member Directory & System Tracker</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Search, filter, and manage registered members live in Firebase & Local DB.
                  </p>
                </div>

                {/* Layout Mode Switcher & Sync Button */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={syncUsersWithFirestore}
                    disabled={loadingSync}
                    className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold uppercase transition flex items-center space-x-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingSync ? 'animate-spin' : ''}`} />
                    <span>Sync DB</span>
                  </button>

                  <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800">
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                        viewMode === 'cards'
                          ? 'bg-amber-500 text-black shadow'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Structured Cards</span>
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                        viewMode === 'table'
                          ? 'bg-amber-500 text-black shadow'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <TableIcon className="w-3.5 h-3.5" />
                      <span>Compact Table</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Search Inputs & Filter Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 mt-4">
                
                {/* Live Search Bar */}
                <div className="lg:col-span-5 relative">
                  <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-amber-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, email, user ID, goal, or level..."
                    className="w-full bg-[#14171D] border border-gray-800 rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-gray-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-3 text-gray-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Role Filter */}
                <div className="lg:col-span-2">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as any)}
                    className="w-full bg-[#14171D] border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-amber-500 outline-none"
                  >
                    <option value="all">All Roles</option>
                    <option value="user">Members Only</option>
                    <option value="admin">Admins Only</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="lg:col-span-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full bg-[#14171D] border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-amber-500 outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active Only</option>
                    <option value="deactivated">Deactivated Only</option>
                  </select>
                </div>

                {/* Fitness Goal Filter */}
                <div className="lg:col-span-2">
                  <select
                    value={goalFilter}
                    onChange={(e) => setGoalFilter(e.target.value)}
                    className="w-full bg-[#14171D] border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-amber-500 outline-none"
                  >
                    <option value="all">All Fitness Goals</option>
                    <option value="Weight Loss">Weight Loss</option>
                    <option value="Muscle Gain">Muscle Gain</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Body Recomposition">Recomposition</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div className="lg:col-span-1">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full bg-[#14171D] border border-gray-800 rounded-xl px-2 py-2.5 text-xs text-white focus:border-amber-500 outline-none"
                  >
                    <option value="newest">Newest</option>
                    <option value="name">Name A-Z</option>
                    <option value="goal">Goal</option>
                  </select>
                </div>

              </div>

              {/* Results Summary Bar */}
              <div className="flex items-center justify-between mt-4 text-xs text-gray-400 font-mono">
                <div>
                  <span>Showing <strong className="text-amber-400">{filteredUsers.length}</strong> of <strong className="text-white">{usersList.length}</strong> registered accounts</span>
                </div>

                {(searchQuery || roleFilter !== 'all' || statusFilter !== 'all' || goalFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setRoleFilter('all');
                      setStatusFilter('all');
                      setGoalFilter('all');
                    }}
                    className="text-amber-400 hover:underline flex items-center space-x-1"
                  >
                    <X className="w-3 h-3" />
                    <span>Reset All Filters</span>
                  </button>
                )}
              </div>
            </div>

            {/* User Data View (Cards or Table) */}
            {filteredUsers.length === 0 ? (
              <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-12 text-center my-8">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <h4 className="text-lg font-bold text-white uppercase">No Members Match Search Criteria</h4>
                <p className="text-xs text-gray-400 mt-1">Try clearing your search query or selecting "All Roles".</p>
              </div>
            ) : viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {filteredUsers.map((usr) => {
                  const { bmi, category } = calculateBMI(usr.weightKg, usr.heightCm);
                  const userBookings = getUserBookingsLocal(usr.id);

                  return (
                    <div
                      key={usr.id}
                      className={`bg-gray-900/90 backdrop-blur-md border rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between relative group hover:-translate-y-1 ${
                        usr.role === 'admin'
                          ? 'border-amber-500/40 hover:border-amber-400 hover:shadow-[0_0_25px_rgba(245,158,11,0.15)]'
                          : usr.isActive
                          ? 'border-gray-800 hover:border-emerald-500/50 hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]'
                          : 'border-red-900/50 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <img
                                src={
                                  usr.avatarUrl ||
                                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
                                }
                                alt={usr.name}
                                className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-md"
                                referrerPolicy="no-referrer"
                              />
                              <span
                                className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-gray-900 ${
                                  usr.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
                                }`}
                              />
                            </div>
                            <div>
                              <h4 className="font-black text-white text-base leading-tight flex items-center space-x-1.5">
                                <span>{usr.name}</span>
                              </h4>
                              <p className="text-xs text-gray-400 truncate max-w-[170px] font-mono">
                                {usr.email}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                              usr.role === 'admin'
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            {usr.role === 'admin' ? '🛡️ Admin' : '💪 Member'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] bg-gray-950 px-3 py-1.5 rounded-xl border border-gray-800/80 mb-4 font-mono">
                          <span className="text-gray-500">ID:</span>
                          <span className="text-emerald-400 font-bold truncate max-w-[180px]">{usr.id}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                          <div className="bg-gray-950/80 p-2.5 rounded-xl border border-gray-800/80 col-span-2">
                            <p className="text-[10px] text-gray-500 uppercase font-mono font-bold">Fitness Goal & Level</p>
                            <p className="font-bold text-white mt-0.5 text-xs flex items-center justify-between">
                              <span className="text-amber-400">{usr.goal}</span>
                              <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded text-[10px]">{usr.level}</span>
                            </p>
                          </div>

                          <div className="bg-gray-950/80 p-2.5 rounded-xl border border-gray-800/80">
                            <p className="text-[10px] text-gray-500 uppercase font-mono font-bold">Height & Weight</p>
                            <p className="font-mono font-bold text-white mt-0.5">
                              {usr.heightCm || 175}cm <span className="text-gray-500">|</span> {usr.weightKg || 75}kg
                            </p>
                          </div>

                          <div className="bg-gray-950/80 p-2.5 rounded-xl border border-gray-800/80">
                            <p className="text-[10px] text-gray-500 uppercase font-mono font-bold">Calculated BMI</p>
                            <p className="font-mono font-bold text-emerald-400 mt-0.5">
                              {bmi} <span className="text-[10px] font-normal text-gray-400">({category})</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-gray-400 mb-4 px-1">
                          <span className="flex items-center space-x-1">
                            <Activity className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Bookings: <strong className="text-white">{userBookings.length}</strong></span>
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono">
                            Joined {usr.createdAt || '2026-08'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-800 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setSelectedUser(usr)}
                          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>Inspect</span>
                        </button>

                        <button
                          onClick={() => handleToggleUserRole(usr.id)}
                          className="px-2.5 py-1.5 bg-gray-800/80 hover:bg-gray-700 text-amber-400 rounded-xl text-[11px] font-semibold transition"
                          title="Toggle User/Admin Role"
                        >
                          {usr.role === 'admin' ? 'Make User' : 'Promote Admin'}
                        </button>

                        <button
                          onClick={() => handleToggleUserActive(usr.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition flex items-center space-x-1 ${
                            usr.isActive
                              ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {usr.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          <span>{usr.isActive ? 'Deactivate' : 'Activate'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-3xl p-6 mb-12 shadow-2xl overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-[#14171D] text-gray-400 uppercase font-mono text-[10px] border-b border-gray-800">
                    <tr>
                      <th className="p-3">Member</th>
                      <th className="p-3">Account ID</th>
                      <th className="p-3">Goal & Level</th>
                      <th className="p-3">Biometrics</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {filteredUsers.map((usr) => {
                      const { bmi } = calculateBMI(usr.weightKg, usr.heightCm);
                      return (
                        <tr key={usr.id} className="hover:bg-gray-800/40 transition">
                          <td className="p-3 font-bold text-white flex items-center space-x-3">
                            <img
                              src={
                                usr.avatarUrl ||
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                              }
                              alt={usr.name}
                              className="w-8 h-8 rounded-xl object-cover border border-emerald-400/50"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <p className="text-white font-black">{usr.name}</p>
                              <p className="text-[10px] text-gray-400 font-mono">{usr.email}</p>
                            </div>
                          </td>
                          <td className="p-3 text-gray-400 font-mono text-[11px] truncate max-w-[120px]">
                            {usr.id}
                          </td>
                          <td className="p-3">
                            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/30">
                              {usr.goal} ({usr.level})
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px]">
                            {usr.heightCm || 175}cm / {usr.weightKg || 75}kg • BMI {bmi}
                          </td>
                          <td className="p-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                usr.role === 'admin'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : 'bg-gray-800 text-gray-300'
                              }`}
                            >
                              {usr.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                usr.isActive
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {usr.isActive ? 'Active' : 'Deactivated'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => setSelectedUser(usr)}
                                className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-amber-400 rounded-lg text-[10px] font-bold uppercase transition"
                              >
                                Inspect
                              </button>
                              <button
                                onClick={() => handleToggleUserActive(usr.id)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition flex items-center space-x-1 ${
                                  usr.isActive
                                    ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
                                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                }`}
                              >
                                {usr.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MEMBER BOOKINGS & COACHING REQUESTS APPROVAL DESK */}
        {activeTab === 'bookings' && (
          <div className="space-y-6 mb-12">
            
            {/* Search, Filter & Quick Stats Bar */}
            <div className="bg-gray-900/90 backdrop-blur-md border border-gray-800 rounded-3xl p-6 shadow-2xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-800/80">
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-wider flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-amber-400" />
                    <span>Member Bookings & Coaching Requests Approval Desk</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Review 1-on-1 trainer consultations and class reservations. Approve, cancel, tag priority, or send admin feedback notes directly to the member's My Bookings page.
                  </p>
                </div>

                <button
                  onClick={syncUsersWithFirestore}
                  disabled={loadingSync}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold uppercase transition flex items-center space-x-1.5 self-start lg:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingSync ? 'animate-spin' : ''}`} />
                  <span>Sync Bookings DB</span>
                </button>
              </div>

              {/* Filters row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 mt-4">
                
                {/* Booking Search */}
                <div className="lg:col-span-6 relative">
                  <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-amber-400" />
                  <input
                    type="text"
                    value={bookingSearchQuery}
                    onChange={(e) => setBookingSearchQuery(e.target.value)}
                    placeholder="Search by member name, email, coach, class title, or notes..."
                    className="w-full bg-[#14171D] border border-gray-800 rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-gray-500 focus:border-amber-500 outline-none transition"
                  />
                  {bookingSearchQuery && (
                    <button
                      onClick={() => setBookingSearchQuery('')}
                      className="absolute right-3 top-3 text-gray-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <div className="lg:col-span-3">
                  <select
                    value={bookingStatusFilter}
                    onChange={(e) => setBookingStatusFilter(e.target.value)}
                    className="w-full bg-[#14171D] border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-amber-500 outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Pending Approval">Pending Approval Only</option>
                    <option value="Approved">Approved Only</option>
                    <option value="Confirmed">Confirmed Only</option>
                    <option value="Completed">Completed Only</option>
                    <option value="Cancelled">Cancelled Only</option>
                  </select>
                </div>

                {/* Type Filter */}
                <div className="lg:col-span-3">
                  <select
                    value={bookingTypeFilter}
                    onChange={(e) => setBookingTypeFilter(e.target.value)}
                    className="w-full bg-[#14171D] border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-amber-500 outline-none"
                  >
                    <option value="all">All Booking Types</option>
                    <option value="Trainer Consultation">1-on-1 Trainer Consultations</option>
                    <option value="Class Session">Cyber Class Timetable Sessions</option>
                  </select>
                </div>

              </div>

              {/* Status summary pill bar */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-800/60 text-xs text-gray-400 font-mono">
                <span>
                  Showing <strong className="text-amber-400">{bookingsList.filter((b) => {
                    const q = bookingSearchQuery.toLowerCase().trim();
                    const matchesQuery = !q || b.userName.toLowerCase().includes(q) || b.userEmail.toLowerCase().includes(q) || b.targetTitle.toLowerCase().includes(q) || b.id.toLowerCase().includes(q) || (b.notes || '').toLowerCase().includes(q);
                    const matchesStatus = bookingStatusFilter === 'all' || b.status === bookingStatusFilter;
                    const matchesType = bookingTypeFilter === 'all' || b.type === bookingTypeFilter;
                    return matchesQuery && matchesStatus && matchesType;
                  }).length}</strong> of <strong className="text-white">{bookingsList.length}</strong> member reservations
                </span>
                {(bookingSearchQuery || bookingStatusFilter !== 'all' || bookingTypeFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setBookingSearchQuery('');
                      setBookingStatusFilter('all');
                      setBookingTypeFilter('all');
                    }}
                    className="text-amber-400 hover:underline flex items-center space-x-1"
                  >
                    <X className="w-3 h-3" />
                    <span>Reset Booking Filters</span>
                  </button>
                )}
              </div>
            </div>

            {/* Bookings Card Grid */}
            {bookingsList.filter((b) => {
              const q = bookingSearchQuery.toLowerCase().trim();
              const matchesQuery = !q || b.userName.toLowerCase().includes(q) || b.userEmail.toLowerCase().includes(q) || b.targetTitle.toLowerCase().includes(q) || b.id.toLowerCase().includes(q) || (b.notes || '').toLowerCase().includes(q);
              const matchesStatus = bookingStatusFilter === 'all' || b.status === bookingStatusFilter;
              const matchesType = bookingTypeFilter === 'all' || b.type === bookingTypeFilter;
              return matchesQuery && matchesStatus && matchesType;
            }).length === 0 ? (
              <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-12 text-center my-8">
                <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <h4 className="text-lg font-bold text-white uppercase">No Bookings Found Matching Search</h4>
                <p className="text-xs text-gray-400 mt-1">Try resetting the status filter or search query.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookingsList.filter((b) => {
                  const q = bookingSearchQuery.toLowerCase().trim();
                  const matchesQuery = !q || b.userName.toLowerCase().includes(q) || b.userEmail.toLowerCase().includes(q) || b.targetTitle.toLowerCase().includes(q) || b.id.toLowerCase().includes(q) || (b.notes || '').toLowerCase().includes(q);
                  const matchesStatus = bookingStatusFilter === 'all' || b.status === bookingStatusFilter;
                  const matchesType = bookingTypeFilter === 'all' || b.type === bookingTypeFilter;
                  return matchesQuery && matchesStatus && matchesType;
                }).map((b) => (
                  <div
                    key={b.id}
                    className={`bg-gray-900/90 backdrop-blur-md border rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between space-y-4 relative group ${
                      b.status === 'Pending Approval'
                        ? 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                        : b.status === 'Approved' || b.status === 'Confirmed'
                        ? 'border-emerald-500/40'
                        : b.status === 'Completed'
                        ? 'border-cyan-500/40'
                        : 'border-gray-800 opacity-75'
                    }`}
                  >
                    <div>
                      {/* Top Bar: Type & Status */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded">
                          {b.type}
                        </span>

                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded border ${
                            b.status === 'Pending Approval'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
                              : b.status === 'Approved' || b.status === 'Confirmed'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                              : b.status === 'Completed'
                              ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                              : 'bg-red-500/20 text-red-400 border-red-500/40 line-through'
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>

                      {/* VIP Priority Badge Toggle */}
                      <div className="flex items-center justify-between mb-3">
                        <button
                          onClick={() => handleToggleFeaturedBooking(b.id)}
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border transition flex items-center space-x-1 ${
                            b.isFeatured
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
                          }`}
                        >
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>{b.isFeatured ? 'VIP Priority Pass' : 'Set VIP Priority'}</span>
                        </button>

                        <span className="text-[10px] text-gray-500 font-mono">ID: {b.id.slice(-8)}</span>
                      </div>

                      {/* Member Info Banner */}
                      <div className="bg-gray-950 p-3 rounded-2xl border border-gray-800/80 mb-3 flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center border border-emerald-500/40 shrink-0">
                          {b.userName ? b.userName.charAt(0) : 'M'}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-white truncate">{b.userName || 'Member'}</p>
                          <p className="text-[10px] text-gray-400 font-mono truncate">{b.userEmail || 'member@pulse.pk'}</p>
                        </div>
                      </div>

                      {/* Target Info */}
                      <div className="flex items-start space-x-3 mb-3">
                        {b.imageUrl ? (
                          <img
                            src={b.imageUrl}
                            alt={b.targetTitle}
                            className="w-12 h-12 rounded-xl object-cover border border-emerald-500/40 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center shrink-0 text-emerald-400 font-black text-sm">
                            PM
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-black text-white">{b.targetTitle}</h4>
                          <p className="text-[11px] text-gray-400 leading-tight">{b.targetSub}</p>
                        </div>
                      </div>

                      {/* Time & Location */}
                      <div className="space-y-1.5 text-xs text-gray-300 font-mono bg-gray-950 p-3 rounded-xl border border-gray-800/80 mb-3">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{b.date}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{b.time} ({b.durationMins || 60} mins)</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span className="text-gray-400 text-[10px]">{b.location}</span>
                        </div>
                      </div>

                      {/* Member Notes */}
                      {b.notes && (
                        <div className="text-[11px] text-gray-300 bg-gray-950/80 p-2.5 rounded-xl border-l-2 border-amber-400 mb-3">
                          <span className="text-[10px] text-amber-400 font-bold block uppercase">Member Note:</span>
                          "{b.notes}"
                        </div>
                      )}

                      {/* Admin Note Section */}
                      <div className="bg-gray-950/90 p-3 rounded-2xl border border-gray-800">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1">
                            <MessageSquare className="w-3 h-3" />
                            <span>Admin Feedback / Desk Note</span>
                          </span>
                          {editingAdminNoteId !== b.id && (
                            <button
                              onClick={() => {
                                setEditingAdminNoteId(b.id);
                                setTempAdminNote(b.adminNote || '');
                              }}
                              className="text-[10px] text-amber-400 hover:underline flex items-center space-x-0.5"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          )}
                        </div>

                        {editingAdminNoteId === b.id ? (
                          <div className="space-y-2 mt-2">
                            <textarea
                              rows={2}
                              value={tempAdminNote}
                              onChange={(e) => setTempAdminNote(e.target.value)}
                              placeholder="Add admin note (e.g. Locker #12 assigned, Coach confirmed)..."
                              className="w-full bg-gray-900 border border-amber-500/40 rounded-xl p-2 text-xs text-white focus:outline-none"
                            />
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => setEditingAdminNoteId(null)}
                                className="px-2.5 py-1 bg-gray-800 text-gray-400 rounded-lg text-[10px] font-bold uppercase"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveAdminNote(b.id)}
                                className="px-3 py-1 bg-amber-500 text-black font-bold rounded-lg text-[10px] uppercase shadow"
                              >
                                Save Note
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-gray-300 italic">
                            {b.adminNote ? `"${b.adminNote}"` : <span className="text-gray-500 not-italic">No admin note added yet.</span>}
                          </p>
                        )}
                      </div>

                    </div>

                    {/* Action Controls Footer */}
                    <div className="pt-3 border-t border-gray-800 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Approve Button */}
                        <button
                          onClick={() => handleApproveBooking(b.id)}
                          disabled={b.status === 'Approved' || b.status === 'Confirmed'}
                          className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center space-x-1 ${
                            b.status === 'Approved' || b.status === 'Confirmed'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20'
                          }`}
                        >
                          <Check className="w-4 h-4" />
                          <span>{b.status === 'Approved' || b.status === 'Confirmed' ? 'Approved' : 'Approve'}</span>
                        </button>

                        {/* Reject/Cancel Button */}
                        <button
                          onClick={() => handleCancelBooking(b.id)}
                          disabled={b.status === 'Cancelled'}
                          className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center space-x-1 ${
                            b.status === 'Cancelled'
                              ? 'bg-red-950/30 text-red-500 border border-red-500/20 cursor-default'
                              : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          <XCircle className="w-4 h-4" />
                          <span>{b.status === 'Cancelled' ? 'Cancelled' : 'Cancel Request'}</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          onClick={() => handleCompleteBooking(b.id)}
                          disabled={b.status === 'Completed'}
                          className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold uppercase transition flex items-center justify-center space-x-1 ${
                            b.status === 'Completed'
                              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                              : 'bg-gray-800 hover:bg-gray-700 text-cyan-400 border border-cyan-500/30'
                          }`}
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>{b.status === 'Completed' ? 'Completed' : 'Mark Completed'}</span>
                        </button>

                        <button
                          onClick={() => handleDeleteBooking(b.id)}
                          className="p-2 bg-gray-900 hover:bg-red-950/50 text-gray-500 hover:text-red-400 rounded-xl border border-gray-800 transition"
                          title="Delete Booking Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* TAB 3: AI PROMPT TUNING CONSOLE & API KEY OVERRIDE */}
        {activeTab === 'prompts' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
            <div className="lg:col-span-8 bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-wider flex items-center space-x-2">
                    <Sliders className="w-5 h-5 text-amber-400" />
                    <span>AI Prompt Tuning Console</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Edit live system instructions passed directly to Gemini models.</p>
                </div>

                <button
                  id="btn-save-prompts"
                  onClick={handleSavePrompts}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-lime-400 text-gray-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:scale-105 transition flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Live Prompts</span>
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-300 font-bold uppercase mb-1">7-Day Protocol System Prompt</label>
                  <textarea
                    rows={4}
                    value={promptConfig.planPrompt}
                    onChange={(e) => setPromptConfig({ ...promptConfig, planPrompt: e.target.value })}
                    className="w-full bg-[#14171D] border border-gray-800 rounded-xl p-3 text-white font-mono focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-bold uppercase mb-1">PULSE BOT Chatbot System Prompt</label>
                  <textarea
                    rows={3}
                    value={promptConfig.chatbotPrompt}
                    onChange={(e) => setPromptConfig({ ...promptConfig, chatbotPrompt: e.target.value })}
                    className="w-full bg-[#14171D] border border-gray-800 rounded-xl p-3 text-white font-mono focus:border-amber-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center space-x-2 border-b border-gray-800 pb-3">
                  <Key className="w-5 h-5 text-amber-400" />
                  <span>Evaluator API Key Override</span>
                </h3>
                <p className="text-xs text-gray-400 mt-2">
                  If judging with a custom Gemini key, enter it below to override backend default.
                </p>

                <div className="mt-4 space-y-3">
                  <input
                    type="password"
                    value={keyOverride}
                    onChange={(e) => setKeyOverride(e.target.value)}
                    placeholder="Paste GEMINI_API_KEY..."
                    className="w-full bg-[#14171D] border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-amber-500 outline-none"
                  />

                  <button
                    id="btn-save-key-override"
                    onClick={handleSaveKeyOverride}
                    className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-amber-400 border border-amber-500/40 font-bold text-xs uppercase rounded-xl transition flex items-center justify-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Override Key</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-[11px] text-amber-300">
                <p className="font-bold">Fallback Safety System:</p>
                If no API key is provided, Pulse Matrix automatically falls back to curated biomechanics models so the application never breaks.
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MODERATION & SAFETY LOGS */}
        {activeTab === 'moderation' && (
          <div className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <h3 className="text-lg font-black text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>AI Query Moderation & Inspection Logs</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#14171D] text-gray-400 uppercase font-mono text-[10px] border-b border-gray-800">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">User</th>
                    <th className="p-3">Query Type</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {modLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-800/40">
                      <td className="p-3 font-mono text-gray-400">{log.timestamp}</td>
                      <td className="p-3 font-bold text-white">{log.userName}</td>
                      <td className="p-3 text-emerald-400 font-semibold">{log.queryType}</td>
                      <td className="p-3">
                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/30">
                          {log.status}
                        </span>
                      </td>
                      <td className="p-3 text-gray-300">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* --- MEMBER INSPECTION DETAIL MODAL --- */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#14171D] border border-gray-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-white bg-gray-900 border border-gray-800 rounded-full transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center space-x-4 mb-6">
              <img
                src={selectedUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={selectedUser.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500"
                referrerPolicy="no-referrer"
              />
              <div>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase font-mono">
                  {selectedUser.role.toUpperCase()} PROFILE
                </span>
                <h3 className="text-xl font-black text-white mt-1">{selectedUser.name}</h3>
                <p className="text-xs text-gray-400 font-mono">{selectedUser.email}</p>
              </div>
            </div>

            {/* Detailed Biometrics Table */}
            <div className="space-y-4 text-xs">
              <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between border-b border-gray-800 pb-1.5">
                  <span className="text-gray-400 font-mono">Firebase Account ID</span>
                  <span className="font-mono text-emerald-400 font-bold truncate max-w-[200px]">{selectedUser.id}</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-1.5">
                  <span className="text-gray-400">Primary Fitness Goal</span>
                  <span className="text-amber-400 font-bold">{selectedUser.goal}</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-1.5">
                  <span className="text-gray-400">Fitness Experience Level</span>
                  <span className="text-white font-bold">{selectedUser.level}</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-1.5">
                  <span className="text-gray-400">Age & Gender</span>
                  <span className="text-white">{selectedUser.age || 25} yrs • {selectedUser.gender || 'male'}</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-1.5">
                  <span className="text-gray-400">Height / Weight</span>
                  <span className="text-white font-mono">{selectedUser.heightCm || 175} cm / {selectedUser.weightKg || 75} kg</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-1.5">
                  <span className="text-gray-400">Activity Multiplier</span>
                  <span className="text-white capitalize">{selectedUser.activityLevel || 'moderate'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Account Created</span>
                  <span className="text-gray-300 font-mono">{selectedUser.createdAt || 'Recent'}</span>
                </div>
              </div>

              {/* Status Actions */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => handleToggleUserRole(selectedUser.id)}
                  className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-amber-400 font-bold rounded-xl text-xs uppercase border border-amber-500/30 transition"
                >
                  {selectedUser.role === 'admin' ? 'Demote to Member' : 'Promote to Admin'}
                </button>
                <button
                  onClick={() => handleToggleUserActive(selectedUser.id)}
                  className={`flex-1 py-2.5 font-bold rounded-xl text-xs uppercase transition ${
                    selectedUser.isActive
                      ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-black shadow-lg'
                  }`}
                >
                  {selectedUser.isActive ? 'Deactivate Account' : 'Activate Account'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </section>
  );
};

