export type DayOfWeek = 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | 'Dimanche';
export type MealType = 'petit_dejeuner' | 'dejeuner' | 'diner' | 'collation';
export type MuscleGroup = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'abs' | 'cardio' | 'full_body';
export type Difficulty = 'debutant' | 'intermediaire' | 'avance';

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface RecipeStep {
  order: number;
  description: string;
  duration_minutes?: number;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  calories_per_serving?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  tags: string[];
  created_at: string;
}

export interface MealPlan {
  id: string;
  week_start_date: string;
  day: DayOfWeek;
  meal_type: MealType;
  recipe_id: string;
  recipe?: Recipe;
  created_at: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  is_checked: boolean;
  week_start_date: string;
  recipe_id?: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscle_group: MuscleGroup;
  description?: string;
  video_url?: string;
}

export interface WorkoutExercise {
  exercise_id: string;
  exercise?: Exercise;
  sets: number;
  reps?: number;
  duration_seconds?: number;
  rest_seconds: number;
  weight_kg?: number;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description?: string;
  day_of_week: DayOfWeek;
  week_start_date: string;
  exercises: WorkoutExercise[];
  created_at: string;
}

export interface WorkoutLog {
  id: string;
  workout_plan_id?: string;
  date: string;
  duration_minutes: number;
  notes?: string;
  exercises_done: WorkoutLogExercise[];
  created_at: string;
}

export interface WorkoutLogExercise {
  exercise_id: string;
  exercise_name: string;
  sets_done: SetLog[];
}

export interface SetLog {
  set_number: number;
  reps?: number;
  weight_kg?: number;
  duration_seconds?: number;
  completed: boolean;
}
