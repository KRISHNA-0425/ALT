import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { apiInstance } from '../App';
import { useAuthStore } from '../store/useAuthStore';

// Calculate case-specific pipeline milestones and progress
export const calculateCasePipeline = (activeCase) => {
  if (!activeCase) return null;

  const intakeDate = activeCase.dateOfFirstContact || activeCase.createdAt || new Date();
  const createdDate = new Date(intakeDate);
  const now = new Date();
  const daysSinceIntake = Math.max(0, Math.floor((now - createdDate) / (1000 * 60 * 60 * 24)));

  // Step 1: OR Intake (Created by outreach)
  const isOrIntakeDone = true;
  const orIntakeDate = createdDate;

  // Step 2: OR Documentation (Outreach follow-ups or initial documents)
  const hasOrDocs = Boolean(
    (activeCase.followUps && activeCase.followUps.length > 1) ||
    (activeCase.attachedFiles && activeCase.attachedFiles.length > 0)
  );
  const isOrDocsDone = hasOrDocs;
  const orDocsDate = activeCase.followUps?.[1]?.date
    ? new Date(activeCase.followUps[1].date)
    : activeCase.attachedFiles?.[0]?.uploadedAt
    ? new Date(activeCase.attachedFiles[0].uploadedAt)
    : (hasOrDocs ? new Date(createdDate.getTime() + 2 * 86400000) : null);

  // Step 3: SLC Decoding / Socio-Legal Assessment
  const isSlcDone = Boolean(
    activeCase.slcNo || activeCase.hasSlc || activeCase.actionPlan === 'Refer to SLC' || activeCase.tier || activeCase.legalAssessment
  );
  const slcDate = activeCase.updatedAt ? new Date(activeCase.updatedAt) : (isSlcDone ? new Date(createdDate.getTime() + 7 * 86400000) : null);

  // Step 4: Bail Strategy / Advocate Appointed (by Socio-Legal)
  const hasAdvocate = Boolean(
    activeCase.assignedAdvocate?.name || activeCase.assignedAdvocate?.userID || activeCase.assignedAdvocate?.advocateId
  );
  const isAdvocateDone = hasAdvocate;
  const advDate = activeCase.assignedAdvocate?.assignedAt
    ? new Date(activeCase.assignedAdvocate.assignedAt)
    : (hasAdvocate ? new Date(createdDate.getTime() + 14 * 86400000) : null);

  // Step 5: Monitoring / Bail Support (Advocate court filings or hearing scheduled)
  const hasHearingOrBail = Boolean(
    activeCase.caseDetails?.nextHearingDate ||
    activeCase.caseDetails?.bailApplicationsFiled ||
    (activeCase.attachedFiles && activeCase.attachedFiles.some((f) => f.title?.startsWith('ADV_') || f.originalName?.startsWith('ADV_')))
  );
  const isMonitoringDone = hasHearingOrBail;
  const hearingDate = activeCase.caseDetails?.nextHearingDate
    ? new Date(activeCase.caseDetails.nextHearingDate)
    : (hasHearingOrBail ? new Date(createdDate.getTime() + 21 * 86400000) : null);

  // Step 6: Resolved (Case closed / Bailed out / Relief secured)
  const isResolved = activeCase.callStatus === 'Bail out' || activeCase.tier === 'Resolved' || activeCase.status === 'Resolved';
  const resolvedDate = isResolved ? (activeCase.updatedAt ? new Date(activeCase.updatedAt) : new Date()) : null;

  // Determine active step index (0 to 5)
  let activeIndex = 0;
  if (isResolved) activeIndex = 5;
  else if (isMonitoringDone) activeIndex = 4;
  else if (isAdvocateDone) activeIndex = 3;
  else if (isSlcDone) activeIndex = 2;
  else if (isOrDocsDone) activeIndex = 1;
  else activeIndex = 0;

  // Stepper Nodes (Matching screenshot: Intake -> Documentation -> Decoding -> Bail Support -> Monitoring -> Resolved)
  const stepperNodes = [
    {
      id: 'intake',
      title: 'Intake',
      dept: 'OR',
      isCompleted: true,
      isActive: activeIndex === 0,
      color: '#3B82F6', // Blue
      sublabel: 'Outreach Created',
    },
    {
      id: 'documentation',
      title: 'Documentation',
      dept: 'OR',
      isCompleted: isOrDocsDone,
      isActive: activeIndex === 1,
      color: '#A855F7', // Purple
      sublabel: 'Verification & Camp',
    },
    {
      id: 'decoding',
      title: 'Decoding',
      dept: 'SLC',
      isCompleted: isSlcDone,
      isActive: activeIndex === 2,
      color: '#F59E0B', // Amber
      sublabel: 'Socio-Legal Intake',
    },
    {
      id: 'bail-support',
      title: 'Bail Support',
      dept: 'SLC',
      isCompleted: isAdvocateDone,
      isActive: activeIndex === 3,
      color: '#10B981', // Teal
      sublabel: activeCase.assignedAdvocate?.name ? `Adv. ${activeCase.assignedAdvocate.name}` : 'Appointed by SLC',
    },
    {
      id: 'monitoring',
      title: 'Monitoring',
      dept: 'ADV',
      isCompleted: isMonitoringDone,
      isActive: activeIndex === 4,
      color: '#64748B', // Slate
      sublabel: activeCase.caseDetails?.nextHearingDate ? 'Hearing Scheduled' : 'Court Filings',
    },
    {
      id: 'resolved',
      title: 'Resolved',
      dept: 'Relief',
      isCompleted: isResolved,
      isActive: activeIndex === 5,
      color: '#22C55E', // Green
      sublabel: isResolved ? 'Bailed Out / Disposed' : 'Relief / Case Closed',
    },
  ];

  // Timeline Milestones (Matching screenshot with dates, icons, +Xd)
  const timelineMilestones = [
    {
      id: 't-intake',
      title: 'Intake',
      sublabel: 'First Call',
      dept: 'OR',
      date: orIntakeDate,
      daysDiff: '+0d',
      isDone: true,
      iconType: 'phone',
    },
    {
      id: 't-doc',
      title: 'Documentation',
      sublabel: 'Stage 1',
      dept: 'OR',
      date: orDocsDate,
      daysDiff: isOrDocsDone ? `+${Math.min(daysSinceIntake, 186)}d` : 'Pending',
      isDone: isOrDocsDone,
      iconType: 'doc',
    },
    {
      id: 't-decoding',
      title: 'Case Decoding',
      sublabel: 'Stage 2',
      dept: 'SLC',
      date: slcDate,
      daysDiff: isSlcDone ? '+0d' : 'Pending',
      isDone: isSlcDone,
      iconType: 'book',
    },
    {
      id: 't-bail',
      title: 'Bail Strategy',
      sublabel: 'Stage 3',
      dept: 'SLC',
      date: advDate || hearingDate,
      daysDiff: isAdvocateDone ? '+10d' : 'Pending',
      isDone: isAdvocateDone,
      iconType: 'scales',
    },
    {
      id: 't-resolved',
      title: 'Resolved',
      sublabel: 'Case Closed',
      dept: 'Relief',
      date: resolvedDate,
      daysDiff: isResolved ? `+${daysSinceIntake}d` : 'Pending',
      isDone: isResolved,
      iconType: 'check-double',
    },
  ];

  const prisonName = activeCase.prisonDetails?.prisonName || 'Delhi Prison Facility';
  const courtName = activeCase.caseDetails?.court || activeCase.caseDetails?.policeStation || 'Saket Court';
  const locationSubtitle = `${prisonName} · ${courtName}`;

  let currentStageText = 'OR: Intake Created';
  let stageOwner = 'Outreach Team';
  let currentStageBadge = 'bg-blue-100 text-blue-800 border-blue-200';
  if (isResolved) {
    currentStageText = 'Resolved / Bail Granted';
    stageOwner = 'Relief Secured (Closed)';
    currentStageBadge = 'bg-emerald-100 text-emerald-800 border-emerald-200';
  } else if (isMonitoringDone) {
    currentStageText = `ADV: Court Hearing & Bail (${activeCase.assignedAdvocate?.name || 'Advocate'})`;
    stageOwner = `Advocate (${activeCase.assignedAdvocate?.userID || 'ADV'})`;
    currentStageBadge = 'bg-amber-100 text-amber-800 border-amber-200';
  } else if (isAdvocateDone) {
    currentStageText = `SLC: Advocate Appointed (Adv. ${activeCase.assignedAdvocate?.name || 'Assigned'})`;
    stageOwner = `Advocate (${activeCase.assignedAdvocate?.userID || 'ADV'}) & SLC`;
    currentStageBadge = 'bg-teal-100 text-teal-800 border-teal-200';
  } else if (isSlcDone) {
    currentStageText = `SLC: Under Socio-Legal Assessment (${activeCase.tier || 'In Counselling'})`;
    stageOwner = 'Socio-Legal Wing';
    currentStageBadge = 'bg-purple-100 text-purple-800 border-purple-200';
  } else if (isOrDocsDone) {
    currentStageText = 'OR: Verification & Documentation';
    stageOwner = 'Outreach Team';
    currentStageBadge = 'bg-indigo-100 text-indigo-800 border-indigo-200';
  }

  // Days at current stage estimation
  const daysAtCurrentStage = Math.max(1, Math.min(daysSinceIntake, isResolved ? 14 : isAdvocateDone ? 8 : isSlcDone ? 4 : 2));

  return {
    daysSinceIntake,
    activeIndex,
    stepperNodes,
    timelineMilestones,
    locationSubtitle,
    currentStageText,
    currentStageBadge,
    stageOwner,
    daysAtCurrentStage,
    isResolved,
    isAdvocateDone,
    isSlcDone,
    isOrDocsDone,
  };
};

export default function AdminDashboard() {
  const { token, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'pipeline' | 'targets' | 'communications'
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [pipelineData, setPipelineData] = useState({
    outreachStage: [],
    socioLegalStage: [],
    advocateStage: [],
  });
  const [targetsData, setTargetsData] = useState(null);
  const [personnelData, setPersonnelData] = useState({
    outreach: [],
    socioLegal: [],
    advocates: [],
  });

  // Pipeline filters
  const [searchQuery, setSearchQuery] = useState('');
  const [pipelineStageFilter, setPipelineStageFilter] = useState('All');
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' (latest to oldest, default) | 'asc' (oldest to latest)
  const [selectedPipelineCaseId, setSelectedPipelineCaseId] = useState(null);
  const [pipelineSubTab, setPipelineSubTab] = useState('overview'); // 'overview' | 'documentation' | 'decoding' | 'bail' | 'monitoring' | 'notes'
  const [pipelineViewMode, setPipelineViewMode] = useState('stepper'); // 'stepper' | 'grid'

  // Modals state
  const [selectedCaseForDetails, setSelectedCaseForDetails] = useState(null);
  const [flagModalCase, setFlagModalCase] = useState(null);
  const [flagReason, setFlagReason] = useState('');
  const [updateModalCase, setUpdateModalCase] = useState(null);
  const [updateRequestNote, setUpdateRequestNote] = useState('');

  // Target Form state
  const [targetType, setTargetType] = useState('TOTAL'); // 'TOTAL' | 'DAILY'
  const [targetCount, setTargetCount] = useState(100);
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetDesc, setTargetDesc] = useState('');
  const [savingTarget, setSavingTarget] = useState(false);

  // Communications Form state
  const [messageDept, setMessageDept] = useState('Outreach'); // 'Outreach' | 'SocioLegal' | 'Advocate'
  const [recipientId, setRecipientId] = useState('ALL');
  const [messageTitle, setMessageTitle] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [messagePriority, setMessagePriority] = useState('Normal'); // 'Normal' | 'Important' | 'Urgent'
  const [selectedCaseRef, setSelectedCaseRef] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sentMessages, setSentMessages] = useState([]);

  const authHeaders = useMemo(() => ({
    headers: { Authorization: `Bearer ${token}` },
  }), [token]);

  // Load all dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, pipelineRes, targetsRes, personnelRes] = await Promise.all([
        axios.get(`${apiInstance}/admin/analytics`, authHeaders),
        axios.get(`${apiInstance}/admin/pipeline?sortOrder=${sortOrder}`, authHeaders),
        axios.get(`${apiInstance}/admin/targets`, authHeaders),
        axios.get(`${apiInstance}/admin/personnel`, authHeaders),
      ]);

      setAnalyticsData(analyticsRes.data.data);
      if (pipelineRes.data.pipeline) {
        setPipelineData(pipelineRes.data.pipeline);
      }
      setTargetsData(targetsRes.data.targets);
      setPersonnelData(personnelRes.data.personnel);
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
      toast.error(err.response?.data?.message || 'Failed to load admin metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token, sortOrder]);

  // Filtered and Chronologically Sorted Pipeline Cases
  const allPipelineCases = useMemo(() => {
    const list = [
      ...(pipelineData.outreachStage || []),
      ...(pipelineData.socioLegalStage || []),
      ...(pipelineData.advocateStage || []),
    ];

    const filtered = list.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (c.inmate?.name && c.inmate.name.toLowerCase().includes(q)) ||
        (c.caseDetails?.firNumber && c.caseDetails.firNumber.toLowerCase().includes(q)) ||
        (c.assignedAdvocate?.name && c.assignedAdvocate.name.toLowerCase().includes(q)) ||
        (c.sNo && c.sNo.toString().includes(q)) ||
        (c.slcNo && c.slcNo.toString().includes(q));

      const matchesFlag = !onlyFlagged || (c.adminFlag && c.adminFlag.isFlagged);

      const matchesStage =
        pipelineStageFilter === 'All' ||
        (pipelineStageFilter === 'Outreach' && c.currentStage === 'Outreach') ||
        (pipelineStageFilter === 'Socio-Legal' && c.currentStage === 'Socio-Legal') ||
        (pipelineStageFilter === 'Advocate' && c.currentStage === 'Advocate');

      return matchesSearch && matchesFlag && matchesStage;
    });

    // Helper to extract timestamp when the ticket was created
    const getCreationTime = (c) => {
      if (c.createdAt) {
        const t = new Date(c.createdAt).getTime();
        if (!isNaN(t) && t > 0) return t;
      }
      if (c.dateOfFirstContact) {
        const t = new Date(c.dateOfFirstContact).getTime();
        if (!isNaN(t) && t > 0) return t;
      }
      if (c._id && typeof c._id === 'string' && c._id.length === 24) {
        const t = parseInt(c._id.substring(0, 8), 16) * 1000;
        if (!isNaN(t) && t > 0) return t;
      }
      return 0;
    };

    // Sort by creation date: descending (latest to oldest, default) or ascending (oldest to latest)
    return filtered.sort((a, b) => {
      const timeA = getCreationTime(a);
      const timeB = getCreationTime(b);
      if (sortOrder === 'asc') {
        return timeA - timeB; // Oldest first
      }
      return timeB - timeA; // Latest first (default)
    });
  }, [pipelineData, searchQuery, onlyFlagged, pipelineStageFilter, sortOrder]);

  // Selected active case for the detailed pipeline stepper view
  const activeCase = useMemo(() => {
    if (!allPipelineCases || allPipelineCases.length === 0) return null;
    if (selectedPipelineCaseId) {
      const found = allPipelineCases.find((c) => c._id === selectedPipelineCaseId);
      if (found) return found;
    }
    return allPipelineCases[0];
  }, [allPipelineCases, selectedPipelineCaseId]);

  const activePipelineInfo = useMemo(() => {
    return calculateCasePipeline(activeCase);
  }, [activeCase]);

  // Handle Flag / Unflag submit
  const handleToggleFlag = async (e) => {
    e.preventDefault();
    if (!flagModalCase) return;

    try {
      const isCurrentlyFlagged = flagModalCase.adminFlag?.isFlagged;
      const res = await axios.post(
        `${apiInstance}/admin/cases/${flagModalCase._id}/flag`,
        {
          isFlagged: !isCurrentlyFlagged,
          flagReason: flagReason,
          status: !isCurrentlyFlagged ? 'Open' : 'Resolved',
        },
        authHeaders
      );

      toast.success(res.data.message || 'Case flag updated');
      setFlagModalCase(null);
      setFlagReason('');
      fetchDashboardData();
    } catch (err) {
      console.error('Error toggling flag:', err);
      toast.error(err.response?.data?.message || 'Failed to update flag');
    }
  };

  // Handle Request Case Update submit
  const handleRequestCaseUpdate = async (e) => {
    e.preventDefault();
    if (!updateModalCase) return;

    try {
      const res = await axios.post(
        `${apiInstance}/admin/cases/${updateModalCase._id}/request-update`,
        { customNote: updateRequestNote },
        authHeaders
      );

      toast.success(res.data.message || 'Update request sent');
      setUpdateModalCase(null);
      setUpdateRequestNote('');
    } catch (err) {
      console.error('Error requesting update:', err);
      toast.error(err.response?.data?.message || 'Failed to send update request');
    }
  };

  // Handle Target Submit
  const handleSaveTarget = async (e) => {
    e.preventDefault();
    if (!targetCount || Number(targetCount) < 1) {
      toast.error('Please enter a valid target count');
      return;
    }

    setSavingTarget(true);
    try {
      const payload = {
        targetType,
        targetCount: Number(targetCount),
        targetDate: targetType === 'DAILY' ? targetDate : undefined,
        description: targetDesc,
      };

      const res = await axios.post(`${apiInstance}/admin/targets`, payload, authHeaders);
      toast.success(res.data.message || 'Target updated successfully');
      setTargetDesc('');
      fetchDashboardData();
    } catch (err) {
      console.error('Error saving target:', err);
      toast.error(err.response?.data?.message || 'Failed to save target');
    } finally {
      setSavingTarget(false);
    }
  };

  // Handle Direct Message Submit
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageTitle.trim() || !messageBody.trim()) {
      toast.error('Please enter both subject and message body');
      return;
    }

    setSendingMessage(true);
    try {
      let recipientName = 'All Team Members';
      if (recipientId !== 'ALL') {
        const pool =
          messageDept === 'Outreach'
            ? personnelData.outreach
            : messageDept === 'SocioLegal'
            ? personnelData.socioLegal
            : personnelData.advocates;
        const found = pool.find((p) => p.id === recipientId);
        if (found) recipientName = found.name;
      }

      const payload = {
        department: messageDept,
        recipientId,
        recipientName,
        title: messageTitle,
        message: messageBody,
        priority: messagePriority,
        caseId: selectedCaseRef || undefined,
      };

      const res = await axios.post(`${apiInstance}/admin/messages`, payload, authHeaders);
      toast.success(res.data.message || 'Message sent successfully');

      setSentMessages((prev) => [
        {
          id: Date.now(),
          department: messageDept,
          recipient: recipientName,
          title: messageTitle,
          body: messageBody,
          priority: messagePriority,
          sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev,
      ]);

      setMessageTitle('');
      setMessageBody('');
      setSelectedCaseRef('');
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const personnelListForDept = useMemo(() => {
    if (messageDept === 'Outreach') return personnelData.outreach || [];
    if (messageDept === 'SocioLegal') return personnelData.socioLegal || [];
    return personnelData.advocates || [];
  }, [messageDept, personnelData]);

  if (loading && !analyticsData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-purple-600 border-t-transparent"></div>
          <p className="text-sm font-semibold text-gray-600">Loading Executive Admin Control Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome & Navigation Header */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-xs font-semibold tracking-wide text-purple-200">
              <span>🛡️</span> EXECUTIVE ADMINISTRATION & OVERSIGHT
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Admin Control Center
            </h1>
            <p className="text-sm text-purple-200/80 max-w-2xl leading-relaxed">
              Real-time multi-departmental analytics, full case pipeline tracking from Outreach discovery to Advocate legal defence, ticket target management, and operational directives.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={fetchDashboardData}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold backdrop-blur-md transition cursor-pointer"
            >
              <span>🔄</span> Refresh Data
            </button>
            <div className="px-4 py-2 rounded-xl bg-purple-800/50 border border-purple-400/30 text-xs font-medium text-purple-100">
              Role: <span className="font-bold text-white">ADM (Admin)</span>
            </div>
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex flex-wrap gap-2 pt-6 mt-6 border-t border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-white text-purple-900 shadow-md'
                : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
            }`}
          >
            <span>📊</span> Analysis Dashboard
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pipeline')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'pipeline'
                ? 'bg-white text-purple-900 shadow-md'
                : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
            }`}
          >
            <span>🔄</span> Complete Case Pipeline
            <span className="ml-1 px-2 py-0.5 rounded-full bg-purple-200 text-purple-900 text-[10px]">
              {analyticsData?.pipeline?.totalCases || 0}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('targets')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'targets'
                ? 'bg-white text-purple-900 shadow-md'
                : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
            }`}
          >
            <span>🎯</span> Outreach Target Manager
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('communications')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'communications'
                ? 'bg-white text-purple-900 shadow-md'
                : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
            }`}
          >
            <span>✉️</span> Direct Communications & Directives
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: ANALYSIS & ANALYTICS DASHBOARD
          ========================================================================= */}
      {activeTab === 'analytics' && analyticsData && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Outreach Calls */}
            <div className="rounded-2xl bg-white p-5 border border-indigo-100 shadow-xs space-y-2 hover:border-indigo-300 transition">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-700">
                <span>📞 Outreach Follow-up Calls</span>
                <span className="p-1 rounded-md bg-indigo-50">OR</span>
              </div>
              <p className="text-3xl font-extrabold text-gray-900">
                {analyticsData.calls?.outreachCalls || 0}
              </p>
              <p className="text-xs text-gray-500">Total discovery & camp call logs recorded</p>
            </div>

            {/* Metric 2: SLC Calls */}
            <div className="rounded-2xl bg-white p-5 border border-cyan-100 shadow-xs space-y-2 hover:border-cyan-300 transition">
              <div className="flex items-center justify-between text-xs font-semibold text-cyan-700">
                <span>💬 Socio-Legal Counselling Calls</span>
                <span className="p-1 rounded-md bg-cyan-50">SLC</span>
              </div>
              <p className="text-3xl font-extrabold text-gray-900">
                {analyticsData.calls?.slcCalls || 0}
              </p>
              <p className="text-xs text-gray-500">Total in-depth counselling interactions</p>
            </div>

            {/* Metric 3: Cases Passed to SLC */}
            <div className="rounded-2xl bg-white p-5 border border-purple-100 shadow-xs space-y-2 hover:border-purple-300 transition">
              <div className="flex items-center justify-between text-xs font-semibold text-purple-700">
                <span>📑 Outreach → Socio-Legal</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-100 font-bold">
                  {analyticsData.pipeline?.conversionRates?.outreachToSlcPercent || 0}%
                </span>
              </div>
              <p className="text-3xl font-extrabold text-gray-900">
                {analyticsData.pipeline?.passedToSlc || 0}
              </p>
              <p className="text-xs text-gray-500">Cases transferred for legal counselling</p>
            </div>

            {/* Metric 4: Cases with Advocate */}
            <div className="rounded-2xl bg-white p-5 border border-amber-100 shadow-xs space-y-2 hover:border-amber-300 transition">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-700">
                <span>⚖️ Socio-Legal → Advocate</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 font-bold">
                  {analyticsData.pipeline?.conversionRates?.slcToAdvocatePercent || 0}%
                </span>
              </div>
              <p className="text-3xl font-extrabold text-gray-900">
                {analyticsData.pipeline?.passedToAdvocate || 0}
              </p>
              <p className="text-xs text-gray-500">Cases appointed to legal advocates</p>
            </div>
          </div>

          {/* Pipeline Conversion Flow & Flagged Alert Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Funnel */}
            <div className="lg:col-span-2 rounded-2xl bg-white p-6 border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <span>🔄</span> Complete Case Progression Funnel
                </h3>
                <span className="text-xs font-semibold text-gray-500">
                  Total Cases: {analyticsData.pipeline?.totalCases || 0}
                </span>
              </div>

              {/* Progress Steps */}
              <div className="space-y-3 pt-2">
                {/* Step 1 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                    <span>1. Outreach Stage (Discovery & Calls)</span>
                    <span>{analyticsData.pipeline?.totalCases || 0} Cases (100%)</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-indigo-50 overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full w-full"></div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-purple-900">
                    <span>2. Socio-Legal Counselling Stage</span>
                    <span>
                      {analyticsData.pipeline?.passedToSlc || 0} Cases (
                      {analyticsData.pipeline?.conversionRates?.outreachToSlcPercent || 0}%)
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-purple-50 overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full transition-all duration-500"
                      style={{
                        width: `${analyticsData.pipeline?.conversionRates?.outreachToSlcPercent || 0}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                    <span>3. Appointed Advocate Legal Defense</span>
                    <span>
                      {analyticsData.pipeline?.passedToAdvocate || 0} Cases (
                      {analyticsData.pipeline?.conversionRates?.slcToAdvocatePercent || 0}% of SLC)
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-amber-50 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          analyticsData.pipeline?.totalCases > 0
                            ? ((analyticsData.pipeline.passedToAdvocate / analyticsData.pipeline.totalCases) * 100).toFixed(1)
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Stage breakdown chips */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100 text-center">
                <div className="p-3 rounded-xl bg-indigo-50/70">
                  <p className="text-[11px] font-semibold text-indigo-700">Currently in Outreach Only</p>
                  <p className="text-xl font-bold text-indigo-900">{analyticsData.pipeline?.stages?.outreachOnly || 0}</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-50/70">
                  <p className="text-[11px] font-semibold text-purple-700">Currently in SLC Review</p>
                  <p className="text-xl font-bold text-purple-900">{analyticsData.pipeline?.stages?.socioLegal || 0}</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/70">
                  <p className="text-[11px] font-semibold text-amber-700">With Appointed Advocate</p>
                  <p className="text-xl font-bold text-amber-900">{analyticsData.pipeline?.stages?.advocateAssigned || 0}</p>
                </div>
              </div>
            </div>

            {/* Target Progress & Attention Required */}
            <div className="rounded-2xl bg-white p-6 border border-gray-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <span>🎯</span> Live Ticket Target Status
                </h3>

                {/* Total target */}
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-purple-900">
                    <span>Total Target Progress:</span>
                    <span>
                      {analyticsData.targets?.totalCreated} / {analyticsData.targets?.totalTarget} ({analyticsData.targets?.totalTarget ? Math.round((analyticsData.targets.totalCreated / analyticsData.targets.totalTarget) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-purple-200/70 overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full"
                      style={{
                        width: `${Math.min(100, Math.round(((analyticsData.targets?.totalCreated || 0) / (analyticsData.targets?.totalTarget || 1)) * 100))}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-[11px] text-purple-700">
                    Highest Serial Number registered: <strong>#{analyticsData.targets?.totalCreated || 0}</strong>
                  </p>
                </div>

                {/* Daily target */}
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-cyan-900">
                    <span>Today's Daily Target:</span>
                    <span>
                      {analyticsData.targets?.todayCreated} / {analyticsData.targets?.dailyTarget}
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-cyan-200/70 overflow-hidden">
                    <div
                      className="h-full bg-cyan-600 rounded-full"
                      style={{
                        width: `${Math.min(100, Math.round(((analyticsData.targets?.todayCreated || 0) / (analyticsData.targets?.dailyTarget || 1)) * 100))}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-[11px] text-cyan-700">
                    Tickets logged today ({analyticsData.targets?.todayDate})
                  </p>
                </div>
              </div>

              {/* Flagged cases alert */}
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🚩</span>
                  <div>
                    <p className="text-xs font-bold text-red-900">Flagged for Review</p>
                    <p className="text-[11px] text-red-700">Cases requiring administrative attention</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-red-600 text-white font-extrabold text-xs">
                  {analyticsData.flags?.totalFlagged || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Call Status Breakdown Table */}
          {analyticsData.calls?.callStatusBreakdown?.length > 0 && (
            <div className="rounded-2xl bg-white p-6 border border-gray-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <span>📋</span> Outreach Follow-up Call Status Breakdown
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {analyticsData.calls.callStatusBreakdown.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-center">
                    <p className="text-xs font-medium text-gray-600 truncate" title={item.status}>
                      {item.status}
                    </p>
                    <p className="text-lg font-extrabold text-gray-900 mt-1">{item.count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: CASE-SPECIFIC PIPELINE & MILESTONE TIMELINE (MATCHING UI)
          ========================================================================= */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          {/* Top Filter and Case Selector Controls */}
          <div className="rounded-3xl bg-white p-4 sm:p-5 border border-gray-200/80 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1 min-w-[240px]">
                <input
                  type="text"
                  placeholder="Search by inmate name, FIR, S.No, or advocate..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 pl-9 pr-4 py-2 text-xs text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-gray-50/50"
                />
                <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
              </div>

              {/* Stage Filter */}
              <div className="flex items-center bg-gray-100/80 p-1 rounded-xl text-xs font-semibold">
                {['All', 'Outreach', 'Socio-Legal', 'Advocate'].map((stg) => (
                  <button
                    key={stg}
                    type="button"
                    onClick={() => setPipelineStageFilter(stg)}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                      pipelineStageFilter === stg
                        ? 'bg-white text-gray-900 shadow-xs font-bold'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {stg === 'Outreach' ? 'OR' : stg === 'Socio-Legal' ? 'SLC' : stg === 'Advocate' ? 'ADV' : 'All'}
                  </button>
                ))}
              </div>

              {/* View Mode Toggle: Interactive Stepper vs Grid */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Sort Order Toggle Button: Latest to Oldest (default) vs Oldest to Latest */}
                <button
                  type="button"
                  id="pipeline-sort-toggle-btn"
                  onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    sortOrder === 'desc'
                      ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 shadow-xs'
                      : 'bg-indigo-50 text-indigo-900 border-indigo-300 hover:bg-indigo-100 shadow-xs'
                  }`}
                  title={
                    sortOrder === 'desc'
                      ? 'Currently sorted: Latest to Oldest (Descending). Click to sort Oldest to Latest.'
                      : 'Currently sorted: Oldest to Latest (Ascending). Click to sort Latest to Oldest.'
                  }
                >
                  <span className="text-sm font-black">{sortOrder === 'desc' ? '⬇️' : '⬆️'}</span>
                  <span>{sortOrder === 'desc' ? 'Latest to Oldest' : 'Oldest to Latest'}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white border border-gray-200 text-gray-600 font-extrabold uppercase tracking-wide">
                    {sortOrder === 'desc' ? 'LATEST' : 'OLDEST'}
                  </span>
                </button>

                <div className="flex items-center bg-amber-50 border border-amber-200/70 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setPipelineViewMode('stepper')}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      pipelineViewMode === 'stepper'
                        ? 'bg-amber-500 text-white shadow-xs font-bold'
                        : 'text-amber-800 hover:bg-amber-100/50'
                    }`}
                  >
                    <span>📍</span> Pipeline Timeline
                  </button>
                  <button
                    type="button"
                    onClick={() => setPipelineViewMode('grid')}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      pipelineViewMode === 'grid'
                        ? 'bg-amber-500 text-white shadow-xs font-bold'
                        : 'text-amber-800 hover:bg-amber-100/50'
                    }`}
                  >
                    <span>🗂️</span> All Cards ({allPipelineCases.length})
                  </button>
                </div>

                {/* Only Flagged Toggle */}
                <button
                  type="button"
                  onClick={() => setOnlyFlagged(!onlyFlagged)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    onlyFlagged
                      ? 'bg-red-50 text-red-700 border-red-300'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span>🚩</span> Flagged
                </button>
              </div>
            </div>

            {/* Case Selector Ribbon: Click any case to see its specific pipeline */}
            <div className="pt-3 border-t border-gray-100">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span>Select Case to Inspect Lifecycle Pipeline:</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100/80 text-amber-900 border border-amber-200">
                    {sortOrder === 'desc' ? '⏳ Latest Created First' : '⌛ Oldest Created First'}
                  </span>
                </span>
                <span className="text-gray-500 font-normal lowercase">
                  showing {allPipelineCases.length} pipeline cases
                </span>
              </p>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {allPipelineCases.map((c) => {
                  const isSelected = activeCase?._id === c._id;
                  const isResolved = c.callStatus === 'Bail out' || c.tier === 'Resolved';
                  const hasAdv = !!(c.assignedAdvocate?.name || c.assignedAdvocate?.userID);
                  const hasSlc = !!(c.slcNo || c.hasSlc || c.actionPlan === 'Refer to SLC');

                  let dotColor = 'bg-blue-500';
                  let stageLabel = 'OR Intake';
                  if (isResolved) {
                    dotColor = 'bg-emerald-500';
                    stageLabel = 'Resolved';
                  } else if (hasAdv) {
                    dotColor = 'bg-amber-500';
                    stageLabel = 'Advocate';
                  } else if (hasSlc) {
                    dotColor = 'bg-purple-500';
                    stageLabel = 'SLC';
                  }

                  const createdDateStr = new Date(c.createdAt || c.dateOfFirstContact || Date.now()).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                  });

                  return (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => {
                        setSelectedPipelineCaseId(c._id);
                        setPipelineViewMode('stepper');
                      }}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer border ${
                        isSelected
                          ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-400 text-amber-950 shadow-xs ring-2 ring-amber-200/50'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
                      <span className="font-bold">{c.inmate?.name || 'Inmate'}</span>
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">
                        SL #{c.sNo || c.slcNo || '—'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium" title="Creation Date">
                        ({createdDateStr})
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium">({stageLabel})</span>
                      {c.adminFlag?.isFlagged && <span>🚩</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* =========================================================================
              VIEW MODE A: CASE-SPECIFIC STEPPER & TIMELINE (MATCHING SCREENSHOT)
              ========================================================================= */}
          {pipelineViewMode === 'stepper' && activeCase && activePipelineInfo && (
            <div className="space-y-6">
              {/* Case Header with Inmate Name, Status, Prison/Court, and Actions */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPipelineViewMode('grid')}
                      className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition"
                      title="Back to Grid View"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                    </button>
                    <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                      {activeCase.inmate?.name || 'Case Inmate'}
                    </h2>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${activePipelineInfo.currentStageBadge}`}
                    >
                      {activePipelineInfo.isResolved
                        ? 'Resolved'
                        : activePipelineInfo.isAdvocateDone
                        ? 'Advocate Appointed'
                        : activePipelineInfo.isSlcDone
                        ? 'In Socio-Legal Counselling'
                        : 'Outreach Intake'}
                    </span>
                    {activeCase.adminFlag?.isFlagged && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold border border-red-200">
                        🚩 Flagged by Admin
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-500 pl-8">
                    {activePipelineInfo.locationSubtitle}
                  </p>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-2.5 self-end md:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setFlagModalCase(activeCase);
                      setFlagReason(activeCase.adminFlag?.flagReason || '');
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 ${
                      activeCase.adminFlag?.isFlagged
                        ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span>🚩</span>
                    {activeCase.adminFlag?.isFlagged ? 'Modify Flag' : 'Flag Case'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUpdateModalCase(activeCase);
                      setUpdateRequestNote('');
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>🔔</span> Request Update
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCaseForDetails(activeCase)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-900 text-white hover:bg-gray-800 transition cursor-pointer shadow-xs"
                  >
                    Full Dossier ↗
                  </button>
                </div>
              </div>

              {/* =========================================================================
                  CARD 1: CASE PROGRESS HORIZONTAL STEPPER (EXACT REPLICA OF USER UI)
                  ========================================================================= */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-6 overflow-hidden">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Case Progress
                  </p>
                  <span className="text-xs font-semibold text-gray-500">
                    Stage {activePipelineInfo.activeIndex + 1} of 6 • {activePipelineInfo.currentStageText}
                  </span>
                </div>

                {/* Stepper Track */}
                <div className="relative py-4">
                  {/* Background Track Line */}
                  <div className="absolute top-1/2 -translate-y-4 left-6 right-6 h-1 bg-gray-200 rounded-full z-0"></div>

                  {/* Active Filled Line */}
                  <div
                    className="absolute top-1/2 -translate-y-4 left-6 h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full z-0 transition-all duration-700"
                    style={{
                      width: `${(activePipelineInfo.activeIndex / (activePipelineInfo.stepperNodes.length - 1)) * 100}%`,
                    }}
                  ></div>

                  {/* Nodes Container */}
                  <div className="relative z-10 flex items-start justify-between">
                    {activePipelineInfo.stepperNodes.map((node, idx) => {
                      const isDone = node.isCompleted;
                      const isActive = node.isActive;
                      const isFuture = !isDone && !isActive;

                      return (
                        <div key={node.id} className="flex flex-col items-center text-center group cursor-pointer max-w-[120px]">
                          {/* Circular Node */}
                          <div
                            className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 shadow-xs ${
                              isDone
                                ? 'text-white'
                                : isActive
                                ? 'ring-4 ring-amber-300 ring-offset-2 text-white animate-pulse'
                                : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                            }`}
                            style={{
                              backgroundColor: isDone || isActive ? node.color : undefined,
                            }}
                          >
                            {isDone ? (
                              node.id === 'resolved' ? (
                                <span className="text-base sm:text-lg">🎯</span>
                              ) : (
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                              )
                            ) : isActive ? (
                              <span className="w-3 h-3 rounded-full bg-white animate-ping"></span>
                            ) : (
                              <span className="text-xs text-gray-400">{idx + 1}</span>
                            )}
                          </div>

                          {/* Node Title & Department Pill */}
                          <div className="mt-2.5 space-y-0.5">
                            <span
                              className={`text-xs sm:text-sm font-bold block transition truncate max-w-[110px] ${
                                isDone || isActive ? 'text-gray-900' : 'text-gray-400'
                              }`}
                            >
                              {node.title}
                            </span>
                            <span
                              className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase ${
                                node.dept === 'OR'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                  : node.dept === 'SLC'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-100'
                                  : node.dept === 'ADV'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              }`}
                            >
                              {node.dept}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* =========================================================================
                  SUB-TABS NAVIGATION: Overview, Docs, Decoding, Bail, Monitoring, Notes
                  ========================================================================= */}
              <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
                {/* Sub-Tabs Strip */}
                <div className="border-b border-gray-100 px-6 pt-4 flex items-center gap-6 overflow-x-auto scrollbar-none">
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'documentation', label: 'Documentation' },
                    { id: 'decoding', label: 'Case Decoding (SLC)' },
                    { id: 'bail', label: 'Bail Strategy' },
                    { id: 'monitoring', label: 'Monitoring' },
                    { id: 'notes', label: `Follow-up Notes (${activeCase.followUps?.length || 0})` },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPipelineSubTab(t.id)}
                      className={`pb-3 text-xs sm:text-sm font-semibold transition whitespace-nowrap cursor-pointer border-b-2 -mb-[2px] ${
                        pipelineSubTab === t.id
                          ? 'border-amber-500 text-amber-700 font-bold'
                          : 'border-transparent text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Sub-Tab Content */}
                <div className="p-6 sm:p-8">
                  {/* Sub-Tab 1: Overview */}
                  {pipelineSubTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-2">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Inmate Profile</span>
                        <p className="text-base font-extrabold text-gray-900">{activeCase.inmate?.name}</p>
                        <p className="text-xs text-gray-600">
                          {activeCase.inmate?.gender || 'N/A'} • {activeCase.inmate?.age ? `${activeCase.inmate.age} yrs` : 'Age N/A'} • {activeCase.inmate?.education || 'Education N/A'}
                        </p>
                        <p className="text-xs text-gray-500">Occupation: {activeCase.inmate?.occupation || 'Not Recorded'}</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-2">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Contact Person</span>
                        <p className="text-base font-extrabold text-gray-900">
                          {activeCase.contactPerson?.name || activeCase.familyMember?.name || 'None Recorded'}
                        </p>
                        <p className="text-xs text-gray-600">
                          Relationship: {activeCase.contactPerson?.relationshipWithInmate || 'Family Contact'}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          Phone: {activeCase.contactPerson?.phoneNumbers?.[0] || activeCase.familyMember?.phoneNumber || 'N/A'}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-2">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Discovery Mode</span>
                        <p className="text-base font-extrabold text-gray-900">
                          {activeCase.discovery?.mode || 'Outside Prison'}
                        </p>
                        <p className="text-xs text-gray-600">Source: {activeCase.discovery?.sourceOfDiscovery || 'Outreach Intake'}</p>
                        <p className="text-xs text-indigo-600 font-semibold">Registered SL #{activeCase.sNo || activeCase.slcNo || '—'}</p>
                      </div>
                    </div>
                  )}

                  {/* Sub-Tab 2: Documentation */}
                  {pipelineSubTab === 'documentation' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Attached Case Documents ({activeCase.attachedFiles?.length || 0})
                        </h4>
                        <span className="text-xs text-gray-400">Includes Outreach and Advocate submissions</span>
                      </div>
                      {!activeCase.attachedFiles || activeCase.attachedFiles.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-xs bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                          No attached documents found for this case file.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {activeCase.attachedFiles.map((doc, i) => (
                            <div key={i} className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 truncate">
                                <span className="text-lg">📄</span>
                                <div className="truncate">
                                  <p className="text-xs font-bold text-gray-800 truncate" title={doc.title || doc.originalName}>
                                    {doc.title || doc.originalName}
                                  </p>
                                  <p className="text-[10px] text-gray-500">
                                    {doc.uploadedByName ? `Uploaded by ${doc.uploadedByName}` : 'Uploaded to case'}
                                  </p>
                                </div>
                              </div>
                              {doc.fileUrl && (
                                <a
                                  href={doc.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold shrink-0 transition"
                                >
                                  Open ↗
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sub-Tab 3: Case Decoding (SLC) */}
                  {pipelineSubTab === 'decoding' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-1">
                        <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">Priority Tier</span>
                        <p className="text-xl font-black text-amber-900">{activeCase.tier || 'Tier 2 (Medium)'}</p>
                        <p className="text-xs text-amber-700">SLC assessment classification</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-1">
                        <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider block">Crime Category</span>
                        <p className="text-xl font-black text-purple-900">{activeCase.legalAssessment?.crimeCategory || 'Non-Heinous'}</p>
                        <p className="text-xs text-purple-700">Stage: {activeCase.legalAssessment?.stageOfCase || 'Bail Filing'}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-cyan-50/60 border border-cyan-200 space-y-1">
                        <span className="text-[11px] font-bold text-cyan-900 uppercase tracking-wider block">Custody Duration</span>
                        <p className="text-xl font-black text-cyan-900">
                          {activeCase.durationInCustodyDays ? `${activeCase.durationInCustodyDays} Days` : `${activePipelineInfo.daysSinceIntake} Days in System`}
                        </p>
                        <p className="text-xs text-cyan-700">Prison: {activeCase.prisonDetails?.prisonName || 'Undertrial'}</p>
                      </div>
                    </div>
                  )}

                  {/* Sub-Tab 4: Bail Strategy */}
                  {pipelineSubTab === 'bail' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Appointed Advocate</h4>
                        {activeCase.assignedAdvocate?.name ? (
                          <div className="space-y-1">
                            <p className="text-lg font-black text-gray-900 flex items-center gap-2">
                              <span>⚖️</span> Adv. {activeCase.assignedAdvocate.name}
                            </p>
                            <p className="text-xs text-amber-800 font-mono font-bold">
                              Bar User ID: {activeCase.assignedAdvocate.userID}
                            </p>
                            <p className="text-xs text-gray-500">
                              Assigned on: {activeCase.assignedAdvocate.assignedAt ? new Date(activeCase.assignedAdvocate.assignedAt).toLocaleDateString() : 'Active Assignment'}
                            </p>
                          </div>
                        ) : (
                          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                            No defense advocate has been appointed yet. Currently under Socio-Legal evaluation.
                          </div>
                        )}
                      </div>

                      <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Court & Bail Status</h4>
                        <div className="space-y-1">
                          <p className="text-xs text-gray-700">
                            <strong>Court:</strong> {activeCase.caseDetails?.court || 'Saket Court'}
                          </p>
                          <p className="text-xs text-gray-700">
                            <strong>FIR:</strong> {activeCase.caseDetails?.firNumber || 'FIR 412/2025'} ({activeCase.caseDetails?.policeStation || 'PS Hauz Khas'})
                          </p>
                          <p className="text-xs text-gray-700">
                            <strong>Bail Application Filed:</strong>{' '}
                            <span className={activeCase.caseDetails?.bailApplicationsFiled ? 'text-emerald-700 font-bold' : 'text-gray-500'}>
                              {activeCase.caseDetails?.bailApplicationsFiled ? 'Yes, Filed' : 'Not Filed'}
                            </span>
                          </p>
                          <p className="text-xs text-gray-700">
                            <strong>Next Hearing Date:</strong>{' '}
                            {activeCase.caseDetails?.nextHearingDate ? (
                              <span className="font-bold text-amber-800">
                                {new Date(activeCase.caseDetails.nextHearingDate).toLocaleDateString()}
                              </span>
                            ) : (
                              'No hearing scheduled'
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sub-Tab 5: Monitoring */}
                  {pipelineSubTab === 'monitoring' && (
                    <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Hearing Notes & Court Status</h4>
                      <p className="text-sm text-gray-800 leading-relaxed bg-white p-4 rounded-xl border border-gray-200">
                        {activeCase.caseDetails?.hearingNotes || 'No specific hearing arguments or notes recorded for this date.'}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                        <span>Lawyer Type: {activeCase.caseDetails?.lawyerType || 'Legal Aid'}</span>
                        <span>Call Status: {activeCase.callStatus || 'Under Review'}</span>
                      </div>
                    </div>
                  )}

                  {/* Sub-Tab 6: Notes & Follow-ups */}
                  {pipelineSubTab === 'notes' && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Follow-Up Call Logs & Administrative Remarks
                      </h4>
                      {!activeCase.followUps || activeCase.followUps.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No follow-ups recorded yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {activeCase.followUps.map((f, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-gray-900">
                                  Round {f.round || idx + 1} • {f.poc || 'Officer'}
                                </span>
                                <span className="text-[11px] text-gray-500">
                                  {f.date ? new Date(f.date).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                              <p className="text-gray-700">{f.notes || 'No detailed interaction notes recorded.'}</p>
                              {f.callStatus && (
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-200 text-gray-800">
                                  Status: {f.callStatus}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* =========================================================================
                  CARD 2: CASE TIMELINE (EXACT REPLICA OF USER UI MILESTONES & DAYS COUNT)
                  ========================================================================= */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 tracking-tight">Case Timeline</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Key milestones and time spent at each stage
                    </p>
                  </div>

                  {/* Days Since Intake Big Metric (from screenshot) */}
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                      Days Since Intake
                    </span>
                    <span className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                      {activePipelineInfo.daysSinceIntake}
                    </span>
                  </div>
                </div>

                {/* Connected Gold Milestone Track (from screenshot) */}
                <div className="relative py-6">
                  {/* Gold Horizontal Track Line */}
                  <div className="absolute top-1/2 -translate-y-5 left-10 right-10 h-0.5 bg-amber-500/80 z-0"></div>

                  <div className="relative z-10 flex items-start justify-between">
                    {activePipelineInfo.timelineMilestones.map((milestone) => {
                      const isDone = milestone.isDone;

                      return (
                        <div key={milestone.id} className="flex flex-col items-center text-center max-w-[130px] group">
                          {/* Circular Golden Badge with Icon */}
                          <div
                            className={`w-11 h-11 rounded-full flex items-center justify-center font-bold transition shadow-xs ${
                              isDone
                                ? 'bg-amber-500 text-white ring-4 ring-amber-100 ring-offset-2'
                                : 'bg-white border-2 border-dashed border-gray-300 text-gray-400'
                            }`}
                          >
                            {milestone.iconType === 'phone' && (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                            )}
                            {milestone.iconType === 'doc' && (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            )}
                            {milestone.iconType === 'book' && (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            )}
                            {milestone.iconType === 'scales' && (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                              </svg>
                            )}
                            {milestone.iconType === 'check-double' && (
                              <span className="text-xl">🎯</span>
                            )}
                          </div>

                          {/* Milestone Information */}
                          <div className="mt-3 space-y-0.5">
                            <span className="text-xs sm:text-sm font-bold text-gray-900 block truncate max-w-[120px]">
                              {milestone.title}
                            </span>
                            <span className="text-[11px] font-medium text-gray-400 block truncate max-w-[120px]">
                              {milestone.sublabel}
                            </span>
                            <span className="text-[11px] font-semibold text-gray-700 block">
                              {milestone.date
                                ? new Date(milestone.date).toLocaleDateString(undefined, {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : 'Pending'}
                            </span>
                            <span className="inline-block text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mt-1">
                              {milestone.daysDiff}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Summary Metrics Strip at Bottom (from screenshot) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-100">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Current Stage
                    </span>
                    <p className="text-sm font-extrabold text-gray-900 truncate" title={activePipelineInfo.currentStageText}>
                      {activePipelineInfo.currentStageText}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Days at Current Stage
                    </span>
                    <p className="text-sm font-extrabold text-gray-900">
                      {activePipelineInfo.daysAtCurrentStage} Days
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Department Owner
                    </span>
                    <p className="text-sm font-extrabold text-gray-900 truncate" title={activePipelineInfo.stageOwner}>
                      {activePipelineInfo.stageOwner}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Admin Flag Status
                    </span>
                    <p className="text-sm font-extrabold text-gray-900">
                      {activeCase.adminFlag?.isFlagged ? (
                        <span className="text-red-700 font-bold flex items-center gap-1">
                          <span>🚩</span> Flagged
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-bold">Clear (Normal)</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW MODE B: ALL CASES GRID VIEW (OPTIONAL EXPANDABLE TOGGLE)
              ========================================================================= */}
          {pipelineViewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {allPipelineCases.map((c) => {
                const isFlagged = c.adminFlag?.isFlagged;
                const pInfo = calculateCasePipeline(c);

                return (
                  <div
                    key={c._id}
                    className={`rounded-2xl bg-white border p-5 shadow-xs space-y-4 transition flex flex-col justify-between hover:shadow-md ${
                      isFlagged ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Card Header: Stage badge & SL Number */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-xs text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          SL: #{c.sNo || c.slcNo || 'N/A'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isFlagged && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold">
                              🚩 FLAGGED
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.currentStage === 'Advocate'
                                ? 'bg-amber-100 text-amber-800'
                                : c.currentStage === 'Socio-Legal'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}
                          >
                            {c.currentStage || 'Outreach'}
                          </span>
                        </div>
                      </div>

                      {/* Inmate Info & Creation Date */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-base font-extrabold text-gray-900 tracking-tight">
                            {c.inmate?.name || 'Inmate Name'}
                          </h4>
                          <span
                            className="text-[10px] text-gray-600 font-semibold bg-gray-100 px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1 border border-gray-200/60"
                            title="Ticket Creation Date"
                          >
                            <span>📅</span>
                            {new Date(c.createdAt || c.dateOfFirstContact || Date.now()).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                          {c.inmate?.gender || 'N/A'} • {c.inmate?.age ? `${c.inmate.age} yrs` : 'Age N/A'}
                        </p>
                      </div>

                      {/* Mini Stepper Progress Line */}
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-gray-500">
                          <span>Progress: {pInfo.currentStageText}</span>
                          <span>{pInfo.daysSinceIntake}d</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-500 h-full rounded-full transition-all"
                            style={{
                              width: `${Math.max(16, ((pInfo.activeIndex + 1) / 6) * 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Offence & Court */}
                      <div className="text-xs space-y-1 text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                        <p className="truncate">
                          <span className="font-semibold text-gray-700">Offence:</span>{' '}
                          {Array.isArray(c.inmate?.offenceType) ? c.inmate.offenceType.join(', ') : c.inmate?.offenceType || 'Not specified'}
                        </p>
                        <p className="truncate">
                          <span className="font-semibold text-gray-700">Court / FIR:</span>{' '}
                          {c.caseDetails?.firNumber || 'No FIR'} • {c.caseDetails?.court || 'Court N/A'}
                        </p>
                        {c.assignedAdvocate?.name && (
                          <p className="truncate text-amber-800 font-semibold pt-0.5">
                            ⚖️ Adv: {c.assignedAdvocate.name} ({c.assignedAdvocate.userID})
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setFlagModalCase(c);
                            setFlagReason(c.adminFlag?.flagReason || '');
                          }}
                          className={`p-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                            isFlagged
                              ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
                              : 'bg-white border-gray-200 text-gray-600 hover:text-red-600 hover:bg-gray-50'
                          }`}
                          title={isFlagged ? 'Modify or resolve flag' : 'Flag this case'}
                        >
                          🚩 {isFlagged ? 'Flagged' : 'Flag'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUpdateModalCase(c);
                            setUpdateRequestNote('');
                          }}
                          className="p-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer flex items-center gap-1"
                        >
                          <span>🔔</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPipelineCaseId(c._id);
                          setPipelineViewMode('stepper');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                      >
                        Inspect Pipeline ↗
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: TARGET MANAGEMENT
          ========================================================================= */}
      {activeTab === 'targets' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Target Allocator Form */}
          <div className="lg:col-span-1 rounded-2xl bg-white p-6 border border-gray-200 shadow-xs space-y-5">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>🎯</span> Set Outreach Targets
              </h3>
              <p className="text-xs text-gray-500">
                Configure ticket goals for outreach teams. Targets automatically sync with the Serial Number (SL) trackers.
              </p>
            </div>

            <form onSubmit={handleSaveTarget} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Target Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetType('TOTAL')}
                    className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                      targetType === 'TOTAL'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    Total Target (SL Goal)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('DAILY')}
                    className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                      targetType === 'DAILY'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    Daily Ticket Target
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Target Count ({targetType === 'TOTAL' ? 'Total Tickets' : 'Tickets per Day'})
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={targetCount}
                  onChange={(e) => setTargetCount(e.target.value)}
                  placeholder="e.g. 50 or 100"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {targetType === 'DAILY' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Target Date</label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description / Directive Note</label>
                <textarea
                  rows="2"
                  value={targetDesc}
                  onChange={(e) => setTargetDesc(e.target.value)}
                  placeholder="e.g., Target for North Delhi Outreach Camp"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={savingTarget}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {savingTarget ? 'Saving Target...' : 'Save & Publish Target'}
              </button>
            </form>
          </div>

          {/* Current Target Overview & Live Status */}
          <div className="lg:col-span-2 space-y-5">
            <div className="rounded-2xl bg-white p-6 border border-gray-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <span>📈</span> Current Target Performance
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Total Target Card */}
                <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-purple-900">
                    <span>Overall Project Goal</span>
                    <span className="px-2 py-0.5 rounded bg-purple-200 text-purple-900">Active</span>
                  </div>
                  <div>
                    <p className="text-3xl font-extrabold text-purple-900">
                      {targetsData?.total?.current || 0} / {targetsData?.total?.target || 100}
                    </p>
                    <p className="text-xs text-purple-700 font-medium">Serial Number Tickets Created</p>
                  </div>
                  <div className="w-full h-3 rounded-full bg-purple-200 overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full transition-all duration-500"
                      style={{ width: `${targetsData?.total?.percent || 0}%` }}
                    ></div>
                  </div>
                  <p className="text-[11px] text-purple-700 font-semibold">
                    {targetsData?.total?.percent || 0}% of Total Target Achieved
                  </p>
                </div>

                {/* Daily Target Card */}
                <div className="p-5 rounded-2xl bg-cyan-50/50 border border-cyan-200 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-cyan-900">
                    <span>Today's Quota ({targetsData?.daily?.date || 'Today'})</span>
                    <span className="px-2 py-0.5 rounded bg-cyan-200 text-cyan-900">Daily</span>
                  </div>
                  <div>
                    <p className="text-3xl font-extrabold text-cyan-900">
                      {targetsData?.daily?.current || 0} / {targetsData?.daily?.target || 15}
                    </p>
                    <p className="text-xs text-cyan-700 font-medium">Tickets Logged Today</p>
                  </div>
                  <div className="w-full h-3 rounded-full bg-cyan-200 overflow-hidden">
                    <div
                      className="h-full bg-cyan-600 rounded-full transition-all duration-500"
                      style={{ width: `${targetsData?.daily?.percent || 0}%` }}
                    ></div>
                  </div>
                  <p className="text-[11px] text-cyan-700 font-semibold">
                    {targetsData?.daily?.percent || 0}% of Today's Target Completed
                  </p>
                </div>
              </div>
            </div>

            {/* Target Explanation Card */}
            <div className="rounded-2xl bg-gray-50 p-5 border border-gray-200 text-xs text-gray-600 space-y-2">
              <p className="font-bold text-gray-800 flex items-center gap-1.5">
                <span>ℹ️</span> How Targets Integrate with the System:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-500 pl-1 leading-relaxed">
                <li>
                  <strong>Total Target</strong> determines the target benchmark displayed next to the Outreach Serial Numbers (SL Numbers) across all case lists.
                </li>
                <li>
                  <strong>Daily Target</strong> sets daily expectations for field outreach staff, displaying a progress badge on their personal dashboard.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: DIRECT COMMUNICATIONS & DIRECTIVES
          ========================================================================= */}
      {activeTab === 'communications' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Directive Composer Form */}
          <div className="lg:col-span-1 rounded-2xl bg-white p-6 border border-gray-200 shadow-xs space-y-5">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>✉️</span> Send Directive / Message
              </h3>
              <p className="text-xs text-gray-500">
                Send direct messages or team-wide announcements. Messages immediately trigger real-time toasts and appear in the user's notification center.
              </p>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-4">
              {/* 1. Department Selector (3 sections) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Select Department</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { key: 'Outreach', label: 'OutReach', icon: '📞' },
                    { key: 'SocioLegal', label: 'Socio-Legal', icon: '💬' },
                    { key: 'Advocate', label: 'Advocates', icon: '⚖️' },
                  ].map((dept) => (
                    <button
                      key={dept.key}
                      type="button"
                      onClick={() => {
                        setMessageDept(dept.key);
                        setRecipientId('ALL');
                      }}
                      className={`py-2 px-1 text-center text-xs font-bold rounded-xl border transition cursor-pointer ${
                        messageDept === dept.key
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <span className="block text-sm">{dept.icon}</span>
                      <span className="text-[11px] truncate block">{dept.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Recipient Dropdown (dynamically populated) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Recipient ({messageDept} Personnel)
                </label>
                <select
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="ALL">📢 All {messageDept} Members (Broadcast)</option>
                  {personnelListForDept.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name} ({person.id}) {person.specialization ? `• ${person.specialization}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Priority Flag */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Priority</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Normal', 'Important', 'Urgent'].map((pri) => (
                    <button
                      key={pri}
                      type="button"
                      onClick={() => setMessagePriority(pri)}
                      className={`py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                        messagePriority === pri
                          ? pri === 'Urgent'
                            ? 'bg-red-600 text-white border-red-600'
                            : pri === 'Important'
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-blue-600 text-white border-blue-600'
                          : 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}
                    >
                      {pri === 'Urgent' ? '🚨 Urgent' : pri === 'Important' ? '⚡ Important' : 'Standard'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Subject */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Subject / Directive Title</label>
                <input
                  type="text"
                  required
                  value={messageTitle}
                  onChange={(e) => setMessageTitle(e.target.value)}
                  placeholder="e.g., Immediate Case File Verification Needed"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* 5. Message Body */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Message Content</label>
                <textarea
                  rows="4"
                  required
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Type your message, directive, or case inquiry here..."
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={sendingMessage}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>🚀</span>
                {sendingMessage ? 'Dispatching Message...' : 'Send Directive'}
              </button>
            </form>
          </div>

          {/* Sent Messages History & Live Log */}
          <div className="lg:col-span-2 rounded-2xl bg-white p-6 border border-gray-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <span>📬</span> Admin Dispatched Messages Log
            </h3>

            {sentMessages.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-2xl space-y-2">
                <span className="text-3xl">✉️</span>
                <p className="text-xs font-bold text-gray-700">No messages sent in this session</p>
                <p className="text-[11px] text-gray-400">
                  Use the form on the left to send notifications to Outreach, SLC, or Advocate members.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sentMessages.map((msg) => (
                  <div key={msg.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            msg.priority === 'Urgent'
                              ? 'bg-red-100 text-red-800'
                              : msg.priority === 'Important'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {msg.priority}
                        </span>
                        <span className="text-xs font-bold text-gray-900">{msg.title}</span>
                      </div>
                      <span className="text-[10px] text-gray-400">{msg.sentAt}</span>
                    </div>
                    <p className="text-xs text-gray-600 whitespace-pre-wrap">{msg.body}</p>
                    <div className="text-[11px] text-gray-500 flex items-center gap-2 pt-1 border-t border-gray-200">
                      <span>To: <strong>{msg.recipient}</strong></span>
                      <span>•</span>
                      <span>Department: <strong>{msg.department}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: FLAG / UNFLAG CASE
          ========================================================================= */}
      {flagModalCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>🚩</span>
                {flagModalCase.adminFlag?.isFlagged ? 'Resolve / Edit Flag' : 'Flag Case for Review'}
              </h3>
              <button
                type="button"
                onClick={() => setFlagModalCase(null)}
                className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl">
              <p>
                <strong>Inmate:</strong> {flagModalCase.inmate?.name || 'N/A'} (SL: #{flagModalCase.sNo || flagModalCase.slcNo || 'N/A'})
              </p>
              <p className="mt-1">
                <strong>FIR:</strong> {flagModalCase.caseDetails?.firNumber || 'No FIR'}
              </p>
            </div>

            <form onSubmit={handleToggleFlag} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Reason for Flagging / Audit Remark
                </label>
                <textarea
                  rows="3"
                  required={!flagModalCase.adminFlag?.isFlagged}
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  placeholder="e.g., Discrepancy in custody duration; verify FIR documents..."
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFlagModalCase(null)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition cursor-pointer ${
                    flagModalCase.adminFlag?.isFlagged
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-red-600 hover:bg-red-500'
                  }`}
                >
                  {flagModalCase.adminFlag?.isFlagged ? 'Resolve & Remove Flag' : 'Confirm Flag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: REQUEST CASE UPDATE
          ========================================================================= */}
      {updateModalCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>🔔</span> Request Case Update
              </h3>
              <button
                type="button"
                onClick={() => setUpdateModalCase(null)}
                className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl space-y-1">
              <p>
                <strong>Case:</strong> {updateModalCase.inmate?.name} (SL #{updateModalCase.sNo || updateModalCase.slcNo || 'N/A'})
              </p>
              <p>
                <strong>Recipient:</strong>{' '}
                {updateModalCase.assignedAdvocate?.name
                  ? `Adv. ${updateModalCase.assignedAdvocate.name} (${updateModalCase.assignedAdvocate.userID})`
                  : updateModalCase.slcNo
                  ? 'Socio-Legal Counselling Team'
                  : 'Outreach Team'}
              </p>
            </div>

            <form onSubmit={handleRequestCaseUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Optional Custom Note / Urgent Instruction
                </label>
                <textarea
                  rows="3"
                  value={updateRequestNote}
                  onChange={(e) => setUpdateRequestNote(e.target.value)}
                  placeholder="e.g., Please provide the latest bail hearing date and upload the vakalatnama immediately."
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUpdateModalCase(null)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
                >
                  Send Update Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: FULL CASE INSPECT
          ========================================================================= */}
      {selectedCaseForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-lg bg-purple-100 text-purple-900 font-extrabold text-sm">
                  SL #{selectedCaseForDetails.sNo || selectedCaseForDetails.slcNo || 'N/A'}
                </span>
                <div>
                  <h3 className="text-xl font-extrabold text-gray-900">
                    {selectedCaseForDetails.inmate?.name || 'Inmate'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Stage: <span className="font-bold text-gray-800">{selectedCaseForDetails.currentStage}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCaseForDetails(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <p className="text-gray-500">Age / Gender</p>
                <p className="font-bold text-gray-800 mt-0.5">
                  {selectedCaseForDetails.inmate?.age || 'N/A'} yrs • {selectedCaseForDetails.inmate?.gender || 'N/A'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <p className="text-gray-500">Offence Type</p>
                <p className="font-bold text-gray-800 mt-0.5 truncate" title={selectedCaseForDetails.inmate?.offenceType}>
                  {selectedCaseForDetails.inmate?.offenceType || 'N/A'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <p className="text-gray-500">FIR Number</p>
                <p className="font-bold text-gray-800 mt-0.5 truncate">
                  {selectedCaseForDetails.caseDetails?.firNumber || 'None'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <p className="text-gray-500">Court</p>
                <p className="font-bold text-gray-800 mt-0.5 truncate" title={selectedCaseForDetails.caseDetails?.courtName}>
                  {selectedCaseForDetails.caseDetails?.courtName || 'None'}
                </p>
              </div>
            </div>

            {/* Advocate Details if Assigned */}
            {selectedCaseForDetails.assignedAdvocate?.name && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-sm">
                  <span>⚖️</span> Assigned Advocate: {selectedCaseForDetails.assignedAdvocate.name} ({selectedCaseForDetails.assignedAdvocate.userID})
                </p>
                <p>
                  Specialization: {selectedCaseForDetails.assignedAdvocate.specialization || 'N/A'} • Practice Court: {selectedCaseForDetails.assignedAdvocate.practiceCourt || 'N/A'}
                </p>
              </div>
            )}

            {/* Attached Documents */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Attached Documents ({selectedCaseForDetails.attachedFiles?.length || 0})
              </h4>
              {(!selectedCaseForDetails.attachedFiles || selectedCaseForDetails.attachedFiles.length === 0) ? (
                <p className="text-xs text-gray-400 italic">No files attached to this case.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {selectedCaseForDetails.attachedFiles.map((doc, idx) => (
                    <div key={doc._id || idx} className="p-3 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between gap-2">
                      <div className="truncate">
                        <p className="font-bold text-gray-900 truncate" title={doc.title}>
                          {doc.title || doc.documentType}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {doc.uploadedByName || doc.uploadedByRole || 'User'}
                        </p>
                      </div>
                      <a
                        href={`${apiInstance}/documents/view/${selectedCaseForDetails._id}/${encodeURIComponent(doc._id || doc.publicId)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-white border border-gray-300 text-indigo-700 font-semibold hover:bg-indigo-50"
                      >
                        View ↗
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedCaseForDetails(null)}
                className="px-5 py-2 rounded-xl bg-gray-900 text-white font-bold text-xs hover:bg-gray-800 transition cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
