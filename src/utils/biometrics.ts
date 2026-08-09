import { UserProfile, BiometricsData } from '../types';

export function calculateBiometrics(user: UserProfile | null | undefined): BiometricsData {
  // 🛡️ Guard Clause 1: Default fallback values agar user object missing ho
  const defaultBiometrics: BiometricsData = {
    bmi: 0,
    bmiCategory: 'Pending Scan',
    bmr: 0,
    tdee: 0,
    targetCalories: 0,
    macros: {
      proteinGrams: 0,
      carbsGrams: 0,
      fatGrams: 0,
    },
  };

  if (!user) {
    return defaultBiometrics;
  }

  // Safe destructuring with fallback defaults
  const heightCm = Number(user.heightCm) || 0;
  const weightKg = Number(user.weightKg) || 0;
  const age = Number(user.age) || 25;
  const gender = user.gender || 'male';
  const activityLevel = user.activityLevel || 'moderate';
  const goal = user.goal || 'Maintenance';

  // 🛡️ Guard Clause 2: Prevent Division by Zero or invalid height/weight
  if (heightCm <= 0 || weightKg <= 0) {
    return defaultBiometrics;
  }

  // 1. BMI Calculation
  const heightMeters = heightCm / 100;
  const calculatedBmi = weightKg / (heightMeters * heightMeters);
  
  if (isNaN(calculatedBmi) || !isFinite(calculatedBmi)) {
    return defaultBiometrics;
  }

  const bmi = Number(calculatedBmi.toFixed(1));

  let bmiCategory = 'Normal Weight';
  if (bmi < 18.5) bmiCategory = 'Underweight';
  else if (bmi >= 18.5 && bmi <= 24.9) bmiCategory = 'Optimal Athletic';
  else if (bmi >= 25 && bmi <= 29.9) bmiCategory = 'Overweight';
  else bmiCategory = 'Obese / Recomposition Required';

  // 2. BMR (Mifflin-St Jeor Equation)
  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender.toLowerCase() === 'male') {
    bmr += 5;
  } else {
    bmr -= 161;
  }
  bmr = Math.max(0, Math.round(bmr));

  // 3. TDEE Multiplier
  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    extra: 1.9,
  };

  const multiplier = activityMultipliers[activityLevel] || 1.55;
  const tdee = Math.round(bmr * multiplier);

  // 4. Target Calorie Adjustment based on Goal
  let targetCalories = tdee;
  if (goal === 'Weight Loss') {
    targetCalories = Math.round(tdee * 0.8); // 20% deficit
  } else if (goal === 'Muscle Gain') {
    targetCalories = Math.round(tdee * 1.15); // 15% surplus
  } else if (goal === 'Body Recomposition') {
    targetCalories = Math.round(tdee * 0.95); // Slight 5% deficit with high protein
  }

  // 5. Macro Distribution (Protein, Carbs, Fats)
  let proteinMultiplierGramsPerKg = 2.0; // default 2g/kg
  let fatPct = 0.25;

  if (goal === 'Muscle Gain') {
    proteinMultiplierGramsPerKg = 2.2;
    fatPct = 0.25;
  } else if (goal === 'Weight Loss') {
    proteinMultiplierGramsPerKg = 2.4; // High protein retention
    fatPct = 0.3;
  } else if (goal === 'Body Recomposition') {
    proteinMultiplierGramsPerKg = 2.5;
    fatPct = 0.25;
  }

  const proteinGrams = Math.round(weightKg * proteinMultiplierGramsPerKg);
  const proteinCalories = proteinGrams * 4;

  const fatCalories = targetCalories * fatPct;
  const fatGrams = Math.round(fatCalories / 9);

  const carbCalories = Math.max(0, targetCalories - (proteinCalories + fatCalories));
  const carbsGrams = Math.round(carbCalories / 4);

  return {
    bmi,
    bmiCategory,
    bmr,
    tdee,
    targetCalories,
    macros: {
      proteinGrams: isNaN(proteinGrams) ? 0 : proteinGrams,
      carbsGrams: isNaN(carbsGrams) ? 0 : carbsGrams,
      fatGrams: isNaN(fatGrams) ? 0 : fatGrams,
    },
  };
}