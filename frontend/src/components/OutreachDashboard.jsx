import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { apiInstance } from '../App';
import { useAuthStore } from '../store/useAuthStore';
import { useOutreachStore } from '../store/useOutreachStore';

import OutreachCard from './Outreach Components/OutreachCard';
import CaseDetailsModal from './Outreach Components/CaseDetailsModal';
import MultiStepModal from './Outreach Components/MultiStepModal';
import FollowUpModal from './Outreach Components/FollowUpModal';
import FilterSection from './Outreach Components/FilterSection';

// Re-export constants for any external references
export {
  OFFENCE_TYPE_OPTIONS,
  RELATIONSHIP_OPTIONS,
  DISCOVERY_MODE_OPTIONS,
  CALL_STATUS_OPTIONS,
} from './Outreach Components/constants';

export default function OutreachDashboard() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const {
    outreachList,
    loading,
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

  const [targetsData, setTargetsData] = useState(null);
  const [loadingTargets, setLoadingTargets] = useState(false);

  useEffect(() => {
    if (token) {
      fetchOutreach();
      fetchTargets();
    }
  }, [token]);

  const fetchTargets = async () => {
    if (!token) return;
    try {
      setLoadingTargets(true);
      const res = await axios.get(`${apiInstance}/admin/targets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTargetsData(res.data);
    } catch (err) {
      console.warn('Could not fetch outreach targets:', err.message);
    } finally {
      setLoadingTargets(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Robustly extract total target assigned by admin as SL number
  const totalTargetValue = Number(
    targetsData?.targets?.total?.targetCount ||
    targetsData?.targets?.total?.target ||
    targetsData?.totalTarget ||
    (Array.isArray(targetsData?.data) ? targetsData.data.find((t) => t.targetType === 'TOTAL')?.targetCount : null) ||
    1000
  );

  // Robustly extract today's target assigned by admin
  const dailyTargetValue = Number(
    targetsData?.targets?.daily?.targetCount ||
    targetsData?.targets?.daily?.target ||
    targetsData?.dailyTarget ||
    (Array.isArray(targetsData?.data) ? targetsData.data.find((t) => t.targetType === 'DAILY')?.targetCount : null) ||
    10
  );

  // Calculate current maximum sNo in outreachList
  const currentMaxSno = outreachList.reduce((max, item) => Math.max(max, item.sNo || 0), 0) || outreachList.length;

  // Tickets created today
  const ticketsCreatedToday = outreachList.filter((item) => {
    if (!item.createdAt) return false;
    return new Date(item.createdAt).toISOString().split('T')[0] === todayStr;
  }).length;

  const totalProgressPct = totalTargetValue > 0 ? Math.min(100, parseFloat(((currentMaxSno / totalTargetValue) * 100).toFixed(1))) : 0;
  const dailyProgressPct = dailyTargetValue > 0 ? Math.min(100, Math.round((ticketsCreatedToday / dailyTargetValue) * 100)) : 0;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">OutReach Cases</h2>
            {user?.userName && (
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 border border-indigo-100">
                {user.userName} ({user?.userID})
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Click on any case card to view its comprehensive profile and follow-up timeline
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchTargets}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer shadow-xs"
            title="Refresh Admin Targets"
          >
            <span>🔄</span> Refresh Targets
          </button>
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
      </div>

      {/* Target Progress Cards (Assigned by Admin as SL Number) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
        {/* Total Target / SL Progress */}
        <div className="bg-white rounded-2xl border border-indigo-200/90 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-950">
                  Total Target (Assigned by Admin as SL Number)
                </span>
              </div>
              <span className="text-xs font-extrabold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                {totalProgressPct}% Goal Reached
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-3xl font-black text-gray-900 tracking-tight">
                  SL #{currentMaxSno}
                </span>
                <span className="text-base font-bold text-indigo-700 ml-2">
                  / Target: SL #{totalTargetValue}
                </span>
              </div>
              <span className="text-xs text-gray-600 font-semibold bg-gray-50 px-2 py-1 rounded-md border border-gray-200/60">
                {totalTargetValue > currentMaxSno
                  ? `${totalTargetValue - currentMaxSno} tickets left to SL #${totalTargetValue}`
                  : '🎉 SL Goal Achieved!'}
              </span>
            </div>

            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(2, totalProgressPct)}%` }}
              ></div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-indigo-50 flex items-center justify-between text-[11px] text-gray-500 font-medium">
            <span>Admin Directive: Benchmarked to Serial Number (SL)</span>
            <span className="font-mono text-indigo-900 font-bold">Goal: SL #{totalTargetValue}</span>
          </div>
        </div>

        {/* Daily Ticket Target Progress */}
        <div className="bg-white rounded-2xl border border-amber-200/90 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-950">
                  Today's Target (Assigned by Admin)
                </span>
              </div>
              <span className="text-xs font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                {dailyProgressPct}% Quota
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-3xl font-black text-gray-900 tracking-tight">
                  {ticketsCreatedToday}
                </span>
                <span className="text-base font-bold text-amber-700 ml-2">
                  / Target: {dailyTargetValue} tickets
                </span>
              </div>
              <span className="text-xs text-gray-600 font-semibold bg-gray-50 px-2 py-1 rounded-md border border-gray-200/60">
                {dailyTargetValue > ticketsCreatedToday
                  ? `${dailyTargetValue - ticketsCreatedToday} more tickets today`
                  : '🎯 Today\'s Quota Met!'}
              </span>
            </div>

            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(2, dailyProgressPct)}%` }}
              ></div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-amber-50 flex items-center justify-between text-[11px] text-gray-500 font-medium">
            <span>Date: {todayStr}</span>
            <span className="font-mono text-amber-900 font-bold">Quota: {dailyTargetValue} tickets/day</span>
          </div>
        </div>
      </div>

      {/* Filter Section (Search, Case Categories, Call Statuses) */}
      <FilterSection />

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
