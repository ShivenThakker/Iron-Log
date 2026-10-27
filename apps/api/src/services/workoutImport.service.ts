import * as XLSX from 'xlsx';
import { prisma } from '../lib/prisma';
import { checkAndCreatePR } from './prDetection';
import { gamificationRepository } from '../repositories/gamification.repository';
import { sessionRepository } from '../repositories/session.repository';

export interface ParsedSet {
  set_number: number;
  weight_kg: number;
  reps: number;
  duration_seconds?: number;
  rpe?: number;
  set_type?: string;
}

export interface ParsedSessionExercise {
  name: string;
  muscle?: string;
  sets: ParsedSet[];
  notes?: string;
}

export interface ParsedWorkoutSession {
  date: Date;
  workout_name?: string;
  notes?: string;
  duration_minutes?: number;
  exercises: ParsedSessionExercise[];
}

export interface ImportResult {
  success: boolean;
  message: string;
  sessions_created: number;
  sets_created: number;
  prs_created: number;
  xp_awarded: number;
  date_range?: {
    start: string;
    end: string;
  };
}

export const EXERCISE_METADATA: Record<string, { name: string; muscle: string; equipment: string }> = {
  'Bench Press': { name: 'Bench Press', muscle: 'Chest', equipment: 'Barbell' },
  'Dumbell Press': { name: 'Dumbbell Chest Press', muscle: 'Chest', equipment: 'Dumbbell' },
  'Dumbbell Press': { name: 'Dumbbell Chest Press', muscle: 'Chest', equipment: 'Dumbbell' },
  'Incline Bench Press': { name: 'Incline Bench Press', muscle: 'Chest', equipment: 'Barbell' },
  'Incline Press Machine': { name: 'Incline Chest Press Machine', muscle: 'Chest', equipment: 'Machine' },
  'Pec Deck': { name: 'Pec Deck Fly', muscle: 'Chest', equipment: 'Machine' },
  'Decline Press Machine': { name: 'Decline Press Machine', muscle: 'Chest', equipment: 'Machine' },
  'Lower Chest Cable Fly': { name: 'Lower Chest Cable Fly', muscle: 'Chest', equipment: 'Cable' },
  'Cable Overhead Extension': { name: 'Cable Overhead Tricep Extension', muscle: 'Triceps', equipment: 'Cable' },
  'Cable Tricep Pushdown': { name: 'Cable Tricep Pushdown', muscle: 'Triceps', equipment: 'Cable' },
  'Assisted Tricep Dips': { name: 'Assisted Tricep Dips', muscle: 'Triceps', equipment: 'Machine' },
  Kickback: { name: 'Tricep Kickback', muscle: 'Triceps', equipment: 'Cable' },
  'Tricep Kickback': { name: 'Tricep Kickback', muscle: 'Triceps', equipment: 'Cable' },
  'Dumbell Overhead Extension': { name: 'Dumbbell Overhead Tricep Extension', muscle: 'Triceps', equipment: 'Dumbbell' },
  'Dumbbell Overhead Extension': { name: 'Dumbbell Overhead Tricep Extension', muscle: 'Triceps', equipment: 'Dumbbell' },
  'Flat Bench Crunches': { name: 'Flat Bench Crunches', muscle: 'Core', equipment: 'Bodyweight' },
  'Cable Crunches': { name: 'Cable Crunches', muscle: 'Core', equipment: 'Cable' },
  'Dumbell Wrist Curls': { name: 'Dumbbell Wrist Curls', muscle: 'Forearms', equipment: 'Dumbbell' },
  'Dumbbell Wrist Curls': { name: 'Dumbbell Wrist Curls', muscle: 'Forearms', equipment: 'Dumbbell' },
  'Dumbell Reverse Wrist Curls': { name: 'Dumbbell Reverse Wrist Curls', muscle: 'Forearms', equipment: 'Dumbbell' },
  'Dumbbell Reverse Wrist Curls': { name: 'Dumbbell Reverse Wrist Curls', muscle: 'Forearms', equipment: 'Dumbbell' },
  'Dumbell Overhead Press': { name: 'Dumbbell Overhead Press', muscle: 'Shoulders', equipment: 'Dumbbell' },
  'Dumbbell Overhead Press': { name: 'Dumbbell Overhead Press', muscle: 'Shoulders', equipment: 'Dumbbell' },
  'Cable Lateral Raises': { name: 'Cable Lateral Raises', muscle: 'Shoulders', equipment: 'Cable' },
  'Dumbell Lateral Raises': { name: 'Dumbbell Lateral Raises', muscle: 'Shoulders', equipment: 'Dumbbell' },
  'Dumbbell Lateral Raises': { name: 'Dumbbell Lateral Raises', muscle: 'Shoulders', equipment: 'Dumbbell' },
  'Pec Deck Reverse Fly': { name: 'Pec Deck Reverse Fly', muscle: 'Shoulders', equipment: 'Machine' },
  'Dumbell Shrugs': { name: 'Dumbbell Shrugs', muscle: 'Shoulders', equipment: 'Dumbbell' },
  'Dumbbell Shrugs': { name: 'Dumbbell Shrugs', muscle: 'Shoulders', equipment: 'Dumbbell' },
  'Bulgarian Split Squats': { name: 'Bulgarian Split Squats', muscle: 'Legs', equipment: 'Bodyweight' },
  'Glute Bridge': { name: 'Glute Bridge', muscle: 'Legs', equipment: 'Bodyweight' },
  'Hip Abductions': { name: 'Hip Abductions', muscle: 'Legs', equipment: 'Machine' },
  'Hip Adductors': { name: 'Hip Adductors', muscle: 'Legs', equipment: 'Machine' },
  'Romanian Dead Lifts': { name: 'Romanian Deadlifts', muscle: 'Legs', equipment: 'Barbell' },
  'Romanian Deadlifts': { name: 'Romanian Deadlifts', muscle: 'Legs', equipment: 'Barbell' },
  'Standing Calf Raises': { name: 'Standing Calf Raises', muscle: 'Legs', equipment: 'Bodyweight' },
  'Walking Lunges': { name: 'Walking Lunges', muscle: 'Legs', equipment: 'Dumbbell' },
  'Barbell Squats': { name: 'Barbell Squats', muscle: 'Legs', equipment: 'Barbell' },
  'Leg Press': { name: 'Leg Press', muscle: 'Legs', equipment: 'Machine' },
  'Leg Extension': { name: 'Leg Extension', muscle: 'Legs', equipment: 'Machine' },
  'Leg Curl': { name: 'Leg Curl Machine', muscle: 'Legs', equipment: 'Machine' },
  'Leg Curl Machine': { name: 'Leg Curl Machine', muscle: 'Legs', equipment: 'Machine' },
  'Machine Squats': { name: 'Machine Squats', muscle: 'Legs', equipment: 'Machine' },
  'Assisted Pull Ups': { name: 'Assisted Pull Ups', muscle: 'Back', equipment: 'Machine' },
  'Lat Pulldown': { name: 'Lat Pulldown', muscle: 'Back', equipment: 'Cable' },
  'Seated Cable Row': { name: 'Seated Cable Row', muscle: 'Back', equipment: 'Cable' },
  'Barbell Row': { name: 'Barbell Row', muscle: 'Back', equipment: 'Barbell' },
  'T Bar Row': { name: 'T Bar Row', muscle: 'Back', equipment: 'Machine' },
  'Chest Supported Row': { name: 'Chest Supported Row', muscle: 'Back', equipment: 'Machine' },
  'Dead Hang': { name: 'Dead Hang', muscle: 'Back', equipment: 'Bodyweight' },
  'Dumbell Bicep Curl': { name: 'Dumbbell Bicep Curl', muscle: 'Biceps', equipment: 'Dumbbell' },
  'Dumbbell Bicep Curl': { name: 'Dumbbell Bicep Curl', muscle: 'Biceps', equipment: 'Dumbbell' },
  'Dumbell Hammer Curl': { name: 'Hammer Curl', muscle: 'Biceps', equipment: 'Dumbbell' },
  'Hammer Curl': { name: 'Hammer Curl', muscle: 'Biceps', equipment: 'Dumbbell' },
  'Bayesian Curl': { name: 'Bayesian Curl', muscle: 'Biceps', equipment: 'Cable' },
  'Barbell Curl': { name: 'Barbell Curl', muscle: 'Biceps', equipment: 'Barbell' },
  'Rever Barbell Curl': { name: 'Reverse Barbell Curl', muscle: 'Biceps', equipment: 'Barbell' },
  'Reverse Barbell Curl': { name: 'Reverse Barbell Curl', muscle: 'Biceps', equipment: 'Barbell' },
  'Preqcher Curl': { name: 'Preacher Curl', muscle: 'Biceps', equipment: 'Machine' },
  'Preacher Curl': { name: 'Preacher Curl', muscle: 'Biceps', equipment: 'Machine' },
  'Incline curl': { name: 'Incline Dumbbell Curl', muscle: 'Biceps', equipment: 'Dumbbell' },
  'Incline Dumbbell Curl': { name: 'Incline Dumbbell Curl', muscle: 'Biceps', equipment: 'Dumbbell' },
  'Concentration Curl': { name: 'Concentration Curl', muscle: 'Biceps', equipment: 'Dumbbell' },
};

export function parseSetString(rawStr: string): { sets: ParsedSet[]; notes: string } {
  const sets: ParsedSet[] = [];
  let notes = '';

  if (!rawStr || typeof rawStr !== 'string') {
    return { sets, notes };
  }

  const clean = rawStr.trim();
  if (!clean) return { sets, notes };

  // Dead Hang format e.g. 17s and 5s
  if (/^\s*(\d+)s\s*and\s*(\d+)s/i.test(clean)) {
    const m = clean.match(/(\d+)s/g);
    m?.forEach((sVal, idx) => {
      const sec = parseInt(sVal, 10);
      sets.push({ set_number: idx + 1, weight_kg: 0, reps: 1, duration_seconds: sec, rpe: 10, set_type: 'normal' });
    });
    return { sets, notes: '' };
  }

  // Handle 'round of 20' e.g. 10 and 7.5 round of 20
  const roundMatch = clean.match(/([\d.]+)\s*and\s*([\d.]+)\s*round\s*of\s*(\d+)/i);
  if (roundMatch) {
    const reps = parseInt(roundMatch[3], 10);
    sets.push({ weight_kg: parseFloat(roundMatch[1]), reps, rpe: 10, set_number: 1, set_type: 'normal' });
    sets.push({ weight_kg: parseFloat(roundMatch[2]), reps, rpe: 10, set_number: 2, set_type: 'normal' });
    return { sets, notes: 'round of 20' };
  }

  // Split by ' and ', ' & ', ' && ', ';', or newline
  const parts = clean.split(/\s*(?:&&|&|\band\b|;|\r?\n)\s*/i);

  for (let part of parts) {
    part = part.trim();
    if (!part) continue;

    const parenMatch = part.match(/\(([^)]+)\)/);
    if (parenMatch) {
      notes += (notes ? '; ' : '') + parenMatch[1];
      part = part.replace(/\([^)]+\)/, '').trim();
    }

    // Pattern 1: [weight]kg? - [reps]reps? - [flag] [extra]
    let m = part.match(/^([\d.]+)\s*(?:kg)?\s*[-–xX*]\s*([\d.]+)\s*(?:reps?)?\s*[-–]?\s*(NF|PF|F)?\s*(.*)$/i);
    if (m) {
      const weight = parseFloat(m[1]);
      const reps = parseInt(m[2], 10);
      const flag = (m[3] || '').toUpperCase();
      const extra = (m[4] || '').trim();
      if (extra) notes += (notes ? '; ' : '') + extra;
      const rpe = flag === 'F' ? 10 : flag === 'PF' ? 9.5 : flag === 'NF' ? 8 : 9;
      const setType = flag === 'F' ? 'failure' : 'normal';
      sets.push({ weight_kg: weight, reps, rpe, set_type: setType, set_number: sets.length + 1 });
      continue;
    }

    // Pattern 2: [weight] - [reps] [extra]
    m = part.match(/^([\d.]+)\s*[-–xX*]\s*([\d.]+)\s*(.*)$/);
    if (m) {
      const weight = parseFloat(m[1]);
      const reps = parseInt(m[2], 10);
      const extra = (m[3] || '').trim();
      if (extra) notes += (notes ? '; ' : '') + extra;
      sets.push({ weight_kg: weight, reps, rpe: 9, set_type: 'normal', set_number: sets.length + 1 });
      continue;
    }

    // Pattern 3: Fallback search for numbers [num1] - [num2]
    const numMatch = part.match(/([\d.]+)\s*[-–xX*]\s*([\d.]+)/);
    if (numMatch) {
      sets.push({
        weight_kg: parseFloat(numMatch[1]),
        reps: parseInt(numMatch[2], 10),
        rpe: 9,
        set_type: 'normal',
        set_number: sets.length + 1,
      });
      notes += (notes ? '; ' : '') + part;
    } else {
      // Lone weight e.g. "10 -"
      const loneWeight = part.match(/^([\d.]+)\s*[-–]?$/);
      if (loneWeight) {
        sets.push({ weight_kg: parseFloat(loneWeight[1]), reps: 10, rpe: 9, set_type: 'normal', set_number: sets.length + 1 });
      } else {
        notes += (notes ? '; ' : '') + part;
      }
    }
  }

  sets.forEach((s, i) => (s.set_number = i + 1));
  return { sets, notes };
}

export function parseDateValue(val: any): Date {
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  if (typeof val === 'number') {
    // Excel date serial number (days since 1899-12-30)
    return new Date(Math.round((val - 25569) * 86400 * 1000));
  }
  const str = String(val || '').trim();
  if (!str) return new Date();

  // Try direct ISO / RFC parse
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d;

  // DD/MM/YYYY or DD-MM-YYYY
  const parts = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (parts) {
    const day = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10) - 1;
    let year = parseInt(parts[3], 10);
    if (year < 100) year += 2000;
    return new Date(year, month, day, 12, 0, 0);
  }

  // YYYY-MM-DD
  const isoParts = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (isoParts) {
    const year = parseInt(isoParts[1], 10);
    const month = parseInt(isoParts[2], 10) - 1;
    const day = parseInt(isoParts[3], 10);
    return new Date(year, month, day, 12, 0, 0);
  }

  return new Date();
}

export class WorkoutImportService {
  /**
   * Main entry point to import a spreadsheet (CSV or Excel)
   */
  async importSpreadsheet(userId: string, input: { filename: string; fileData: string }): Promise<ImportResult> {
    const { filename, fileData } = input;
    if (!fileData) {
      throw new Error('File data is empty');
    }

    let buffer: Buffer;
    if (fileData.startsWith('data:')) {
      const base64Data = fileData.split(',')[1];
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      // Check if valid base64
      const isBase64Pattern = /^[A-Za-z0-9+/=]+$/.test(fileData.trim().replace(/\r?\n/g, ''));
      if (isBase64Pattern && fileData.length % 4 === 0 && !fileData.includes(',')) {
        buffer = Buffer.from(fileData, 'base64');
      } else {
        buffer = Buffer.from(fileData, 'utf-8');
      }
    }

    // Read with SheetJS (supports .xlsx, .xls, .csv)
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    } catch {
      // Fallback read as string
      workbook = XLSX.read(fileData, { type: 'string', cellDates: true });
    }

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('No sheets found in spreadsheet');
    }

    // Extract all rows from first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
      blankrows: false,
      raw: false,
      dateNF: 'yyyy-mm-dd',
    });

    if (!rawRows || rawRows.length < 2) {
      throw new Error('Spreadsheet has insufficient data or rows');
    }

    // Detect format: Tabular vs Matrix
    const isTabular = this.isTabularFormat(rawRows);
    let parsedSessions: ParsedWorkoutSession[] = [];

    if (isTabular) {
      parsedSessions = this.parseTabularRows(rawRows);
    } else {
      parsedSessions = this.parseMatrixRows(rawRows);
    }

    if (parsedSessions.length === 0) {
      throw new Error('No workout sessions could be detected from the spreadsheet');
    }

    // Save parsed sessions to database
    return await this.saveSessions(userId, parsedSessions);
  }

  private isTabularFormat(rows: any[][]): boolean {
    const headerRow = (rows[0] || []).map((c: any) => String(c).toLowerCase().trim());
    const row1 = (rows[1] || []).map((c: any) => String(c).toLowerCase().trim());

    const hasHeader = (arr: string[], key: string) => arr.some((col) => col.includes(key));

    const checkArr = (arr: string[]) =>
      (hasHeader(arr, 'date') || hasHeader(arr, 'time') || hasHeader(arr, 'day')) &&
      (hasHeader(arr, 'exercise') || hasHeader(arr, 'workout') || hasHeader(arr, 'movement')) &&
      (hasHeader(arr, 'weight') || hasHeader(arr, 'rep') || hasHeader(arr, 'set'));

    return checkArr(headerRow) || checkArr(row1);
  }

  private parseTabularRows(rows: any[][]): ParsedWorkoutSession[] {
    // Find header index
    let headerIdx = 0;
    const headerRow = rows[0].map((c: any) => String(c).toLowerCase().trim());
    if (!headerRow.some((c) => c.includes('date') || c.includes('exercise'))) {
      if (rows[1] && rows[1].map((c: any) => String(c).toLowerCase().trim()).some((c) => c.includes('date'))) {
        headerIdx = 1;
      }
    }

    const headers = rows[headerIdx].map((c: any) => String(c).toLowerCase().trim());
    const dateCol = headers.findIndex((h) => h.includes('date') || h.includes('day'));
    const exerciseCol = headers.findIndex((h) => h.includes('exercise') || h.includes('movement') || h.includes('lift'));
    const weightCol = headers.findIndex((h) => h.includes('weight') || h.includes('kg') || h.includes('lbs'));
    const repsCol = headers.findIndex((h) => h.includes('rep'));
    const setCol = headers.findIndex((h) => h.includes('set') && !h.includes('reps'));
    const rpeCol = headers.findIndex((h) => h.includes('rpe'));
    const notesCol = headers.findIndex((h) => h.includes('note') || h.includes('comment'));
    const workoutCol = headers.findIndex((h) => h.includes('workout') || h.includes('routine') || h.includes('program'));

    // Group rows by Date
    const sessionMap = new Map<string, ParsedWorkoutSession>();

    for (let r = headerIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      const rawDate = dateCol >= 0 ? row[dateCol] : null;
      const rawExercise = exerciseCol >= 0 ? String(row[exerciseCol]).trim() : '';
      if (!rawExercise) continue;

      const dateObj = rawDate ? parseDateValue(rawDate) : new Date();
      const dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

      const rawWeight = weightCol >= 0 ? parseFloat(String(row[weightCol]).replace(/[^\d.]/g, '')) : 0;
      const rawReps = repsCol >= 0 ? parseInt(String(row[repsCol]).replace(/[^\d]/g, ''), 10) : 0;
      const rawRpe = rpeCol >= 0 ? parseFloat(String(row[rpeCol])) : undefined;
      const rawNotes = notesCol >= 0 ? String(row[notesCol] || '').trim() : undefined;
      const workoutName = workoutCol >= 0 ? String(row[workoutCol] || '').trim() : undefined;

      if (!sessionMap.has(dateKey)) {
        sessionMap.set(dateKey, {
          date: dateObj,
          workout_name: workoutName || 'Imported Workout',
          duration_minutes: 45,
          exercises: [],
        });
      }

      const session = sessionMap.get(dateKey)!;
      let ex = session.exercises.find((e) => e.name.toLowerCase() === rawExercise.toLowerCase());
      if (!ex) {
        ex = {
          name: rawExercise,
          sets: [],
          notes: rawNotes,
        };
        session.exercises.push(ex);
      }

      const setNum = setCol >= 0 && parseInt(String(row[setCol]), 10)
        ? parseInt(String(row[setCol]), 10)
        : ex.sets.length + 1;

      ex.sets.push({
        set_number: setNum,
        weight_kg: isNaN(rawWeight) ? 0 : rawWeight,
        reps: isNaN(rawReps) ? 10 : rawReps,
        rpe: isNaN(rawRpe ?? NaN) ? 9 : rawRpe,
        set_type: 'normal',
      });
    }

    return Array.from(sessionMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private parseMatrixRows(rows: any[][]): ParsedWorkoutSession[] {
    const muscleGroups = ['CHEST', 'TRICEPS', 'CORE', 'FOREARMS', 'SHOULDERS', 'LEGS', 'BACK', 'BICEPS', 'CARDIO', 'FULL BODY'];
    let currentMuscle = 'Full Body';
    const parsedExercises: { rawName: string; muscle: string; cells: string[] }[] = [];

    // Header row usually at row 1 or row 0
    let headerRowIdx = 0;
    if (rows[1] && rows[1].some((c: any) => String(c).toLowerCase().includes('week') || /\d{1,2}[/-]\d{1,2}/.test(String(c)))) {
      headerRowIdx = 1;
    }

    const headerRow = rows[headerRowIdx];
    const colCount = headerRow.length;

    // Parse column dates
    const columnDates: Date[] = [];
    const baseDate = new Date(2026, 1, 16); // Fallback: Feb 16, 2026

    for (let c = 1; c < colCount; c++) {
      const headerVal = String(headerRow[c] || '').trim();
      if (!headerVal) {
        columnDates.push(new Date(baseDate.getTime() + (c - 1) * 7 * 24 * 60 * 60 * 1000));
        continue;
      }

      // Check if headerVal is date
      const possibleDate = parseDateValue(headerVal);
      if (!isNaN(possibleDate.getTime()) && possibleDate.getFullYear() > 2020) {
        columnDates.push(possibleDate);
      } else {
        // Week N format -> 7-day increments
        const weekMatch = headerVal.match(/week\s*(\d+)/i);
        const weekNum = weekMatch ? parseInt(weekMatch[1], 10) - 1 : c - 1;
        columnDates.push(new Date(baseDate.getTime() + weekNum * 7 * 24 * 60 * 60 * 1000));
      }
    }

    for (let r = headerRowIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      const name = String(row[0] || '').trim();
      if (!name) continue;

      if (muscleGroups.includes(name.toUpperCase())) {
        currentMuscle = name.toUpperCase();
        continue;
      }

      parsedExercises.push({
        rawName: name,
        muscle: currentMuscle,
        cells: row.slice(1).map((val: any) => String(val || '').trim()),
      });
    }

    // Build sessions by week / date
    const sessionList: ParsedWorkoutSession[] = [];

    for (let w = 0; w < columnDates.length; w++) {
      const monday = columnDates[w];
      const wednesday = new Date(monday.getTime() + 2 * 24 * 60 * 60 * 1000);
      const friday = new Date(monday.getTime() + 4 * 24 * 60 * 60 * 1000);

      const weekPush = parsedExercises.filter(
        (e) => ['CHEST', 'TRICEPS', 'SHOULDERS'].includes(e.muscle) && e.cells[w]
      );
      const weekPull = parsedExercises.filter(
        (e) => ['BACK', 'BICEPS', 'FOREARMS'].includes(e.muscle) && e.cells[w]
      );
      const weekLegs = parsedExercises.filter(
        (e) => ['LEGS', 'CORE'].includes(e.muscle) && e.cells[w]
      );

      // Push session (Monday)
      if (weekPush.length > 0) {
        sessionList.push({
          date: monday,
          workout_name: 'Push Workout (Chest & Shoulders)',
          duration_minutes: 50,
          exercises: weekPush.map((e) => {
            const { sets, notes } = parseSetString(e.cells[w]);
            return {
              name: e.rawName,
              muscle: e.muscle,
              sets,
              notes,
            };
          }).filter((e) => e.sets.length > 0),
        });
      }

      // Pull session (Wednesday)
      if (weekPull.length > 0) {
        sessionList.push({
          date: wednesday,
          workout_name: 'Pull Workout (Back & Biceps)',
          duration_minutes: 50,
          exercises: weekPull.map((e) => {
            const { sets, notes } = parseSetString(e.cells[w]);
            return {
              name: e.rawName,
              muscle: e.muscle,
              sets,
              notes,
            };
          }).filter((e) => e.sets.length > 0),
        });
      }

      // Legs session (Friday)
      if (weekLegs.length > 0) {
        sessionList.push({
          date: friday,
          workout_name: 'Legs & Core Workout',
          duration_minutes: 50,
          exercises: weekLegs.map((e) => {
            const { sets, notes } = parseSetString(e.cells[w]);
            return {
              name: e.rawName,
              muscle: e.muscle,
              sets,
              notes,
            };
          }).filter((e) => e.sets.length > 0),
        });
      }
    }

    return sessionList.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private async resolveExercise(userId: string, rawName: string, fallbackMuscle?: string): Promise<string> {
    const trimmed = rawName.trim();

    // Check alias / metadata dictionary
    const meta = EXERCISE_METADATA[trimmed];
    const canonicalName = meta?.name || trimmed;
    const muscle = meta?.muscle || fallbackMuscle || 'Full Body';
    const equipment = meta?.equipment || 'Other';

    // 1. Find by canonical name or raw name
    let ex = await prisma.exercise.findFirst({
      where: {
        OR: [
          { name: { equals: canonicalName, mode: 'insensitive' } },
          { name: { equals: trimmed, mode: 'insensitive' } },
          { name: canonicalName },
          { name: trimmed },
        ],
      },
    });

    if (ex) return ex.id;

    // 2. Create custom exercise
    const created = await prisma.exercise.create({
      data: {
        name: canonicalName,
        primary_muscle: muscle,
        equipment: equipment,
        exercise_type: 'reps',
        is_custom: true,
        created_by_user_id: userId,
      },
    });

    return created.id;
  }

  private async saveSessions(userId: string, sessions: ParsedWorkoutSession[]): Promise<ImportResult> {
    let sessionsCreated = 0;
    let setsCreated = 0;
    let prsCreated = 0;
    let totalXp = 0;

    const startDate = sessions[0]?.date ? sessions[0].date.toISOString().split('T')[0] : '';
    const endDate = sessions[sessions.length - 1]?.date
      ? sessions[sessions.length - 1].date.toISOString().split('T')[0]
      : '';

    // Exercise cache to avoid repeated lookups
    const exerciseCache = new Map<string, string>();

    for (const s of sessions) {
      if (!s.exercises || s.exercises.length === 0) continue;

      const durationSeconds = (s.duration_minutes || 45) * 60;
      const finishedAt = new Date(s.date.getTime() + durationSeconds * 1000);

      const dbSession = await prisma.workoutSession.create({
        data: {
          user_id: userId,
          started_at: s.date,
          finished_at: finishedAt,
          session_date: s.date,
          duration_seconds: durationSeconds,
          notes: s.workout_name || s.notes || 'Imported Workout',
        },
      });

      sessionsCreated++;
      totalXp += 50; // 50 XP per session

      for (const ex of s.exercises) {
        if (!ex.sets || ex.sets.length === 0) continue;

        let exId = exerciseCache.get(ex.name);
        if (!exId) {
          exId = await this.resolveExercise(userId, ex.name, ex.muscle);
          exerciseCache.set(ex.name, exId);
        }

        for (const set of ex.sets) {
          const setType = set.set_type || 'normal';
          const weight = set.weight_kg ?? 0;
          const reps = set.reps ?? 0;

          await prisma.exerciseSet.create({
            data: {
              session_id: dbSession.id,
              exercise_id: exId,
              set_number: set.set_number,
              set_type: setType,
              weight_kg: weight,
              reps: reps,
              duration_seconds: set.duration_seconds,
              rpe: set.rpe || 9,
              logged_at: s.date,
            },
          });

          setsCreated++;

          if (setType !== 'warmup' && weight > 0 && reps > 0) {
            const pr = await checkAndCreatePR(userId, exId, weight, reps, dbSession.id, s.date);
            if (pr.isNewPR) {
              prsCreated++;
              // Note: checkAndCreatePR already awards 25 XP for the PR in pr.repository.ts
            }
          }
        }
      }
    }

    if (totalXp > 0) {
      // Cap historical import session XP to prevent leaderboard distortion
      const cappedXp = Math.min(totalXp, 200);
      await gamificationRepository.awardXp(userId, cappedXp, 'Historical Workout Import');
    }

    await gamificationRepository.checkAndUnlockTrophies(userId);

    // Update streak if the last session was today or yesterday
    const lastSessionDate = sessions[sessions.length - 1]?.date;
    if (lastSessionDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkDate = new Date(lastSessionDate);
      checkDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round((today.getTime() - checkDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays >= 0 && diffDays <= 1) {
        await sessionRepository.updateUserStreak(userId);
      }
    }

    return {
      success: true,
      message: `Successfully imported ${sessionsCreated} workout sessions with ${setsCreated} sets and ${prsCreated} personal records!`,
      sessions_created: sessionsCreated,
      sets_created: setsCreated,
      prs_created: prsCreated,
      xp_awarded: totalXp,
      date_range: {
        start: startDate,
        end: endDate,
      },
    };
  }
}

export const workoutImportService = new WorkoutImportService();
