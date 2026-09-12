import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { apiInstance } from '../../App';
import { useAuthStore } from '../../store/useAuthStore';
import { useSlcStore } from '../../store/useSlcStore';
import { ADVOCATE_SPECIALIZATION_OPTIONS } from './constants';

export default function AssignAdvocateSection({ formData, setFormData }) {
  const token = useAuthStore((state) => state.token);
  const currentId = useSlcStore((state) => state.currentId);
  const fetchSlcRecords = useSlcStore((state) => state.fetchSlcRecords);

  // Extract detected offence from formData
  const primaryOffence = Array.isArray(formData.inmate?.offenceType) && formData.inmate.offenceType.length > 0
    ? formData.inmate.offenceType[0]
    : typeof formData.inmate?.offenceType === 'string' && formData.inmate.offenceType
    ? formData.inmate.offenceType
    : formData.inmate?.otherOffence || '';

  const [selectedOffence, setSelectedOffence] = useState(primaryOffence || 'Attempt to Murder');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [topAdvocates, setTopAdvocates] = useState([]);
  const [allAvailableOverall, setAllAvailableOverall] = useState([]);
  const [busyAdvocates, setBusyAdvocates] = useState([]);
  const [targetSpecialization, setTargetSpecialization] = useState('');
  const [isFallback, setIsFallback] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unassigning, setUnassigning] = useState(false);
  const [error, setError] = useState(null);

  // Full Directory Selector State
  const [showAllDirectory, setShowAllDirectory] = useState(false);
  const [directorySearch, setDirectorySearch] = useState('');
  const [directorySpecFilter, setDirectorySpecFilter] = useState('All');
  const [directoryCourtFilter, setDirectoryCourtFilter] = useState('All');
  const [showBusyList, setShowBusyList] = useState(false);

  // Fetch top 3 currently available advocates and available directory pool
  const fetchTopAdvocates = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedSpecialization && selectedSpecialization !== 'All') {
        params.append('specialization', selectedSpecialization);
      } else if (selectedOffence) {
        params.append('offence', selectedOffence);
      }

      const res = await axios.get(`${apiInstance}/advocates/top?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTopAdvocates(res.data.topAdvocates || []);
      setAllAvailableOverall(res.data.allAvailableOverall || []);
      setBusyAdvocates(res.data.busyAdvocates || []);
      setTargetSpecialization(res.data.targetSpecialization || '');
      setIsFallback(Boolean(res.data.isFallback));
    } catch (err) {
      console.error('Error fetching available advocates:', err);
      setError(err.response?.data?.message || 'Failed to load available advocates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTopAdvocates();
    }
  }, [token, selectedOffence, selectedSpecialization]);

  // Synchronize when inmate primary offence changes
  useEffect(() => {
    if (primaryOffence && primaryOffence !== selectedOffence) {
      setSelectedOffence(primaryOffence);
    }
  }, [primaryOffence]);

  const handleAssignAdvocate = (advocate) => {
    setFormData({
      ...formData,
      assignedAdvocate: {
        advocateId: advocate._id,
        name: advocate.name,
        userID: advocate.userID,
        specialization: advocate.specialization,
        practiceCourt: advocate.practiceCourt,
        yearsOfExperience: advocate.yearsOfExperience,
        casesWon: advocate.casesWon,
        casesTaken: advocate.casesTaken,
        assignedAt: new Date().toISOString(),
      },
      caseDetails: {
        ...formData.caseDetails,
        lawyerType: 'Private Lawyer',
      },
    });
    toast.success(`Adv. ${advocate.name} (${advocate.userID}) selected for this case!`);
  };

  const handleUnassignAdvocate = async () => {
    try {
      setUnassigning(true);
      const caseIdToUnassign = currentId || formData._id;

      if (caseIdToUnassign) {
        await axios.post(
          `${apiInstance}/advocates/cases/${caseIdToUnassign}/unassign`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Advocate unassigned. Advocate is now free for new cases.');
        if (fetchSlcRecords) fetchSlcRecords();
      } else {
        toast.success('Advocate removed from form.');
      }

      setFormData({
        ...formData,
        assignedAdvocate: null,
      });

      // Refresh available pool so the freed advocate is immediately available
      await fetchTopAdvocates();
    } catch (err) {
      console.error('Error unassigning advocate:', err);
      toast.error(err.response?.data?.message || 'Failed to unassign advocate');
    } finally {
      setUnassigning(false);
    }
  };

  // Distinct practice courts for directory filter
  const courtOptions = useMemo(() => {
    const courts = new Set();
    allAvailableOverall.forEach((adv) => {
      if (adv.practiceCourt) courts.add(adv.practiceCourt);
    });
    return Array.from(courts).sort();
  }, [allAvailableOverall]);

  // Filtered list of advocates for the full directory picker
  const filteredDirectoryAdvocates = useMemo(() => {
    const q = directorySearch.trim().toLowerCase();
    return allAvailableOverall.filter((adv) => {
      if (directorySpecFilter !== 'All' && adv.specialization !== directorySpecFilter) {
        return false;
      }
      if (directoryCourtFilter !== 'All' && adv.practiceCourt !== directoryCourtFilter) {
        return false;
      }
      if (q) {
        const nameMatch = adv.name?.toLowerCase().includes(q);
        const userMatch = adv.userID?.toLowerCase().includes(q);
        const specMatch = adv.specialization?.toLowerCase().includes(q);
        const courtMatch = adv.practiceCourt?.toLowerCase().includes(q);
        if (!nameMatch && !userMatch && !specMatch && !courtMatch) return false;
      }
      return true;
    });
  }, [allAvailableOverall, directorySearch, directorySpecFilter, directoryCourtFilter]);

  const currentAssigned = formData.assignedAdvocate;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
              />
            </svg>
            Assign an Advocate
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Select any currently available advocate or choose from the top 3 recommended specialists. Busy advocates are excluded until free.
          </p>
        </div>

        {/* Selected Offence / Field Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="specialization-filter" className="text-xs font-semibold text-gray-600 whitespace-nowrap">
            Specialization:
          </label>
          <select
            id="specialization-filter"
            value={selectedSpecialization || targetSpecialization || ''}
            onChange={(e) => setSelectedSpecialization(e.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 font-semibold focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none cursor-pointer"
          >
            <option value="">Auto-detected ({targetSpecialization || 'Offence'})</option>
            {ADVOCATE_SPECIALIZATION_OPTIONS.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Currently Assigned Advocate Status Banner */}
      {currentAssigned && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
              ⚖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md border border-amber-300">
                  Currently Assigned
                </span>
                <span className="text-xs font-mono font-bold text-gray-700">{currentAssigned.userID}</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Active on this case
                </span>
              </div>
              <p className="text-base font-extrabold text-gray-900 mt-0.5">
                Adv. {currentAssigned.name}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                Specialization: <strong className="text-gray-800">{currentAssigned.specialization}</strong> • Court:{' '}
                <strong className="text-gray-800">{currentAssigned.practiceCourt}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={unassigning}
            onClick={handleUnassignAdvocate}
            className="px-4 py-2 rounded-xl border border-rose-300 bg-white text-xs font-bold text-rose-600 hover:bg-rose-50 hover:border-rose-400 transition cursor-pointer shadow-xs whitespace-nowrap flex items-center gap-1.5 disabled:opacity-50"
          >
            {unassigning ? (
              <>
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-600 border-r-transparent"></span>
                Unassigning...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Remove / Unassign Advocate
              </>
            )}
          </button>
        </div>
      )}

      {/* Case Offence & Matched Specialization Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-700">
        <div className="flex items-center flex-wrap gap-1.5">
          <span>Case Offence:</span>
          <strong className="text-indigo-700 font-bold">{selectedOffence || 'Attempt to Murder'}</strong>
          <span className="mx-1.5 text-gray-300">|</span>
          <span>Matched Field:</span>
          <strong className="text-purple-700 font-bold">{targetSpecialization || 'Murder'}</strong>
          {isFallback && (
            <span className="ml-1.5 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
              ⚡ Top Overall Available Advocates
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {allAvailableOverall.length} Available Advocates
          </span>
          {busyAdvocates.length > 0 && (
            <button
              type="button"
              onClick={() => setShowBusyList(!showBusyList)}
              className="text-[11px] font-semibold text-gray-500 hover:text-gray-800 underline cursor-pointer"
            >
              {busyAdvocates.length} Busy
            </button>
          )}
        </div>
      </div>

      {/* Busy Advocates Information Accordion */}
      {showBusyList && busyAdvocates.length > 0 && (
        <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs animate-in fade-in duration-100">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-gray-700">
              Advocates Currently Assigned to Other Cases ({busyAdvocates.length})
            </span>
            <span className="text-[11px] text-gray-500">
              Excluded from selection until free
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-36 overflow-y-auto">
            {busyAdvocates.map((b) => (
              <div key={b.advocateUserID || b.caseId} className="p-2 bg-white rounded-lg border border-gray-200 text-[11px]">
                <p className="font-bold text-gray-800">Adv. {b.advocateName} <span className="font-mono text-gray-500">({b.advocateUserID})</span></p>
                <p className="text-gray-500 text-[10px] mt-0.5">Handling: <strong className="text-gray-700">{b.inmateName}</strong> ({b.caseNumber})</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section Title: Top 3 Recommended Available Advocates */}
      <div className="flex items-center justify-between">
        <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
          <span>Top 3 Recommended Advocates Currently Available</span>
          <span className="text-[10px] lowercase font-normal text-gray-400">(ranked by win rate, cases won & exp)</span>
        </h5>
      </div>

      {/* Top 3 Advocates Recommendation Cards */}
      {loading ? (
        <div className="p-10 text-center text-gray-500 text-sm">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-amber-600 border-r-transparent mb-2"></div>
          <p>Finding top available specialized advocates...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center text-xs text-red-600">
          {error}
        </div>
      ) : topAdvocates.length === 0 ? (
        <div className="p-8 border border-dashed border-gray-300 rounded-2xl text-center text-gray-500 text-xs bg-gray-50/50">
          <p className="font-semibold text-gray-700">No free advocates currently available in {targetSpecialization || selectedOffence}.</p>
          <p className="mt-1 text-gray-500">You can select any available advocate from the directory below.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topAdvocates.map((advocate, idx) => {
            const isAssigned = currentAssigned?.userID === advocate.userID || currentAssigned?.advocateId === advocate._id;
            const rankLabel = idx === 0 ? '🏆 #1 Top Match' : idx === 1 ? '⭐ #2 Specialist' : '🎯 #3 Recommended';
            const rankBadgeColor =
              idx === 0
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : idx === 1
                ? 'bg-indigo-100 text-indigo-900 border-indigo-200'
                : 'bg-blue-100 text-blue-900 border-blue-200';

            return (
              <div
                key={advocate._id || advocate.userID}
                className={`relative rounded-2xl p-5 border flex flex-col justify-between transition-all duration-200 ${
                  isAssigned
                    ? 'bg-amber-50/60 border-amber-400 shadow-md ring-2 ring-amber-400'
                    : 'bg-white border-gray-200 hover:border-amber-400 hover:shadow-sm'
                }`}
              >
                <div>
                  {/* Top Badge Row */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${rankBadgeColor}`}>
                      {rankLabel}
                    </span>
                    <span className="font-mono text-xs font-semibold text-gray-500">
                      {advocate.userID}
                    </span>
                  </div>

                  {/* Advocate Name & Court */}
                  <h5 className="text-base font-bold text-gray-900 leading-tight">
                    Adv. {advocate.name}
                  </h5>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1" title={advocate.practiceCourt}>
                    📍 {advocate.practiceCourt}
                  </p>

                  {/* Specialization Tag & Availability Status */}
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                      ⚖ {advocate.specialization}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Free
                    </span>
                  </div>

                  {/* Statistics Box */}
                  <div className="mt-4 grid grid-cols-3 gap-2 bg-gray-50/80 rounded-xl p-2.5 border border-gray-100 text-center">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-semibold">Exp.</p>
                      <p className="text-xs font-bold text-gray-800 mt-0.5">{advocate.yearsOfExperience}y</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-semibold">Won</p>
                      <p className="text-xs font-bold text-emerald-600 mt-0.5">{advocate.casesWon}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-semibold">Win Rate</p>
                      <p className="text-xs font-bold text-indigo-700 mt-0.5">{advocate.winRate}%</p>
                    </div>
                  </div>
                </div>

                {/* Assignment Button */}
                <div className="mt-5">
                  {isAssigned ? (
                    <div className="w-full py-2 px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                      Assigned to this Case
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAssignAdvocate(advocate)}
                      className="w-full py-2.5 px-3 rounded-xl bg-gray-900 hover:bg-amber-600 text-white text-xs font-bold transition cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Assign Advocate
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Directory Browser Toggle / Action */}
      <div className="pt-2 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4">
          <div>
            <h5 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
              <span>🔍</span>
              Want to choose a different advocate?
            </h5>
            <p className="text-[11px] text-indigo-800/80 mt-0.5">
              Browse and select any advocate from the full Bar directory ({allAvailableOverall.length} available advocates ready to take cases).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAllDirectory(!showAllDirectory)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer shadow-xs whitespace-nowrap"
          >
            {showAllDirectory ? 'Hide Full Directory' : `Browse All Available Advocates (${allAvailableOverall.length})`}
          </button>
        </div>

        {/* Full Directory Selector Modal / Accordion */}
        {showAllDirectory && (
          <div className="mt-4 p-5 bg-gray-50/90 rounded-2xl border border-gray-200 space-y-4 animate-in fade-in duration-150">
            {/* Filter / Search Toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Search by Name, User ID, or Court:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aditi, ADV10001, Saket..."
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Filter by Specialization:
                </label>
                <select
                  value={directorySpecFilter}
                  onChange={(e) => setDirectorySpecFilter(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option value="All">All Specializations</option>
                  {ADVOCATE_SPECIALIZATION_OPTIONS.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Filter by Practice Court:
                </label>
                <select
                  value={directoryCourtFilter}
                  onChange={(e) => setDirectoryCourtFilter(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option value="All">All Practice Courts</option>
                  {courtOptions.map((court) => (
                    <option key={court} value={court}>
                      {court}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results Counter */}
            <div className="flex items-center justify-between text-xs text-gray-500 px-1 border-b border-gray-200 pb-2">
              <span>
                Showing <strong className="text-gray-800">{filteredDirectoryAdvocates.length}</strong> available advocate(s)
              </span>
              {(directorySearch || directorySpecFilter !== 'All' || directoryCourtFilter !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setDirectorySearch('');
                    setDirectorySpecFilter('All');
                    setDirectoryCourtFilter('All');
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Advocate Directory Grid */}
            {filteredDirectoryAdvocates.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500 bg-white rounded-xl border border-dashed border-gray-200">
                No available advocates match your search criteria.
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 bg-white rounded-xl border border-gray-200 shadow-2xs">
                {filteredDirectoryAdvocates.map((adv) => {
                  const isAssigned = currentAssigned?.userID === adv.userID;
                  return (
                    <div
                      key={adv.userID}
                      className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                        isAssigned ? 'bg-amber-50/50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-900">
                            Adv. {adv.name}
                          </span>
                          <span className="font-mono text-[11px] font-semibold text-gray-500">
                            ({adv.userID})
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            ⚖ {adv.specialization}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500">
                          📍 {adv.practiceCourt} • {adv.yearsOfExperience}y exp • {adv.casesWon}/{adv.casesTaken} won ({adv.winRate}% win rate)
                        </p>
                      </div>

                      <div>
                        {isAssigned ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-xl font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ✓ Assigned to this Case
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAssignAdvocate(adv)}
                            className="px-3.5 py-1.5 text-xs rounded-xl font-bold bg-gray-900 hover:bg-amber-600 text-white transition cursor-pointer shadow-2xs flex items-center gap-1"
                          >
                            Assign Advocate
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
