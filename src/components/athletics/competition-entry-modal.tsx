'use client';

import React, { useState } from 'react';
import { AthleteProfile } from '@/types/athlete';
import { Competition, PerformanceRecord, TimingMethod, WindLegalStatus } from '@/types/athletics';
import { SEED_ATHLETICS_EVENTS } from '@/lib/data/seed-events';
import { calculateWorldAthleticsPoints } from '@/lib/scoring/wa-points';
import { X, Trophy, Check, Plus, Trash2, Wind } from 'lucide-react';

interface CompetitionEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  athletes: AthleteProfile[];
  competitions: Competition[];
  initialAthleteId?: string;
  onSavePerformance: (record: PerformanceRecord) => void;
}

export function CompetitionEntryModal({
  isOpen,
  onClose,
  athletes,
  competitions,
  initialAthleteId,
  onSavePerformance,
}: CompetitionEntryModalProps) {
  const [athleteId, setAthleteId] = useState(initialAthleteId || athletes[0]?.id || '');
  const [competitionId, setCompetitionId] = useState(competitions[0]?.id || '');
  const [eventId, setEventId] = useState(SEED_ATHLETICS_EVENTS[0]?.id || 'evt-100m');
  const [date, setDate] = useState('2024-10-15');
  const [round, setRound] = useState<'heats' | 'semifinal' | 'final'>('final');
  const [position, setPosition] = useState(1);

  React.useEffect(() => {
    setDate(new Date().toISOString().split('T')[0]);
  }, []);
  
  // Track specific
  const [timeSeconds, setTimeSeconds] = useState('10.25');
  const [reactionTime, setReactionTime] = useState('0.145');
  const [timingMethod, setTimingMethod] = useState<TimingMethod>('FAT');
  const [windReading, setWindReading] = useState('+1.2');

  // Field specific
  const [attempts, setAttempts] = useState<{ attemptNumber: number; result: number; isValid: boolean }[]>([
    { attemptNumber: 1, result: 7.65, isValid: true },
    { attemptNumber: 2, result: 7.78, isValid: true },
    { attemptNumber: 3, result: 0.0, isValid: false },
  ]);

  const [notes, setNotes] = useState('');
  const [isPersonalBest, setIsPersonalBest] = useState(false);
  const [isSeasonBest, setIsSeasonBest] = useState(false);

  if (!isOpen) return null;

  const selectedAthlete = athletes.find((a) => a.id === athleteId);
  const selectedCompetition = competitions.find((c) => c.id === competitionId);
  const selectedEvent = SEED_ATHLETICS_EVENTS.find((e) => e.id === eventId);

  const isTrack = selectedEvent?.category === 'track';

  const windNum = parseFloat(windReading);
  const isWindAssisted = !isNaN(windNum) && windNum > 2.0;
  const windLegalStatus: WindLegalStatus = isWindAssisted ? 'wind_assisted' : !isNaN(windNum) ? 'legal' : 'nwi';

  // Calculate live WA Points
  const rawMark = isTrack ? parseFloat(timeSeconds) || 0 : Math.max(0, ...attempts.filter((a) => a.isValid).map((a) => a.result));
  const waResult = calculateWorldAthleticsPoints(
    selectedEvent?.code ?? '100m',
    rawMark,
    selectedAthlete?.sex ?? 'male',
    !isNaN(windNum) ? windNum : undefined
  );

  const handleAddFieldAttempt = () => {
    setAttempts((prev) => [
      ...prev,
      { attemptNumber: prev.length + 1, result: 0.0, isValid: true },
    ]);
  };

  const handleUpdateAttempt = (idx: number, result: number, isValid: boolean) => {
    setAttempts((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], result, isValid };
      return next;
    });
  };

  const handleDeleteAttempt = (idx: number) => {
    setAttempts((prev) => prev.filter((_, i) => i !== idx).map((a, i) => ({ ...a, attemptNumber: i + 1 })));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: PerformanceRecord = {
      id: `perf-${Date.now()}`,
      athleteId,
      organizationId: 'org-nahpc',
      competitionId,
      competitionName: selectedCompetition?.name ?? 'Official Competition',
      eventId,
      eventName: selectedEvent?.name ?? 'Event',
      eventCategory: selectedEvent?.category ?? 'track',
      date,
      round,
      position: Number(position),
      timeSeconds: isTrack ? parseFloat(timeSeconds) : undefined,
      reactionTimeSeconds: isTrack && reactionTime ? parseFloat(reactionTime) : undefined,
      distanceOrHeightMeters: !isTrack ? rawMark : undefined,
      attempts: !isTrack ? attempts.map((a) => ({ ...a, isPass: false })) : undefined,
      windReading: !isNaN(windNum) ? windNum : undefined,
      windLegalStatus,
      timingMethod,
      isLegalForRecords: !isWindAssisted,
      worldAthleticsPoints: waResult.points,
      waTableVersion: waResult.tableVersion,
      isPersonalBest,
      isSeasonBest,
      notes,
      recordedByCoachId: 'coach-rudra-roy',
      verifiedByAdmin: true,
      createdAt: new Date().toISOString(),
    };

    onSavePerformance(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-8">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-600 text-white font-bold">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Record Athletics Competition Result</h3>
              <p className="text-xs text-slate-400">Track & Field Official Electronic Record</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Athlete & Competition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Athlete</label>
              <select
                value={athleteId}
                onChange={(e) => setAthleteId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 font-semibold"
              >
                {athletes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.fullName} ({a.athleteCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Competition</label>
              <select
                value={competitionId}
                onChange={(e) => setCompetitionId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                {competitions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Event & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Event</label>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 font-semibold text-slate-900"
              >
                {SEED_ATHLETICS_EVENTS.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    [{evt.category.toUpperCase()}] {evt.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Track vs Field Inputs */}
          {isTrack ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Track Measurements</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time (seconds) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={timeSeconds}
                    onChange={(e) => setTimeSeconds(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reaction (s)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={reactionTime}
                    onChange={(e) => setReactionTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Wind className="w-3 h-3" /> Wind (m/s)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={windReading}
                    onChange={(e) => setWindReading(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Position</label>
                  <input
                    type="number"
                    min="1"
                    value={position}
                    onChange={(e) => setPosition(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Field Event Attempts (meters)</h4>
                <button
                  type="button"
                  onClick={handleAddFieldAttempt}
                  className="text-xs font-bold text-red-700 hover:text-red-900 inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Attempt
                </button>
              </div>
              <div className="space-y-2">
                {attempts.map((att, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 w-16">Attempt {att.attemptNumber}:</span>
                    <input
                      type="number"
                      step="0.01"
                      disabled={!att.isValid}
                      value={att.result}
                      onChange={(e) => handleUpdateAttempt(idx, parseFloat(e.target.value) || 0, att.isValid)}
                      className={`w-24 px-2 py-1 text-xs font-bold border rounded ${
                        att.isValid ? 'bg-white border-slate-300' : 'bg-rose-50 text-rose-500 border-rose-300 line-through'
                      }`}
                    />
                    <label className="flex items-center gap-1.5 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={!att.isValid}
                        onChange={(e) => handleUpdateAttempt(idx, att.result, !e.target.checked)}
                        className="rounded text-rose-600 focus:ring-rose-500"
                      />
                      <span>Foul (X)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleDeleteAttempt(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* World Athletics Points Live Box */}
          <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase">Calculated World Athletics Points</div>
              <div className="text-2xl font-black text-rose-400">{waResult.points} pts</div>
            </div>
            <div className="text-right">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${waResult.isLegalForPoints ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                {waResult.isLegalForPoints ? 'Record Legal' : 'Wind Assisted (>+2.0)'}
              </span>
            </div>
          </div>

          {/* PB / SB Toggles */}
          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={isPersonalBest}
                onChange={(e) => setIsPersonalBest(e.target.checked)}
                className="w-4 h-4 text-rose-500 rounded focus:ring-red-500"
              />
              <span>Mark as Personal Best (PB)</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={isSeasonBest}
                onChange={(e) => setIsSeasonBest(e.target.checked)}
                className="w-4 h-4 text-rose-500 rounded focus:ring-red-500"
              />
              <span>Mark as Season Best (SB)</span>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Tactical Evaluation</label>
            <input
              type="text"
              placeholder="e.g. Clean hurdle clearance, negative split, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:from-red-500 hover:to-rose-500 shadow transition"
            >
              <Check className="w-4 h-4" />
              Save Competition Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
