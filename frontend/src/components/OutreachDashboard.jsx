import React, { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useOutreachStore } from '../store/useOutreachStore';

import OutreachCard from './Outreach Components/OutreachCard';
import CaseDetailsModal from './Outreach Components/CaseDetailsModal';
import MultiStepModal from './Outreach Components/MultiStepModal';
import FollowUpModal from './Outreach Components/FollowUpModal';

// Re-export constants for any external references
export {
  OFFENCE_TYPE_OPTIONS,
  RELATIONSHIP_OPTIONS,
  DISCOVERY_MODE_OPTIONS,
  CALL_STATUS_OPTIONS,
} from './Outreach Components/constants';

export default function OutreachDashboard() {
  const token = useAuthStore((state) => state.token);

  const {
    outreachList,
    loading,
    search,
    setSearch,
    fetchOutreach,
    openCreateModal,
    openEditModal,
    handleDelete,
    selectedCase,
    setSelectedCase,
    isModalOpen,
    isEditMode,
    currentStep,
    formData,
    submitting,
    closeModal,
    nextStep,
    prevStep,
    setCurrentStep,
    toggleOffenceType,
    setFormData,
    handleSubmit,
    isFollowUpModalOpen,
    activeRecord,
    followUpData,
    setFollowUpData,
    openFollowUpModal,
    closeFollowUpModal,
    handleFollowUpSubmit,
  } = useOutreachStore();

  useEffect(() => {
    if (token) {
      fetchOutreach();
    }
  }, [token]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">OutReach Cases</h2>
          <p className="text-sm text-gray-500 mt-1">
            Click on any case card to view its comprehensive profile and follow-up timeline
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add OutReach Record
        </button>
      </div>

      {/* Search Bar */}
      <div className="mt-6 flex gap-3">
        <input
          type="text"
          placeholder="Search by Inmate Name, Contact Name, Offence Type, or Source..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchOutreach()}
          className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
        />
        <button
          onClick={fetchOutreach}
          className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition cursor-pointer"
        >
          Search
        </button>
        {search && (
          <button
            onClick={() => {
              setSearch('');
              fetchOutreach();
            }}
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* 3 Squares per row Grid */}
      <div className="mt-8">
        {loading ? (
          <div className="p-16 text-center text-gray-500 text-sm">Loading outreach cases...</div>
        ) : outreachList.length === 0 ? (
          <div className="p-16 text-center text-gray-500 space-y-2 border border-dashed border-gray-300 rounded-3xl bg-white">
            <p className="text-base font-semibold text-gray-800">No outreach cases found</p>
            <p className="text-xs text-gray-400">Click "Add OutReach Record" to start logging contacts.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {outreachList.map((item) => (
              <OutreachCard
                key={item._id}
                item={item}
                onSelect={(caseItem) => setSelectedCase(caseItem)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Case Details Pop-up Modal */}
      <CaseDetailsModal
        selectedCase={selectedCase}
        onClose={() => setSelectedCase(null)}
        onEdit={openEditModal}
        onDelete={handleDelete}
        onAddFollowUp={openFollowUpModal}
      />

      {/* Multi-Step Add/Edit Modal */}
      <MultiStepModal
        isOpen={isModalOpen}
        isEditMode={isEditMode}
        currentStep={currentStep}
        formData={formData}
        submitting={submitting}
        onClose={closeModal}
        onNextStep={nextStep}
        onPrevStep={prevStep}
        onSetStep={setCurrentStep}
        onToggleOffenceType={toggleOffenceType}
        onChangeFormData={setFormData}
        onSubmit={handleSubmit}
      />

      {/* Follow-Up Modal */}
      <FollowUpModal
        isOpen={isFollowUpModalOpen}
        activeRecord={activeRecord}
        followUpData={followUpData}
        onChangeFollowUpData={setFollowUpData}
        onClose={closeFollowUpModal}
        onSubmit={handleFollowUpSubmit}
      />
    </div>
  );
}
