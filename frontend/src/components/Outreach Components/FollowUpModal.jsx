import React from 'react';
import { CALL_STATUS_OPTIONS } from './constants';

export default function FollowUpModal({
  isOpen,
  activeRecord,
  followUpData,
  onChangeFollowUpData,
  onClose,
  onSubmit,
}) {
  if (!isOpen || !activeRecord) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Follow-ups for {activeRecord.inmate?.name || `Record #${activeRecord.sNo || ''}`}
            </h3>
            <p className="text-xs text-gray-500">Record rounds, dates, status and observations</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-light cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Past follow-ups list */}
        {activeRecord.followUps && activeRecord.followUps.length > 0 && (
          <div className="max-h-40 overflow-y-auto space-y-2 border-b pb-3">
            <p className="text-xs font-bold text-gray-500 uppercase">Past Follow-Ups</p>
            {activeRecord.followUps.map((fu, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-gray-50 p-2.5 text-xs text-gray-700 border border-gray-200"
              >
                <div className="flex justify-between font-semibold">
                  <span>Round {fu.round}</span>
                  <span>{fu.date ? new Date(fu.date).toLocaleDateString() : '-'}</span>
                </div>
                <div className="text-gray-500 mt-0.5">Status: {fu.callStatus}</div>
                {fu.notes && <div className="text-gray-600 italic mt-0.5">"{fu.notes}"</div>}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700">Follow-up Round</label>
              <input
                type="number"
                min="1"
                required
                value={followUpData.round}
                onChange={(e) =>
                  onChangeFollowUpData({ ...followUpData, round: Number(e.target.value) })
                }
                className="mt-1 w-full rounded-xl border border-gray-300 p-2 text-sm focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700">Date</label>
              <input
                type="date"
                required
                value={followUpData.date}
                onChange={(e) =>
                  onChangeFollowUpData({ ...followUpData, date: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-gray-300 p-2 text-sm focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700">Call Status</label>
            <select
              value={followUpData.callStatus}
              onChange={(e) =>
                onChangeFollowUpData({ ...followUpData, callStatus: e.target.value })
              }
              className="mt-1 w-full rounded-xl border border-gray-300 p-2 text-sm focus:border-indigo-500 outline-none"
            >
              {CALL_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700">Notes / Details</label>
            <textarea
              rows="3"
              placeholder="Record summary of conversation, next steps, etc."
              value={followUpData.notes}
              onChange={(e) =>
                onChangeFollowUpData({ ...followUpData, notes: e.target.value })
              }
              className="mt-1 w-full rounded-xl border border-gray-300 p-2 text-sm focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500 cursor-pointer"
            >
              Save Follow-up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
