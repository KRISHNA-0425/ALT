import React, { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useSlcStore } from '../store/useSlcStore';
import SlcCard from './SLC Components/SlcCard';
import SlcFilterSection from './SLC Components/SlcFilterSection';
import SlcModal from './SLC Components/SlcModal';
import SlcFollowUpModal from './SLC Components/SlcFollowUpModal';

export default function SlcDashboard() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  const {
    slcList,
    loading,
    activeTab,
    setActiveTab,
    fetchSlcRecords,
    openCreateModal,
  } = useSlcStore();

  useEffect(() => {
    if (token) {
      fetchSlcRecords();
    }
  }, [token]);

  // Derived statistics
  const tier1Count = slcList.filter((i) => i.tier === 'Tier 1 (High Priority)').length;
  const heinousCount = slcList.filter(
    (i) => i.legalAssessment?.crimeCategory === 'Heinous'
  ).length;
  const pendingAssessmentCount = slcList.filter((i) => !i.tier && !i.slcNo).length;
  const completedAssessmentCount = slcList.filter((i) => i.tier || i.slcNo).length;

  // Filter list by tab
  const displayedCases =
    activeTab === 'pending'
      ? slcList.filter((i) => !i.tier && !i.slcNo)
      : activeTab === 'assessed'
      ? slcList.filter((i) => i.tier || i.slcNo)
      : slcList;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              Socio-Legal Counselling
            </h2>
            <span className="inline-flex items-center rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-bold text-cyan-800 border border-cyan-200">
              Role: SLC
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Access cases logged during OutReach, add socio-legal evaluations, documents, and court particulars to the same document.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add New Case
        </button>
      </div>

      {/* Metrics Row */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white p-5 border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Cases</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{slcList.length}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            #
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tier 1 (High Priority)</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{tier1Count}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            !
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Heinous Crime</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{heinousCount}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            ⚖
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Assessment</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{pendingAssessmentCount}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            ⏳
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex items-center gap-3 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`pb-2 px-3 text-sm font-bold transition cursor-pointer border-b-2 ${
            activeTab === 'all' || activeTab === 'slc'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All Cases ({slcList.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`pb-2 px-3 text-sm font-bold transition cursor-pointer border-b-2 ${
            activeTab === 'pending'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Pending Assessment ({pendingAssessmentCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('assessed')}
          className={`pb-2 px-3 text-sm font-bold transition cursor-pointer border-b-2 ${
            activeTab === 'assessed'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Assessed by SLC ({completedAssessmentCount})
        </button>
      </div>

      {/* Filter Section */}
      <SlcFilterSection />

      {/* Case Grid */}
      <div className="mt-6">
        {loading ? (
          <div className="p-16 text-center text-gray-500 text-sm">Loading cases...</div>
        ) : displayedCases.length === 0 ? (
          <div className="p-16 text-center text-gray-500 space-y-2 border border-dashed border-gray-300 rounded-3xl bg-white">
            <p className="text-base font-semibold text-gray-800">No matching cases found</p>
            <p className="text-xs text-gray-400">
              {activeTab === 'pending'
                ? 'All existing cases have already been enriched with Socio-Legal assessment!'
                : 'Click "Add New Case" or clear filters to view cases.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedCases.map((item) => (
              <SlcCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <SlcModal />
      <SlcFollowUpModal />
    </div>
  );
}
