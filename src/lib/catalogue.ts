// Built-in exercise list. Users can add their own on top (stored as 'exercise' records).
export type Muscle =
  | 'Chest' | 'Back' | 'Shoulders' | 'Biceps' | 'Triceps' | 'Forearms'
  | 'Quads' | 'Hamstrings' | 'Glutes' | 'Calves' | 'Core' | 'Full body' | 'Cardio'

export type Equipment = 'Barbell' | 'Dumbbell' | 'Cable' | 'Machine' | 'Bodyweight' | 'Kettlebell' | 'EZ bar' | 'Smith machine' | 'Band' | 'Other'

export interface Exercise {
  id: string
  name: string
  muscle: Muscle
  equipment: Equipment
  bodyweight?: boolean
  custom?: boolean
}

const raw: [string, Muscle, Equipment][] = [
  // Chest
  ['Bench Press', 'Chest', 'Barbell'],
  ['Incline Bench Press', 'Chest', 'Barbell'],
  ['Decline Bench Press', 'Chest', 'Barbell'],
  ['Dumbbell Bench Press', 'Chest', 'Dumbbell'],
  ['Incline Dumbbell Press', 'Chest', 'Dumbbell'],
  ['Dumbbell Fly', 'Chest', 'Dumbbell'],
  ['Incline Dumbbell Fly', 'Chest', 'Dumbbell'],
  ['Cable Crossover', 'Chest', 'Cable'],
  ['Low-to-High Cable Fly', 'Chest', 'Cable'],
  ['Machine Chest Press', 'Chest', 'Machine'],
  ['Pec Deck', 'Chest', 'Machine'],
  ['Smith Machine Bench Press', 'Chest', 'Smith machine'],
  ['Push-Up', 'Chest', 'Bodyweight'],
  ['Chest Dip', 'Chest', 'Bodyweight'],
  // Back
  ['Deadlift', 'Back', 'Barbell'],
  ['Barbell Row', 'Back', 'Barbell'],
  ['Pendlay Row', 'Back', 'Barbell'],
  ['T-Bar Row', 'Back', 'Barbell'],
  ['Rack Pull', 'Back', 'Barbell'],
  ['One-Arm Dumbbell Row', 'Back', 'Dumbbell'],
  ['Chest-Supported Dumbbell Row', 'Back', 'Dumbbell'],
  ['Lat Pulldown', 'Back', 'Cable'],
  ['Close-Grip Lat Pulldown', 'Back', 'Cable'],
  ['Seated Cable Row', 'Back', 'Cable'],
  ['Straight-Arm Pulldown', 'Back', 'Cable'],
  ['Machine Row', 'Back', 'Machine'],
  ['Assisted Pull-Up', 'Back', 'Machine'],
  ['Pull-Up', 'Back', 'Bodyweight'],
  ['Chin-Up', 'Back', 'Bodyweight'],
  ['Inverted Row', 'Back', 'Bodyweight'],
  ['Back Extension', 'Back', 'Bodyweight'],
  ['Shrug', 'Back', 'Barbell'],
  ['Dumbbell Shrug', 'Back', 'Dumbbell'],
  // Shoulders
  ['Overhead Press', 'Shoulders', 'Barbell'],
  ['Push Press', 'Shoulders', 'Barbell'],
  ['Seated Dumbbell Shoulder Press', 'Shoulders', 'Dumbbell'],
  ['Arnold Press', 'Shoulders', 'Dumbbell'],
  ['Lateral Raise', 'Shoulders', 'Dumbbell'],
  ['Cable Lateral Raise', 'Shoulders', 'Cable'],
  ['Front Raise', 'Shoulders', 'Dumbbell'],
  ['Rear Delt Fly', 'Shoulders', 'Dumbbell'],
  ['Reverse Pec Deck', 'Shoulders', 'Machine'],
  ['Face Pull', 'Shoulders', 'Cable'],
  ['Machine Shoulder Press', 'Shoulders', 'Machine'],
  ['Upright Row', 'Shoulders', 'Barbell'],
  ['Pike Push-Up', 'Shoulders', 'Bodyweight'],
  // Biceps
  ['Barbell Curl', 'Biceps', 'Barbell'],
  ['EZ Bar Curl', 'Biceps', 'EZ bar'],
  ['Dumbbell Curl', 'Biceps', 'Dumbbell'],
  ['Hammer Curl', 'Biceps', 'Dumbbell'],
  ['Incline Dumbbell Curl', 'Biceps', 'Dumbbell'],
  ['Concentration Curl', 'Biceps', 'Dumbbell'],
  ['Preacher Curl', 'Biceps', 'EZ bar'],
  ['Cable Curl', 'Biceps', 'Cable'],
  ['Machine Preacher Curl', 'Biceps', 'Machine'],
  // Triceps
  ['Close-Grip Bench Press', 'Triceps', 'Barbell'],
  ['Skull Crusher', 'Triceps', 'EZ bar'],
  ['Triceps Pushdown', 'Triceps', 'Cable'],
  ['Rope Pushdown', 'Triceps', 'Cable'],
  ['Overhead Cable Triceps Extension', 'Triceps', 'Cable'],
  ['Overhead Dumbbell Triceps Extension', 'Triceps', 'Dumbbell'],
  ['Dumbbell Kickback', 'Triceps', 'Dumbbell'],
  ['Triceps Dip', 'Triceps', 'Bodyweight'],
  ['Bench Dip', 'Triceps', 'Bodyweight'],
  ['Diamond Push-Up', 'Triceps', 'Bodyweight'],
  // Forearms
  ['Wrist Curl', 'Forearms', 'Dumbbell'],
  ['Reverse Wrist Curl', 'Forearms', 'Dumbbell'],
  ['Reverse Curl', 'Forearms', 'EZ bar'],
  ["Farmer's Carry", 'Forearms', 'Dumbbell'],
  ['Dead Hang', 'Forearms', 'Bodyweight'],
  // Quads
  ['Back Squat', 'Quads', 'Barbell'],
  ['Front Squat', 'Quads', 'Barbell'],
  ['Pause Squat', 'Quads', 'Barbell'],
  ['Smith Machine Squat', 'Quads', 'Smith machine'],
  ['Hack Squat', 'Quads', 'Machine'],
  ['Leg Press', 'Quads', 'Machine'],
  ['Leg Extension', 'Quads', 'Machine'],
  ['Goblet Squat', 'Quads', 'Dumbbell'],
  ['Bulgarian Split Squat', 'Quads', 'Dumbbell'],
  ['Walking Lunge', 'Quads', 'Dumbbell'],
  ['Reverse Lunge', 'Quads', 'Dumbbell'],
  ['Step-Up', 'Quads', 'Dumbbell'],
  ['Bodyweight Squat', 'Quads', 'Bodyweight'],
  // Hamstrings
  ['Romanian Deadlift', 'Hamstrings', 'Barbell'],
  ['Stiff-Leg Deadlift', 'Hamstrings', 'Barbell'],
  ['Good Morning', 'Hamstrings', 'Barbell'],
  ['Dumbbell Romanian Deadlift', 'Hamstrings', 'Dumbbell'],
  ['Lying Leg Curl', 'Hamstrings', 'Machine'],
  ['Seated Leg Curl', 'Hamstrings', 'Machine'],
  ['Nordic Curl', 'Hamstrings', 'Bodyweight'],
  // Glutes
  ['Hip Thrust', 'Glutes', 'Barbell'],
  ['Glute Bridge', 'Glutes', 'Bodyweight'],
  ['Sumo Deadlift', 'Glutes', 'Barbell'],
  ['Cable Kickback', 'Glutes', 'Cable'],
  ['Hip Abduction Machine', 'Glutes', 'Machine'],
  ['Hip Adduction Machine', 'Glutes', 'Machine'],
  ['Kettlebell Swing', 'Glutes', 'Kettlebell'],
  // Calves
  ['Standing Calf Raise', 'Calves', 'Machine'],
  ['Seated Calf Raise', 'Calves', 'Machine'],
  ['Leg Press Calf Raise', 'Calves', 'Machine'],
  ['Single-Leg Calf Raise', 'Calves', 'Bodyweight'],
  // Core
  ['Plank', 'Core', 'Bodyweight'],
  ['Side Plank', 'Core', 'Bodyweight'],
  ['Crunch', 'Core', 'Bodyweight'],
  ['Hanging Leg Raise', 'Core', 'Bodyweight'],
  ['Hanging Knee Raise', 'Core', 'Bodyweight'],
  ['Cable Crunch', 'Core', 'Cable'],
  ['Ab Wheel Rollout', 'Core', 'Other'],
  ['Russian Twist', 'Core', 'Bodyweight'],
  ['Pallof Press', 'Core', 'Cable'],
  ['Dead Bug', 'Core', 'Bodyweight'],
  ['Decline Sit-Up', 'Core', 'Bodyweight'],
  // Full body
  ['Power Clean', 'Full body', 'Barbell'],
  ['Clean and Jerk', 'Full body', 'Barbell'],
  ['Snatch', 'Full body', 'Barbell'],
  ['Thruster', 'Full body', 'Barbell'],
  ['Burpee', 'Full body', 'Bodyweight'],
  ['Kettlebell Goblet Squat', 'Full body', 'Kettlebell'],
  ['Turkish Get-Up', 'Full body', 'Kettlebell'],
  // Cardio (log minutes as reps, distance or level as weight)
  ['Treadmill', 'Cardio', 'Machine'],
  ['Stationary Bike', 'Cardio', 'Machine'],
  ['Rowing Machine', 'Cardio', 'Machine'],
  ['Elliptical', 'Cardio', 'Machine'],
  ['Stair Climber', 'Cardio', 'Machine'],
  ['Jump Rope', 'Cardio', 'Other'],
]

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export const CATALOGUE: Exercise[] = raw.map(([name, muscle, equipment]) => ({
  id: slug(name),
  name,
  muscle,
  equipment,
  bodyweight: equipment === 'Bodyweight' || undefined,
}))

export const MUSCLES: Muscle[] = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core', 'Full body', 'Cardio']
export const EQUIPMENT: Equipment[] = ['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Kettlebell', 'EZ bar', 'Smith machine', 'Band', 'Other']
