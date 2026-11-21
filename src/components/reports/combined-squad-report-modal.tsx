'use client';

import React, { useState, useMemo } from 'react';
import { Assessment } from '@/types/assessment';
import { AthleteProfile } from '@/types/athlete';
import { ReportPageOne } from './report-page-one';
import { ReportPageTwo } from './report-page-two';
import { Badge } from '@/components/ui/badge';
import { FITNESS_CATEGORIES_INFO, FitnessCategory } from '@/types/fitness';
import {
  Printer,
  X,
  FileText,
  Users,
  Trophy,
  Activity,
  Layers,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Zap,
  Filter,
} from 'lucide-react';

interface CombinedSquadReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  athletes: AthleteProfile[];
  assessments: Assessment[];
  onEnsureAllTests?: () => void;
}

export function CombinedSquadReportModal({
  isOpen,
  onClose,
  athletes,
  assessments,
  onEnsureAllTests,
}: CombinedSquadReportModalProps) {
  const [selectedSquad, setSelectedSquad] = useState<string>('all');

  // Pair each athlete with their latest and previous assessments
  const athleteReportPairs = useMemo(() => {
    return athletes.map((ath) => {
      const athleteAssessments = assessments
        .filter((a) => a.athleteId === ath.id)
        .sort((a, b) => new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime());

      return {
        athlete: ath,
        latestAssessment: athleteAssessments[0] as Assessment | undefined,
        previousAssessment: athleteAssessments[1] as Assessment | undefined,
      };
    });
  }, [athletes, assessments]);

  // Squad options for filter
  const squadOptions = useMemo(() => {
    const set = new Set(athletes.map((a) => a.trainingSquad).filter(Boolean));
    return Array.from(set);
  }, [athletes]);

  // Filtered pairs based on squad selector
  const filteredPairs = useMemo(() => {
    return athleteReportPairs.filter(({ athlete }) => {
      if (selectedSquad === 'all') return true;
      return athlete.trainingSquad === selectedSquad;
    });
  }, [athleteReportPairs, selectedSquad]);

  // Athletes with completed assessments
  const completedPairs = useMemo(() => {
    return filteredPairs.filter((p) => p.latestAssessment !== undefined);
  }, [filteredPairs]);

  const pendingAthletes = useMemo(() => {
    return filteredPairs.filter((p) => p.latestAssessment === undefined);
  }, [filteredPairs]);

  // Compute Squad Summary Metrics
  const squadStats = useMemo(() => {
    if (completedPairs.length === 0) {
      return {
        avgScore: 0,
        topAthlete: null,
        topScore: 0,
        categoryAverages: {} as Partial<Record<FitnessCategory, number>>,
      };
    }

    const scores = completedPairs
      .map((p) => p.latestAssessment?.overallFitnessScore)
      .filter((s): s is number => typeof s === 'number');

    const avgScore =
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : 0;

    const sortedByScore = [...completedPairs].sort(
      (a, b) =>
        (b.latestAssessment?.overallFitnessScore ?? 0) - (a.latestAssessment?.overallFitnessScore ?? 0)
    );

    const topAthlete = sortedByScore[0];
    const topScore = topAthlete?.latestAssessment?.overallFitnessScore ?? 0;

    // Calculate average for all 10 categories
    const categories: FitnessCategory[] = Object.keys(FITNESS_CATEGORIES_INFO) as FitnessCategory[];
    const categoryAverages: Partial<Record<FitnessCategory, number>> = {};

    for (const cat of categories) {
      const catScores = completedPairs
        .map((p) => p.latestAssessment?.categoryScores?.[cat]?.categoryScorePercentile)
        .filter((s): s is number => typeof s === 'number');

      if (catScores.length > 0) {
        categoryAverages[cat] =
          Math.round((catScores.reduce((a, b) => a + b, 0) / catScores.length) * 10) / 10;
      }
    }

    return { avgScore, topAthlete, topScore, categoryAverages };
  }, [completedPairs]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const scrollToAthlete = (athleteId: string) => {
    const el = document.getElementById(`athlete-dossier-${athleteId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToExecutiveSummary = () => {
    const el = document.getElementById('squad-executive-summary');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="printable-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print:p-0 print:m-0 print:static print:bg-white print:overflow-visible"
    >
      <div className="printable-modal-card bg-slate-100 rounded-2xl shadow-2xl max-w-6xl w-full border border-slate-300 overflow-hidden my-4 max-h-[94vh] flex flex-col print:max-w-none print:w-full print:m-0 print:border-none print:shadow-none print:rounded-none print:max-h-none print:overflow-visible print:bg-white">
        {/* Top Control Bar (Hidden when printing!) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 no-print shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-white font-black flex items-center justify-center text-sm shadow-md shadow-red-950/30 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  Consolidated Squad Performance Dossier
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-gradient-to-r from-red-600 to-rose-600 text-white">
                  All Athletes Together
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {completedPairs.length} of {filteredPairs.length} athletes tested • Instant unified dossier & batch A4 print
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Squad Filter Dropdown */}
            {squadOptions.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs">
                <Filter className="w-3.5 h-3.5 text-rose-400" />
                <select
                  value={selectedSquad}
                  onChange={(e) => setSelectedSquad(e.target.value)}
                  className="bg-transparent text-white font-semibold text-xs focus:outline-hidden cursor-pointer"
                >
                  <option value="all" className="bg-slate-900 text-white">
                    All Squads ({athleteReportPairs.length})
                  </option>
                  {squadOptions.map((sq) => (
                    <option key={sq} value={sq} className="bg-slate-900 text-white">
                      {sq}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* If any athlete has missing tests, provide 1-click test simulation */}
            {pendingAthletes.length > 0 && onEnsureAllTests && (
              <button
                onClick={onEnsureAllTests}
                title="Simulate / Complete tests for remaining athletes"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-red-500/20 text-rose-300 border border-red-500/40 hover:bg-red-600/30 rounded-lg transition"
              >
                <Zap className="w-3.5 h-3.5 text-rose-400" />
                Complete {pendingAthletes.length} Pending Tests
              </button>
            )}

            {/* Print Settings Helper Badge */}
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-rose-300 bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20">
              <span>💡 In print dialog: select <strong>Save as PDF</strong> & check <strong>Background graphics</strong></span>
            </div>

            {/* Print / Save Consolidated PDF Button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-black bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-md shadow-red-950/40 rounded-lg shadow-md transition transform active:scale-95"
            >
              <Printer className="w-4 h-4" />
              Print / Save All PDF
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Athlete Quick Jump Strip (no-print) */}
        <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center gap-2 overflow-x-auto no-print scrollbar-none text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-rose-400" /> Quick Jump:
          </span>

          <button
            onClick={scrollToExecutiveSummary}
            className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-700 text-white font-bold shrink-0 border border-slate-600 transition"
          >
            📋 Executive Summary
          </button>

          {completedPairs.map(({ athlete, latestAssessment }) => {
            const score = latestAssessment?.overallFitnessScore?.toFixed(1) ?? '—';
            return (
              <button
                key={athlete.id}
                onClick={() => scrollToAthlete(athlete.id)}
                className="px-2.5 py-1 rounded-md bg-slate-900/80 hover:bg-red-600 hover:text-white text-slate-200 font-medium shrink-0 border border-slate-700/80 transition flex items-center gap-1.5"
              >
                <span>{athlete.fullName}</span>
                <span className="font-mono text-[10px] font-bold px-1 rounded bg-red-500/20 text-rose-300 border border-red-500/30">
                  {score}
                </span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Document Container */}
        <div className="printable-scroll-body p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-200/80 space-y-10 print:p-0 print:m-0 print:space-y-0 print:bg-white print:overflow-visible print:block">
          {/* ============================================================ */}
          {/* COVER PAGE / SQUAD EXECUTIVE SUMMARY (PRINTABLE A4 SHEET) */}
          {/* ============================================================ */}
          <div
            id="squad-executive-summary"
            className="a4-page w-full max-w-[210mm] mx-auto bg-white p-6 sm:p-8 print:p-5 text-black border border-slate-300 shadow-xl print:shadow-none print:border-none print:m-0 page-break"
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b-2 border-slate-900">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-widest uppercase bg-gradient-to-r from-red-600 to-rose-600 text-white px-2.5 py-0.5 rounded">
                    SQUAD CONSOLIDATED DOSSIER
                  </span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    EXECUTIVE SUMMARY
                  </span>
                </div>
                <h1 className="text-2xl font-black text-slate-950 mt-1 tracking-tight">
                  SQUAD PHYSICAL FITNESS & PERFORMANCE ASSESSMENT
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  National Athletics High Performance Centre • Published Benchmark Reference Standard
                </p>
              </div>

              <div className="text-right bg-slate-900 text-white p-3 rounded-xl border border-red-500/50 min-w-[150px]">
                <div className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
                  Squad Average Index
                </div>
                <div className="text-3xl font-black text-white mt-0.5">
                  {squadStats.avgScore > 0 ? squadStats.avgScore.toFixed(1) : '—'}
                </div>
                <div className="text-[11px] font-bold text-rose-400 uppercase mt-0.5">
                  {completedPairs.length} Athletes Tested
                </div>
              </div>
            </div>

            {/* Squad Demographic & Overview Grid */}
            <div className="grid grid-cols-4 gap-3 my-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 font-medium block">Roster Evaluated</span>
                <span className="font-bold text-slate-950 text-sm">
                  {completedPairs.length} of {filteredPairs.length} Athletes
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Top Squad Performer</span>
                <span className="font-bold text-red-700 text-sm">
                  {squadStats.topAthlete?.athlete.fullName ?? '—'} ({squadStats.topScore.toFixed(1)})
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Norm References</span>
                <span className="font-bold text-slate-900">Eurofit & BJSM (DOI Verified)</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Supervising Coach</span>
                <span className="font-bold text-slate-900">Coach Rudra Roy</span>
              </div>
            </div>

            {/* Category Performance Matrix Across Squad */}
            <div className="my-5 p-4 rounded-xl border border-slate-200 bg-white">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-rose-500" />
                Squad Average Percentiles Across 10 Physical Dimensions
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                {(Object.keys(FITNESS_CATEGORIES_INFO) as FitnessCategory[]).map((cat) => {
                  const score = squadStats.categoryAverages[cat] ?? 0;
                  return (
                    <div
                      key={cat}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col justify-between"
                    >
                      <span className="text-[10px] font-bold text-slate-500 truncate">
                        {FITNESS_CATEGORIES_INFO[cat].label}
                      </span>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-base font-black text-slate-900">{score.toFixed(0)}</span>
                        <span className="text-[10px] font-bold text-red-600">%ile</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Squad Leaderboard / Summary Table */}
            <div className="my-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-2 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-rose-500" />
                Squad Roster Assessment Summary
              </h3>
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="p-2.5">Rank</th>
                    <th className="p-2.5">Athlete</th>
                    <th className="p-2.5">Event & Squad</th>
                    <th className="p-2.5 text-center">Fitness Score</th>
                    <th className="p-2.5 text-center">Rating</th>
                    <th className="p-2.5">Key Physical Strengths</th>
                    <th className="p-2.5 text-right no-print">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {completedPairs.map(({ athlete, latestAssessment }, idx) => {
                    const score = latestAssessment?.overallFitnessScore ?? 0;
                    return (
                      <tr key={athlete.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-500">{idx + 1}</td>
                        <td className="p-2.5">
                          <div className="font-bold text-slate-900">{athlete.fullName}</div>
                          <div className="font-mono text-[10px] text-slate-500">{athlete.athleteCode}</div>
                        </td>
                        <td className="p-2.5">
                          <div className="font-semibold text-slate-800">{athlete.primaryEventName}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                            {athlete.trainingSquad}
                          </div>
                        </td>
                        <td className="p-2.5 text-center font-mono font-black text-sm text-slate-900">
                          {score.toFixed(1)}
                        </td>
                        <td className="p-2.5 text-center">
                          <Badge
                            variant={
                              score >= 90
                                ? 'emerald'
                                : score >= 75
                                ? 'blue'
                                : score >= 50
                                ? 'yellow'
                                : 'red'
                            }
                            size="sm"
                          >
                            {latestAssessment?.overallRating?.toUpperCase() ?? 'TESTED'}
                          </Badge>
                        </td>
                        <td className="p-2.5 text-[11px] text-slate-600">
                          {latestAssessment?.topStrengths?.slice(0, 2).join(', ') ?? 'All dimensions tested'}
                        </td>
                        <td className="p-2.5 text-right no-print">
                          <button
                            onClick={() => scrollToAthlete(athlete.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 hover:text-red-900 hover:underline"
                          >
                            View Report <ChevronRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Sign-off Strip */}
            <div className="pt-4 mt-6 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <div>
                Compiled for High Performance Director & Coaching Staff • Verified calculation engine v1.0
              </div>
              <div className="font-mono font-bold text-slate-700">Page 1 of {completedPairs.length * 2 + 1}</div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* COMPLETE TWO-PAGE REPORT FOR EVERY ATHLETE SEQUENTIALLY */}
          {/* ============================================================ */}
          {completedPairs.map(({ athlete, latestAssessment, previousAssessment }, idx) => {
            if (!latestAssessment) return null;

            return (
              <div key={athlete.id} id={`athlete-dossier-${athlete.id}`} className="space-y-6 print:space-y-0 print:block">
                {/* Visual Separator for Screen Mode (no-print) */}
                <div className="no-print flex items-center justify-between bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white flex items-center justify-center font-black text-xs">
                      {idx + 1}
                    </span>
                    <span>
                      Athlete #{idx + 1}: {athlete.fullName} ({athlete.athleteCode})
                    </span>
                    <span className="text-slate-400">• {athlete.primaryEventName}</span>
                  </div>
                  <span className="text-rose-400 font-mono">
                    Score: {latestAssessment.overallFitnessScore?.toFixed(1) ?? '—'}
                  </span>
                </div>

                {/* PAGE 1: PHYSICAL PROFILE & RADAR */}
                <ReportPageOne
                  assessment={latestAssessment}
                  previousAssessment={previousAssessment}
                  athlete={athlete}
                />

                {/* PAGE 2: TEST MEASUREMENTS & SCIENTIFIC NORMS */}
                <ReportPageTwo assessment={latestAssessment} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
