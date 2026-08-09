import { UserProfile, HabitLog, SystemPromptConfig, ModerationLog, ProtocolPlan, PostureAnalysisResult, UserBooking } from '../types';
import { INITIAL_USERS, DEFAULT_SYSTEM_PROMPT_CONFIG, INITIAL_HABIT_LOGS, INITIAL_MODERATION_LOGS, DEFAULT_POSTURE_RESULT } from '../data/mockData';

const STORAGE_KEYS = {
  USERS: 'pulse_matrix_users',
  ACTIVE_USER_ID: 'pulse_matrix_active_user_id',
  HABIT_LOGS: 'pulse_matrix_habit_logs',
  STREAK_COUNT: 'pulse_matrix_streak_count',
  SYSTEM_PROMPT: 'pulse_matrix_system_prompts',
  MODERATION_LOGS: 'pulse_matrix_moderation_logs',
  GEMINI_KEY_OVERRIDE: 'pulse_matrix_gemini_key_override',
  CURRENT_PLAN: 'pulse_matrix_current_plan',
  CURRENT_POSTURE: 'pulse_matrix_current_posture',
  BOOKINGS: 'pulse_matrix_user_bookings',
  IS_LOGGED_IN: 'pulse_matrix_is_logged_in',
};

export function getIsLoggedIn(): boolean {
  return localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN) === 'true';
}

export function setIsLoggedIn(loggedIn: boolean): void {
  localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, loggedIn ? 'true' : 'false');
}

export function initializeLocalStorage(): void {
  // Seed users if empty
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  }

  // Active user ID - default to null or empty if not set
  if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID)) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, '');
  }

  // Habit logs
  if (!localStorage.getItem(STORAGE_KEYS.HABIT_LOGS)) {
    localStorage.setItem(STORAGE_KEYS.HABIT_LOGS, JSON.stringify(INITIAL_HABIT_LOGS));
  }

  // Streak count
  if (!localStorage.getItem(STORAGE_KEYS.STREAK_COUNT)) {
    localStorage.setItem(STORAGE_KEYS.STREAK_COUNT, '5');
  }

  // System prompt config
  if (!localStorage.getItem(STORAGE_KEYS.SYSTEM_PROMPT)) {
    localStorage.setItem(STORAGE_KEYS.SYSTEM_PROMPT, JSON.stringify(DEFAULT_SYSTEM_PROMPT_CONFIG));
  }

  // Moderation logs
  if (!localStorage.getItem(STORAGE_KEYS.MODERATION_LOGS)) {
    localStorage.setItem(STORAGE_KEYS.MODERATION_LOGS, JSON.stringify(INITIAL_MODERATION_LOGS));
  }

  // Default Posture Analysis
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_POSTURE)) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_POSTURE, JSON.stringify(DEFAULT_POSTURE_RESULT));
  }

  // Bookings list
  if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify([]));
  }
}

// User Profile Helpers
export function getUsers(): UserProfile[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : INITIAL_USERS;
  } catch {
    return INITIAL_USERS;
  }
}

export function saveUsers(users: UserProfile[]): void {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

export function getActiveUser(): UserProfile {
  const users = getUsers();
  const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID);
  const found = users.find((u) => u.id === activeId);
  return found || users[0] || INITIAL_USERS[0];
}

export function setActiveUserId(id: string): void {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, id);
}

const INITIAL_MOCK_BOOKINGS: UserBooking[] = [
  {
    id: 'booking_demo_101',
    userId: 'usr_001',
    userName: 'Vikram Sarabhai',
    userEmail: 'vikram.s@matrix.in',
    type: 'Trainer Consultation',
    targetTitle: 'Coach Marcus Vance',
    targetSub: 'Head of Biomechanics & Powerlifting Prep',
    imageUrl: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=300&auto=format&fit=crop&q=80',
    date: '2026-08-12',
    time: '05:00 PM',
    durationMins: 60,
    status: 'Pending Approval',
    notes: 'Requesting 1-on-1 assessment for lumbar spine posture and heavy deadlift mechanics.',
    adminNote: 'Awaiting head coach schedule confirmation',
    isFeatured: true,
    location: 'Pulse Matrix Cyber Studio, Jubilee Hills, Hyderabad',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'booking_demo_102',
    userId: 'usr_002',
    userName: 'Dr. Ananya Rao',
    userEmail: 'ananya.rao@apollo.org',
    type: 'Class Session',
    targetTitle: 'HYPERDRIVE METCON HIIT',
    targetSub: 'Coach Sarah Jenkins • HIIT (Extreme Intensity)',
    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300&auto=format&fit=crop&q=80',
    date: 'Next Tue',
    time: '07:00 AM',
    durationMins: 45,
    status: 'Approved',
    notes: 'First time joining MetCon class. Prefer front row station.',
    adminNote: 'Spot reserved & locker assigned',
    isFeatured: false,
    location: 'Pulse Matrix Cyber Studio, Jubilee Hills, Hyderabad',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'booking_demo_103',
    userId: 'usr_003',
    userName: 'Karan Mehta',
    userEmail: 'karan.m@techscale.io',
    type: 'Trainer Consultation',
    targetTitle: 'Dr. Elena Rostova',
    targetSub: 'Olympic Sports Scientist & Posture Rehab Specialist',
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    date: '2026-08-15',
    time: '11:30 AM',
    durationMins: 60,
    status: 'Completed',
    notes: '3D posture scan analysis & custom mobility routine review.',
    adminNote: 'Session completed successfully. Posture report attached.',
    isFeatured: true,
    location: 'Pulse Matrix Performance Club, Hyderabad',
    createdAt: new Date().toISOString(),
  }
];

// Booking Helpers
export function getAllBookingsLocal(): UserBooking[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(INITIAL_MOCK_BOOKINGS));
      return INITIAL_MOCK_BOOKINGS;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_MOCK_BOOKINGS;
  }
}

export function getUserBookingsLocal(userId: string): UserBooking[] {
  const bookings = getAllBookingsLocal();
  return userId ? bookings.filter((b) => b.userId === userId) : bookings;
}

export function saveUserBookingLocal(booking: UserBooking): void {
  const bookings = getAllBookingsLocal();
  const index = bookings.findIndex((b) => b.id === booking.id);
  if (index !== -1) {
    bookings[index] = booking;
  } else {
    bookings.unshift(booking);
  }
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
}

export function updateBookingStatusLocal(
  bookingId: string,
  status: UserBooking['status'],
  adminNote?: string,
  isFeatured?: boolean
): UserBooking | null {
  const bookings = getAllBookingsLocal();
  const index = bookings.findIndex((b) => b.id === bookingId);
  if (index === -1) return null;

  const updatedBooking: UserBooking = {
    ...bookings[index],
    status,
    adminNote: adminNote !== undefined ? adminNote : bookings[index].adminNote,
    isFeatured: isFeatured !== undefined ? isFeatured : bookings[index].isFeatured,
  };

  bookings[index] = updatedBooking;
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  return updatedBooking;
}

export function cancelUserBookingLocal(bookingId: string): void {
  updateBookingStatusLocal(bookingId, 'Cancelled');
}

export function deleteUserBookingLocal(bookingId: string): void {
  const bookings = getAllBookingsLocal();
  const filtered = bookings.filter((b) => b.id !== bookingId);
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(filtered));
}


export function saveUserProfile(updatedUser: UserProfile): void {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === updatedUser.id);
  if (index !== -1) {
    users[index] = updatedUser;
  } else {
    users.push(updatedUser);
  }
  saveUsers(users);
}

// Habit Log Helpers
export function getHabitLogs(): HabitLog[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.HABIT_LOGS);
    return data ? JSON.parse(data) : INITIAL_HABIT_LOGS;
  } catch {
    return INITIAL_HABIT_LOGS;
  }
}

export function getTodayHabitLog(): HabitLog {
  const logs = getHabitLogs();
  const today = new Date().toISOString().split('T')[0];
  const found = logs.find((l) => l.date === today);
  if (found) return found;

  const newLog: HabitLog = {
    date: today,
    waterMl: 0,
    waterGoalMl: 3500,
    mealsChecked: [false, false, false, false],
    workoutCompleted: false,
  };
  logs.push(newLog);
  localStorage.setItem(STORAGE_KEYS.HABIT_LOGS, JSON.stringify(logs));
  return newLog;
}

export function saveHabitLog(log: HabitLog): void {
  const logs = getHabitLogs();
  const index = logs.findIndex((l) => l.date === log.date);
  if (index !== -1) {
    logs[index] = log;
  } else {
    logs.push(log);
  }
  localStorage.setItem(STORAGE_KEYS.HABIT_LOGS, JSON.stringify(logs));

  // Recalculate streak
  calculateAndUpdateStreak(logs);
}

export function getStreakCount(): number {
  const countStr = localStorage.getItem(STORAGE_KEYS.STREAK_COUNT);
  return countStr ? parseInt(countStr, 10) : 5;
}

function calculateAndUpdateStreak(logs: HabitLog[]): void {
  let streak = 0;
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  for (const log of sorted) {
    const isCompleted = log.workoutCompleted && log.waterMl >= 2000;
    if (isCompleted) {
      streak++;
    } else {
      break;
    }
  }
  if (streak === 0 && logs.some((l) => l.workoutCompleted)) {
    streak = 1;
  }
  localStorage.setItem(STORAGE_KEYS.STREAK_COUNT, streak.toString());
}

// System Prompt Config
export function getSystemPromptConfig(): SystemPromptConfig {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SYSTEM_PROMPT);
    return data ? JSON.parse(data) : DEFAULT_SYSTEM_PROMPT_CONFIG;
  } catch {
    return DEFAULT_SYSTEM_PROMPT_CONFIG;
  }
}

export function saveSystemPromptConfig(config: SystemPromptConfig): void {
  localStorage.setItem(STORAGE_KEYS.SYSTEM_PROMPT, JSON.stringify(config));
}

// Moderation Logs
export function getModerationLogs(): ModerationLog[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MODERATION_LOGS);
    return data ? JSON.parse(data) : INITIAL_MODERATION_LOGS;
  } catch {
    return INITIAL_MODERATION_LOGS;
  }
}

export function addModerationLog(log: Omit<ModerationLog, 'id' | 'timestamp'>): void {
  const logs = getModerationLogs();
  const newLog: ModerationLog = {
    ...log,
    id: `mod_${Date.now()}`,
    timestamp: new Date().toLocaleString(),
  };
  logs.unshift(newLog);
  localStorage.setItem(STORAGE_KEYS.MODERATION_LOGS, JSON.stringify(logs));
}

// Gemini Key Override
export function getGeminiKeyOverride(): string {
  return localStorage.getItem(STORAGE_KEYS.GEMINI_KEY_OVERRIDE) || '';
}

export function saveGeminiKeyOverride(key: string): void {
  localStorage.setItem(STORAGE_KEYS.GEMINI_KEY_OVERRIDE, key);
}

// Saved Protocol Plan & Posture Analysis
export function getSavedPlan(): ProtocolPlan | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_PLAN);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function savePlan(plan: ProtocolPlan): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_PLAN, JSON.stringify(plan));
}

export function getSavedPosture(): PostureAnalysisResult {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_POSTURE);
    return data ? JSON.parse(data) : DEFAULT_POSTURE_RESULT;
  } catch {
    return DEFAULT_POSTURE_RESULT;
  }
}

export function savePosture(posture: PostureAnalysisResult): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_POSTURE, JSON.stringify(posture));
}
