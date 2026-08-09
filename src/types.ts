export type FitnessGoal = 'Weight Loss' | 'Muscle Gain' | 'Maintenance' | 'Body Recomposition';
export type FitnessLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Elite';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  goal: FitnessGoal;
  level: FitnessLevel;
  age: number;
  gender: 'male' | 'female' | 'other';
  heightCm: number;
  weightKg: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'extra';
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: string;
  avatarUrl?: string;
}

export interface BiometricsData {
  bmi: number;
  bmiCategory: string;
  bmr: number;
  tdee: number;
  targetCalories: number;
  macros: {
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
  };
}

export interface PostureAnalysisResult {
  bodyFatCategory: string;
  estimatedBodyFatPct: string;
  muscleDistribution: string;
  postureFindings: {
    issue: string;
    severity: 'Mild' | 'Moderate' | 'Severe' | 'Optimal';
    description: string;
  }[];
  correctiveExercises: {
    name: string;
    setsReps: string;
    instructions: string;
    targetArea: string;
  }[];
  score: number; // 0-100 overall score
}

export interface DayPlan {
  day: string;
  meals: {
    type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    items: string[];
  }[];
  workout: {
    title: string;
    category: string;
    durationMins: number;
    exercises: {
      name: string;
      sets: number;
      reps: string;
      rest: string;
      notes: string;
    }[];
  };
}

export interface ProtocolPlan {
  id: string;
  userId: string;
  generatedAt: string;
  goal: FitnessGoal;
  targetCalories: number;
  summary: string;
  days: DayPlan[];
}

export interface HabitLog {
  date: string; // YYYY-MM-DD
  waterMl: number; // e.g., 2500
  waterGoalMl: number; // e.g., 3000
  mealsChecked: boolean[]; // [breakfast, lunch, dinner, snack]
  workoutCompleted: boolean;
  notes?: string;
}

export interface Trainer {
  id: string;
  name: string;
  role: string;
  credentials: string[];
  achievements: string[];
  specialty: string;
  experienceYears: number;
  imageUrl: string;
  bio: string;
  rating: number;
}

export interface ClassSession {
  id: string;
  title: string;
  category: 'HIIT' | 'Hypertrophy' | 'Mobility' | 'Boxing';
  trainerName: string;
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  time: string;
  durationMins: number;
  capacity: number;
  enrolled: number;
  intensity: 'High' | 'Medium' | 'Extreme';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  sources?: string[];
}

export interface ModerationLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  queryType: string;
  status: 'Approved' | 'Flagged' | 'Inspected';
  details: string;
}

export interface SystemPromptConfig {
  planPrompt: string;
  chatbotPrompt: string;
  visionPrompt: string;
}

export interface UserBooking {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: 'Trainer Consultation' | 'Class Session';
  targetTitle: string;
  targetSub: string;
  imageUrl?: string;
  date: string;
  time: string;
  durationMins?: number;
  status: 'Pending Approval' | 'Approved' | 'Confirmed' | 'Completed' | 'Cancelled';
  notes?: string;
  adminNote?: string;
  isFeatured?: boolean;
  location: string;
  createdAt: string;
}

