import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import { apiInstance } from '../App';

export default function AdvocateDashboard() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const storedAdvocate = useAuthStore((state) => state.advocate);
  const setAdvocate = useAuthStore((state) => state.setAdvocate);

  const [advocateData, setAdvocateData] = useState(storedAdvocate);
  const [loadingProfile, setLoadingProfile] = useState(!storedAdvocate);
  const [profileError, setProfileError] = useState(null);

  // Assigned Cases state
  const [assignedCases, setAssignedCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [casesError, setCasesError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('All');
  const [expandedCaseId, setExpandedCaseId] = useState(null);

  // Modals state
  const [selectedCaseForDetails, setSelectedCaseForDetails] = useState(null);
  const [selectedCaseForAddFields, setSelectedCaseForAddFields] = useState(null);

  // Add Fields Form state
  const [pdfFile, setPdfFile] = useState(null);
  const [documentNotes, setDocumentNotes] = useState('');
  const [hearingDate, setHearingDate] = useState('');
  const [hearingNotes, setHearingNotes] = useState('');
  const [bailStatus, setBailStatus] = useState('');
  const [submittingFields, setSubmittingFields] = useState(false);

  // 1. Fetch advocate profile if not available in store
  useEffect(() => {
    if (storedAdvocate) {
      setAdvocateData(storedAdvocate);
      setLoadingProfile(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);
        const res = await axios.get(`${apiInstance}/advocates/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fetched = res.data.advocate;
        setAdvocateData(fetched);
        setAdvocate(fetched);
      } catch (err) {
        console.error('Failed to fetch advocate profile:', err);
        setProfileError(err.response?.data?.message || 'Failed to load advocate profile');
      } finally {
        setLoadingProfile(false);
      }
    };

    if (token) {
      fetchProfile();
    }
  }, [token, storedAdvocate, setAdvocate]);

  // 2. Fetch cases assigned to this advocate
  const fetchAssignedCases = async () => {
    try {
      setLoadingCases(true);
      setCasesError(null);
      const res = await axios.get(`${apiInstance}/advocates/assigned-cases`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignedCases(res.data.cases || []);
    } catch (err) {
      console.error('Failed to fetch assigned cases:', err);
      setCasesError(err.response?.data?.message || 'Failed to load assigned cases');
    } finally {
      setLoadingCases(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAssignedCases();
    }
  }, [token]);

  const advocateName = advocateData?.name || user?.userName || 'Advocate';
  const userID = advocateData?.userID || user?.userID || 'ADV-----';
  const specialization = advocateData?.specialization || 'Not Specified';
  const practiceCourt = advocateData?.practiceCourt || 'Not Specified';
  const experience = advocateData?.yearsOfExperience ?? '—';
  const casesTaken = advocateData?.casesTaken ?? '—';
  const casesWon = advocateData?.casesWon ?? '—';
  const stateName = advocateData?.state || 'Delhi';

  const winRate =
    advocateData?.casesTaken && advocateData?.casesTaken > 0
      ? ((advocateData.casesWon / advocateData.casesTaken) * 100).toFixed(1)
      : '0.0';

  // Filter assigned cases
  const filteredCases = assignedCases.filter((item) => {
    const inmateName = item.inmate?.name?.toLowerCase() || '';
    const offences = (item.inmate?.offenceType || []).join(' ').toLowerCase();
    const fir = item.caseDetails?.firNumber?.toLowerCase() || '';
    const court = item.caseDetails?.court?.toLowerCase() || '';
    const contact = item.contactPerson?.name?.toLowerCase() || item.familyMember?.name?.toLowerCase() || '';
    const search = searchQuery.toLowerCase().trim();

    const matchesSearch =
      !search ||
      inmateName.includes(search) ||
      offences.includes(search) ||
      fir.includes(search) ||
      court.includes(search) ||
      contact.includes(search);

    const matchesTier =
      tierFilter === 'All' ||
      (item.tier && item.tier.toLowerCase().includes(tierFilter.toLowerCase()));

    return matchesSearch && matchesTier;
  });

  const highPriorityCount = assignedCases.filter(
    (c) => c.tier && c.tier.toLowerCase().includes('tier 1')
  ).length;

  const docsAvailableCount = assignedCases.filter(
    (c) => Array.isArray(c.attachedFiles) && c.attachedFiles.length > 0
  ).length;

  const getTierBadgeClass = (tier) => {
    if (!tier) return 'bg-gray-100 text-gray-700 border-gray-200';
    if (tier.includes('Tier 1')) return 'bg-rose-100 text-rose-800 border-rose-200';
    if (tier.includes('Tier 2')) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (tier.includes('Tier 3')) return 'bg-purple-100 text-purple-800 border-purple-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  // Helper to separate advocate documents and socio-legal documents
  const separateDocuments = (attachedFiles = []) => {
    const advocateDocs = [];
    const socioLegalDocs = [];

    for (const doc of attachedFiles) {
      const isAdv =
        doc.section === 'Advocate' ||
        (doc.title && doc.title.startsWith('ADV_')) ||
        doc.uploadedByRole === 'ADV' ||
        doc.documentType === 'Advocate Submission';

      if (isAdv) {
        advocateDocs.push(doc);
      } else {
        socioLegalDocs.push(doc);
      }
    }

    return { advocateDocs, socioLegalDocs };
  };

  // Generate safe inline viewing URL (opens in new browser tab without downloading)
  const getDocumentViewUrl = (doc, caseItem) => {
    if (!doc) return '#';
    const backendBase = 'http://localhost:3000';
    const caseId = caseItem?._id || doc.caseId;
    const fileId = doc._id || doc.publicId;

    if (caseId && fileId) {
      return `${backendBase}/api/documents/view/${caseId}/${encodeURIComponent(fileId)}`;
    }
    if (fileId) {
      return `${backendBase}/api/documents/view/${encodeURIComponent(fileId)}`;
    }
    return doc.fileUrl || '#';
  };

  // Open "Add Fields" modal
  const openAddFieldsModal = (caseItem) => {
    setSelectedCaseForAddFields(caseItem);
    setPdfFile(null);
    setDocumentNotes('');
    setHearingDate(
      caseItem.caseDetails?.nextHearingDate
        ? caseItem.caseDetails.nextHearingDate.split('T')[0]
        : ''
    );
    setHearingNotes(caseItem.caseDetails?.hearingNotes || '');
    setBailStatus(
      caseItem.caseDetails?.bailApplicationsFiled === true
        ? 'true'
        : caseItem.caseDetails?.bailApplicationsFiled === false
        ? 'false'
        : ''
    );
  };

  const closeAddFieldsModal = () => {
    setSelectedCaseForAddFields(null);
    setPdfFile(null);
    setDocumentNotes('');
    setHearingDate('');
    setHearingNotes('');
    setBailStatus('');
  };

  // Handle PDF file selection
  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF documents are allowed.');
      e.target.value = '';
      return;
    }
    setPdfFile(file);
  };

  // Submit "Add Fields"
  const handleAddFieldsSubmit = async (e) => {
    e.preventDefault();

    if (!pdfFile && !hearingDate && !hearingNotes.trim() && !bailStatus) {
      toast.error('Please attach a PDF document, update hearing date/notes, or set bail status.');
      return;
    }

    if (pdfFile && !documentNotes.trim()) {
      toast.error('Please enter a description for the document being uploaded.');
      return;
    }

    setSubmittingFields(true);

    try {
      const formData = new FormData();
      if (pdfFile) {
        formData.append('file', pdfFile);
        // Prefix with ADV_
        const rawNote = documentNotes.trim();
        const prefixed = rawNote.startsWith('ADV_') ? rawNote : `ADV_${rawNote}`;
        formData.append('documentNotes', prefixed);
      }

      if (hearingDate) {
        formData.append('hearingDate', hearingDate);
      }

      if (hearingNotes.trim()) {
        formData.append('hearingNotes', hearingNotes.trim());
      }

      if (bailStatus) {
        formData.append('bailApplicationsFiled', bailStatus);
      }

      const res = await axios.post(
        `${apiInstance}/advocates/cases/${selectedCaseForAddFields._id}/add-fields`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      toast.success(res.data.message || 'Fields and Socio-Legal docket updated successfully!');

      // Update local state with the updated case
      const updated = res.data.case;
      setAssignedCases((prev) =>
        prev.map((c) => (c._id === updated._id ? { ...c, ...updated } : c))
      );

      closeAddFieldsModal();
    } catch (err) {
      console.error('Error adding fields:', err);
      toast.error(err.response?.data?.message || 'Failed to update case fields.');
    } finally {
      setSubmittingFields(false);
    }
  };

  if (loadingProfile && !advocateData) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-16 text-center text-gray-500">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-amber-600 border-r-transparent mb-4"></div>
        <p className="text-sm font-medium">Loading advocate portal...</p>
      </div>
    );
  }

  if (profileError && !advocateData) {
    return (
      <div className="w-full max-w-xl mx-auto my-12 p-6 bg-red-50 border border-red-200 rounded-2xl text-center">
        <p className="text-red-700 font-semibold">{profileError}</p>
        <p className="text-xs text-red-500 mt-1">Please try logging in again or contact administrator.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30 backdrop-blur-xs">
              Role: ADV
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-100 border border-emerald-300/30">
              Verified Legal Counsel
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Advocate {advocateName}
          </h1>
          <p className="text-amber-100 text-sm">
            Jurisdiction: <strong className="text-white">{practiceCourt}</strong> ({stateName})
          </p>
        </div>

        <div className="bg-white/10 border border-white/20 backdrop-blur-xs rounded-2xl px-5 py-3 text-right">
          <p className="text-xs text-amber-200 font-medium">Advocate Bar ID</p>
          <p className="text-xl font-mono font-bold tracking-wider">{userID}</p>
        </div>
      </div>

      {/* Profile & Practice Details Card */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4 bg-gray-50/60 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Personal & Practice Details
          </h2>
          <span className="text-xs font-medium text-gray-500">
            Specialization: <strong className="text-indigo-700">{specialization}</strong>
          </span>
        </div>

        <div className="p-6 sm:p-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Experience */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Experience</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{experience} <span className="text-xs font-normal text-gray-500">Years</span></p>
          </div>

          {/* Cases Taken */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Cases Taken</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{casesTaken}</p>
          </div>

          {/* Cases Won */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Cases Won</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">{casesWon}</p>
          </div>

          {/* Win Rate */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Success Rate</p>
            <p className="text-xl font-bold text-indigo-600 mt-1">{winRate}%</p>
          </div>
        </div>
      </div>

      {/* SECTION: Assigned Cases from Socio-Legal Team */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-7 w-7 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                ⚖
              </span>
              <h2 className="text-xl font-bold text-gray-900">
                Cases Assigned by Socio-Legal Team
              </h2>
              <span className="rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-xs font-bold border border-amber-200">
                {assignedCases.length} {assignedCases.length === 1 ? 'Case' : 'Cases'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Inmates and undertrial cases matched to your legal expertise in {specialization}.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchAssignedCases}
            disabled={loadingCases}
            className="self-start sm:self-auto rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <svg
              className={`w-4 h-4 text-gray-500 ${loadingCases ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Cases
          </button>
        </div>

        {/* Assigned Cases Metric Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white p-4 border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Total Active Assignments</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{assignedCases.length}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-base">
              📁
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Tier 1 (High Priority)</p>
              <p className="text-2xl font-bold text-rose-600 mt-0.5">{highPriorityCount}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-base">
              ⚡
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 border border-gray-200 shadow-xs flex items-center justify-between col-span-2 sm:col-span-1">
            <div>
              <p className="text-xs font-medium text-gray-500">Cases with Documents</p>
              <p className="text-2xl font-bold text-indigo-600 mt-0.5">{docsAvailableCount}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-base">
              📄
            </div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search inmate name, offence, court, FIR number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-300 py-2 pl-9 pr-4 text-xs text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600 whitespace-nowrap">Filter Priority:</label>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800 font-medium focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              <option value="All">All Priorities</option>
              <option value="Tier 1">Tier 1 (High Priority)</option>
              <option value="Tier 2">Tier 2 (Low Priority)</option>
              <option value="Tier 3">Tier 3 (Complex)</option>
            </select>
          </div>
        </div>

        {/* Case List Display */}
        {loadingCases ? (
          <div className="rounded-3xl bg-white border border-gray-200 p-12 text-center text-gray-500 shadow-xs">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-amber-600 border-r-transparent mb-4"></div>
            <p className="text-sm font-medium">Loading your assigned cases...</p>
          </div>
        ) : casesError ? (
          <div className="rounded-3xl bg-red-50 border border-red-200 p-8 text-center text-red-700">
            <p className="font-semibold">{casesError}</p>
            <button
              type="button"
              onClick={fetchAssignedCases}
              className="mt-3 rounded-xl bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-500"
            >
              Try Again
            </button>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="rounded-3xl bg-white border border-gray-200 p-12 text-center shadow-xs">
            <div className="h-16 w-16 mx-auto rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl mb-4">
              ⚖
            </div>
            <h3 className="text-base font-bold text-gray-900">No Assigned Cases Found</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1.5">
              {searchQuery || tierFilter !== 'All'
                ? 'No assigned cases match your search or filter criteria. Try clearing the filter.'
                : 'When the Socio-Legal Counselling team assigns you a case from the portal, it will immediately appear here with all case notes and documents.'}
            </p>
            {(searchQuery || tierFilter !== 'All') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setTierFilter('All');
                }}
                className="mt-4 rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCases.map((caseItem) => {
              const inmate = caseItem.inmate || {};
              const caseDetails = caseItem.caseDetails || {};
              const legal = caseItem.legalAssessment || {};
              const contact = caseItem.familyMember || caseItem.contactPerson || {};
              const contactPhone =
                contact.phoneNumber ||
                (Array.isArray(contact.phoneNumbers) ? contact.phoneNumbers.join(', ') : contact.phoneNumbers || '');
              const offences = Array.isArray(inmate.offenceType) ? inmate.offenceType : [inmate.offenceType].filter(Boolean);
              const isExpanded = expandedCaseId === caseItem._id;

              // Formatted Dates
              const registeredDate = caseItem.createdAt
                ? new Date(caseItem.createdAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'N/A';

              const assignedDate = caseItem.assignedAdvocate?.assignedAt
                ? new Date(caseItem.assignedAdvocate.assignedAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Recent';

              const nextHearing = caseDetails.nextHearingDate
                ? new Date(caseDetails.nextHearingDate).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : null;

              // Separate advocate and socio-legal documents
              const { advocateDocs, socioLegalDocs } = separateDocuments(caseItem.attachedFiles);

              return (
                <div
                  key={caseItem._id}
                  className="rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-amber-300 transition-all p-5 sm:p-6 space-y-4"
                >
                  {/* Top Bar: Case ID, Inmate Name, Status, Date & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="rounded-lg bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 text-xs font-bold font-mono">
                        {caseItem.slcNo ? `SLC #${caseItem.slcNo}` : `Case #${caseItem.sNo || caseItem._id.slice(-6)}`}
                      </span>

                      {caseItem.tier && (
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getTierBadgeClass(
                            caseItem.tier
                          )}`}
                        >
                          {caseItem.tier}
                        </span>
                      )}

                      {legal.crimeCategory && (
                        <span className="rounded-full bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 text-xs font-medium">
                          {legal.crimeCategory}
                        </span>
                      )}

                      {caseItem.prisonDetails?.prisonerType && (
                        <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 text-xs font-medium">
                          {caseItem.prisonDetails.prisonerType}
                        </span>
                      )}

                      {nextHearing && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 text-violet-800 border border-violet-300 px-2.5 py-0.5 text-xs font-bold">
                          <span>📅 Hearing:</span>
                          <span>{nextHearing}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {/* BUTTON: Add Fields */}
                      <button
                        type="button"
                        onClick={() => openAddFieldsModal(caseItem)}
                        className="rounded-xl bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-1.5 text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                        title="Upload PDF document, update bail status & hearing date"
                      >
                        <span>+ Add Fields</span>
                      </button>

                      {/* BUTTON: View Full Case Data */}
                      <button
                        type="button"
                        onClick={() => setSelectedCaseForDetails(caseItem)}
                        className="rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                        title="View complete registered case file"
                      >
                        <span>🔍 Full Details</span>
                      </button>
                    </div>
                  </div>

                  {/* Registered Date & Assignment Info */}
                  <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50/80 px-3 py-1.5 rounded-lg">
                    <span>
                      Registered Date: <strong className="text-gray-800">{registeredDate}</strong>
                    </span>
                    <span>
                      Assigned Date: <strong className="text-gray-800">{assignedDate}</strong>
                    </span>
                  </div>

                  {/* Main Grid: Inmate Info, Offence, Contact, Court */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Col 1: Inmate Demographics */}
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Inmate Profile</p>
                      <h3 className="text-base font-bold text-gray-900">{inmate.name || 'Unnamed Inmate'}</h3>
                      <div className="text-xs text-gray-600 space-y-0.5">
                        {inmate.gender && <p>Gender: <strong className="text-gray-800">{inmate.gender}</strong></p>}
                        {inmate.age && <p>Age: <strong className="text-gray-800">{inmate.age} yrs</strong></p>}
                        {inmate.education && <p>Education: <strong className="text-gray-800">{inmate.education}</strong></p>}
                      </div>
                    </div>

                    {/* Col 2: Legal Particulars & Court */}
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Offence & Court</p>
                      <div className="flex flex-wrap gap-1.5">
                        {offences.length > 0 ? (
                          offences.map((off, idx) => (
                            <span
                              key={idx}
                              className="rounded-md bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 text-xs font-semibold"
                            >
                              {off}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">Not specified</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 space-y-0.5 mt-2">
                        <p>Court: <strong className="text-gray-800">{caseDetails.court || 'Not specified'}</strong></p>
                        <p>FIR No: <strong className="text-gray-800">{caseDetails.firNumber || 'N/A'}</strong></p>
                        {caseDetails.policeStation && (
                          <p>Police Station: <strong className="text-gray-800">{caseDetails.policeStation}</strong></p>
                        )}
                        {legal.stageOfCase && (
                          <p>Stage: <strong className="text-indigo-700">{legal.stageOfCase}</strong></p>
                        )}
                      </div>
                    </div>

                    {/* Col 3: Family Contact & Support */}
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Contact Person</p>
                      <p className="text-sm font-bold text-gray-800">
                        {contact.name || 'N/A'} {contact.relationshipWithInmate && `(${contact.relationshipWithInmate})`}
                      </p>
                      {contactPhone ? (
                        <a
                          href={`tel:${contactPhone}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline mt-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {contactPhone}
                        </a>
                      ) : (
                        <p className="text-xs text-gray-400">No phone provided</p>
                      )}

                      {caseItem.poc && (
                        <p className="text-xs text-gray-500 mt-1">
                          SLC POC: <strong className="text-gray-700">{caseItem.poc}</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Hearing Information Box if present */}
                  {(caseDetails.nextHearingDate || caseDetails.hearingNotes) && (
                    <div className="rounded-xl bg-violet-50/80 border border-violet-200 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="font-bold text-violet-900 flex items-center gap-1">
                          <span>📅</span> Next Hearing Date: {nextHearing || 'Unspecified'}
                        </span>
                        {caseDetails.hearingNotes && (
                          <p className="text-violet-800 mt-1">
                            <strong>Hearing Notes:</strong> {caseDetails.hearingNotes}
                          </p>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-violet-600 bg-violet-100 px-2 py-0.5 rounded">
                        Active on Docket
                      </span>
                    </div>
                  )}

                  {/* SECTION 1: Advocate Documents & Bail Submissions */}
                  <div className="rounded-xl bg-amber-50/60 p-3.5 border border-amber-200/80 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                        <span>⚖</span> Advocate Submissions & Bail Documents ({advocateDocs.length}):
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded">
                          Cloudinary: advocate_documents/
                        </span>
                        {caseDetails.bailApplicationsFiled === true ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                            ✓ Bail Filed
                          </span>
                        ) : caseDetails.bailApplicationsFiled === false ? (
                          <span className="text-[10px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                            Bail Not Filed
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {advocateDocs.length === 0 ? (
                      <p className="text-xs text-amber-800/70 italic">
                        No advocate documents uploaded yet. Click "+ Add Fields" to upload bail applications or case documents.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {advocateDocs.map((doc, idx) => (
                          <a
                            key={doc._id || idx}
                            href={getDocumentViewUrl(doc, caseItem)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition shadow-2xs"
                          >
                            <span>⚖</span>
                            <span className="truncate max-w-[220px]" title={doc.title}>
                              {doc.title || 'Advocate Submission'}
                            </span>
                            <span className="text-[10px] text-amber-600">↗</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* SECTION 2: Socio-Legal Case Documents */}
                  {socioLegalDocs.length > 0 && (
                    <div className="rounded-xl bg-gray-50 p-3.5 border border-gray-200 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                          <span>📁</span> Socio-Legal Case Documents ({socioLegalDocs.length}):
                        </p>
                        <span className="text-[10px] font-semibold text-gray-500 bg-gray-200/70 px-2 py-0.5 rounded">
                          Cloudinary: socio_legal_documents/
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {socioLegalDocs.map((doc, idx) => (
                          <a
                            key={doc._id || idx}
                            href={getDocumentViewUrl(doc, caseItem)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition shadow-2xs"
                          >
                            <span>📎</span>
                            <span className="truncate max-w-[200px]" title={doc.title}>
                              {doc.title || doc.documentType || 'Document'}
                            </span>
                            <span className="text-[10px] text-gray-400">↗</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Collapsible Details & Follow-up Timeline */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-gray-100 space-y-3 text-xs animate-in fade-in duration-150">
                      {caseItem.initialCallNotes && (
                        <div className="rounded-xl bg-amber-50/60 border border-amber-200/70 p-3">
                          <p className="font-bold text-amber-900 mb-0.5">Socio-Legal Initial Advisory Notes:</p>
                          <p className="text-gray-700 whitespace-pre-wrap">{caseItem.initialCallNotes}</p>
                        </div>
                      )}

                      {Array.isArray(caseItem.followUps) && caseItem.followUps.length > 0 ? (
                        <div className="space-y-2">
                          <p className="font-bold text-gray-800">Docket & Follow-up Timeline:</p>
                          <div className="space-y-1.5">
                            {caseItem.followUps.map((fu, fIdx) => (
                              <div
                                key={fu._id || fIdx}
                                className="rounded-lg bg-gray-50 p-2.5 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-gray-700"
                              >
                                <div>
                                  <span className="font-semibold text-indigo-700 mr-2">
                                    Round #{fu.round || fu.followUpNumber || fIdx + 1}:
                                  </span>
                                  <span>{fu.notes || fu.callStatus || 'Logged call'}</span>
                                  {fu.documentBottleneck && (
                                    <span className="ml-2 text-rose-700 font-medium bg-rose-50 px-1.5 py-0.5 rounded">
                                      Bottleneck: {fu.documentBottleneck}
                                    </span>
                                  )}
                                </div>
                                <span className="text-gray-400 text-[11px] shrink-0">
                                  {fu.date ? new Date(fu.date).toLocaleDateString('en-GB') : ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-400 italic">No follow-up calls logged for this case yet.</p>
                      )}
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                    <span className="text-gray-400">
                      {caseItem.followUps?.length || 0} docket interactions
                    </span>

                    <button
                      type="button"
                      onClick={() => setExpandedCaseId(isExpanded ? null : caseItem._id)}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer flex items-center gap-1"
                    >
                      {isExpanded ? 'Hide Details ▲' : 'View Docket Timeline ▼'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: "Add Fields" (PDF only with ADV_ prefix + Next Hearing Date & Notes + Bail Status) */}
      {selectedCaseForAddFields && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-100 p-6 space-y-5 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-amber-600">⚖</span> Add Fields to Case
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Inmate: <strong className="text-gray-800">{selectedCaseForAddFields.inmate?.name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={closeAddFieldsModal}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1.5 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddFieldsSubmit} className="space-y-4">
              {/* FIELD 1: PDF File Upload + Text Bar with ADV_ Prefix */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <span>📄</span> 1. Advocate Case Document (PDF Only)
                  </label>
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    Cloudinary: advocate_documents/
                  </span>
                </div>

                {/* PDF File Picker Button */}
                <div>
                  <input
                    type="file"
                    id="advocate-pdf-file"
                    accept=".pdf,application/pdf"
                    onChange={handlePdfChange}
                    className="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-500 cursor-pointer"
                  />
                  {pdfFile && (
                    <p className="text-[11px] text-emerald-700 font-medium mt-1">
                      ✓ Selected: {pdfFile.name} ({(pdfFile.size / 1024).toFixed(0)} KB)
                    </p>
                  )}
                </div>

                {/* Document Description / Text Bar with ADV_ prefix */}
                <div>
                  <label htmlFor="adv-doc-notes" className="block text-xs font-semibold text-gray-700 mb-1">
                    Document Description <span className="text-amber-700 font-normal">(Prefix `ADV_` will be added automatically)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-bold text-amber-700 pointer-events-none">
                      ADV_
                    </span>
                    <input
                      id="adv-doc-notes"
                      type="text"
                      placeholder="e.g. Bail Application Draft / Vakalatnama / High Court Order"
                      value={documentNotes}
                      onChange={(e) => {
                        const val = e.target.value;
                        const cleanVal = val.startsWith('ADV_') ? val.slice(4) : val;
                        setDocumentNotes(cleanVal);
                      }}
                      className="w-full rounded-xl border border-gray-300 pl-14 pr-3 py-2 text-xs text-gray-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  {documentNotes && (
                    <p className="text-[11px] text-gray-500 mt-1 font-mono">
                      File will be saved as: <strong className="text-amber-800">ADV_{documentNotes}</strong>
                    </p>
                  )}
                </div>
              </div>

              {/* FIELD 2: Update Hearing Date, Notes & Bail Status */}
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-4 space-y-3">
                <label className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <span>📅</span> 2. Hearing Date & Bail Status (Reflected on SLC Docket)
                </label>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="adv-hearing-date" className="block text-xs font-semibold text-gray-700 mb-1">
                        Next Hearing Date
                      </label>
                      <input
                        id="adv-hearing-date"
                        type="date"
                        value={hearingDate}
                        onChange={(e) => setHearingDate(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Bail Application Status
                      </label>
                      <select
                        value={bailStatus}
                        onChange={(e) => setBailStatus(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                      >
                        <option value="">Select Status</option>
                        <option value="true">✓ Bail Application Filed</option>
                        <option value="false">✗ Bail Not Yet Filed</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="adv-hearing-notes" className="block text-xs font-semibold text-gray-700 mb-1">
                      Hearing Proceedings / Advocate Notes
                    </label>
                    <textarea
                      id="adv-hearing-notes"
                      rows="2"
                      placeholder="e.g. Hearing held today; arguments presented on bail; next date set for prosecution reply."
                      value={hearingNotes}
                      onChange={(e) => setHearingNotes(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    ></textarea>
                  </div>
                </div>

                <div className="rounded-lg bg-indigo-100/70 p-2 text-[11px] text-indigo-800 font-medium">
                  ℹ This hearing date, bail status, and note will immediately update the Socio-Legal Counselling docket.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeAddFieldsModal}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFields}
                  className="rounded-xl bg-amber-600 hover:bg-amber-500 px-5 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer disabled:opacity-60 flex items-center gap-2"
                >
                  {submittingFields ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                      <span>Saving & Syncing...</span>
                    </>
                  ) : (
                    'Save Fields to Docket'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Full Registered Case Details View with Two Separate Document Sections */}
      {selectedCaseForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-gray-100 p-6 sm:p-8 space-y-6 my-auto max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 text-xs font-bold font-mono">
                    {selectedCaseForDetails.slcNo ? `SLC #${selectedCaseForDetails.slcNo}` : `Case #${selectedCaseForDetails.sNo || selectedCaseForDetails._id.slice(-6)}`}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900">
                    Complete Registered Case File
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Inmate: <strong className="text-gray-800">{selectedCaseForDetails.inmate?.name || 'Unnamed Inmate'}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCaseForDetails(null)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-2 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Registration & Timeline Dates */}
            <div className="rounded-2xl bg-gray-50 p-4 border border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-gray-400 font-medium">Case Registered Date:</span>
                <p className="font-bold text-gray-900 mt-0.5">
                  {selectedCaseForDetails.createdAt
                    ? new Date(selectedCaseForDetails.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-gray-400 font-medium">First Contact Date:</span>
                <p className="font-bold text-gray-900 mt-0.5">
                  {selectedCaseForDetails.dateOfFirstContact || selectedCaseForDetails.dateOfContact
                    ? new Date(selectedCaseForDetails.dateOfFirstContact || selectedCaseForDetails.dateOfContact).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-gray-400 font-medium">Date of Arrest:</span>
                <p className="font-bold text-gray-900 mt-0.5">
                  {selectedCaseForDetails.dateOfArrest
                    ? new Date(selectedCaseForDetails.dateOfArrest).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'Not Recorded'}
                </p>
              </div>
              <div>
                <span className="text-gray-400 font-medium">Next Hearing Date:</span>
                <p className="font-bold text-violet-700 mt-0.5">
                  {selectedCaseForDetails.caseDetails?.nextHearingDate
                    ? new Date(selectedCaseForDetails.caseDetails.nextHearingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'Not Scheduled'}
                </p>
              </div>
            </div>

            {/* Section 1: Inmate Demographics */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-1">
                1. Inmate Demographics & Background
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-gray-400">Full Name:</span>
                  <p className="font-semibold text-gray-800">{selectedCaseForDetails.inmate?.name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Gender:</span>
                  <p className="font-semibold text-gray-800">{selectedCaseForDetails.inmate?.gender || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Age:</span>
                  <p className="font-semibold text-gray-800">{selectedCaseForDetails.inmate?.age ? `${selectedCaseForDetails.inmate.age} yrs` : 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Education:</span>
                  <p className="font-semibold text-gray-800">{selectedCaseForDetails.inmate?.education || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Occupation:</span>
                  <p className="font-semibold text-gray-800">{selectedCaseForDetails.inmate?.occupation || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Monthly Income:</span>
                  <p className="font-semibold text-gray-800">{selectedCaseForDetails.inmate?.monthlyIncome || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400">Residential Address:</span>
                  <p className="font-semibold text-gray-800">{selectedCaseForDetails.inmate?.address || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Past Case History:</span>
                  <p className="font-semibold text-gray-800">{selectedCaseForDetails.inmate?.pastCaseHistory || 'No'}</p>
                </div>
              </div>
            </div>

            {/* Section 2: Legal & Court Particulars */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-1">
                2. Legal Assessment & Court Particulars
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-gray-400">Offence Type:</span>
                  <p className="font-semibold text-gray-800">
                    {Array.isArray(selectedCaseForDetails.inmate?.offenceType)
                      ? selectedCaseForDetails.inmate.offenceType.join(', ')
                      : selectedCaseForDetails.inmate?.offenceType || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Court Name:</span>
                  <p className="font-semibold text-gray-800">{selectedCaseForDetails.caseDetails?.court || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-400">FIR Number:</span>
                  <p className="font-semibold text-gray-800">{selectedCaseForDetails.caseDetails?.firNumber || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Police Station:</span>
                  <p className="font-semibold text-gray-800">{selectedCaseForDetails.caseDetails?.policeStation || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Stage of Case:</span>
                  <p className="font-semibold text-indigo-700">{selectedCaseForDetails.legalAssessment?.stageOfCase || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Crime Category:</span>
                  <p className="font-semibold text-gray-800">{selectedCaseForDetails.legalAssessment?.crimeCategory || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Lawyer Type:</span>
                  <p className="font-semibold text-gray-800">{selectedCaseForDetails.caseDetails?.lawyerType || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Bail Applications Filed:</span>
                  <p className="font-semibold text-gray-800">
                    {selectedCaseForDetails.caseDetails?.bailApplicationsFiled === true
                      ? '✓ Yes, Filed'
                      : selectedCaseForDetails.caseDetails?.bailApplicationsFiled === false
                      ? '✗ No, Not Filed'
                      : 'Unknown'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Prisoner Type:</span>
                  <p className="font-semibold text-gray-800">{selectedCaseForDetails.prisonDetails?.prisonerType || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Section 3: Contact Person & Discovery */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-1">
                3. Family Contact & Discovery
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-gray-400">Contact Person Name:</span>
                  <p className="font-semibold text-gray-800">
                    {selectedCaseForDetails.familyMember?.name || selectedCaseForDetails.contactPerson?.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Relationship:</span>
                  <p className="font-semibold text-gray-800">
                    {selectedCaseForDetails.familyMember?.relationshipWithInmate ||
                      selectedCaseForDetails.contactPerson?.relationshipWithInmate ||
                      'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Phone Number:</span>
                  <p className="font-semibold text-gray-800">
                    {selectedCaseForDetails.familyMember?.phoneNumber ||
                      (Array.isArray(selectedCaseForDetails.contactPerson?.phoneNumbers)
                        ? selectedCaseForDetails.contactPerson.phoneNumbers.join(', ')
                        : selectedCaseForDetails.contactPerson?.phoneNumbers) ||
                      'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Source of Discovery:</span>
                  <p className="font-semibold text-gray-800">{selectedCaseForDetails.discovery?.sourceOfDiscovery || selectedCaseForDetails.poc || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Mode of Discovery:</span>
                  <p className="font-semibold text-gray-800">{selectedCaseForDetails.discovery?.mode || selectedCaseForDetails.modeOfDiscovery || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Socio-Legal Priority Tier:</span>
                  <p className="font-bold text-rose-700">{selectedCaseForDetails.tier || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Section 4A: Advocate Submissions & Bail Documents */}
            {(() => {
              const { advocateDocs, socioLegalDocs } = separateDocuments(selectedCaseForDetails.attachedFiles);
              return (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                        <span>⚖</span> 4A. Advocate Submissions & Bail Documents ({advocateDocs.length})
                      </h4>
                      <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        Cloudinary: advocate_documents/
                      </span>
                    </div>

                    {advocateDocs.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No advocate documents or bail petitions uploaded yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {advocateDocs.map((doc, idx) => (
                          <div
                            key={doc._id || idx}
                            className="p-2.5 rounded-xl border bg-amber-50/70 border-amber-200 flex items-center justify-between gap-2"
                          >
                            <div className="truncate">
                              <p className="font-bold text-amber-950 truncate" title={doc.title}>
                                {doc.title || 'Advocate Submission'}
                              </p>
                              <p className="text-[10px] text-amber-700">
                                Uploaded by: {doc.uploadedByName || 'Advocate'}
                              </p>
                            </div>
                            <a
                              href={getDocumentViewUrl(doc, selectedCaseForDetails)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 rounded-lg bg-white border border-amber-300 px-2.5 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                            >
                              View ↗
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section 4B: Socio-Legal Case Documents */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
                        <span>📁</span> 4B. Socio-Legal Case Documents ({socioLegalDocs.length})
                      </h4>
                      <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        Cloudinary: socio_legal_documents/
                      </span>
                    </div>

                    {socioLegalDocs.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No socio-legal documents attached to this case record yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {socioLegalDocs.map((doc, idx) => (
                          <div
                            key={doc._id || idx}
                            className="p-2.5 rounded-xl border bg-gray-50 border-gray-200 flex items-center justify-between gap-2"
                          >
                            <div className="truncate">
                              <p className="font-bold text-gray-900 truncate" title={doc.title}>
                                {doc.title || doc.documentType}
                              </p>
                              <p className="text-[10px] text-gray-500">
                                Uploaded by: {doc.uploadedByName || doc.uploadedByRole || 'SLC'}
                              </p>
                            </div>
                            <a
                              href={getDocumentViewUrl(doc, selectedCaseForDetails)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 rounded-lg bg-white border border-gray-300 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
                            >
                              View ↗
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}

            {/* Close Button */}
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedCaseForDetails(null)}
                className="rounded-xl bg-gray-800 hover:bg-gray-700 text-white px-5 py-2 text-xs font-bold transition cursor-pointer"
              >
                Close Case File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
