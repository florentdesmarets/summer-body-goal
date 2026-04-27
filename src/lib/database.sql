-- =============================================
-- SUMMER BODY GOAL - Supabase Schema
-- À exécuter dans Supabase SQL Editor
-- =============================================

-- RECIPES
create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  prep_time_minutes int default 0,
  cook_time_minutes int default 0,
  servings int default 2,
  calories_per_serving int,
  protein_g numeric(5,1),
  carbs_g numeric(5,1),
  fat_g numeric(5,1),
  ingredients jsonb not null default '[]',
  steps jsonb not null default '[]',
  tags text[] default '{}',
  created_at timestamptz default now()
);

-- MEAL PLANS
create table if not exists meal_plans (
  id uuid primary key default gen_random_uuid(),
  week_start_date date not null,
  day text not null check (day in ('Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche')),
  meal_type text not null check (meal_type in ('petit_dejeuner','dejeuner','diner','collation')),
  recipe_id uuid references recipes(id) on delete cascade,
  created_at timestamptz default now(),
  unique(week_start_date, day, meal_type)
);

-- SHOPPING ITEMS
create table if not exists shopping_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  quantity numeric(8,2) not null,
  unit text not null,
  is_checked boolean default false,
  week_start_date date not null,
  recipe_id uuid references recipes(id) on delete set null,
  created_at timestamptz default now()
);

-- EXERCISES
create table if not exists exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  muscle_group text not null check (muscle_group in ('chest','back','legs','shoulders','arms','abs','cardio','full_body')),
  description text,
  video_url text,
  created_at timestamptz default now()
);

-- WORKOUT PLANS
create table if not exists workout_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  day_of_week text check (day_of_week in ('Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche')),
  week_start_date date not null,
  exercises jsonb not null default '[]',
  created_at timestamptz default now()
);

-- WORKOUT LOGS
create table if not exists workout_logs (
  id uuid primary key default gen_random_uuid(),
  workout_plan_id uuid references workout_plans(id) on delete set null,
  date date not null,
  duration_minutes int not null,
  notes text,
  exercises_done jsonb not null default '[]',
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_meal_plans_week on meal_plans(week_start_date);
create index if not exists idx_shopping_items_week on shopping_items(week_start_date);
create index if not exists idx_workout_plans_week on workout_plans(week_start_date);
create index if not exists idx_workout_logs_date on workout_logs(date);

-- Disable RLS (app perso, pas d'auth)
alter table recipes disable row level security;
alter table meal_plans disable row level security;
alter table shopping_items disable row level security;
alter table exercises disable row level security;
alter table workout_plans disable row level security;
alter table workout_logs disable row level security;
