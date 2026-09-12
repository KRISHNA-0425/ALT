import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { apiInstance } from '../../App';
import { useAuthStore } from '../../store/useAuthStore';
import { ADVOCATE_SPECIALIZATION_OPTIONS } from './constants';

export default function AssignAdvocateSection({ formData, setFormData }) {
  const token = useAuthStore((state) => state.token);

  // Extract detected offence from formData
  const primaryOffence = Array.isArray(formData.inmate?.offenceType) && formData.inmate.offenceType.length > 0
    ? formData.inmate.offenceType[0]
    : typeof formData.inmate?.offenceType === 'string' && formData.inmate.offenceType
    ? formData.inmate.offenceType
    : formData.inmate?.otherOffence || '';

  const [selectedOffence, setSelectedOffence] = useState(primaryOffence || 'Attempt to Murder');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [topAdvocates, setTopAdvocates] = useState([]);
  const [targetSpecialization, setTargetSpecialization] = useState('');
  const [isFallback, setIsFallback] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAllModal, setShowAllModal] = useState(false);
  const [allAdvocates, setAllAdvocates] = useState([]);

  // Fetch top 3 advocates whenever offence or specialization changes
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
      setAllAdvocates(res.data.allMatching || []);
      setTargetSpecialization(res.data.targetSpecialization || '');
      setIsFallback(Boolean(res.data.isFallback));
    } catch (err) {
      console.error('Error fetching top advocates:', err);
      setError(err.response?.data?.message || 'Failed to load specialized advocates');
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
  };

  const handleUnassignAdvocate = () => {
    setFormData({
      ...formData,
      assignedAdvocate: null,
    });
  };

  const currentAssigned = formData.assignedAdvocate;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            Assign an Advocate
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Automated matchmaking recommending top 3 advocates specialized in the inmate's alleged offence.
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
        <div className="rounded-2xl bg-amber-50/80 border border-amber-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              ⚖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-md">
                  Currently Assigned
                </span>
                <span className="text-xs font-mono font-semibold text-gray-600">{currentAssigned.userID}</span>
              </div>
              <p className="text-base font-bold text-gray-900 mt-0.5">
                Adv. {currentAssigned.name}
              </p>
              <p className="text-xs text-gray-600">
                Specialization: <strong className="text-gray-800">{currentAssigned.specialization}</strong> • Court: <strong className="text-gray-800">{currentAssigned.practiceCourt}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleUnassignAdvocate}
            className="px-3.5 py-1.5 rounded-xl border border-rose-200 bg-white text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer shadow-2xs whitespace-nowrap"
          >
            Remove / Unassign
          </button>
        </div>
      )}

      {/* Detected Offence Notice */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-700">
        <div>
          <span>Case Offence: </span>
          <strong className="text-indigo-700 font-bold">{selectedOffence || 'Attempt to Murder'}</strong>
          <span className="mx-2 text-gray-300">|</span>
          <span>Matched Specialization: </span>
          <strong className="text-purple-700 font-bold">{targetSpecialization || 'Murder'}</strong>
          {isFallback && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
              ⚡ Top Overall Advocates (Unspecialized Offence)
            </span>
          )}
        </div>
        <span className="text-gray-400 text-[11px]">Ranked by Win Rate & Cases Won</span>
      </div>

      {/* Top 3 Advocates Recommendation Cards */}
      {loading ? (
        <div className="p-12 text-center text-gray-500 text-sm">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-amber-600 border-r-transparent mb-2"></div>
          <p>Finding top specialized advocates...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center text-xs text-red-600">
          {error}
        </div>
      ) : topAdvocates.length === 0 ? (
        <div className="p-8 border border-dashed border-gray-200 rounded-2xl text-center text-gray-500 text-xs">
          No advocates found for specialization "{targetSpecialization || selectedOffence}". You can choose another specialization from the selector above.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topAdvocates.map((advocate, idx) => {
            const isAssigned = currentAssigned?.userID === advocate.userID || currentAssigned?.advocateId === advocate._id;
            const rankLabel = idx === 0 ? '🏆 #1 Top Match' : idx === 1 ? '⭐ #2 Specialist' : '🎯 #3 Recommended';
            const rankBadgeColor =
              idx === 0
                ? 'bg-amber-100 text-amber-800 border-amber-200'
                : idx === 1
                ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                : 'bg-blue-100 text-blue-800 border-blue-200';

            return (
              <div
                key={advocate._id || advocate.userID}
                className={`relative rounded-2xl p-5 border flex flex-col justify-between transition-all duration-200 ${
                  isAssigned
                    ? 'bg-amber-50/50 border-amber-400 shadow-md ring-2 ring-amber-400'
                    : 'bg-white border-gray-200 hover:border-amber-300 hover:shadow-sm'
                }`}
              >
                <div>
                  {/* Top Badge Row */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${rankBadgeColor}`}>
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

                  {/* Specialization Tag */}
                  <div className="mt-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                      ⚖ {advocate.specialization}
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
                      Assigned to Case
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAssignAdvocate(advocate)}
                      className="w-full py-2 px-3 rounded-xl bg-gray-900 hover:bg-amber-600 text-white text-xs font-semibold transition cursor-pointer shadow-2xs flex items-center justify-center gap-1"
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

      {/* Button to view all matching advocates */}
      {allAdvocates.length > 3 && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setShowAllModal(!showAllModal)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer underline"
          >
            {showAllModal ? 'Hide additional advocates' : `View all ${allAdvocates.length} advocates specialized in ${targetSpecialization}`}
          </button>
        </div>
      )}

      {/* Expanded list of other matching advocates */}
      {showAllModal && (
        <div className="mt-3 p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
          <p className="text-xs font-bold text-gray-700 mb-2">
            All Advocates specialized in {targetSpecialization} ({allAdvocates.length})
          </p>
          <div className="max-h-60 overflow-y-auto divide-y divide-gray-200">
            {allAdvocates.map((advocate, i) => {
              const isAssigned = currentAssigned?.userID === advocate.userID;
              return (
                <div key={advocate.userID} className="py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-gray-900">
                      #{i + 1} Adv. {advocate.name} <span className="font-mono text-gray-500 font-normal">({advocate.userID})</span>
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {advocate.practiceCourt} • {advocate.yearsOfExperience} yrs exp • {advocate.casesWon}/{advocate.casesTaken} won ({advocate.winRate}%)
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isAssigned}
                    onClick={() => handleAssignAdvocate(advocate)}
                    className={`px-3 py-1 text-xs rounded-lg font-semibold transition cursor-pointer ${
                      isAssigned
                        ? 'bg-emerald-100 text-emerald-800 cursor-default'
                        : 'bg-gray-800 text-white hover:bg-amber-600'
                    }`}
                  >
                    {isAssigned ? 'Assigned' : 'Assign'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
