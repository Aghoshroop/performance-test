'use client';

import React, { useState } from 'react';
import { AthleteProfile, BodyMeasurement } from '@/types/athlete';
import { X, Scale, Check } from 'lucide-react';

interface BodyMeasurementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  athlete: AthleteProfile;
  onSaveMeasurement: (updatedAthlete: AthleteProfile) => void;
}

export function BodyMeasurementsModal({
  isOpen,
  onClose,
  athlete,
  onSaveMeasurement,
}: BodyMeasurementsModalProps) {
  const [date, setDate] = useState('2024-10-15');
  const [heightCm, setHeightCm] = useState(athlete.currentMeasurements?.heightCm ?? 180);
  const [weightKg, setWeightKg] = useState(athlete.currentMeasurements?.weightKg ?? 75);
  const [armSpanCm, setArmSpanCm] = useState(athlete.currentMeasurements?.armSpanCm ?? 185);
  const [sittingHeightCm, setSittingHeightCm] = useState(athlete.currentMeasurements?.sittingHeightCm ?? 95);
  const [bodyFatPercent, setBodyFatPercent] = useState(athlete.currentMeasurements?.bodyFatPercent ?? 10);
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    setDate(new Date().toISOString().split('T')[0]);
  }, []);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: BodyMeasurement = {
      id: `meas-${Date.now()}`,
      athleteId: athlete.id,
      date,
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      armSpanCm: Number(armSpanCm),
      sittingHeightCm: Number(sittingHeightCm),
      bodyFatPercent: Number(bodyFatPercent),
      recordedByCoachId: 'coach-rudra-roy',
      notes,
    };

    const updatedHistory = [...(athlete.measurementHistory || []), newEntry].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const updatedAthlete: AthleteProfile = {
      ...athlete,
      currentMeasurements: newEntry,
      measurementHistory: updatedHistory,
      updatedAt: new Date().toISOString(),
    };

    onSaveMeasurement(updatedAthlete);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-600 text-white font-bold">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Log Body Anthropometry</h3>
              <p className="text-xs text-slate-400">{athlete.fullName} ({athlete.athleteCode})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Measurement Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Height (cm) *</label>
              <input
                type="number"
                step="0.1"
                required
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Weight (kg) *</label>
              <input
                type="number"
                step="0.1"
                required
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Arm Span (cm)</label>
              <input
                type="number"
                step="0.1"
                value={armSpanCm}
                onChange={(e) => setArmSpanCm(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Body Fat (%)</label>
              <input
                type="number"
                step="0.1"
                value={bodyFatPercent}
                onChange={(e) => setBodyFatPercent(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Coach Notes</label>
              <input
                type="text"
                placeholder="e.g. Weigh-in morning fasted session"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:from-red-500 hover:to-rose-500 transition"
            >
              <Check className="w-4 h-4" />
              Save Measurement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
