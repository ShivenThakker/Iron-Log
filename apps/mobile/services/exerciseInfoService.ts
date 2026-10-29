import scrapedExercises from '@/constants/scrapedExercises.json';
import { MuscleHeatmapData } from '@/components/charts/MuscleHeatmap';

export interface ExerciseStep {
  step: number;
  name?: string;
  text: string;
}

export interface DetailedExerciseInfo {
  name: string;
  category?: string;
  difficulty?: string;
  equipment?: string;
  youtubeId?: string | null;
  youtubeThumbnail?: string | null;
  youtubeUrl: string;
  instructions: string;
  steps: ExerciseStep[];
  primaryMuscles: string[];
  secondaryMuscles: string[];
  coachingCues: string[];
  commonMistakes: string[];
  breathingTips: string[];
  heatmapData: MuscleHeatmapData;
}

// Curated high-quality YouTube IDs for exercises without an exact scraped ID
const CURATED_YOUTUBE_IDS: Record<string, string> = {
  'lat pulldown': 'CAwf7n6Luuc',
  'lat pull-down': 'CAwf7n6Luuc',
  'cable lat pulldown': 'CAwf7n6Luuc',
  'tricep cable pushdown': '2-LAMcpzODU',
  'cable pushdowns': '2-LAMcpzODU',
  'tricep pushdown': '2-LAMcpzODU',
  'cable pushdown': '2-LAMcpzODU',
  'barbell bench press': '_FkbD0FhgVE',
  'bench press': '_FkbD0FhgVE',
  'incline dumbbell press': '8iPEnn-ltC8',
  'incline db press': '8iPEnn-ltC8',
  'barbell squat': 'MLoZuAkIyZI',
  'squat': 'MLoZuAkIyZI',
  'romanian deadlift': 'JCXUYuzwNrM',
  'barbell deadlift': 'op9kVnSso6Q',
  'deadlift': 'op9kVnSso6Q',
  'dumbbell bicep curl': 'ykJmrZ5v0Oo',
  'bicep curl': 'ykJmrZ5v0Oo',
  'overhead press': '2yjwXTZQDDI',
  'barbell shoulder press': '2yjwXTZQDDI',
  'seated cable row': 'GZbfZ033f74',
  'cable row': 'GZbfZ033f74',
  'leg press': 'IZxyjW7MPJQ',
  'leg curl': '1Tq3QdYUuHs',
  'leg extension': 'YyvSfV/QdFo',
};

// Map muscle strings to Heatmap keys
function mapMuscleNameToHeatmapKey(muscleStr: string): string[] {
  const lower = muscleStr.toLowerCase();
  const keys: string[] = [];

  if (lower.includes('chest') || lower.includes('pec')) keys.push('chest');
  if (lower.includes('lat') || lower.includes('back') || lower.includes('rhomboid')) keys.push('back');
  if (lower.includes('trap')) keys.push('traps');
  if (lower.includes('delt') || lower.includes('shoulder')) keys.push('shoulders');
  if (lower.includes('bicep')) keys.push('biceps');
  if (lower.includes('tricep')) keys.push('triceps');
  if (lower.includes('forearm')) keys.push('forearms');
  if (lower.includes('quad') || lower.includes('femoris')) keys.push('quads');
  if (lower.includes('hamstring')) keys.push('hamstrings');
  if (lower.includes('glute')) keys.push('glutes');
  if (lower.includes('calf') || lower.includes('calves') || lower.includes('gastrocnemius')) keys.push('calves');
  if (lower.includes('abs') || lower.includes('core') || lower.includes('abdominal') || lower.includes('oblique')) keys.push('core');

  return keys;
}

export function getDetailedExerciseInfo(
  exerciseName: string,
  fallbackTargetMuscles?: string,
  fallbackInstructions?: string
): DetailedExerciseInfo {
  const normName = exerciseName.toLowerCase().trim();

  // Try finding exact or fuzzy match in scraped database
  const entry = (scrapedExercises as any[]).find((e: any) => {
    if (!e?.name) return false;
    const itemNorm = e.name.toLowerCase().trim();
    if (itemNorm === normName) return true;
    if (normName.includes(itemNorm) || itemNorm.includes(normName)) return true;
    // Strip common modifiers
    const stripped1 = normName.replace(/\b(barbell|dumbbell|db|cable|machine|seated|standing|incline|decline)\b/g, '').trim();
    const stripped2 = itemNorm.replace(/\b(barbell|dumbbell|db|cable|machine|seated|standing|incline|decline)\b/g, '').trim();
    return stripped1.length > 3 && (stripped2.includes(stripped1) || stripped1.includes(stripped2));
  });

  // Resolve YouTube ID
  let youtubeId: string | null = null;
  for (const [key, id] of Object.entries(CURATED_YOUTUBE_IDS)) {
    if (normName.includes(key) || key.includes(normName)) {
      youtubeId = id;
      break;
    }
  }
  if (!youtubeId && entry?.youtube_id) {
    youtubeId = entry.youtube_id;
  }

  const youtubeThumbnail = youtubeId
    ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
    : entry?.youtube_thumbnail || null;

  const youtubeUrl = youtubeId
    ? `https://www.youtube.com/watch?v=${youtubeId}`
    : `https://www.youtube.com/results?search_query=how+to+do+${encodeURIComponent(exerciseName)}+exercise`;

  // Resolve primary and secondary muscles
  let primaryMuscles: string[] = [];
  let secondaryMuscles: string[] = [];

  if (Array.isArray(entry?.primary_muscles) && entry.primary_muscles.length > 0) {
    primaryMuscles = entry.primary_muscles;
  } else if (fallbackTargetMuscles) {
    primaryMuscles = fallbackTargetMuscles.split(',').map((s) => s.trim()).filter(Boolean);
  } else {
    primaryMuscles = ['Target Muscle Group'];
  }

  if (Array.isArray(entry?.secondary_muscles) && entry.secondary_muscles.length > 0) {
    secondaryMuscles = entry.secondary_muscles;
  } else {
    // Deduce common secondary stabilizers
    if (normName.includes('press') || normName.includes('bench')) {
      secondaryMuscles = ['Triceps Brachii', 'Anterior Deltoids'];
    } else if (normName.includes('pull') || normName.includes('row')) {
      secondaryMuscles = ['Biceps Brachii', 'Rear Deltoids', 'Forearms'];
    } else if (normName.includes('squat') || normName.includes('leg')) {
      secondaryMuscles = ['Gluteus Maximus', 'Hamstrings', 'Core'];
    }
  }

  // Resolve steps
  let steps: ExerciseStep[] = [];
  if (Array.isArray(entry?.steps) && entry.steps.length > 0) {
    steps = entry.steps;
  } else if (fallbackInstructions) {
    const rawSteps = fallbackInstructions.split(/\.\s+/).filter((s) => s.trim().length > 5);
    if (rawSteps.length > 1) {
      steps = rawSteps.map((text, idx) => ({
        step: idx + 1,
        name: idx === 0 ? 'Setup' : idx === rawSteps.length - 1 ? 'Finish & Control' : 'Execution',
        text: text.trim().endsWith('.') ? text.trim() : `${text.trim()}.`,
      }));
    } else {
      steps = [
        {
          step: 1,
          name: 'Setup',
          text: 'Set up with solid biomechanical positioning and brace your core.',
        },
        {
          step: 2,
          name: 'Execution',
          text: fallbackInstructions,
        },
        {
          step: 3,
          name: 'Control & Return',
          text: 'Maintain controlled eccentric tempo through full range of motion.',
        },
      ];
    }
  } else {
    steps = [
      {
        step: 1,
        name: 'Set up',
        text: 'Align your posture, stabilize your feet flat on the ground, and establish your grip.',
      },
      {
        step: 2,
        name: 'Perform movement',
        text: 'Initiate the movement with the target muscle group through a full, controlled range of motion.',
      },
      {
        step: 3,
        name: 'Finish with control',
        text: 'Control the eccentric lowering phase for 2-3 seconds without bouncing or losing tension.',
      },
    ];
  }

  // Resolve instructions string
  const instructions =
    entry?.instructions ||
    fallbackInstructions ||
    steps.map((s) => `${s.step}. ${s.name ? `${s.name}: ` : ''}${s.text}`).join('\n');

  // Resolve common mistakes
  let commonMistakes: string[] = [];
  if (Array.isArray(entry?.common_mistakes) && entry.common_mistakes.length > 0) {
    commonMistakes = entry.common_mistakes;
  } else {
    if (normName.includes('press') || normName.includes('bench')) {
      commonMistakes = [
        'Flaring elbows out past 90 degrees, stressing the shoulder joint',
        'Bouncing the weight off the chest without controlling the eccentric phase',
        'Lifting hips and glutes off the bench to compensate for heavy load',
      ];
    } else if (normName.includes('pulldown') || normName.includes('pull')) {
      commonMistakes = [
        'Leaning excessively backward and turning the vertical pull into a momentum row',
        'Pulling the bar behind the neck, causing neck and rotator cuff strain',
        'Shrugging shoulders upward instead of actively depressing shoulder blades',
      ];
    } else if (normName.includes('squat')) {
      commonMistakes = [
        'Allowing knees to cave inward (valgus collapse) during the drive upward',
        'Lifting heels off the ground and shifting center of mass onto toes',
        'Rounding the lower lumbar spine at the bottom of the descent',
      ];
    } else {
      commonMistakes = [
        'Rushing the eccentric lowering phase and sacrificing muscle tension',
        'Using excessive body momentum or swinging to move the load',
        'Cutting range of motion short at peak contraction or stretch',
      ];
    }
  }

  // Resolve coaching cues
  let coachingCues: string[] = [];
  if (Array.isArray(entry?.coaching_cues) && entry.coaching_cues.length > 0) {
    coachingCues = entry.coaching_cues;
  } else {
    coachingCues = [
      'Lock in core intra-abdominal pressure before initiating each repetition',
      'Focus your mind-muscle connection directly on the contracting target muscle',
      'Pause for a crisp split-second at full peak contraction',
    ];
  }

  // Standard breathing tips
  const breathingTips = [
    'Inhale deeply into your belly and brace your core during the eccentric (lowering) phase.',
    'Exhale forcefully through pursed lips during the concentric (push or pull) effort.',
    'Never hold your breath under maximum exertion; maintain rhythmic control.',
  ];

  // Construct Muscle Heatmap Data:
  // Primary target gets 1.0 (bright peak volt lime + glow)
  // Secondary target gets 0.5 (moderate volt lime)
  const heatmapData: MuscleHeatmapData = {};

  for (const p of primaryMuscles) {
    const keys = mapMuscleNameToHeatmapKey(p);
    for (const k of keys) {
      heatmapData[k] = 1.0;
    }
  }

  for (const s of secondaryMuscles) {
    const keys = mapMuscleNameToHeatmapKey(s);
    for (const k of keys) {
      if (!heatmapData[k]) {
        heatmapData[k] = 0.5;
      }
    }
  }

  // If heatmap is empty, deduce from exercise name
  if (Object.keys(heatmapData).length === 0) {
    const deduced = mapMuscleNameToHeatmapKey(normName);
    for (const k of deduced) {
      heatmapData[k] = 1.0;
    }
  }

  return {
    name: entry?.name || exerciseName,
    category: entry?.category || 'Hypertrophy',
    difficulty: entry?.difficulty || 'Intermediate',
    equipment: entry?.equipment || 'Standard',
    youtubeId,
    youtubeThumbnail,
    youtubeUrl,
    instructions,
    steps,
    primaryMuscles,
    secondaryMuscles,
    coachingCues,
    commonMistakes,
    breathingTips,
    heatmapData,
  };
}
