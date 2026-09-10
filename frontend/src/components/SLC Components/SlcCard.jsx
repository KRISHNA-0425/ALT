import React from 'react';
import { useSlcStore } from '../../store/useSlcStore';

export default function SlcCard({ item }) {
  const { openEditModal, openFollowUpModal, handleDelete } = useSlcStore();

  const getTierBadge = (tier) => {
    switch (tier) {
      case 'Tier 1 (High Priority)':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Tier 2 (Low Priority)':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Tier 3 (Complex)':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Tier 0 (Data Needed)':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getCrimeCategoryBadge = (category) => {
    switch (category) {
      case 'Heinous':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Non-Heinous':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const contactPhone =
    item.familyMember?.phoneNumber ||
    (Array.isArray(item.contactPerson?.phoneNumbers)
      ? item.contactPerson.phoneNumbers.join(', ')
      : item.contactPerson?.phoneNumbers || '');

  const contactName = item.familyMember?.name || item.contactPerson?.name || 'N/A';
  const relationship =
    item.familyMember?.relationshipWithInmate ||
    item.contactPerson?.relationshipWithInmate ||
    'Family';

  const rawDate = item.dateOfContact || item.dateOfFirstContact;
  const formattedDate = rawDate
    ? new Date(rawDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'No Date';

  const hasSlcData = Boolean(item.slcNo || item.tier || item.legalAssessment?.crimeCategory);

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl bg-white p-6 border border-gray-200 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all duration-200">
      {/* Top Meta Bar */}
      <div>
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-100">
              {item.slcNo ? `SLC #${item.slcNo}` : `OutReach #${item.sNo || '—'}`}
            </span>
            {hasSlcData ? (
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
                SLC Enriched
              </span>
            ) : (
              <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-200">
                Pending SLC Assessment
              </span>
            )}
          </div>
          <span className="text-xs font-medium text-gray-400">{formattedDate}</span>
        </div>

        {/* Inmate & Family Details */}
        <div className="mt-4">
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
            {item.inmate?.name || 'Unnamed Inmate'}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Contact: <strong className="text-gray-700">{contactName}</strong> ({relationship})
          </p>
          {contactPhone && (
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {contactPhone}
            </p>
          )}
        </div>

        {/* Badges: Tier & Crime Category */}
        <div className="mt-4 flex flex-wrap gap-2">
          {item.tier ? (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getTierBadge(item.tier)}`}>
              {item.tier}
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-600 border border-gray-200 px-2.5 py-0.5 text-xs font-medium">
              No Tier Assigned
            </span>
          )}

          {item.legalAssessment?.crimeCategory && (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getCrimeCategoryBadge(item.legalAssessment.crimeCategory)}`}>
              {item.legalAssessment.crimeCategory}
            </span>
          )}

          {item.prisonDetails?.prisonerType && (
            <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 text-xs font-medium">
              {item.prisonDetails.prisonerType}
            </span>
          )}

          {item.attachedFiles?.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 text-xs font-semibold" title={`${item.attachedFiles.length} document(s) uploaded`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              {item.attachedFiles.length} {item.attachedFiles.length === 1 ? 'Doc' : 'Docs'}
            </span>
          )}
        </div>

        {/* Case Info Summary */}
        <div className="mt-4 rounded-xl bg-gray-50 p-3 text-xs space-y-1 text-gray-600 border border-gray-100">
          <div className="flex justify-between">
            <span className="text-gray-400">Offence:</span>
            <span className="font-medium text-gray-800 truncate max-w-[170px]">
              {item.inmate?.offenceType?.length ? item.inmate.offenceType.join(', ') : 'Not specified'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">FIR No:</span>
            <span className="font-medium text-gray-800">{item.caseDetails?.firNumber || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Court:</span>
            <span className="font-medium text-gray-800">{item.caseDetails?.court || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">POC:</span>
            <span className="font-medium text-gray-800">{item.poc || 'Unassigned'}</span>
          </div>
        </div>
      </div>

      {/* Footer & Actions */}
      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          {item.followUps?.length || 0} {item.followUps?.length === 1 ? 'call' : 'calls'}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openFollowUpModal(item)}
            className="rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2.5 py-1.5 text-xs font-medium transition cursor-pointer border border-emerald-200"
            title="Log follow-up call"
          >
            + Call
          </button>
          <button
            type="button"
            onClick={() => openEditModal(item)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer border ${
              hasSlcData
                ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-500 border-indigo-600 shadow-xs'
            }`}
          >
            {hasSlcData ? 'Edit Information' : '+ Add Information'}
          </button>
          <button
            type="button"
            onClick={() => handleDelete(item._id)}
            className="rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 transition cursor-pointer"
            title="Delete record"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
