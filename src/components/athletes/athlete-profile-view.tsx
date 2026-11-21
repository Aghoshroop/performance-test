'use client';

import React, { useState } from 'react';
import { AthleteProfile, calculateAge } from '@/types/athlete';
import { Assessment } from '@/types/assessment';
import { PerformanceRecord } from '@/types/athletics';
import { Badge } from '@/components/ui/badge';
import { PerformanceTable } from '@/components/athletics/performance-table';
import { FitnessRadarChart } from '@/components/intelligence/fitness-radar-chart';
import { ProgressionChart } from '@/components/intelligence/progression-chart';
import { BilateralAsymmetryChart } from '@/components/intelligence/bilateral-asymmetry-chart';
import { InsightCards } from '@/components/intelligence/insight-cards';
import {
  User,
  Activity,
  Trophy,
  Scale,
  LineChart,
  Calendar,
  FileText,
  Plus,
  ChevronLeft,
  Ruler,
  Weight,
  Trash2,
} from 'lucide-react';

interface AthleteProfileViewProps {
  athlete: AthleteProfile;
  assessments: Assessment[];
  performances: PerformanceRecord[];
  onBack: () => void;
  onNewAssessment: () => void;
  onAddMeasurement: () => void;
  onRecordPerformance: () => void;
  onDeleteAthlete?: (athlete: AthleteProfile) => void;
  onOpenReport: (assessment: Assessment) => void;
  userRole?: string;
  theme?: 'bright' | 'dark';
}

export function AthleteProfileView({
  athlete,
  assessments,
  performances,
  onBack,
  onNewAssessment,
  onAddMeasurement,
  onRecordPerformance,
  onDeleteAthlete,
  onOpenReport,
  userRole,
  theme = 'bright',
}: AthleteProfileViewProps) {
  const isBright = theme === 'bright';
  const [activeTab, setActiveTab] = useState<'overview' | 'fitness' | 'competitions' | 'anthropometry'>('overview');

  const age = calculateAge(athlete.dateOfBirth);
  const latestAssessment = assessments[0];
  const previousAssessment = assessments[1];
  const coachDisplayName = (athlete.coachName && athlete.coachName.includes('Miller'))
    ? 'Coach Rudra Roy'
    : (athlete.coachName || 'Coach Rudra Roy');

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${
        isBright ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <button
          onClick={onBack}
          className={`inline-flex items-center gap-1.5 text-xs font-semibold transition ${
            isBright ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ChevronLeft className="w-4 h-4" /> Back to Athletes Directory
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {userRole !== 'ATHLETE' && (
            <>
              <button
                onClick={onNewAssessment}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-500 hover:to-rose-500 transition shadow-md shadow-red-950/30"
              >
                <Activity className="w-3.5 h-3.5" /> New Assessment
              </button>
              <button
                onClick={onAddMeasurement}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                  isBright
                    ? 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 shadow-xs'
                    : 'bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200'
                }`}
              >
                <Scale className="w-3.5 h-3.5 text-slate-400" /> Log Body Stats
              </button>
              {onDeleteAthlete && (
                <button
                  onClick={() => onDeleteAthlete(athlete)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                    isBright
                      ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 shadow-xs'
                      : 'bg-red-950/20 border-red-900/40 hover:bg-red-900/40 text-rose-400'
                  }`}
                  title="Remove Athlete"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove Athlete
                </button>
              )}
            </>
          )}

          {latestAssessment && (
            <button
              onClick={() => onOpenReport(latestAssessment)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                isBright
                  ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm border-slate-900'
                  : 'bg-slate-900 border border-slate-700 text-rose-400 hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-rose-400" /> View A4 Dossier
            </button>
          )}
        </div>
      </div>

      {/* Athlete Header Card */}
      <div
        className={`p-6 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
          isBright
            ? 'bg-white border-slate-200/90 shadow-sm text-slate-900'
            : 'bg-[#0e0e13] border border-slate-800 shadow-xl text-white'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shrink-0 ${
              isBright
                ? 'bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-md shadow-red-950/20 ring-2 ring-red-500/20'
                : 'bg-slate-900 text-rose-500 shadow-lg ring-2 ring-red-500/40'
            }`}
          >
            {athlete.fullName.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                  isBright
                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-slate-900 text-slate-300 border-slate-800'
                }`}
              >
                {athlete.athleteCode}
              </span>
              <Badge variant="emerald" size="sm">
                {athlete.status.toUpperCase()}
              </Badge>
            </div>
            <h1 className={`text-xl sm:text-2xl font-black ${isBright ? 'text-slate-900' : 'text-white'}`}>
              {athlete.fullName}
            </h1>
            <p className={`text-xs mt-1 flex flex-wrap items-center gap-2 ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>
              <span>{age} years old</span>
              <span>•</span>
              <span className="capitalize">{athlete.sex}</span>
              <span>•</span>
              <span>{athlete.trainingSquad}</span>
              <span>•</span>
              <span>Coach: {coachDisplayName}</span>
            </p>
          </div>
        </div>

        {/* Current Body Measurements */}
        <div
          className={`flex items-center gap-4 p-3.5 rounded-xl border text-xs ${
            isBright
              ? 'bg-slate-50 border-slate-200/80 text-slate-900'
              : 'bg-slate-900/90 border-slate-800 text-white'
          }`}
        >
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Height</span>
            <span className={`font-black text-base ${isBright ? 'text-slate-900' : 'text-white'}`}>
              {athlete.currentMeasurements?.heightCm ?? '—'} <span className="text-xs font-normal text-slate-500">cm</span>
            </span>
          </div>
          <div className={`h-8 w-px ${isBright ? 'bg-slate-200' : 'bg-slate-800'}`} />
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Weight</span>
            <span className={`font-black text-base ${isBright ? 'text-slate-900' : 'text-white'}`}>
              {athlete.currentMeasurements?.weightKg ?? '—'} <span className="text-xs font-normal text-slate-500">kg</span>
            </span>
          </div>
          <div className={`h-8 w-px ${isBright ? 'bg-slate-200' : 'bg-slate-800'}`} />
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Arm Span</span>
            <span className={`font-black text-base ${isBright ? 'text-slate-900' : 'text-white'}`}>
              {athlete.currentMeasurements?.armSpanCm ?? '—'} <span className="text-xs font-normal text-slate-500">cm</span>
            </span>
          </div>
          <div className={`h-8 w-px ${isBright ? 'bg-slate-200' : 'bg-slate-800'}`} />
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Primary Event</span>
            <span className={`font-bold block ${isBright ? 'text-red-600' : 'text-rose-400'}`}>
              {athlete.primaryEventName}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex border-b text-xs font-bold gap-2 ${isBright ? 'border-slate-200' : 'border-slate-800'}`}>
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-3 transition border-b-2 ${
            activeTab === 'overview'
              ? isBright
                ? 'border-red-600 text-red-600 font-black'
                : 'border-red-500 text-white font-black'
              : isBright
                ? 'border-transparent text-slate-500 hover:text-slate-900'
                : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Intelligence & Radar Overview
        </button>
        <button
          onClick={() => setActiveTab('fitness')}
          className={`pb-3 px-3 transition border-b-2 ${
            activeTab === 'fitness'
              ? isBright
                ? 'border-red-600 text-red-600 font-black'
                : 'border-red-500 text-white font-black'
              : isBright
                ? 'border-transparent text-slate-500 hover:text-slate-900'
                : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Fitness Assessments ({assessments.length})
        </button>
        <button
          onClick={() => setActiveTab('anthropometry')}
          className={`pb-3 px-3 transition border-b-2 ${
            activeTab === 'anthropometry'
              ? isBright
                ? 'border-red-600 text-red-600 font-black'
                : 'border-red-500 text-white font-black'
              : isBright
                ? 'border-transparent text-slate-500 hover:text-slate-900'
                : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Body History ({athlete.measurementHistory?.length ?? 1})
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {latestAssessment ? (
            <>
              {/* Insight Cards */}
              <InsightCards
                currentAssessment={latestAssessment}
                previousAssessment={previousAssessment}
              />

              {/* Radar Chart + Progression Line */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div
                  className={`p-5 rounded-xl border transition-all ${
                    isBright
                      ? 'bg-white border-slate-200/90 shadow-sm text-slate-900'
                      : 'bg-[#0e0e13] border border-slate-800 shadow-xl text-white'
                  }`}
                >
                  <div
                    className={`flex items-center justify-between pb-2 mb-3 border-b ${
                      isBright ? 'border-slate-100' : 'border-slate-800'
                    }`}
                  >
                    <h3 className={`font-bold text-sm ${isBright ? 'text-slate-900' : 'text-white'}`}>
                      Athletic Fitness Radar Profile
                    </h3>
                    <span className={`text-xs font-bold font-mono ${isBright ? 'text-red-600' : 'text-rose-400'}`}>
                      {latestAssessment.assessmentDate}
                    </span>
                  </div>
                  <FitnessRadarChart
                    currentAssessment={latestAssessment}
                    previousAssessment={previousAssessment}
                  />
                </div>

                <div
                  className={`p-5 rounded-xl border transition-all ${
                    isBright
                      ? 'bg-white border-slate-200/90 shadow-sm text-slate-900'
                      : 'bg-[#0e0e13] border border-slate-800 shadow-xl text-white'
                  }`}
                >
                  <div
                    className={`flex items-center justify-between pb-2 mb-3 border-b ${
                      isBright ? 'border-slate-100' : 'border-slate-800'
                    }`}
                  >
                    <h3 className={`font-bold text-sm ${isBright ? 'text-slate-900' : 'text-white'}`}>
                      Longitudinal Progress Analytics
                    </h3>
                    <span className={`text-xs ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>Historical Assessments</span>
                  </div>
                  <ProgressionChart assessments={assessments} />
                </div>
              </div>

              {/* Bilateral Balance */}
              <div
                className={`p-5 rounded-xl border transition-all ${
                  isBright
                    ? 'bg-white border-slate-200/90 shadow-sm text-slate-900'
                    : 'bg-[#0e0e13] border border-slate-800 shadow-xl text-white'
                }`}
              >
                <div
                  className={`flex items-center justify-between pb-2 mb-3 border-b ${
                    isBright ? 'border-slate-100' : 'border-slate-800'
                  }`}
                >
                  <h3 className={`font-bold text-sm ${isBright ? 'text-slate-900' : 'text-white'}`}>
                    Bilateral Limb Balance &amp; Functional Asymmetry
                  </h3>
                  <span className={`text-xs ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>Left vs Right Performance Index</span>
                </div>
                <BilateralAsymmetryChart assessment={latestAssessment} />
              </div>
            </>
          ) : (
            <div
              className={`p-12 text-center rounded-xl border ${
                isBright
                  ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
                  : 'bg-[#0e0e13] border-slate-800 text-white'
              }`}
            >
              <Activity className={`w-10 h-10 mx-auto mb-2 ${isBright ? 'text-red-600' : 'text-rose-500'}`} />
              <p className={`text-sm font-semibold ${isBright ? 'text-slate-700' : 'text-slate-300'}`}>No fitness assessment recorded yet.</p>
              <button
                onClick={onNewAssessment}
                className="mt-3 px-4 py-2 text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:from-red-500 hover:to-rose-500 shadow-md shadow-red-950/50"
              >
                Create First Physical Assessment
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Fitness Assessments History */}
      {activeTab === 'fitness' && (
        <div className="space-y-4">
          {assessments.map((ass) => (
            <div
              key={ass.id}
              className={`p-5 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isBright
                  ? 'bg-white border-slate-200/90 text-slate-900 shadow-sm'
                  : 'bg-[#0e0e13] border border-slate-800 text-white shadow-xl'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-bold text-sm ${isBright ? 'text-slate-900' : 'text-white'}`}>{ass.batteryName}</span>
                  <Badge variant={ass.status === 'finalized' ? 'emerald' : 'yellow'} size="sm">
                    {ass.status.toUpperCase()}
                  </Badge>
                </div>
                <div className={`text-xs flex items-center gap-3 ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>
                  <span>Testing Date: <strong className={isBright ? 'text-slate-800' : 'text-slate-200'}>{ass.assessmentDate}</strong></span>
                  <span>•</span>
                  <span>Coach: {ass.coachName?.includes('Miller') ? 'Coach Rudra Roy' : (ass.coachName || 'Coach Rudra Roy')}</span>
                  <span>•</span>
                  <span>Coverage: {ass.coveragePercentage}%</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-xs text-slate-400 uppercase font-semibold block">Fitness Score</span>
                  <span className={`text-2xl font-black ${isBright ? 'text-red-600' : 'text-rose-400'}`}>
                    {ass.overallFitnessScore !== undefined ? `${ass.overallFitnessScore.toFixed(1)} pts` : '—'}
                  </span>
                  <div className={`text-[10px] font-bold ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>{ass.overallRating ?? 'Review'}</div>
                </div>

                <button
                  onClick={() => onOpenReport(ass)}
                  className={`px-3.5 py-2 text-xs font-bold rounded-lg transition ${
                    isBright
                      ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
                      : 'bg-slate-900 border border-slate-700 text-white hover:bg-slate-800'
                  }`}
                >
                  View Report
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Historical Body Measurements */}
      {activeTab === 'anthropometry' && (
        <div
          className={`p-5 rounded-xl border transition-all ${
            isBright
              ? 'bg-white border-slate-200/90 shadow-sm text-slate-900'
              : 'bg-[#0e0e13] border border-slate-800 shadow-xl text-white'
          }`}
        >
          <div
            className={`flex items-center justify-between pb-3 mb-4 border-b ${
              isBright ? 'border-slate-100' : 'border-slate-800'
            }`}
          >
            <div>
              <h3 className={`font-bold text-sm ${isBright ? 'text-slate-900' : 'text-white'}`}>Historical Body Measurements Timeline</h3>
              <p className={`text-xs ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>Continuous body composition log without overwriting past entries</p>
            </div>
            {userRole !== 'ATHLETE' && (
              <button
                onClick={onAddMeasurement}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-500 hover:to-rose-500 shadow-md shadow-red-950/50"
              >
                + Log Measurement
              </button>
            )}
          </div>

          <div className={`overflow-x-auto rounded-lg border ${isBright ? 'border-slate-200' : 'border-slate-800'}`}>
            <table className="w-full text-left text-xs">
              <thead
                className={`font-bold text-[10px] uppercase ${
                  isBright ? 'bg-slate-100 text-slate-700' : 'bg-slate-900 text-white'
                }`}
              >
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Height (cm)</th>
                  <th className="p-3">Weight (kg)</th>
                  <th className="p-3">Arm Span (cm)</th>
                  <th className="p-3">Sitting Height (cm)</th>
                  <th className="p-3">Body Fat %</th>
                  <th className="p-3">Notes</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isBright ? 'divide-slate-200 bg-white' : 'divide-slate-800 bg-[#0e0e13]'}`}>
                {(athlete.measurementHistory || [athlete.currentMeasurements]).map((m, idx) => (
                  <tr key={idx} className={isBright ? 'hover:bg-slate-50' : 'hover:bg-slate-900/60'}>
                    <td className={`p-3 font-mono font-bold ${isBright ? 'text-slate-900' : 'text-white'}`}>{m.date}</td>
                    <td className={`p-3 font-semibold ${isBright ? 'text-slate-700' : 'text-slate-300'}`}>{m.heightCm}</td>
                    <td className={`p-3 font-semibold ${isBright ? 'text-slate-700' : 'text-slate-300'}`}>{m.weightKg}</td>
                    <td className={`p-3 font-semibold ${isBright ? 'text-slate-700' : 'text-slate-300'}`}>{m.armSpanCm ?? '—'}</td>
                    <td className={`p-3 font-semibold ${isBright ? 'text-slate-700' : 'text-slate-300'}`}>{m.sittingHeightCm ?? '—'}</td>
                    <td className={`p-3 font-semibold ${isBright ? 'text-slate-700' : 'text-slate-300'}`}>{m.bodyFatPercent ? `${m.bodyFatPercent}%` : '—'}</td>
                    <td className={`p-3 italic ${isBright ? 'text-slate-500' : 'text-slate-400'}`}>{m.notes || 'Routine weigh-in'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
