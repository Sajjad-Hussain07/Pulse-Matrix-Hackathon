import { UserProfile, Trainer, ClassSession, HabitLog, SystemPromptConfig, ModerationLog, PostureAnalysisResult } from '../types';

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user_001',
    name: 'Tariq Baloch',
    email: 'tariq.baloch@pulse.pk',
    goal: 'Muscle Gain',
    level: 'Advanced',
    age: 28,
    gender: 'male',
    heightCm: 180,
    weightKg: 78,
    activityLevel: 'active',
    role: 'user',
    isActive: true,
    createdAt: '2026-07-01',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'user_002',
    name: 'Ayesha Khan',
    email: 'ayesha.khan@pulse.pk',
    goal: 'Body Recomposition',
    level: 'Intermediate',
    age: 25,
    gender: 'female',
    heightCm: 165,
    weightKg: 62,
    activityLevel: 'moderate',
    role: 'user',
    isActive: true,
    createdAt: '2026-07-15',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'user_003',
    name: 'Syed Hamza Ali',
    email: 'admin@pulse.pk',
    goal: 'Maintenance',
    level: 'Elite',
    age: 32,
    gender: 'male',
    heightCm: 182,
    weightKg: 83,
    activityLevel: 'extra',
    role: 'admin',
    isActive: true,
    createdAt: '2026-06-01',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  },
];

export const MOCK_TRAINERS: Trainer[] = [
  {
    id: 'tr_1',
    name: 'Coach Zeeshan Ahmed',
    role: 'Head of Strength & Conditioning',
    credentials: ['CSCS Certified', 'B.S. Exercise Physiology', '12+ Yrs Experience'],
    achievements: ['Trained 50+ National Athletes', 'Powerlifting Champion 2024', 'Hyrox Master Trainer'],
    specialty: 'Hypertrophy & Max Strength Protocols',
    experienceYears: 12,
    imageUrl: '/src/assets/images/trainer_strength_1786215023186.jpg',
    bio: 'Pioneer in velocity-based resistance training and neuromuscular hypertrophy adaptation.',
    rating: 4.9,
  },
  {
    id: 'tr_2',
    name: 'Dr. Fatima Dawood',
    role: 'Head Clinical Nutritionist & Biomechanics Lead',
    credentials: ['Ph.D. Sports Nutrition', 'ISSN Certified', 'FMS Level 2 Specialist'],
    achievements: ['Designed 1,000+ Precision Meal Protocols', 'Keynote Speaker at Metabolic Health Summit'],
    specialty: 'Metabolic Flexibility & Corrective Posture Alignment',
    experienceYears: 9,
    imageUrl: '/src/assets/images/trainer_nutrition_1786215034165.jpg',
    bio: 'Specializing in blood-glucose optimization, anti-inflammatory nutrition, and kinetic chain postural repair.',
    rating: 5.0,
  },
  {
    id: 'tr_3',
    name: 'Kashif "The Viper" Raza',
    role: 'Senior Functional & Combat Coach',
    credentials: ['Pro MMA Fighter (Retired)', 'NASM-CPT', 'TRX Master Trainer'],
    achievements: ['15-0 Amateur Boxing Record', 'Conditioned 200+ Combat Sports Athletes'],
    specialty: 'High-Velocity HIIT & Explosive Striking',
    experienceYears: 8,
    imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&auto=format&fit=crop&q=80',
    bio: 'Combining raw martial arts discipline with biometric heart-rate zone tracking for maximum caloric burn.',
    rating: 4.8,
  },
];

export const MOCK_CLASSES: ClassSession[] = [
  {
    id: 'cls_1',
    title: 'Cyber Cardio HIIT Protocol',
    category: 'HIIT',
    trainerName: 'Kashif "The Viper" Raza',
    day: 'Mon',
    time: '07:00 AM - 08:00 AM',
    durationMins: 60,
    capacity: 20,
    enrolled: 16,
    intensity: 'High',
  },
  {
    id: 'cls_2',
    title: 'Hypertrophy Power Hour (Upper)',
    category: 'Hypertrophy',
    trainerName: 'Coach Zeeshan Ahmed',
    day: 'Mon',
    time: '06:00 PM - 07:15 PM',
    durationMins: 75,
    capacity: 15,
    enrolled: 14,
    intensity: 'Extreme',
  },
  {
    id: 'cls_3',
    title: 'Kinetix Posture & Joint Mobility',
    category: 'Mobility',
    trainerName: 'Dr. Fatima Dawood',
    day: 'Tue',
    time: '08:00 AM - 09:00 AM',
    durationMins: 60,
    capacity: 25,
    enrolled: 18,
    intensity: 'Medium',
  },
  {
    id: 'cls_4',
    title: 'Precision Tactical Boxing Conditioning',
    category: 'Boxing',
    trainerName: 'Kashif "The Viper" Raza',
    day: 'Wed',
    time: '07:30 PM - 08:30 PM',
    durationMins: 60,
    capacity: 18,
    enrolled: 17,
    intensity: 'High',
  },
  {
    id: 'cls_5',
    title: 'Metabolic Recomp Circuit',
    category: 'HIIT',
    trainerName: 'Dr. Fatima Dawood',
    day: 'Thu',
    time: '06:30 AM - 07:30 AM',
    durationMins: 60,
    capacity: 20,
    enrolled: 12,
    intensity: 'High',
  },
  {
    id: 'cls_6',
    title: 'Posterior Chain & Deadlift Masterclass',
    category: 'Hypertrophy',
    trainerName: 'Coach Zeeshan Ahmed',
    day: 'Fri',
    time: '05:30 PM - 07:00 PM',
    durationMins: 90,
    capacity: 12,
    enrolled: 11,
    intensity: 'Extreme',
  },
];

export const DEFAULT_SYSTEM_PROMPT_CONFIG: SystemPromptConfig = {
  planPrompt: `You are the Lead Sports Scientist and Master AI Nutritionist at PULSE MATRIX PERFORMANCE CLUB in Hyderabad, Pakistan.
Given the user's biometrics, fitness level, target goals, and daily calorie target, generate a structured 7-Day Nutrition and Workout Protocol.
Respond in clear JSON or well-formatted markdown containing:
1. Daily Meal Breakdown (Breakfast, Lunch, Dinner, Snack) with exact gram macros (Protein, Carbs, Fat) and local Pakistani/Clean options (e.g. grilled chicken breast, lentils, egg whites, oats, Greek yogurt).
2. Customized Workout Split with target muscle groups, exercises, sets, reps, rest periods, and progressive overload tips.`,

  chatbotPrompt: `You are PULSE BOT 3.0, the AI Performance Specialist at PULSE MATRIX PERFORMANCE CLUB (Located opposite Dawood Super Market, Auto Bahn Road, Hyderabad, Pakistan).
You provide ultra-scientific, encouraging, and actionable fitness, nutrition, biomechanics, and recovery advice tailored specifically to the active user's profile.
Always stay sharp, professional, concise, and motivating!`,

  visionPrompt: `You are an elite Biomechanics & Anthropometric Computer Vision AI for Pulse Matrix.
Analyze the user's posture photo and evaluate:
1. Estimated Body Fat Category and Muscle Symmetry.
2. Posture Findings (Forward Head Angle, Shoulder Elevation Difference, Anterior Pelvic Tilt).
3. 3 Specific Targeted Corrective Exercises with prescribed sets, reps, and kinetic cues.`,
};

export const DEFAULT_POSTURE_RESULT: PostureAnalysisResult = {
  bodyFatCategory: 'Athletic / Recomposition Target (14% - 17%)',
  estimatedBodyFatPct: '15.4%',
  muscleDistribution: 'Symmetrical upper torso development with mild thoracic stiffness.',
  postureFindings: [
    {
      issue: 'Forward Head Position (Text Neck)',
      severity: 'Mild',
      description: 'Cervical spine flexed forward by approximately 12 degrees relative to vertical shoulder alignment.',
    },
    {
      issue: 'Right Shoulder Elevation',
      severity: 'Mild',
      description: 'Right acromion process is ~1.5cm higher than left due to dominant trapezius tightness.',
    },
    {
      issue: 'Anterior Pelvic Tilt',
      severity: 'Moderate',
      description: 'Tight hip flexors causing slight lumbar lordosis. Requires glute/core recruitment.',
    },
  ],
  correctiveExercises: [
    {
      name: 'Chin Tucks & Deep Cervical Flexor Holds',
      setsReps: '3 Sets x 12 Reps (5s isometric hold)',
      targetArea: 'Cervical Spine & Neck Extensors',
      instructions: 'Retract chin straight back without tilting head down. Hold firmly for 5 seconds per rep.',
    },
    {
      name: 'Face Pulls with External Rotation',
      setsReps: '4 Sets x 15 Reps',
      targetArea: 'Rear Deltoids & Rhomboids',
      instructions: 'Pull cable rope toward eye level while spreading hands apart and squeezing shoulder blades.',
    },
    {
      name: 'Half-Kneeling Hip Flexor Stretch & Glute Squeeze',
      setsReps: '3 Sets x 45 Seconds / side',
      targetArea: 'Psoas Major & Anterior Pelvis',
      instructions: 'Kneel on one knee, tuck pelvis posterior, squeeze rear glute tightly while holding upright posture.',
    },
  ],
  score: 84,
};

export const INITIAL_HABIT_LOGS: HabitLog[] = [
  {
    date: new Date().toISOString().split('T')[0],
    waterMl: 2250,
    waterGoalMl: 3500,
    mealsChecked: [true, true, true, false],
    workoutCompleted: true,
    notes: 'Smashed heavy bench press and upper hypertrophy session today at Auto Bahn Road club!',
  },
];

export const INITIAL_MODERATION_LOGS: ModerationLog[] = [
  {
    id: 'mod_1',
    timestamp: '2026-08-08 09:14 AM',
    userId: 'user_001',
    userName: 'Tariq Baloch',
    queryType: 'AI 7-Day Plan Generation',
    status: 'Approved',
    details: 'Generated 2,800 kcal Muscle Gain Protocol with high protein split.',
  },
  {
    id: 'mod_2',
    timestamp: '2026-08-08 10:30 AM',
    userId: 'user_002',
    userName: 'Ayesha Khan',
    queryType: 'Vision Posture Scan',
    status: 'Approved',
    details: 'Uploaded front posture alignment photo. Corrective exercises assigned for shoulder symmetry.',
  },
  {
    id: 'mod_3',
    timestamp: '2026-08-08 11:05 AM',
    userId: 'user_001',
    userName: 'Tariq Baloch',
    queryType: 'Chatbot Interaction',
    status: 'Approved',
    details: 'Requested 10-minute high intensity finisher routine for leg day.',
  },
];
