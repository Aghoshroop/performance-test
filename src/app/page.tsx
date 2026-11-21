'use client';

import React, { useState, useEffect } from 'react';
import { db, DEFAULT_CURRENT_USER } from '@/lib/storage/local-storage-db';
import { AthleteProfile } from '@/types/athlete';
import { Assessment } from '@/types/assessment';
import { Competition, PerformanceRecord } from '@/types/athletics';
import { UserProfile } from '@/types/user';

import { Navbar } from '@/components/layout/navbar';
import { Sidebar, ActiveTab } from '@/components/layout/sidebar';
import { KpiMetrics } from '@/components/dashboard/kpi-metrics';
import { FilterBar, DashboardFilterState } from '@/components/dashboard/filter-bar';
import { SquadDistributionChart } from '@/components/dashboard/squad-distribution-chart';
import { RecentActivityWidget } from '@/components/dashboard/recent-activity-widget';
import { AthleteCard } from '@/components/athletes/athlete-card';
import { AthleteProfileView } from '@/components/athletes/athlete-profile-view';
import { AthleteRegistrationModal } from '@/components/athletes/athlete-registration-modal';
import { AthleteDeleteModal } from '@/components/athletes/athlete-delete-modal';
import { BodyMeasurementsModal } from '@/components/athletes/body-measurements-modal';
import { CoachTestingEntry } from '@/components/fitness/coach-testing-entry';
import { SquadBatchTestingMatrix } from '@/components/fitness/squad-batch-testing-matrix';
import { CompetitionEntryModal } from '@/components/athletics/competition-entry-modal';
import { CombinedEventCard } from '@/components/athletics/combined-event-card';
import { PerformanceTable } from '@/components/athletics/performance-table';
import { WACalculatorModal } from '@/components/athletics/wa-calculator-modal';
import { TestLibraryModal } from '@/components/fitness/test-library-modal';
import { ReportModal } from '@/components/reports/report-modal';
import { CombinedSquadReportModal } from '@/components/reports/combined-squad-report-modal';
import { AuditSystemView } from '@/components/system/audit-system-view';
import { FitnessRadarChart } from '@/components/intelligence/fitness-radar-chart';
import { ProgressionChart } from '@/components/intelligence/progression-chart';
import { BilateralAsymmetryChart } from '@/components/intelligence/bilateral-asymmetry-chart';
import { InsightCards } from '@/components/intelligence/insight-cards';

import {
  Users,
  Activity,
  Trophy,
  BookOpen,
  LineChart,
  FileText,
  Plus,
  ShieldAlert,
  Zap,
  Layers,
} from 'lucide-react';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_CURRENT_USER);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [fitnessViewMode, setFitnessViewMode] = useState<'batch' | 'individual'>('batch');
  const [theme, setTheme] = useState<'bright' | 'dark'>('bright');
  
  // Data lists from local storage database
  const [athletes, setAthletes] = useState<AthleteProfile[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [performances, setPerformances] = useState<PerformanceRecord[]>([]);

  // Selected State
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteProfile | null>(null);
  const [athleteToDelete, setAthleteToDelete] = useState<AthleteProfile | null>(null);
  const [reportModalAssessment, setReportModalAssessment] = useState<Assessment | null>(null);

  // Modal open states
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);
  const [isTestingModalOpen, setIsTestingModalOpen] = useState(false);
  const [isCompetitionModalOpen, setIsCompetitionModalOpen] = useState(false);
  const [isWACalcOpen, setIsWACalcOpen] = useState(false);
  const [isTestLibraryOpen, setIsTestLibraryOpen] = useState(false);
  const [isCombinedReportOpen, setIsCombinedReportOpen] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<DashboardFilterState>({
    searchQuery: '',
    eventGroup: 'all',
    squad: 'all',
    status: 'all',
  });

  // Load database items & persisted theme on client mount
  useEffect(() => {
    setCurrentUser(db.getCurrentUser());
    setAthletes(db.getAthletes());
    setAssessments(db.getAssessments());
    setCompetitions(db.getCompetitions());
    setPerformances(db.getPerformanceRecords());

    const savedTheme = localStorage.getItem('athletics_theme');
    if (savedTheme === 'dark' || savedTheme === 'bright') {
      setTheme(savedTheme);
    }
  }, []);

  const handleToggleTheme = () => {
    const next = theme === 'bright' ? 'dark' : 'bright';
    setTheme(next);
    localStorage.setItem('athletics_theme', next);
  };

  const refreshData = () => {
    setAthletes(db.getAthletes());
    setAssessments(db.getAssessments());
    setCompetitions(db.getCompetitions());
    setPerformances(db.getPerformanceRecords());
  };

  // Athlete Management handlers
  const handleSaveAthlete = (newAthlete: AthleteProfile) => {
    db.saveAthlete(newAthlete);
    refreshData();
  };

  const handleDeleteAthlete = (athleteId: string) => {
    db.deleteAthlete(athleteId);
    refreshData();
    if (selectedAthlete?.id === athleteId) {
      setSelectedAthlete(null);
    }
    setAthleteToDelete(null);
  };

  const handleSaveMeasurement = (updatedAthlete: AthleteProfile) => {
    db.saveAthlete(updatedAthlete);
    refreshData();
    setSelectedAthlete(updatedAthlete);
  };

  const handleSaveAssessment = (assessment: Assessment) => {
    db.saveAssessment(assessment);
    refreshData();
    setIsTestingModalOpen(false);
  };

  const handleSaveBatchAssessments = (newAssessments: Assessment[]) => {
    refreshData();
  };

  const handleEnsureAllTests = () => {
    db.ensureAllAthletesHaveAssessments();
    refreshData();
  };

  const handleSavePerformance = (perf: PerformanceRecord) => {
    db.savePerformanceRecord(perf);
    refreshData();
  };

  // Squad options for filter
  const squadOptions = Array.from(new Set(athletes.map((a) => a.trainingSquad).filter(Boolean)));

  // Filter athletes
  const filteredAthletes = athletes.filter((ath) => {
    const matchSearch =
      ath.fullName.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      ath.athleteCode.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      ath.primaryEventName.toLowerCase().includes(filters.searchQuery.toLowerCase());

    const matchGroup = filters.eventGroup === 'all' || ath.eventGroup === filters.eventGroup;
    const matchSquad = filters.squad === 'all' || ath.trainingSquad === filters.squad;
    const matchStatus = filters.status === 'all' || ath.status === filters.status;

    return matchSearch && matchGroup && matchSquad && matchStatus;
  });

  // Calculate KPIs
  const activeAthletesCount = athletes.filter((a) => a.status === 'active').length;
  const finalizedAssessmentsCount = assessments.filter((a) => a.status === 'finalized').length;
  const pendingAssessmentsCount = assessments.filter((a) => a.status === 'draft').length;
  const personalBestsCount = performances.filter((p) => p.isPersonalBest).length;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      theme === 'bright' ? 'bg-[#f6f7fb] text-slate-900' : 'bg-[#08080b] text-slate-100'
    }`}>
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onUserChange={setCurrentUser}
        onOpenTestingModal={() => setIsTestingModalOpen(true)}
        onOpenAthleteModal={() => setIsRegisterModalOpen(true)}
        onOpenWACalculator={() => setIsWACalcOpen(true)}
        onOpenCombinedReport={() => setIsCombinedReportOpen(true)}
        onOpenBatchMatrix={() => {
          setActiveTab('fitness');
          setFitnessViewMode('batch');
          setSelectedAthlete(null);
        }}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto p-3 sm:p-6 gap-6">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setSelectedAthlete(null);
          }}
          userRole={currentUser.role}
          theme={theme}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* Athlete Profile Detail View (If selected) */}
          {selectedAthlete ? (
            <AthleteProfileView
              athlete={selectedAthlete}
              assessments={assessments.filter((a) => a.athleteId === selectedAthlete.id)}
              performances={performances.filter((p) => p.athleteId === selectedAthlete.id)}
              onBack={() => setSelectedAthlete(null)}
              onNewAssessment={() => setIsTestingModalOpen(true)}
              onAddMeasurement={() => setIsMeasurementModalOpen(true)}
              onRecordPerformance={() => setIsCompetitionModalOpen(true)}
              onDeleteAthlete={(ath) => setAthleteToDelete(ath)}
              onOpenReport={(ass) => setReportModalAssessment(ass)}
              userRole={currentUser.role}
              theme={theme}
            />
          ) : (
            <>
              {/* TAB 1: COACHING DASHBOARD */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* KPI Bar */}
                  <KpiMetrics
                    totalAthletes={athletes.length}
                    activeAthletes={activeAthletesCount}
                    registeredCoaches={3}
                    assessmentsCompleted={finalizedAssessmentsCount}
                    assessmentsPending={pendingAssessmentsCount}
                    recentPersonalBests={personalBestsCount}
                    upcomingReassessments={2}
                    theme={theme}
                  />

                  {/* Filter Bar */}
                  <FilterBar
                    filters={filters}
                    onFilterChange={setFilters}
                    squadOptions={squadOptions}
                    theme={theme}
                  />

                  {/* Squad Distribution Chart */}
                  <SquadDistributionChart
                    athletes={filteredAthletes}
                    assessments={assessments}
                    theme={theme}
                  />

                  {/* Recent Activity: Assessments, PBs & Due Cycles */}
                  <RecentActivityWidget
                    recentAssessments={assessments}
                    recentPerformances={performances}
                    athletesRequiringReassessment={athletes.filter((a) => a.status === 'rehabilitation' || a.id === 'ath-sophia-chen')}
                    onSelectAssessment={(ass) => setReportModalAssessment(ass)}
                    onSelectAthlete={(ath) => setSelectedAthlete(ath)}
                    theme={theme}
                  />

                  {/* Athletes Quick Directory */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-bold text-sm ${theme === 'bright' ? 'text-slate-900' : 'text-white'}`}>
                        Athletes Directory ({filteredAthletes.length})
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsCombinedReportOpen(true)}
                          className="text-xs font-black text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 px-3 py-1.5 rounded-lg shadow-md shadow-red-950/50 inline-flex items-center gap-1.5 transition"
                          title="View all athlete reports together in one unified dossier"
                        >
                          <Layers className="w-3.5 h-3.5" /> All Reports Together
                        </button>
                        {currentUser.role !== 'ATHLETE' && (
                          <button
                            onClick={() => setIsRegisterModalOpen(true)}
                            className={`text-xs font-bold inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition ${
                              theme === 'bright'
                                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs'
                                : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5 text-rose-500" /> Add New Athlete
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredAthletes.map((ath) => (
                        <AthleteCard
                          key={ath.id}
                          athlete={ath}
                          onSelect={setSelectedAthlete}
                          onNewAssessment={() => {
                            setSelectedAthlete(ath);
                            setIsTestingModalOpen(true);
                          }}
                          onRecordPerformance={() => {
                            setSelectedAthlete(ath);
                            setIsCompetitionModalOpen(true);
                          }}
                          onDelete={(ath) => setAthleteToDelete(ath)}
                          userRole={currentUser.role}
                          theme={theme}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ATHLETES MANAGEMENT */}
              {activeTab === 'athletes' && (
                <div className="space-y-6">
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${
                    theme === 'bright' ? 'border-slate-200' : 'border-slate-800'
                  }`}>
                    <div>
                      <h2 className={`text-xl font-black ${theme === 'bright' ? 'text-slate-900' : 'text-white'}`}>Athletes Management</h2>
                      <p className={`text-xs ${theme === 'bright' ? 'text-slate-500' : 'text-slate-400'}`}>
                        High performance registry, historical anthropometry and multi-event profiles
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsCombinedReportOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-black rounded-lg bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-500 hover:to-rose-500 shadow-md shadow-red-950/50 transition"
                      >
                        <Layers className="w-4 h-4 text-white" /> All Reports Together
                      </button>
                      {currentUser.role !== 'ATHLETE' && (
                        <button
                          onClick={() => setIsRegisterModalOpen(true)}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg border shadow-xs transition ${
                            theme === 'bright'
                              ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                              : 'bg-slate-900 border-slate-700 text-white hover:bg-slate-800'
                          }`}
                        >
                          <Plus className="w-4 h-4 text-rose-500" /> Register New Athlete
                        </button>
                      )}
                    </div>
                  </div>

                  <FilterBar
                    filters={filters}
                    onFilterChange={setFilters}
                    squadOptions={squadOptions}
                    theme={theme}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredAthletes.map((ath) => (
                      <AthleteCard
                        key={ath.id}
                        athlete={ath}
                        onSelect={setSelectedAthlete}
                        onNewAssessment={() => {
                          setSelectedAthlete(ath);
                          setIsTestingModalOpen(true);
                        }}
                        onRecordPerformance={() => {
                          setSelectedAthlete(ath);
                          setIsCompetitionModalOpen(true);
                        }}
                        onDelete={(ath) => setAthleteToDelete(ath)}
                        userRole={currentUser.role}
                        theme={theme}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: FITNESS ASSESSMENTS ENGINE */}
              {activeTab === 'fitness' && (
                <div className="space-y-6">
                  {currentUser.role === 'ATHLETE' ? (
                    <div className={`p-6 rounded-xl border text-center ${
                      theme === 'bright'
                        ? 'bg-white border-slate-200/90 text-slate-900 shadow-sm'
                        : 'bg-[#0e0e13] border-slate-800 text-white'
                    }`}>
                      <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-2" />
                      <h3 className={`font-bold text-base ${theme === 'bright' ? 'text-slate-900' : 'text-white'}`}>Athlete Read-Only Access Mode</h3>
                      <p className={`text-xs mt-1 max-w-md mx-auto ${theme === 'bright' ? 'text-slate-500' : 'text-slate-400'}`}>
                        In accordance with Phase 1 User Roles, official fitness assessment data entry is restricted to authorized coaches and administrators.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Coach Mode Switcher Bar */}
                      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${
                        theme === 'bright'
                          ? 'bg-white border-slate-200/90 shadow-sm text-slate-900'
                          : 'bg-[#0e0e13] border-slate-800 shadow-xl text-white'
                      }`}>
                        <div>
                          <h3 className={`font-bold text-sm flex items-center gap-2 ${
                            theme === 'bright' ? 'text-slate-900' : 'text-white'
                          }`}>
                            <Activity className="w-4 h-4 text-rose-500" />
                            Fitness Assessment Suite
                          </h3>
                          <p className={`text-xs ${theme === 'bright' ? 'text-slate-500' : 'text-slate-400'}`}>
                            {fitnessViewMode === 'batch'
                              ? 'Squad Batch Testing Mode: Choose a preset testing batch, enter trial scores for all athletes simultaneously, and view combined report.'
                              : 'Individual Athlete Mode: Single-athlete comprehensive testing battery with multi-attempt, trial, and bilateral tracking.'}
                          </p>
                        </div>

                        <div className={`flex items-center gap-1 p-1 rounded-lg border shrink-0 ${
                          theme === 'bright' ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
                        }`}>
                          <button
                            type="button"
                            onClick={() => setFitnessViewMode('batch')}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition ${
                              fitnessViewMode === 'batch'
                                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-950/50'
                                : theme === 'bright'
                                ? 'text-slate-600 hover:text-slate-900'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            <Users className="w-3.5 h-3.5" />
                            Squad Batch Matrix ({athletes.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setFitnessViewMode('individual')}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition ${
                              fitnessViewMode === 'individual'
                                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-950/50'
                                : theme === 'bright'
                                ? 'text-slate-600 hover:text-slate-900'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            <Activity className="w-3.5 h-3.5" />
                            Individual Athlete
                          </button>
                        </div>
                      </div>

                      {/* Active Mode Render */}
                      {fitnessViewMode === 'batch' ? (
                        <SquadBatchTestingMatrix
                          athletes={athletes}
                          onSaveBatchAssessments={handleSaveBatchAssessments}
                          onOpenCombinedReport={() => setIsCombinedReportOpen(true)}
                          onSwitchToIndividual={(athleteId) => {
                            if (athleteId) {
                              const a = athletes.find((ath) => ath.id === athleteId);
                              if (a) setSelectedAthlete(a);
                            }
                            setFitnessViewMode('individual');
                          }}
                        />
                      ) : (
                        <CoachTestingEntry
                          athletes={athletes}
                          onSaveAssessment={handleSaveAssessment}
                          onOpenReport={(ass) => setReportModalAssessment(ass)}
                        />
                      )}
                    </>
                  )}
                </div>
              )}

              {/* TAB 4: SCIENTIFIC NORMS & TEST LIBRARY */}
              {activeTab === 'benchmarks' && (
                <div className="space-y-6">
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${
                    theme === 'bright' ? 'border-slate-200' : 'border-slate-800'
                  }`}>
                    <div>
                      <h2 className={`text-xl font-black flex items-center gap-2 ${
                        theme === 'bright' ? 'text-slate-900' : 'text-white'
                      }`}>
                        <BookOpen className="w-6 h-6 text-rose-500" />
                        Published Scientific Benchmark Norms
                      </h2>
                      <p className={`text-xs ${theme === 'bright' ? 'text-slate-500' : 'text-slate-400'}`}>
                        Peer-reviewed normative datasets with verified DOIs (Phase 4 Specification)
                      </p>
                    </div>
                    <button
                      onClick={() => setIsTestLibraryOpen(true)}
                      className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:from-red-500 hover:to-rose-500 shadow-md shadow-red-950/50 transition"
                    >
                      Browse Complete Test Catalog
                    </button>
                  </div>

                  <div className={`p-6 rounded-xl border space-y-4 ${
                    theme === 'bright'
                      ? 'bg-white border-slate-200/90 shadow-sm text-slate-900'
                      : 'bg-[#0e0e13] border-slate-800 text-white'
                  }`}>
                    <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                      <Zap className="w-4 h-4 text-rose-600" />
                      Scientific Reference Engine Standards
                    </div>
                    <p className={`text-xs leading-relaxed ${theme === 'bright' ? 'text-slate-600' : 'text-slate-300'}`}>
                      Athletics Intelligence strictly prohibits invented benchmark values or fictitious percentile scores. All active physical fitness tests correlate with recognized, published studies including the Council of Europe Eurofit Battery, McMahon et al. (2018), Haugen et al. (2012) elite sprint curves, and Tomkinson et al. (2017 BJSM, N = 1.14M).
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className={`p-4 rounded-lg border text-xs space-y-1 ${
                        theme === 'bright' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                      }`}>
                        <div className={`font-bold ${theme === 'bright' ? 'text-slate-900' : 'text-white'}`}>Eurofit Normative Standard</div>
                        <div className={theme === 'bright' ? 'text-slate-600' : 'text-slate-400'}>Council of Europe Committee for Sports Development (N &gt; 22,000)</div>
                        <div className={`${theme === 'bright' ? 'text-slate-500' : 'text-slate-500'} text-[11px]`}>Covers Standing Long Jump, Sit-and-Reach, Plate Tapping</div>
                      </div>
                      <div className={`p-4 rounded-lg border text-xs space-y-1 ${
                        theme === 'bright' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                      }`}>
                        <div className={`font-bold ${theme === 'bright' ? 'text-slate-900' : 'text-white'}`}>Tomkinson et al. 20m Shuttle Run (BJSM 2017)</div>
                        <div className={theme === 'bright' ? 'text-slate-600' : 'text-slate-400'}>DOI: 10.1136/bjsports-2016-095987 (N = 1,142,026 across 50 countries)</div>
                        <div className={`${theme === 'bright' ? 'text-slate-500' : 'text-slate-500'} text-[11px]`}>Continuous LMS growth curves for aerobic capacity</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: DEVELOPMENT INTELLIGENCE */}
              {activeTab === 'intelligence' && (
                <div className="space-y-6">
                  <div className={`pb-3 border-b ${theme === 'bright' ? 'border-slate-200' : 'border-slate-800'}`}>
                    <h2 className={`text-xl font-black flex items-center gap-2 ${
                      theme === 'bright' ? 'text-slate-900' : 'text-white'
                    }`}>
                      <LineChart className="w-6 h-6 text-rose-500" />
                      Longitudinal Athlete Development Intelligence
                    </h2>
                    <p className={`text-xs ${theme === 'bright' ? 'text-slate-500' : 'text-slate-400'}`}>
                      Longitudinal progress analytics, athletic event radar profiling & bilateral asymmetry monitoring
                    </p>
                  </div>

                  {assessments.length > 0 ? (
                    <div className="space-y-6">
                      <InsightCards
                        currentAssessment={assessments[0]}
                        previousAssessment={assessments[1]}
                      />

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className={`rounded-xl border p-5 shadow-sm ${
                          theme === 'bright'
                            ? 'bg-white border-slate-200/90 text-slate-900'
                            : 'bg-[#0e0e13] border-slate-800 text-white shadow-xl'
                        }`}>
                          <h3 className={`font-bold text-sm mb-2 ${theme === 'bright' ? 'text-slate-900' : 'text-white'}`}>
                            Latest Assessment Radar Profile ({assessments[0].athleteName})
                          </h3>
                          <FitnessRadarChart
                            currentAssessment={assessments[0]}
                            previousAssessment={assessments[1]}
                          />
                        </div>

                        <div className={`rounded-xl border p-5 shadow-sm ${
                          theme === 'bright'
                            ? 'bg-white border-slate-200/90 text-slate-900'
                            : 'bg-[#0e0e13] border-slate-800 text-white shadow-xl'
                        }`}>
                          <h3 className={`font-bold text-sm mb-2 ${theme === 'bright' ? 'text-slate-900' : 'text-white'}`}>
                            Longitudinal Progress Trajectory
                          </h3>
                          <ProgressionChart assessments={assessments} />
                        </div>
                      </div>

                      <div className={`rounded-xl border p-5 shadow-sm ${
                        theme === 'bright'
                          ? 'bg-white border-slate-200/90 text-slate-900'
                          : 'bg-[#0e0e13] border-slate-800 text-white shadow-xl'
                      }`}>
                        <h3 className={`font-bold text-sm mb-2 ${theme === 'bright' ? 'text-slate-900' : 'text-white'}`}>
                          Bilateral Symmetry & Limb Deficit Analysis
                        </h3>
                        <BilateralAsymmetryChart assessment={assessments[0]} />
                      </div>
                    </div>
                  ) : (
                    <div className={`p-12 text-center rounded-xl border text-xs ${
                      theme === 'bright'
                        ? 'bg-white border-slate-200 text-slate-500'
                        : 'bg-[#0e0e13] border-slate-800 text-slate-400'
                    }`}>
                      No assessment data available. Complete testing to activate development intelligence.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7: A4 REPORT GENERATOR */}
              {activeTab === 'reports' && (
                <div className="space-y-6">
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${
                    theme === 'bright' ? 'border-slate-200' : 'border-slate-800'
                  }`}>
                    <div>
                      <h2 className={`text-xl font-black flex items-center gap-2 ${
                        theme === 'bright' ? 'text-slate-900' : 'text-white'
                      }`}>
                        <FileText className="w-6 h-6 text-rose-500" />
                        A4 PDF Report Generator (Phase 7)
                      </h2>
                      <p className={`text-xs ${theme === 'bright' ? 'text-slate-500' : 'text-slate-400'}`}>
                        Editorial 2-page print & PDF dossiers with frozen calculation versioning
                      </p>
                    </div>
                    <button
                      onClick={() => setIsCombinedReportOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-black rounded-lg bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-500 hover:to-rose-500 shadow-md shadow-red-950/50 transition transform active:scale-95"
                    >
                      <Layers className="w-4 h-4 text-white" />
                      View All Athlete Reports Together ({athletes.length})
                    </button>
                  </div>

                  {/* Hero Callout Banner for Instant Squad Dossier */}
                  <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
                    theme === 'bright'
                      ? 'bg-gradient-to-r from-red-50 via-rose-50 to-red-50 border-red-200 text-slate-900'
                      : 'bg-gradient-to-r from-[#0e0e13] via-[#14141c] to-[#0e0e13] text-white border-red-500/30 shadow-xl'
                  }`}>
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-white flex items-center justify-center font-black text-base shadow-md shadow-red-950/40 shrink-0">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className={`font-extrabold text-sm flex items-center gap-2 ${
                          theme === 'bright' ? 'text-slate-900' : 'text-white'
                        }`}>
                          Consolidated Squad Performance Dossier
                          <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-rose-600 text-white">
                            Instant 1-Click
                          </span>
                        </h4>
                        <p className={`text-xs mt-0.5 ${theme === 'bright' ? 'text-slate-600' : 'text-slate-300'}`}>
                          Suppose all athletes have completed testing: compile every official 2-page physical dossier, executive leaderboard, and multi-page printable PDF in a single second.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsCombinedReportOpen(true)}
                      className="px-4 py-2 text-xs font-black bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-lg shadow-md shadow-red-950/50 transition shrink-0 whitespace-nowrap"
                    >
                      ⚡ Open All Reports Together
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assessments.map((ass) => {
                      const ath = athletes.find((a) => a.id === ass.athleteId);
                      return (
                        <div
                          key={ass.id}
                          className={`p-5 rounded-xl border flex flex-col justify-between ${
                            theme === 'bright'
                              ? 'bg-white border-slate-200/90 shadow-sm text-slate-900'
                              : 'bg-[#0e0e13] border-slate-800 shadow-xl text-white'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                                theme === 'bright'
                                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                                  : 'bg-slate-900 text-slate-300 border-slate-800'
                              }`}>
                                {ass.athleteCode}
                              </span>
                              <span className="text-xs font-bold text-rose-500">
                                Score: {ass.overallFitnessScore?.toFixed(1) ?? '—'}
                              </span>
                            </div>
                            <h3 className={`font-bold text-base ${theme === 'bright' ? 'text-slate-900' : 'text-white'}`}>{ass.athleteName}</h3>
                            <p className={`text-xs mt-1 ${theme === 'bright' ? 'text-slate-500' : 'text-slate-400'}`}>
                              Testing Date: {ass.assessmentDate} • Battery: {ass.batteryName}
                            </p>
                          </div>

                          <div className={`mt-4 pt-3 border-t flex items-center justify-between ${
                            theme === 'bright' ? 'border-slate-100' : 'border-slate-800'
                          }`}>
                            <span className={`text-xs ${theme === 'bright' ? 'text-slate-500' : 'text-slate-400'}`}>
                              Coach: {ass.coachName}
                            </span>
                            <button
                              onClick={() => setReportModalAssessment(ass)}
                              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg border transition ${
                                theme === 'bright'
                                  ? 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
                                  : 'bg-slate-900 border-slate-700 text-white hover:bg-slate-800'
                              }`}
                            >
                              Generate A4 Dossier
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 8: SYSTEM & AUDIT LOGS */}
              {activeTab === 'system' && <AuditSystemView />}
            </>
          )}
        </main>
      </div>

      {/* MODALS */}
      {/* 1. Athlete Registration Modal */}
      <AthleteRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSave={handleSaveAthlete}
        existingAthletesCount={athletes.length}
      />

      {/* 2. Body Measurements Modal */}
      {selectedAthlete && (
        <BodyMeasurementsModal
          isOpen={isMeasurementModalOpen}
          onClose={() => setIsMeasurementModalOpen(false)}
          athlete={selectedAthlete}
          onSaveMeasurement={handleSaveMeasurement}
        />
      )}

      {/* 3. Fast Testing Entry Modal */}
      {isTestingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-5 overflow-hidden">
          <div className="max-w-5xl w-full h-[90vh] max-h-[920px] flex flex-col">
            <CoachTestingEntry
              athletes={athletes}
              initialAthleteId={selectedAthlete?.id}
              onSaveAssessment={handleSaveAssessment}
              onClose={() => setIsTestingModalOpen(false)}
              onOpenReport={(ass) => {
                setIsTestingModalOpen(false);
                setReportModalAssessment(ass);
              }}
            />
          </div>
        </div>
      )}

      {/* 4. Competition Entry Modal */}
      <CompetitionEntryModal
        isOpen={isCompetitionModalOpen}
        onClose={() => setIsCompetitionModalOpen(false)}
        athletes={athletes}
        competitions={competitions}
        initialAthleteId={selectedAthlete?.id}
        onSavePerformance={handleSavePerformance}
      />

      {/* 5. World Athletics Calculator Modal */}
      <WACalculatorModal
        isOpen={isWACalcOpen}
        onClose={() => setIsWACalcOpen(false)}
      />

      {/* 6. Test Library Modal */}
      <TestLibraryModal
        isOpen={isTestLibraryOpen}
        onClose={() => setIsTestLibraryOpen(false)}
        userRole={currentUser.role}
      />

      {/* 7. Two-Page A4 PDF / Print Report Modal */}
      {reportModalAssessment && (
        <ReportModal
          isOpen={!!reportModalAssessment}
          onClose={() => setReportModalAssessment(null)}
          assessment={reportModalAssessment}
          previousAssessment={assessments.find(
            (a) => a.athleteId === reportModalAssessment.athleteId && a.id !== reportModalAssessment.id
          )}
          athlete={athletes.find((a) => a.id === reportModalAssessment.athleteId)}
          performances={performances.filter((p) => p.athleteId === reportModalAssessment.athleteId)}
        />
      )}

      {/* 8. Athlete Removal Confirmation Modal */}
      {athleteToDelete && (
        <AthleteDeleteModal
          isOpen={!!athleteToDelete}
          onClose={() => setAthleteToDelete(null)}
          onConfirm={handleDeleteAthlete}
          athlete={athleteToDelete}
          assessmentCount={
            assessments.filter((a) => a.athleteId === athleteToDelete.id).length
          }
          performanceCount={
            performances.filter((p) => p.athleteId === athleteToDelete.id).length
          }
        />
      )}

      {/* 9. Consolidated Squad Reports Modal (All Athletes Together) */}
      <CombinedSquadReportModal
        isOpen={isCombinedReportOpen}
        onClose={() => setIsCombinedReportOpen(false)}
        athletes={athletes}
        assessments={assessments}
        onEnsureAllTests={handleEnsureAllTests}
      />
    </div>
  );
}
