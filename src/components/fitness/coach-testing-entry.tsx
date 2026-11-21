'use client';

import React, { useState, useEffect } from 'react';
import { AthleteProfile, calculateAge } from '@/types/athlete';
import { FitnessCategory, FITNESS_CATEGORIES_INFO, TestDefinition, TestingBattery } from '@/types/fitness';
import { Assessment, TestResultEntry } from '@/types/assessment';
import { evaluateTestBenchmark } from '@/lib/scoring/benchmark-engine';
import { calculateFitnessScores } from '@/lib/scoring/fitness-scoring';
import { calculateBilateralAsymmetry } from '@/lib/scoring/bilateral';
import { db } from '@/lib/storage/local-storage-db';
import { Badge } from '@/components/ui/badge';
import { PRESET_BATCHES, PresetBatch } from '@/components/fitness/squad-batch-testing-matrix';
import {
  Activity,
  CheckCircle2,
  Save,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  FileText,
  Trash2,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

interface CoachTestingEntryProps {
  athletes: AthleteProfile[];
  initialAthleteId?: string;
  onSaveAssessment: (assessment: Assessment) => void;
  onClose?: () => void;
  onOpenReport?: (assessment: Assessment) => void;
}

interface TestEntryState {
  test: TestDefinition;
  attempts: string[];
  isBilateral: boolean;
  leftAttempts: string[];
  rightAttempts: string[];
  coachNotes: string;
}

export function CoachTestingEntry({
  athletes,
  initialAthleteId,
  onSaveAssessment,
  onClose,
  onOpenReport,
}: CoachTestingEntryProps) {
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(
    initialAthleteId || athletes[0]?.id || ''
  );
  const [testingDate, setTestingDate] = useState<string>('2024-10-15');
  const [batteries, setBatteries] = useState<TestingBattery[]>([]);
  const [selectedBatteryId, setSelectedBatteryId] = useState<string>('battery-sprints-velocity');
  const [testDefinitions, setTestDefinitions] = useState<TestDefinition[]>([]);
  
  // Active preset batch and selected tests
  const [activePresetId, setActivePresetId] = useState<string>('sprints-velocity');
  const [selectedTestIds, setSelectedTestIds] = useState<Set<string>>(
    new Set(PRESET_BATCHES[0].testIds)
  );
  const [testEntries, setTestEntries] = useState<Record<string, TestEntryState>>({});

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    speed: true,
    acceleration: true,
    explosive_power: true,
    strength: true,
    agility: true,
    flexibility: true,
    mobility: true,
    coordination: true,
    endurance: true,
    balance: true,
  });
  const [coachGeneralComments, setCoachGeneralComments] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);

  // Load batteries, test definitions, and initialize default preset batch
  useEffect(() => {
    setTestingDate(new Date().toISOString().split('T')[0]);
    const bList = db.getTestingBatteries();
    setBatteries(bList);
    const tDefs = db.getTestDefinitions();
    setTestDefinitions(tDefs);

    const defaultPreset = PRESET_BATCHES[0];
    setActivePresetId(defaultPreset.id);
    setSelectedBatteryId(`battery-${defaultPreset.id}`);
    setSelectedTestIds(new Set(defaultPreset.testIds));

    const initialEntries: Record<string, TestEntryState> = {};
    for (const testId of defaultPreset.testIds) {
      const t = tDefs.find((def) => def.id === testId);
      if (t) {
        initialEntries[t.id] = {
          test: t,
          attempts: Array(t.permittedAttempts).fill(''),
          isBilateral: t.isBilateral,
          leftAttempts: t.isBilateral ? Array(t.permittedAttempts).fill('') : [],
          rightAttempts: t.isBilateral ? Array(t.permittedAttempts).fill('') : [],
          coachNotes: '',
        };
      }
    }
    setTestEntries(initialEntries);
  }, []);

  const selectedAthlete = athletes.find((a) => a.id === selectedAthleteId);
  const athleteAge = selectedAthlete ? calculateAge(selectedAthlete.dateOfBirth, testingDate) : 20;

  // Toggle category collapse in the testing form
  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Helper to ensure testEntry exists
  const ensureEntryExists = (testId: string, currentEntries: Record<string, TestEntryState>): TestEntryState => {
    if (currentEntries[testId]) return currentEntries[testId];
    const t = testDefinitions.find((def) => def.id === testId);
    if (!t) {
      throw new Error(`Test definition not found: ${testId}`);
    }
    return {
      test: t,
      attempts: Array(t.permittedAttempts).fill(''),
      isBilateral: t.isBilateral,
      leftAttempts: t.isBilateral ? Array(t.permittedAttempts).fill('') : [],
      rightAttempts: t.isBilateral ? Array(t.permittedAttempts).fill('') : [],
      coachNotes: '',
    };
  };

  // Active preset helper
  const activePreset = PRESET_BATCHES.find((p) => p.id === activePresetId);

  // Apply a preset testing batch
  const handleApplyPreset = (preset: PresetBatch) => {
    setActivePresetId(preset.id);
    setSelectedBatteryId(`battery-${preset.id}`);
    const nextIds = new Set(preset.testIds);
    setSelectedTestIds(nextIds);

    setTestEntries((prevEntries) => {
      const updated = { ...prevEntries };
      for (const testId of preset.testIds) {
        if (!updated[testId]) {
          const t = testDefinitions.find((def) => def.id === testId);
          if (t) {
            updated[t.id] = {
              test: t,
              attempts: Array(t.permittedAttempts).fill(''),
              isBilateral: t.isBilateral,
              leftAttempts: t.isBilateral ? Array(t.permittedAttempts).fill('') : [],
              rightAttempts: t.isBilateral ? Array(t.permittedAttempts).fill('') : [],
              coachNotes: '',
            };
          }
        }
      }
      return updated;
    });

    setNotification({
      type: 'success',
      message: `Loaded ${preset.name} (${preset.testIds.length} tests).`,
    });
  };

  // Remove test directly from form card
  const handleRemoveTest = (testId: string) => {
    setSelectedTestIds((prev) => {
      const next = new Set(prev);
      next.delete(testId);
      return next;
    });
    setActivePresetId('');
  };

  // Update single attempt
  const handleAttemptChange = (testId: string, index: number, value: string) => {
    setTestEntries((prev) => {
      const entry = prev[testId];
      if (!entry) return prev;
      const newAttempts = [...entry.attempts];
      newAttempts[index] = value;
      return { ...prev, [testId]: { ...entry, attempts: newAttempts } };
    });
  };

  // Update bilateral attempt
  const handleBilateralChange = (
    testId: string,
    side: 'left' | 'right',
    index: number,
    value: string
  ) => {
    setTestEntries((prev) => {
      const entry = prev[testId];
      if (!entry) return prev;
      if (side === 'left') {
        const newLeft = [...entry.leftAttempts];
        newLeft[index] = value;
        return { ...prev, [testId]: { ...entry, leftAttempts: newLeft } };
      } else {
        const newRight = [...entry.rightAttempts];
        newRight[index] = value;
        return { ...prev, [testId]: { ...entry, rightAttempts: newRight } };
      }
    });
  };

  // Aggregate raw value for a test entry
  const computeRawValue = (entry: TestEntryState): number | undefined => {
    const { test } = entry;
    if (test.isBilateral) {
      const validLeft = entry.leftAttempts.map(Number).filter((v) => !isNaN(v) && v > 0);
      const validRight = entry.rightAttempts.map(Number).filter((v) => !isNaN(v) && v > 0);
      if (validLeft.length === 0 && validRight.length === 0) return undefined;
      const bestLeft = validLeft.length > 0 ? (test.measurementDirection === 'lower_is_better' ? Math.min(...validLeft) : Math.max(...validLeft)) : undefined;
      const bestRight = validRight.length > 0 ? (test.measurementDirection === 'lower_is_better' ? Math.min(...validRight) : Math.max(...validRight)) : undefined;
      if (bestLeft !== undefined && bestRight !== undefined) {
        return Math.round(((bestLeft + bestRight) / 2) * 100) / 100;
      }
      return bestRight ?? bestLeft;
    } else {
      const validAttempts = entry.attempts.map(Number).filter((v) => !isNaN(v) && v > 0);
      if (validAttempts.length === 0) return undefined;
      if (test.resultAggregation === 'best') {
        return test.measurementDirection === 'lower_is_better'
          ? Math.min(...validAttempts)
          : Math.max(...validAttempts);
      } else if (test.resultAggregation === 'average') {
        return Math.round((validAttempts.reduce((a, b) => a + b, 0) / validAttempts.length) * 100) / 100;
      }
      return validAttempts[0];
    }
  };

  // Compute live test results ONLY for currently selected tests
  const evaluatedResults: TestResultEntry[] = Array.from(selectedTestIds)
    .map((testId) => testEntries[testId])
    .filter((entry): entry is TestEntryState => Boolean(entry))
    .map((entry) => {
      const rawVal = computeRawValue(entry);
      const normDataset = db.getNormDatasetForTest(entry.test.code);

      const normEval = evaluateTestBenchmark(
        rawVal,
        normDataset,
        athleteAge,
        selectedAthlete?.sex ?? 'male'
      );

      let leftResult: number | undefined;
      let rightResult: number | undefined;
      let asymmetryPercent: number | undefined;
      let dominantSideAdvantage: 'left' | 'right' | 'symmetric' | undefined;

      if (entry.test.isBilateral) {
        const validLeft = entry.leftAttempts.map(Number).filter((v) => !isNaN(v) && v > 0);
        const validRight = entry.rightAttempts.map(Number).filter((v) => !isNaN(v) && v > 0);
        if (validLeft.length > 0 && validRight.length > 0) {
          leftResult = entry.test.measurementDirection === 'lower_is_better' ? Math.min(...validLeft) : Math.max(...validLeft);
          rightResult = entry.test.measurementDirection === 'lower_is_better' ? Math.min(...validRight) : Math.max(...validRight);
          const asym = calculateBilateralAsymmetry({
            testCode: entry.test.code,
            testName: entry.test.name,
            leftValue: leftResult,
            rightValue: rightResult,
            unit: entry.test.unit,
            higherIsBetter: entry.test.measurementDirection === 'higher_is_better',
          });
          asymmetryPercent = asym.relativeDeficitPercent;
          dominantSideAdvantage = asym.relativeDeficitPercent > 1 ? 'right' : asym.relativeDeficitPercent < -1 ? 'left' : 'symmetric';
        }
      }

      return {
        testId: entry.test.id,
        testCode: entry.test.code,
        testName: entry.test.name,
        category: entry.test.category,
        unit: entry.test.unit,
        measurementDirection: entry.test.measurementDirection,
        attempts: entry.attempts.map(Number).filter((v) => !isNaN(v)),
        isBilateral: entry.test.isBilateral,
        leftAttempts: entry.leftAttempts.map(Number).filter((v) => !isNaN(v)),
        rightAttempts: entry.rightAttempts.map(Number).filter((v) => !isNaN(v)),
        leftResult,
        rightResult,
        asymmetryPercent,
        dominantSideAdvantage,
        finalRawValue: rawVal,
        benchmarkStatus: normEval.status,
        benchmarkSourceId: normEval.benchmarkSourceId,
        benchmarkSourceTitle: normEval.sourceCitation,
        percentile: normEval.percentile,
        rating: normEval.rating,
        isMissing: rawVal === undefined,
        isExcludedFromOverall: normEval.status === 'none',
        coachNotes: entry.coachNotes,
        limitationNote: normEval.limitations,
      };
    });

  // Calculate overall category scores & score dynamically
  const scoringConfig = db.getScoringConfig();
  const fitnessScoreCalc = calculateFitnessScores(evaluatedResults, scoringConfig);

  // Group tests by category - ONLY categories that have at least one test selected!
  const categoriesPresent = Array.from(
    new Set(evaluatedResults.map((r) => r.category))
  ) as FitnessCategory[];

  // Build finalized Assessment object
  const buildAssessmentRecord = (status: 'draft' | 'validated' | 'finalized'): Assessment => {
    const batteryObj = batteries.find((b) => b.id === selectedBatteryId);
    const batteryName = activePreset
      ? activePreset.name
      : batteryObj
      ? batteryObj.name
      : `Testing Session (${selectedTestIds.size} Events)`;

    return {
      id: `ass-${selectedAthlete?.id}-${testingDate}-${Date.now().toString().slice(-4)}`,
      organizationId: selectedAthlete?.organizationId ?? 'org-nahpc',
      athleteId: selectedAthlete?.id ?? '',
      athleteCode: selectedAthlete?.athleteCode ?? '',
      athleteName: selectedAthlete?.fullName ?? '',
      athleteAge,
      sex: selectedAthlete?.sex ?? 'male',
      eventGroup: selectedAthlete?.eventGroup ?? 'sprints',
      primaryEvent: selectedAthlete?.primaryEventName ?? '100m',
      batteryId: activePreset ? `battery-${activePreset.id}` : selectedBatteryId || 'battery-custom-session',
      batteryName,
      coachId: 'coach-rudra-roy',
      coachName: 'Coach Rudra Roy',
      assessmentDate: testingDate,
      status,
      testResults: evaluatedResults,
      categoryScores: fitnessScoreCalc.categoryScores,
      overallFitnessScore: fitnessScoreCalc.overallFitnessScore,
      overallRating: fitnessScoreCalc.overallRating,
      coveragePercentage: fitnessScoreCalc.coveragePercentage,
      meetsMinimumCoverage: fitnessScoreCalc.meetsMinimumCoverage,
      topStrengths: fitnessScoreCalc.topStrengths,
      areasToImprove: fitnessScoreCalc.areasToImprove,
      bilateralAsymmetries: evaluatedResults
        .filter((r) => r.isBilateral && r.asymmetryPercent !== undefined)
        .map((r) => ({
          testName: r.testName,
          asymmetryPercent: r.asymmetryPercent!,
          description: `${Math.abs(r.asymmetryPercent!).toFixed(1)}% variance favoring ${r.dominantSideAdvantage} side.`,
        })),
      revision: 1,
      scoringConfigVersion: scoringConfig.name,
      coachGeneralComments,
      finalizedAt: status === 'finalized' ? new Date().toISOString() : undefined,
      finalizedByCoachId: status === 'finalized' ? 'coach-rudra-roy' : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleSaveDraft = () => {
    if (selectedTestIds.size === 0) {
      setNotification({ type: 'warning', message: 'Please select at least one event/test before saving.' });
      return;
    }
    const record = buildAssessmentRecord('draft');
    db.saveAssessment(record);
    onSaveAssessment(record);
    setNotification({ type: 'warning', message: 'Draft assessment saved successfully. Ready for further testing.' });
  };

  const handleFinalize = () => {
    if (selectedTestIds.size === 0) {
      setNotification({ type: 'error', message: 'Please select and record at least one event/test before finalizing.' });
      return;
    }
    const record = buildAssessmentRecord('finalized');
    db.saveAssessment(record);
    onSaveAssessment(record);
    setNotification({ type: 'success', message: 'Official Athletics Assessment FINALIZED! Score locked.' });
    if (onOpenReport) {
      setTimeout(() => onOpenReport(record), 800);
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col ${onClose ? 'h-full max-h-[90vh]' : ''}`}>
      {/* Top Header */}
      <div className="bg-slate-900 text-white px-5 py-3 border-b border-slate-800 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 text-white flex items-center justify-center font-black shadow-sm shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">
                  Physical Fitness Assessment Engine
                </h2>
                <span className="text-[9px] bg-red-500/20 text-rose-300 font-bold px-1.5 py-0.5 rounded border border-red-500/40">
                  Published Norm Calibrated
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Multi-attempt scoring • Published norm percentiles & composite calculation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSaveDraft}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <Save className="w-3.5 h-3.5" />
              Save Draft
            </button>
            <button
              onClick={handleFinalize}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-md shadow-red-950/40 transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Finalize Assessment
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Athlete & Date Header Row */}
        <div className="mt-2.5 pt-2.5 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Select Athlete */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
              Athlete Profile
            </label>
            <select
              value={selectedAthleteId}
              onChange={(e) => setSelectedAthleteId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-hidden focus:ring-1 focus:ring-red-500"
            >
              {athletes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.fullName} ({a.athleteCode}) - {a.primaryEventName}
                </option>
              ))}
            </select>
          </div>

          {/* Testing Date */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-rose-400" /> Testing Date (Age: {athleteAge}y)
            </label>
            <input
              type="date"
              value={testingDate}
              onChange={(e) => setTestingDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-red-500"
            />
          </div>
        </div>
      </div>

      {/* PRESET TESTING BATCHES DECK */}
      <div className="bg-slate-900 border-b border-slate-800 text-white px-5 py-2.5 shrink-0">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-rose-400" />
                Preset Testing Batches:
              </span>
              <span className="px-2 py-0.2 rounded-full bg-red-600 text-white font-black text-[10px] shadow-xs">
                {selectedTestIds.size} Events Active
              </span>
            </div>
            {activePreset && (
              <span className="text-[11px] text-slate-400 truncate max-w-lg">
                Protocol: <strong className="text-rose-400">{activePreset.name}</strong> • {activePreset.description}
              </span>
            )}
          </div>

          {/* Preset Buttons */}
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

      {/* Real-time Calculation Summary Bar */}
      <div className="bg-red-500/10 border-b border-red-500/20 px-5 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase">Overall Fitness Score</div>
            <div className="text-base font-black text-slate-900 flex items-center gap-2">
              {fitnessScoreCalc.overallFitnessScore !== undefined ? (
                <>
                  <span>{fitnessScoreCalc.overallFitnessScore.toFixed(1)}</span>
                  <Badge variant="yellow" size="sm">
                    {fitnessScoreCalc.overallRating}
                  </Badge>
                </>
              ) : (
                <span className="text-xs font-semibold text-red-700 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  Coverage {fitnessScoreCalc.coveragePercentage}% (Min {scoringConfig.minimumDataCoveragePercent}% req)
                </span>
              )}
            </div>
          </div>
          <div className="h-6 w-px bg-slate-200 hidden sm:block" />
          <div className="hidden sm:block">
            <div className="text-[10px] font-semibold text-slate-500 uppercase">Active Testing Protocol</div>
            <div className="text-xs font-bold text-slate-800">
              {selectedTestIds.size} event{selectedTestIds.size !== 1 ? 's' : ''} across {categoriesPresent.length} categor{categoriesPresent.length === 1 ? 'y' : 'ies'}
            </div>
          </div>
        </div>

        {notification && (
          <div className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-xs">
            {notification.message}
          </div>
        )}
      </div>

      {/* Main Testing Body */}
      <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
        {/* BLANK FORM EMPTY STATE */}
        {selectedTestIds.size === 0 ? (
          <div className="py-12 px-6 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/70">
            <div className="w-14 h-14 rounded-2xl bg-red-500/20 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Testing Sheet is Blank</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
              No physical events are selected. Choose one of the preset testing batches below to start recording trial marks:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {PRESET_BATCHES.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition shadow-sm"
                  title={preset.description}
                >
                  <span>{preset.icon}</span>
                  <span>{preset.shortLabel}</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded-full font-bold">
                    {preset.testIds.length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* AUTOMATICALLY CATEGORIZED SELECTED TESTS */
          categoriesPresent.map((category) => {
            const catInfo = FITNESS_CATEGORIES_INFO[category as FitnessCategory];
            const testsInCat = evaluatedResults.filter((r) => r.category === category);
            const isExpanded = expandedCategories[category] ?? true;
            const catScore = fitnessScoreCalc.categoryScores[category as FitnessCategory];

            return (
              <div
                key={category}
                className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 shadow-xs"
              >
                {/* Category Header */}
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className="w-full px-5 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between hover:bg-slate-50 transition text-left"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-8 rounded-full"
                      style={{ backgroundColor: catInfo?.color ?? '#eab308' }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{catInfo?.label}</h4>
                        <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                          — {catInfo?.description}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        <span className="font-semibold text-slate-800">{testsInCat.length} event{testsInCat.length > 1 ? 's' : ''}</span> selected in this category
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {catScore && catScore.validTestsCount > 0 ? (
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-900">
                          {catScore.categoryScorePercentile.toFixed(0)}th percentile
                        </span>
                        <div className="text-[10px] text-slate-500">{catScore.rating}</div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No valid test data</span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Tests in Category */}
                {isExpanded && (
                  <div className="divide-y divide-slate-200 p-2 sm:p-4 space-y-3">
                    {testsInCat.map((item) => {
                      const entry = testEntries[item.testId];
                      if (!entry) return null;

                      return (
                        <div
                          key={item.testId}
                          className="p-4 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            {/* Test Info */}
                            <div className="min-w-0 max-w-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900">{item.testName}</span>
                                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                  {item.unit}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTest(item.testId)}
                                  className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-0.5 ml-1 transition"
                                  title="Remove from session"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span className="hidden sm:inline">Remove</span>
                                </button>
                              </div>
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                {entry.test.protocol}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                {/* Benchmark Status */}
                                {item.benchmarkStatus === 'valid' && (
                                  <Badge variant="emerald" size="sm">
                                    Valid Benchmark: {item.benchmarkSourceTitle}
                                  </Badge>
                                )}
                                {item.benchmarkStatus === 'limited' && (
                                  <Badge variant="yellow" size="sm">
                                    Limited Norm Data
                                  </Badge>
                                )}
                                {item.benchmarkStatus === 'none' && (
                                  <Badge variant="gray" size="sm">
                                    No Validated Benchmark (Excluded from Score)
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Data Entry Fields */}
                            <div className="flex flex-wrap items-center gap-4">
                              {/* Bilateral Inputs */}
                              {entry.isBilateral ? (
                                <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200">
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                      Left Limb ({item.unit})
                                    </label>
                                    <div className="flex gap-1.5">
                                      {entry.leftAttempts.map((val, idx) => (
                                        <input
                                          key={idx}
                                          type="number"
                                          step="0.01"
                                          placeholder={`L${idx + 1}`}
                                          value={val}
                                          onChange={(e) =>
                                            handleBilateralChange(item.testId, 'left', idx, e.target.value)
                                          }
                                          className="w-16 px-2 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded text-center focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                                        />
                                      ))}
                                    </div>
                                  </div>
                                  <div className="h-8 w-px bg-slate-300" />
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                      Right Limb ({item.unit})
                                    </label>
                                    <div className="flex gap-1.5">
                                      {entry.rightAttempts.map((val, idx) => (
                                        <input
                                          key={idx}
                                          type="number"
                                          step="0.01"
                                          placeholder={`R${idx + 1}`}
                                          value={val}
                                          onChange={(e) =>
                                            handleBilateralChange(item.testId, 'right', idx, e.target.value)
                                          }
                                          className="w-16 px-2 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded text-center focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                                        />
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                /* Standard Multiple Attempts */
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                    Attempts ({entry.test.permittedAttempts} allowed) - {entry.test.resultAggregation.toUpperCase()}
                                  </label>
                                  <div className="flex gap-1.5">
                                    {entry.attempts.map((att, idx) => (
                                      <input
                                        key={idx}
                                        type="number"
                                        step="0.01"
                                        placeholder={`#${idx + 1}`}
                                        value={att}
                                        onChange={(e) =>
                                          handleAttemptChange(item.testId, idx, e.target.value)
                                        }
                                        className="w-20 px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded text-center focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Live Result Display */}
                              <div className="min-w-[130px] p-2 bg-slate-50 rounded-lg border border-slate-200 text-right">
                                <div className="text-[10px] text-slate-500 font-bold uppercase">
                                  Final Raw:
                                </div>
                                <div className="text-base font-black text-slate-900">
                                  {item.finalRawValue !== undefined ? `${item.finalRawValue} ${item.unit}` : '—'}
                                </div>
                                {item.percentile !== undefined && (
                                  <div className="text-xs font-bold text-red-600">
                                    {item.percentile.toFixed(1)}th %ile ({item.rating})
                                  </div>
                                )}
                                {item.asymmetryPercent !== undefined && (
                                  <div className="text-[10px] text-indigo-700 font-semibold mt-0.5">
                                    Asymmetry: {item.asymmetryPercent > 0 ? `+${item.asymmetryPercent}% (R)` : `${item.asymmetryPercent}% (L)`}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Coach Note field for this test */}
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Add specific testing notes, wind, or technique remarks..."
                              value={entry.coachNotes}
                              onChange={(e) =>
                                setTestEntries((prev) => ({
                                  ...prev,
                                  [item.testId]: { ...prev[item.testId], coachNotes: e.target.value },
                                }))
                              }
                              className="w-full text-xs px-2.5 py-1 text-slate-600 bg-transparent border-0 border-b border-dashed border-slate-200 focus:ring-0 focus:border-red-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Coach General Comments */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-rose-500" />
            General Coach Assessment Observations & Prescriptions
          </label>
          <textarea
            rows={3}
            placeholder="Document overall athlete condition, block cycle goals, readiness for upcoming competitions..."
            value={coachGeneralComments}
            onChange={(e) => setCoachGeneralComments(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden"
          />
        </div>
      </div>
    </div>
  );
}
