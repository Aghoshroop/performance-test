'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AthleteProfile, calculateAge } from '@/types/athlete';
import { TestDefinition, FitnessCategory, FITNESS_CATEGORIES_INFO } from '@/types/fitness';
import { Assessment, TestResultEntry } from '@/types/assessment';
import { evaluateTestBenchmark } from '@/lib/scoring/benchmark-engine';
import { calculateFitnessScores } from '@/lib/scoring/fitness-scoring';
import { db } from '@/lib/storage/local-storage-db';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  CheckCircle2,
  Save,
  Layers,
  Search,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Users,
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trophy,
  X,
  UserMinus,
} from 'lucide-react';

export interface PresetBatch {
  id: string;
  name: string;
  shortLabel: string;
  icon: string;
  testIds: string[];
  description: string;
}

export const PRESET_BATCHES: PresetBatch[] = [
  {
    id: 'sprints-velocity',
    name: 'Olympic Sprint & Acceleration',
    shortLabel: '⚡ Sprint Trials',
    icon: '⚡',
    testIds: ['test-sprint-10m', 'test-sprint-30m', 'test-flying-10m-max-vel', 'test-cmj'],
    description: '10m acceleration, 30m sprint, flying 10m max velocity, and countermovement jump',
  },
  {
    id: 'distance-aerobic',
    name: 'Distance & VO2max Trials',
    shortLabel: '🏃 Distance Trials',
    icon: '🏃',
    testIds: ['test-cooper-12min', 'test-lactate-tolerance-6x400', 'test-yoyo-ir2', 'test-shuttle-20m'],
    description: '12-min Cooper run, 6x400m lactate tolerance, Yo-Yo IR2, and 20m shuttle beep test',
  },
  {
    id: 'jumps-power',
    name: 'Jumps & Explosive Power',
    shortLabel: '🚀 Jumps & Power',
    icon: '🚀',
    testIds: ['test-reactive-strength-index', 'test-bomst-overhead-medball', 'test-cmj', 'test-slj'],
    description: 'RSI drop jump, backwards medball throw, CMJ, and standing long jump',
  },
  {
    id: 'agility-speed',
    name: 'Agility & Coordination',
    shortLabel: '🔄 Agility & Speed',
    icon: '🔄',
    testIds: ['test-t-test', 'test-illinois-agility', 'test-sprint-10m', 'test-plate-tapping'],
    description: 'T-test agility, Illinois agility run, 10m acceleration, and neuromuscular plate tapping',
  },
  {
    id: 'strength-capacity',
    name: 'Strength & Muscular Capacity',
    shortLabel: '🏋️ Strength & Capacity',
    icon: '🏋️',
    testIds: ['test-relative-back-squat-1rm', 'test-handgrip', 'test-pushups-60s', 'test-bomst-overhead-medball'],
    description: 'Relative back squat 1RM, handgrip dynamometry, 60s push-ups, and overhead medball throw',
  },
  {
    id: 'mobility-stability',
    name: 'Mobility & Joint Screening',
    shortLabel: '🤸 Mobility & Screening',
    icon: '🤸',
    testIds: ['test-ankle-dorsiflexion', 'test-sit-and-reach', 'test-shoulder-mobility', 'test-y-balance'],
    description: 'Ankle dorsiflexion lunge, sit & reach, shoulder mobility reach, and Y-balance stability',
  },
  {
    id: 'multi-events',
    name: 'Decathlon / Multi-Events Profile',
    shortLabel: '🏆 Multi-Events (Dec/Hep)',
    icon: '🏆',
    testIds: ['test-sprint-10m', 'test-sprint-30m', 'test-cmj', 'test-slj', 'test-bomst-overhead-medball', 'test-cooper-12min'],
    description: 'Sprint, vertical & horizontal jumps, throw power, and aerobic capacity',
  },
  {
    id: 'standard-combine',
    name: 'Standard Athletics Combine',
    shortLabel: '📋 Standard Combine',
    icon: '📋',
    testIds: ['test-sprint-10m', 'test-sprint-30m', 'test-cmj', 'test-slj', 'test-handgrip', 'test-sit-and-reach', 'test-cooper-12min'],
    description: 'Speed, power, strength, flexibility, and aerobic capacity combine',
  },
  {
    id: 'olympic-battery',
    name: 'Full Olympic Testing Battery',
    shortLabel: '🏅 Full Olympic Battery',
    icon: '🏅',
    testIds: ['test-sprint-10m', 'test-sprint-30m', 'test-flying-10m-max-vel', 'test-cmj', 'test-slj', 'test-reactive-strength-index', 'test-yoyo-ir2', 'test-handgrip'],
    description: 'Comprehensive 8-event Olympic high-performance physical battery',
  },
];

interface SquadBatchTestingMatrixProps {
  athletes: AthleteProfile[];
  onSaveBatchAssessments: (assessments: Assessment[]) => void;
  onOpenCombinedReport?: () => void;
  onSwitchToIndividual?: (athleteId?: string) => void;
}

export function SquadBatchTestingMatrix({
  athletes,
  onSaveBatchAssessments,
  onOpenCombinedReport,
  onSwitchToIndividual,
}: SquadBatchTestingMatrixProps) {
  const [testingDate, setTestingDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [testDefinitions, setTestDefinitions] = useState<TestDefinition[]>([]);
  
  // Default selected trial events: Olympic Sprint & Acceleration preset
  const [activePresetId, setActivePresetId] = useState<string>('sprints-velocity');
  const [selectedTestIds, setSelectedTestIds] = useState<Set<string>>(
    new Set(PRESET_BATCHES[0].testIds)
  );

  // Matrix results: matrixValues[athleteId][testId] = string
  const [matrixValues, setMatrixValues] = useState<Record<string, Record<string, string>>>({});
  const [athleteComments, setAthleteComments] = useState<Record<string, string>>({});
  const [selectedSquad, setSelectedSquad] = useState<string>('all');
  const [searchAthlete, setSearchAthlete] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);

  // Excluded athletes who are not giving the trial in this session
  const [excludedAthleteIds, setExcludedAthleteIds] = useState<Set<string>>(new Set());
  const [athleteToExclude, setAthleteToExclude] = useState<AthleteProfile | null>(null);

  // Load test definitions and initialize matrix values from latest assessments
  useEffect(() => {
    const tDefs = db.getTestDefinitions();
    setTestDefinitions(tDefs);

    // Pre-populate matrix with latest values from existing assessments
    const initialMatrix: Record<string, Record<string, string>> = {};
    for (const ath of athletes) {
      initialMatrix[ath.id] = {};
      const latestAss = db.getAssessmentsForAthlete(ath.id)[0];
      if (latestAss && latestAss.testResults) {
        for (const tr of latestAss.testResults) {
          if (!tr.isMissing && tr.finalRawValue !== undefined) {
            initialMatrix[ath.id][tr.testId] = String(tr.finalRawValue);
          }
        }
      }
    }
    setMatrixValues(initialMatrix);
  }, [athletes]);

  // Squads list
  const squads = useMemo(() => {
    const set = new Set<string>();
    athletes.forEach((a) => {
      if (a.trainingSquad) set.add(a.trainingSquad);
    });
    return Array.from(set);
  }, [athletes]);

  // Filtered athletes (excluding any athletes not taking the trial)
  const filteredAthletes = useMemo(() => {
    return athletes.filter((a) => {
      if (excludedAthleteIds.has(a.id)) return false;
      const matchSquad = selectedSquad === 'all' || a.trainingSquad === selectedSquad;
      const matchSearch =
        a.fullName.toLowerCase().includes(searchAthlete.toLowerCase()) ||
        a.athleteCode.toLowerCase().includes(searchAthlete.toLowerCase()) ||
        a.primaryEventName.toLowerCase().includes(searchAthlete.toLowerCase());
      return matchSquad && matchSearch;
    });
  }, [athletes, selectedSquad, searchAthlete, excludedAthleteIds]);

  // Selected test objects in order
  const selectedTests = useMemo(() => {
    return Array.from(selectedTestIds)
      .map((id) => testDefinitions.find((t) => t.id === id))
      .filter((t): t is TestDefinition => Boolean(t));
  }, [selectedTestIds, testDefinitions]);

  // Active preset batch definition helper
  const activePreset = useMemo(() => {
    return PRESET_BATCHES.find((p) => p.id === activePresetId);
  }, [activePresetId]);

  // Handle cell value change
  const handleCellChange = (athleteId: string, testId: string, val: string) => {
    setMatrixValues((prev) => ({
      ...prev,
      [athleteId]: {
        ...(prev[athleteId] || {}),
        [testId]: val,
      },
    }));
  };

  // Remove test column
  const handleRemoveTestColumn = (testId: string) => {
    setSelectedTestIds((prev) => {
      const next = new Set(prev);
      next.delete(testId);
      return next;
    });
    setActivePresetId('');
  };

  // Preset loaders
  const handleApplyPreset = (preset: PresetBatch) => {
    setSelectedTestIds(new Set(preset.testIds));
    setActivePresetId(preset.id);
    setNotification({ type: 'success', message: `Loaded ${preset.name} (${preset.testIds.length} events)` });
  };

  // Evaluate cell performance
  const evaluateCell = (athlete: AthleteProfile, test: TestDefinition, rawValStr?: string) => {
    if (!rawValStr || rawValStr.trim() === '') return null;
    const val = parseFloat(rawValStr);
    if (isNaN(val) || val <= 0) return null;

    const normDataset = db.getNormDatasetForTest(test.code);
    const age = calculateAge(athlete.dateOfBirth, testingDate);
    const evalRes = evaluateTestBenchmark(val, normDataset, age, athlete.sex);

    return {
      rawValue: val,
      percentile: evalRes.percentile,
      rating: evalRes.rating,
      status: evalRes.status,
      sourceCitation: evalRes.sourceCitation,
      sourceId: evalRes.benchmarkSourceId,
    };
  };

  // Build assessment record for an athlete
  const buildAssessmentForAthlete = (
    athlete: AthleteProfile,
    status: 'draft' | 'finalized'
  ): Assessment => {
    const athleteVals = matrixValues[athlete.id] || {};
    const age = calculateAge(athlete.dateOfBirth, testingDate);

    const testResults: TestResultEntry[] = selectedTests.map((t) => {
      const rawStr = athleteVals[t.id];
      const cellEval = evaluateCell(athlete, t, rawStr);

      return {
        testId: t.id,
        testCode: t.code,
        testName: t.name,
        category: t.category,
        unit: t.unit,
        measurementDirection: t.measurementDirection,
        attempts: cellEval ? [cellEval.rawValue] : [],
        isBilateral: false,
        finalRawValue: cellEval ? cellEval.rawValue : undefined,
        benchmarkStatus: cellEval?.status ?? 'none',
        benchmarkSourceId: cellEval?.sourceId,
        benchmarkSourceTitle: cellEval?.sourceCitation,
        percentile: cellEval?.percentile,
        rating: cellEval?.rating,
        isMissing: !cellEval,
        isExcludedFromOverall: cellEval?.status === 'none',
        coachNotes: '',
      };
    });

    const scoringConfig = db.getScoringConfig();
    const fitnessScores = calculateFitnessScores(testResults, scoringConfig);

    return {
      id: `ass-${athlete.id}-${testingDate}-${Date.now().toString().slice(-4)}`,
      organizationId: athlete.organizationId,
      athleteId: athlete.id,
      athleteCode: athlete.athleteCode,
      athleteName: athlete.fullName,
      athleteAge: age,
      sex: athlete.sex,
      eventGroup: athlete.eventGroup,
      primaryEvent: athlete.primaryEventName,
      batteryId: 'battery-squad-matrix-session',
      batteryName: `Squad Trial Session (${selectedTests.length} Events)`,
      coachId: 'coach-rudra-roy',
      coachName: 'Coach Rudra Roy',
      assessmentDate: testingDate,
      status,
      testResults,
      categoryScores: fitnessScores.categoryScores,
      overallFitnessScore: fitnessScores.overallFitnessScore,
      overallRating: fitnessScores.overallRating,
      coveragePercentage: fitnessScores.coveragePercentage,
      meetsMinimumCoverage: fitnessScores.meetsMinimumCoverage,
      topStrengths: fitnessScores.topStrengths,
      areasToImprove: fitnessScores.areasToImprove,
      bilateralAsymmetries: [],
      revision: 1,
      scoringConfigVersion: scoringConfig.name,
      coachGeneralComments: athleteComments[athlete.id] || 'Squad batch trial protocol session.',
      finalizedAt: status === 'finalized' ? new Date().toISOString() : undefined,
      finalizedByCoachId: status === 'finalized' ? 'coach-rudra-roy' : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  // Save all as draft
  const handleSaveAllDrafts = () => {
    if (selectedTests.length === 0) {
      setNotification({ type: 'warning', message: 'Please select at least one event column.' });
      return;
    }

    const saved: Assessment[] = [];
    for (const ath of filteredAthletes) {
      const ass = buildAssessmentForAthlete(ath, 'draft');
      db.saveAssessment(ass);
      saved.push(ass);
    }
    onSaveBatchAssessments(saved);
    setNotification({
      type: 'warning',
      message: `Saved draft trial assessments for ${saved.length} squad athletes!`,
    });
  };

  // Finalize all assessments and open combined squad report
  const handleFinalizeAllAndOpenReport = () => {
    if (selectedTests.length === 0) {
      setNotification({ type: 'warning', message: 'Please select at least one event column.' });
      return;
    }

    const finalizedList: Assessment[] = [];
    for (const ath of filteredAthletes) {
      const ass = buildAssessmentForAthlete(ath, 'finalized');
      db.saveAssessment(ass);
      finalizedList.push(ass);
    }

    onSaveBatchAssessments(finalizedList);
    setNotification({
      type: 'success',
      message: `FINALIZED physical assessments for all ${finalizedList.length} athletes!`,
    });

    // Directly open the consolidated squad report dossier
    if (onOpenCombinedReport) {
      setTimeout(() => onOpenCombinedReport(), 400);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header Bar */}
      <div className="bg-slate-900 text-white p-5 border-b border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-white flex items-center justify-center font-black shadow-md shadow-red-950/40">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  Squad Batch Testing Matrix
                </h2>
                <span className="text-[10px] bg-red-950/40 text-rose-300 font-bold px-2 py-0.5 rounded border border-red-500/40">
                  Trackside Multi-Athlete Entry
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Enter trial results for all squad athletes together in one grid • Real-time norm calculation & composite reports
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {onOpenCombinedReport && (
              <button
                type="button"
                onClick={onOpenCombinedReport}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-black rounded-lg bg-slate-900 hover:bg-slate-800 text-rose-400 border border-slate-700 transition shadow-sm"
                title="View combined report for all athletes"
              >
                <Layers className="w-3.5 h-3.5" />
                All Reports Together
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveAllDrafts}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              Save All Drafts
            </button>
            <button
              type="button"
              onClick={handleFinalizeAllAndOpenReport}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white transition shadow-md shadow-red-950/50"
            >
              <CheckCircle2 className="w-4 h-4" />
              Finalize All & Show Combined Report
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Testing Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-rose-500" /> Trial Session Date
            </label>
            <input
              type="date"
              value={testingDate}
              onChange={(e) => setTestingDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-red-500"
            />
          </div>

          {/* Squad Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Users className="w-3 h-3 text-rose-500" /> Squad Filter
            </label>
            <select
              value={selectedSquad}
              onChange={(e) => setSelectedSquad(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-red-500"
            >
              <option value="all">
                All Squads ({athletes.length - excludedAthleteIds.size} Athletes{excludedAthleteIds.size > 0 ? ` • ${excludedAthleteIds.size} excluded` : ''})
              </option>
              {squads.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Athlete Search */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Search className="w-3 h-3 text-rose-500" /> Search Athletes
            </label>
            <input
              type="text"
              placeholder="Search by name, code or event..."
              value={searchAthlete}
              onChange={(e) => setSearchAthlete(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-red-500"
            />
          </div>

          {/* Excluded Athletes Indicator & Quick Restore */}
          {excludedAthleteIds.size > 0 && (
            <div className="sm:col-span-3 flex items-center justify-between p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/40 text-amber-300 text-xs font-medium">
              <div className="flex items-center gap-2">
                <UserMinus className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong className="text-white font-bold">{excludedAthleteIds.size}</strong> athlete{excludedAthleteIds.size > 1 ? 's' : ''} excluded from this trial session (not tested / absent).
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setExcludedAthleteIds(new Set());
                  setNotification({ type: 'success', message: 'Restored all excluded athletes to this trial matrix.' });
                }}
                className="text-[11px] font-bold text-amber-400 hover:text-white underline ml-3 shrink-0"
              >
                Restore all athletes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* PRESET TESTING BATCHES BAR */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 text-white shrink-0">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Preset Testing Batches:
              </span>
              <span className="px-2 py-0.2 rounded-full bg-red-600 text-white font-black text-[10px] shadow-xs">
                {selectedTests.length} Events In Active Batch
              </span>
            </div>
            {activePreset && (
              <span className="text-[11px] text-slate-400 truncate max-w-lg">
                Active Batch: <strong className="text-rose-400">{activePreset.name}</strong> • {activePreset.description}
              </span>
            )}
          </div>

          {/* Preset Batches Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {PRESET_BATCHES.map((preset) => {
              const isActive = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-md border transition shadow-xs ${
                    isActive
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 border-red-500 text-white ring-1 ring-red-400 shadow-red-950/50'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                  }`}
                  title={preset.description}
                >
                  <span>{preset.icon}</span>
                  <span>{preset.shortLabel}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-red-950/60 text-white' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {preset.testIds.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-2 text-xs font-bold flex items-center justify-between shadow-md">
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-white hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {/* THE SPREADSHEET MATRIX TABLE */}
      <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
        <table className="w-full text-left border-collapse">
          {/* Header Row: Top Columns */}
          <thead className="bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider sticky top-0 z-20 shadow-xs border-b border-slate-200">
            <tr>
              {/* Athlete Column (Sticky Left) */}
              <th className="py-3 px-4 sticky left-0 z-30 bg-slate-100 min-w-[220px] border-r border-slate-200">
                Squad Athlete
              </th>

              {/* Event Columns */}
              {selectedTests.map((t) => {
                const catInfo = FITNESS_CATEGORIES_INFO[t.category];
                return (
                  <th key={t.id} className="py-2.5 px-3 min-w-[150px] border-r border-slate-200 bg-white">
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <div className="text-xs font-black text-slate-900 truncate" title={t.name}>
                          {t.name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 font-normal">
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.2 rounded uppercase"
                            style={{
                              color: catInfo?.color ?? '#eab308',
                              backgroundColor: `${catInfo?.color ?? '#eab308'}15`,
                              border: `1px solid ${catInfo?.color ?? '#eab308'}40`,
                            }}
                          >
                            {catInfo?.label ?? t.category}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 font-semibold bg-slate-100 px-1 rounded">
                            {t.unit}
                          </span>
                        </div>
                      </div>

                      {/* Remove column button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveTestColumn(t.id)}
                        className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition"
                        title="Remove event column"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </th>
                );
              })}

              {/* Summary Columns */}
              <th className="py-3 px-3 text-center min-w-[120px] bg-slate-100 border-r border-slate-200">
                Overall Score
              </th>
              <th className="py-3 px-3 text-center min-w-[100px] bg-slate-100">
                Actions
              </th>
            </tr>
          </thead>

          {/* Body Rows: Each Athlete */}
          <tbody className="divide-y divide-slate-200 text-xs bg-white">
            {filteredAthletes.map((ath, rowIndex) => {
              const athVals = matrixValues[ath.id] || {};
              const age = calculateAge(ath.dateOfBirth, testingDate);

              // Calculate row athlete fitness score live
              const rowTestResults: TestResultEntry[] = selectedTests.map((t) => {
                const cellEval = evaluateCell(ath, t, athVals[t.id]);
                return {
                  testId: t.id,
                  testCode: t.code,
                  testName: t.name,
                  category: t.category,
                  unit: t.unit,
                  measurementDirection: t.measurementDirection,
                  attempts: cellEval ? [cellEval.rawValue] : [],
                  isBilateral: false,
                  finalRawValue: cellEval ? cellEval.rawValue : undefined,
                  benchmarkStatus: cellEval?.status ?? 'none',
                  percentile: cellEval?.percentile,
                  rating: cellEval?.rating,
                  isMissing: !cellEval,
                  isExcludedFromOverall: cellEval?.status === 'none',
                };
              });

              const scoringConfig = db.getScoringConfig();
              const scoreCalc = calculateFitnessScores(rowTestResults, scoringConfig);
              const validCount = rowTestResults.filter((r) => !r.isMissing).length;

              return (
                <tr
                  key={ath.id}
                  className={`hover:bg-red-950/20 transition ${
                    rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                  }`}
                >
                  {/* Athlete Info (Sticky Left) */}
                  <td className="py-3 px-3.5 sticky left-0 z-10 bg-inherit border-r border-slate-200 font-medium">
                    <div className="flex items-center gap-2">
                      {/* Cross Button: on the LEFT SIDE of the athlete name */}
                      <button
                        type="button"
                        onClick={() => setAthleteToExclude(ath)}
                        className="w-5 h-5 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-600 transition border border-slate-300 hover:border-red-600 shrink-0 shadow-2xs group"
                        title={`Exclude ${ath.fullName} from this trial session`}
                      >
                        <X className="w-3.5 h-3.5 text-slate-400 group-hover:text-white stroke-[2.5]" />
                      </button>

                      {ath.photoUrl ? (
                        <img
                          src={ath.photoUrl}
                          alt={ath.fullName}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-rose-500 font-bold flex items-center justify-center text-xs shrink-0 ring-1 ring-red-500/30">
                          {ath.fullName.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{ath.fullName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {ath.athleteCode} • {ath.primaryEventName} ({age}y {ath.sex === 'male' ? 'M' : 'F'})
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Cell Inputs for Each Selected Event */}
                  {selectedTests.map((t) => {
                    const cellVal = athVals[t.id] || '';
                    const cellEval = evaluateCell(ath, t, cellVal);

                    return (
                      <td key={t.id} className="py-2 px-3 border-r border-slate-200 align-middle">
                        <div className="space-y-1">
                          <input
                            type="number"
                            step="0.01"
                            placeholder={`${t.unit}`}
                            value={cellVal}
                            onChange={(e) => handleCellChange(ath.id, t.id, e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500 text-center shadow-2xs"
                          />

                          {/* Live Benchmark Evaluation Pill */}
                          <div className="h-4 flex items-center justify-center">
                            {cellEval && cellEval.percentile !== undefined ? (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                                  cellEval.percentile >= 90
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : cellEval.percentile >= 75
                                    ? 'bg-teal-100 text-teal-800'
                                    : cellEval.percentile >= 50
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {cellEval.percentile.toFixed(0)}%ile • {cellEval.rating}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {t.measurementDirection === 'lower_is_better' ? '↓ lower' : '↑ higher'}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })}

                  {/* Athlete Overall Score Summary */}
                  <td className="py-3 px-3 text-center border-r border-slate-200 bg-slate-50/50">
                    {scoreCalc.overallFitnessScore !== undefined ? (
                      <div>
                        <div className="text-base font-black text-slate-900">
                          {scoreCalc.overallFitnessScore.toFixed(1)}
                        </div>
                        <Badge variant="red" size="sm">
                          {scoreCalc.overallRating}
                        </Badge>
                      </div>
                    ) : (
                      <div>
                        <span className="text-[11px] text-slate-400 font-mono italic">
                          {validCount}/{selectedTests.length} tested
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Individual Actions */}
                  <td className="py-3 px-3 text-center">
                    {onSwitchToIndividual && (
                      <button
                        type="button"
                        onClick={() => onSwitchToIndividual(ath.id)}
                        className="text-[11px] text-rose-600 hover:text-rose-700 font-bold underline"
                        title="Open individual testing view for detailed bilateral/attempt breakdown"
                      >
                        Single View
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Summary & Hero Finalize Button */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-white">
        <div className="text-slate-400">
          Showing <span className="font-bold text-white">{filteredAthletes.length}</span> athletes across{' '}
          <span className="font-bold text-white">{selectedTests.length}</span> trial events. Data auto-validates against peer-reviewed normative models.
        </div>

        <div className="flex items-center gap-2">
          {onOpenCombinedReport && (
            <button
              type="button"
              onClick={onOpenCombinedReport}
              className="inline-flex items-center gap-1.5 px-3 py-2 font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <FileText className="w-3.5 h-3.5" />
              Preview Dossier
            </button>
          )}
          <button
            type="button"
            onClick={handleFinalizeAllAndOpenReport}
            className="inline-flex items-center gap-1.5 px-4 py-2 font-black rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-md shadow-red-950/50 transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            Finalize All & Show Combined Report
          </button>
        </div>
      </div>
      {/* Coach Confirmation Modal to Exclude Athlete from Trial Session */}
      {athleteToExclude && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-slate-900 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <UserMinus className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-base text-slate-900">
                  Exclude Athlete from Trial?
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Are you sure you want to remove <strong className="text-slate-900">{athleteToExclude.fullName}</strong> ({athleteToExclude.athleteCode}) from this trial session?
                </p>
                <div className="mt-2.5 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                  <strong>Coach Note:</strong> This removes the athlete from this squad testing matrix session. They will not be marked as failing and will be omitted from the batch trial assessments and combined report.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAthleteToExclude(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetAth = athleteToExclude;
                  setExcludedAthleteIds((prev) => new Set(prev).add(targetAth.id));
                  setAthleteToExclude(null);
                  setNotification({
                    type: 'warning',
                    message: `${targetAth.fullName} has been removed from this trial session.`,
                  });
                }}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-950/20 transition"
              >
                Confirm &amp; Exclude
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
