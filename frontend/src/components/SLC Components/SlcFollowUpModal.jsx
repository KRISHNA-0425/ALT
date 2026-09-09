import React from 'react';
import { useSlcStore } from '../../store/useSlcStore';

export default function SlcFollowUpModal() {
  const {
    isFollowUpModalOpen,
    activeSlcRecord,
    followUpData,
    setFollowUpData,
    closeFollowUpModal,
    handleFollowUpSubmit,
  } = useSlcStore();

  if (!isFollowUpModalOpen || !activeSlcRecord) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Log Socio-Legal Follow-up
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Inmate: <strong className="text-gray-700">{activeSlcRecord.inmate?.name}</strong> (SLC #{activeSlcRecord.slcNo || '—'})
            </p>
          </div>
          <button
            type="button"
            onClick={closeFollowUpModal}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1.5 transition cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFollowUpSubmit} className="mt-4 space-y-4 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Follow-up Round #
              </label>
              <input
                type="number"
                min="1"
                value={followUpData.followUpNumber}
                onChange={(e) =>
                  setFollowUpData({ ...followUpData, followUpNumber: Number(e.target.value) })
                }
                required
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Point of Contact (POC)
              </label>
              <input
                type="text"
                placeholder="e.g. Aayushee, Tanishqua"
                value={followUpData.poc}
                onChange={(e) => setFollowUpData({ ...followUpData, poc: e.target.value })}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Call Date
              </label>
              <input
                type="date"
                value={followUpData.callDate}
                onChange={(e) => setFollowUpData({ ...followUpData, callDate: e.target.value })}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Scheduled Next Date
              </label>
              <input
                type="date"
                value={followUpData.scheduledDate}
                onChange={(e) => setFollowUpData({ ...followUpData, scheduledDate: e.target.value })}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Document Bottleneck (if any)
            </label>
            <input
              type="text"
              placeholder="e.g. Waiting for Chargesheet copy from court clerk"
              value={followUpData.documentBottleneck}
              onChange={(e) =>
                setFollowUpData({ ...followUpData, documentBottleneck: e.target.value })
              }
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Support Provided / Call Notes
            </label>
            <textarea
              rows="4"
              placeholder="Details of the counselling provided, discussions with advocate or family..."
              value={followUpData.notes}
              onChange={(e) => setFollowUpData({ ...followUpData, notes: e.target.value })}
              className="w-full rounded-xl border border-gray-300 p-3 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            ></textarea>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeFollowUpModal}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition cursor-pointer"
            >
              Save Follow-up Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
