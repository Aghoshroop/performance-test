'use client';

import React, { useState } from 'react';
import { AthleteProfile, AthleteStatus, DominantSide, SexGroup, calculateAge } from '@/types/athlete';
import { SEED_ATHLETICS_EVENTS } from '@/lib/data/seed-events';
import { X, UserPlus, Check, AlertCircle } from 'lucide-react';

interface AthleteRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (athlete: AthleteProfile) => void;
  existingAthletesCount: number;
}

export function AthleteRegistrationModal({
  isOpen,
  onClose,
  onSave,
  existingAthletesCount,
}: AthleteRegistrationModalProps) {
  const currentYear = 2024;
  const nextCodeNum = String(existingAthletesCount + 1).padStart(3, '0');
  const generatedAthleteCode = `ATH-${currentYear}-${nextCodeNum}`;

  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('2005-06-15');
  const [sex, setSex] = useState<SexGroup>('male');
  const [club, setClub] = useState('National Athletics High Performance Centre');
  const [coachName, setCoachName] = useState('Coach Rudra Roy');
  const [trainingSquad, setTrainingSquad] = useState('Senior Sprint & Hurdle Group A');
  const [dominantHand, setDominantHand] = useState<DominantSide>('right');
  const [dominantFoot, setDominantFoot] = useState<DominantSide>('left');
  
  // Events
  const [primaryEventId, setPrimaryEventId] = useState('evt-100m');
  const [secondaryEventIds, setSecondaryEventIds] = useState<string[]>(['evt-200m']);
  
  // Measurements
  const [heightCm, setHeightCm] = useState(180.0);
  const [weightKg, setWeightKg] = useState(72.5);
  const [armSpanCm, setArmSpanCm] = useState(185.0);
  
  const [status, setStatus] = useState<AthleteStatus>('active');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const calculatedAge = calculateAge(dateOfBirth);

  const selectedPrimaryEvent = SEED_ATHLETICS_EVENTS.find((e) => e.id === primaryEventId);

  const handleToggleSecondary = (eventId: string) => {
    if (eventId === primaryEventId) return;
    if (secondaryEventIds.includes(eventId)) {
      setSecondaryEventIds(secondaryEventIds.filter((id) => id !== eventId));
    } else {
      setSecondaryEventIds([...secondaryEventIds, eventId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please provide the athlete full legal name.');
      return;
    }
    if (!dateOfBirth) {
      setError('Date of birth is required for norm matching.');
      return;
    }

    const newId = `ath-${Date.now()}`;
    const measurementId = `meas-${Date.now()}`;

    const newMeasurement = {
      id: measurementId,
      athleteId: newId,
      date: new Date().toISOString().split('T')[0],
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      armSpanCm: Number(armSpanCm),
      notes: 'Initial registration baseline body measurements.',
    };

    const newAthlete: AthleteProfile = {
      id: newId,
      organizationId: 'org-nahpc',
      athleteCode: generatedAthleteCode,
      fullName: fullName.trim(),
      dateOfBirth,
      sex,
      club,
      coachId: 'coach-rudra-roy',
      coachName,
      trainingSquad,
      dominantHand,
      dominantFoot,
      primaryEventId,
      primaryEventName: selectedPrimaryEvent?.name ?? '100m',
      eventGroup: selectedPrimaryEvent?.eventGroup ?? 'sprints',
      secondaryEventIds,
      secondaryEventNames: secondaryEventIds.map(
        (id) => SEED_ATHLETICS_EVENTS.find((e) => e.id === id)?.name ?? id
      ),
      status,
      currentMeasurements: newMeasurement,
      measurementHistory: [newMeasurement],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newAthlete);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-600 text-white font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Register Track & Field Athlete</h2>
              <p className="text-xs text-slate-400">
                System Code: <span className="font-mono text-rose-400 font-semibold">{generatedAthleteCode}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-800 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Core Info */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              1. Personal & Norm Identification
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Athlete Legal Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Miller"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date of Birth * (Calculated Age: <span className="text-red-600 font-bold">{calculatedAge} yrs</span>)
                </label>
                <input
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sex / Scientific Norm Group *
                </label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value as SexGroup)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500"
                >
                  <option value="male">Male (Standard Norms)</option>
                  <option value="female">Female (Standard Norms)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Athletics Discipline Selection */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              2. Athletics Event Assignments
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Athletics Event *
                </label>
                <select
                  value={primaryEventId}
                  onChange={(e) => setPrimaryEventId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500 font-semibold text-slate-900"
                >
                  {SEED_ATHLETICS_EVENTS.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      [{evt.category.toUpperCase()}] {evt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Training Squad / Group
                </label>
                <input
                  type="text"
                  value={trainingSquad}
                  onChange={(e) => setTrainingSquad(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Secondary Events (Click to toggle)
                </label>
                <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg max-h-32 overflow-y-auto">
                  {SEED_ATHLETICS_EVENTS.filter((e) => e.id !== primaryEventId).map((evt) => {
                    const isSelected = secondaryEventIds.includes(evt.id);
                    return (
                      <button
                        type="button"
                        key={evt.id}
                        onClick={() => handleToggleSecondary(evt.id)}
                        className={`text-xs px-2.5 py-1 rounded-md font-medium transition ${
                          isSelected
                            ? 'bg-red-600 text-white font-bold shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {evt.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Anthropometry & Baseline Measurements */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              3. Baseline Body Measurements
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Height (cm) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Weight (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Arm Span (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={armSpanCm}
                  onChange={(e) => setArmSpanCm(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          {/* Coaching & Status */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              4. Coaching & Status
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Coach
                </label>
                <input
                  type="text"
                  value={coachName}
                  onChange={(e) => setCoachName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Athlete Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AthleteStatus)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500"
                >
                  <option value="active">Active (Full Training)</option>
                  <option value="injured">Injured</option>
                  <option value="rehabilitation">Rehabilitation</option>
                  <option value="off-season">Off-Season</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:from-red-500 hover:to-rose-500 transition shadow"
            >
              <Check className="w-4 h-4" />
              Save Athlete Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
