import React from 'react';

export default function CaseDetailsModal({
  selectedCase,
  onClose,
  onEdit,
  onDelete,
  onAddFollowUp,
}) {
  if (!selectedCase) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden my-6 border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-indigo-950 text-white px-6 py-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Case Details
              </span>
              {selectedCase.sNo !== undefined && selectedCase.sNo !== null && (
                <span className="rounded-full bg-indigo-800/80 px-2.5 py-0.5 text-xs font-semibold text-indigo-200">
                  S.No #{selectedCase.sNo}
                </span>
              )}
            </div>
            <h3 className="text-2xl font-bold mt-1 text-white">
              {selectedCase.inmate?.name || 'Inmate Case Profile'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-light cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm">
          {/* Top Quick Status Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-200">
            <div>
              <span className="block text-xs font-bold text-gray-400 uppercase">First Contact</span>
              <span className="font-semibold text-gray-900">
                {selectedCase.dateOfFirstContact
                  ? new Date(selectedCase.dateOfFirstContact).toLocaleDateString()
                  : '-'}
              </span>
            </div>
            <div>
              <span className="block text-xs font-bold text-gray-400 uppercase">Past Case History</span>
              <span
                className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  selectedCase.inmate?.pastCaseHistory === 'Yes'
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-gray-200 text-gray-700 border-gray-300'
                }`}
              >
                {selectedCase.inmate?.pastCaseHistory === 'Yes' ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="block text-xs font-bold text-gray-400 uppercase">Discovery Mode</span>
              <span className="font-semibold text-gray-900">
                {selectedCase.discovery?.mode || 'Outside Prison'}
              </span>
            </div>
          </div>

          {/* Inmate & Offences Section */}
          <div className="rounded-2xl border border-gray-200 p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Inmate & Offences
            </h4>
            <div>
              <span className="text-xs font-medium text-gray-500 block mb-1">Offence Type(s):</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedCase.inmate?.offenceType && selectedCase.inmate.offenceType.length > 0 ? (
                  selectedCase.inmate.offenceType.map((off, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 border border-indigo-100"
                    >
                      {off}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400 italic">None recorded</span>
                )}
              </div>
            </div>
            {selectedCase.inmate?.otherOffence && (
              <div className="rounded-xl bg-amber-50/70 p-3 border border-amber-100 text-xs text-amber-900">
                <strong className="block font-semibold mb-0.5">Other Offence Details:</strong>
                <p className="whitespace-pre-wrap">{selectedCase.inmate.otherOffence}</p>
              </div>
            )}
          </div>

          {/* Contact Person Section */}
          <div className="rounded-2xl border border-gray-200 p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Contact Person Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-medium text-gray-500 block">Name:</span>
                <span className="font-semibold text-gray-900">
                  {selectedCase.contactPerson?.name || 'Not provided'}
                </span>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 block">Relationship:</span>
                <span className="font-semibold text-gray-900">
                  {selectedCase.contactPerson?.relationshipWithInmate || 'Not provided'}
                  {selectedCase.contactPerson?.otherRelationship && (
                    <span className="text-gray-500 italic ml-1">
                      ({selectedCase.contactPerson.otherRelationship})
                    </span>
                  )}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-xs font-medium text-gray-500 block">Phone Numbers:</span>
                <span className="font-semibold text-indigo-600">
                  {selectedCase.contactPerson?.phoneNumbers?.length > 0
                    ? selectedCase.contactPerson.phoneNumbers.join(', ')
                    : 'No numbers registered'}
                </span>
              </div>
            </div>
          </div>

          {/* Discovery Details Section */}
          <div className="rounded-2xl border border-gray-200 p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Case Discovery Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-medium text-gray-500 block">Mode:</span>
                <span className="font-semibold text-gray-900">
                  {selectedCase.discovery?.mode || 'Outside Prison'}
                </span>
                {selectedCase.discovery?.otherMode && (
                  <p className="text-xs text-gray-600 mt-1 italic">
                    Note: {selectedCase.discovery.otherMode}
                  </p>
                )}
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 block">Source of Discovery:</span>
                <span className="font-semibold text-gray-900">
                  {selectedCase.discovery?.sourceOfDiscovery || 'Not recorded'}
                </span>
              </div>
            </div>
          </div>

          {/* Follow-up Timeline */}
          <div className="rounded-2xl border border-gray-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Follow-Up History ({selectedCase.followUps?.length || 0})
              </h4>
              <button
                onClick={() => onAddFollowUp(selectedCase)}
                className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition cursor-pointer"
              >
                + Add Follow-Up
              </button>
            </div>

            {selectedCase.followUps && selectedCase.followUps.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedCase.followUps.map((fu, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl bg-gray-50 p-3 text-xs border border-gray-200 text-gray-800"
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>Round {fu.round}</span>
                      <span className="text-gray-500">
                        {fu.date ? new Date(fu.date).toLocaleDateString() : '-'}
                      </span>
                    </div>
                    <div className="mt-1">
                      Status:{' '}
                      <span className="font-semibold text-indigo-700">{fu.callStatus}</span>
                    </div>
                    {fu.notes && (
                      <p className="mt-1 text-gray-600 italic bg-white p-2 rounded-lg border border-gray-100">
                        "{fu.notes}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No follow-ups recorded yet.</p>
            )}
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between gap-3">
          <button
            onClick={() => onDelete(selectedCase._id)}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer"
          >
            Delete Record
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onEdit(selectedCase)}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition cursor-pointer shadow-sm"
            >
              Edit Case Details
            </button>
            <button
              onClick={onClose}
              className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
