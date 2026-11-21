'use client';

import React from 'react';
import { AthleteProfile, calculateAge } from '@/types/athlete';
import { Badge } from '@/components/ui/badge';
import { User, Activity, Trophy, ChevronRight, Ruler, Weight, Trash2 } from 'lucide-react';

interface AthleteCardProps {
  athlete: AthleteProfile;
  onSelect: (athlete: AthleteProfile) => void;
  onNewAssessment?: (athlete: AthleteProfile) => void;
  onRecordPerformance?: (athlete: AthleteProfile) => void;
  onDelete?: (athlete: AthleteProfile) => void;
  userRole?: string;
  theme?: 'bright' | 'dark';
}

export function AthleteCard({
  athlete,
  onSelect,
  onNewAssessment,
  onRecordPerformance,
  onDelete,
  userRole,
  theme = 'bright',
}: AthleteCardProps) {
  const isBright = theme === 'bright';
  const age = calculateAge(athlete.dateOfBirth);

  const statusVariantMap: Record<string, 'emerald' | 'yellow' | 'red' | 'blue' | 'gray'> = {
    active: 'emerald',
    injured: 'red',
    rehabilitation: 'yellow',
    'off-season': 'blue',
    retired: 'gray',
  };

  return (
    <div
      className={`rounded-xl p-5 flex flex-col justify-between group transition-all duration-200 ${
        isBright
          ? 'bg-white border border-slate-200/90 hover:border-red-500/60 hover:shadow-md text-slate-900'
          : 'bg-[#0e0e13] border border-slate-800 hover:border-red-500/50 hover:shadow-xl hover:shadow-red-950/40 text-white'
      }`}
    >
      <div>
        {/* Top Row: Code & Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
              isBright
                ? 'bg-slate-100 text-slate-700 border-slate-200'
                : 'bg-slate-900 text-slate-300 border-slate-800'
            }`}
          >
            {athlete.athleteCode}
          </span>
          <Badge variant={statusVariantMap[athlete.status] ?? 'gray'} size="sm">
            {athlete.status.toUpperCase()}
          </Badge>
        </div>

        {/* Athlete Name & Photo */}
        <div className="flex items-start gap-3.5 mb-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
              isBright
                ? 'bg-slate-900 text-rose-500 ring-2 ring-red-500/20'
                : 'bg-slate-900 text-rose-500 ring-2 ring-red-500/30'
            }`}
          >
            {athlete.fullName.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <h3
              className={`font-bold text-base leading-tight transition ${
                isBright
                  ? 'text-slate-900 group-hover:text-red-600'
                  : 'text-white group-hover:text-rose-400'
              }`}
            >
              {athlete.fullName}
            </h3>
            <div
              className={`text-xs mt-1 flex items-center gap-2 ${
                isBright ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              <span>{age} yrs</span>
              <span>•</span>
              <span className="capitalize">{athlete.sex}</span>
              <span>•</span>
              <span className="truncate max-w-[120px]">{athlete.trainingSquad}</span>
            </div>
          </div>
        </div>

        {/* Events Hierarchy */}
        <div
          className={`space-y-2 mb-4 p-2.5 rounded-lg border text-xs ${
            isBright
              ? 'bg-slate-50/70 border-slate-100 text-slate-700'
              : 'bg-slate-950 border-slate-800/80 text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={isBright ? 'text-slate-500 font-medium' : 'text-slate-400 font-medium'}>
              Primary Event:
            </span>
            <span
              className={`font-bold px-2 py-0.5 rounded border ${
                isBright
                  ? 'text-red-700 bg-red-50 border-red-200'
                  : 'text-rose-300 bg-red-950/40 border-red-500/30'
              }`}
            >
              {athlete.primaryEventName}
            </span>
          </div>
          {athlete.secondaryEventNames.length > 0 && (
            <div className="flex items-center justify-between">
              <span className={isBright ? 'text-slate-500 font-medium' : 'text-slate-400 font-medium'}>
                Secondary:
              </span>
              <span
                className={`font-medium truncate max-w-[150px] ${
                  isBright ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                {athlete.secondaryEventNames.join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Current Body Measurements */}
        <div
          className={`grid grid-cols-2 gap-2 text-xs mb-4 p-2 rounded border ${
            isBright
              ? 'bg-slate-50/70 border-slate-100 text-slate-600'
              : 'bg-slate-950 border-slate-800 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Ruler className={isBright ? 'w-3.5 h-3.5 text-slate-400' : 'w-3.5 h-3.5 text-slate-500'} />
            <span>{athlete.currentMeasurements?.heightCm ?? '—'} cm</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Weight className={isBright ? 'w-3.5 h-3.5 text-slate-400' : 'w-3.5 h-3.5 text-slate-500'} />
            <span>{athlete.currentMeasurements?.weightKg ?? '—'} kg</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div
        className={`pt-3 border-t flex items-center justify-between gap-2 ${
          isBright ? 'border-slate-100' : 'border-slate-800'
        }`}
      >
        <button
          onClick={() => onSelect(athlete)}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-bold py-2 px-3 rounded-lg transition ${
            isBright
              ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
              : 'bg-slate-900 border border-slate-700 text-white hover:bg-slate-800'
          }`}
        >
          View Profile
          <ChevronRight className="w-3.5 h-3.5 text-rose-400" />
        </button>

        {userRole !== 'ATHLETE' && onNewAssessment && (
          <button
            onClick={() => onNewAssessment(athlete)}
            title="Create Fitness Assessment"
            className={`p-2 rounded-lg border transition ${
              isBright
                ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                : 'bg-red-950/30 hover:bg-red-950/60 text-rose-400 border-red-500/30'
            }`}
          >
            <Activity className="w-4 h-4" />
          </button>
        )}

        {userRole !== 'ATHLETE' && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(athlete);
            }}
            title="Remove Athlete"
            aria-label={`Remove ${athlete.fullName}`}
            className={`p-2 rounded-lg border transition ${
              isBright
                ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'
                : 'bg-red-950/20 hover:bg-red-900/40 text-rose-500 border-red-900/40'
            }`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
