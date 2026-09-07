import React from 'react';

export default function OutreachCard({ item, onSelect }) {
  return (
    <div
      onClick={() => onSelect(item)}
      className="group relative flex flex-col justify-between rounded-3xl bg-white p-6 border border-gray-200 shadow-xs hover:shadow-xl hover:border-indigo-500 hover:-translate-y-1 transition-all duration-200 cursor-pointer min-h-[260px]"
    >
      {/* Top: Date & S.No badge */}
      <div>
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {item.dateOfFirstContact
              ? new Date(item.dateOfFirstContact).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : 'No date'}
          </span>
          {item.sNo !== undefined && item.sNo !== null && (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-600">
              #{item.sNo}
            </span>
          )}
        </div>

        {/* Inmate Name */}
        <div className="mt-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Inmate Name
          </span>
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition truncate">
            {item.inmate?.name || 'Unnamed Inmate'}
          </h3>
        </div>

        {/* Offence Type(s) */}
        <div className="mt-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
            Offence Type
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-hidden">
            {item.inmate?.offenceType && item.inmate.offenceType.length > 0 ? (
              item.inmate.offenceType.slice(0, 3).map((off, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 border border-indigo-100"
                >
                  {off}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400 italic">No offences specified</span>
            )}
            {item.inmate?.offenceType && item.inmate.offenceType.length > 3 && (
              <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                +{item.inmate.offenceType.length - 3} more
              </span>
            )}
            {item.inmate?.otherOffence && (
              <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200 truncate max-w-[160px]">
                Other: {item.inmate.otherOffence}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Bottom: Click prompt & Follow-up pill */}
      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
        <span className="font-semibold text-indigo-600 group-hover:translate-x-1 transition flex items-center gap-1">
          View Details
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </span>
        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-100">
          {item.followUps?.length || 0} Follow-up{item.followUps?.length === 1 ? '' : 's'}
        </span>
      </div>
    </div>
  );
}
