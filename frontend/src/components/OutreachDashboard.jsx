import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { apiInstance } from '../App';
import { useAuthStore } from '../store/useAuthStore';

export const OFFENCE_TYPE_OPTIONS = [
  'Theft',
  'Dacoity',
  'Robbery',
  'Snatching',
  'Murder',
  'Attempt to Murder',
  'Assault',
  'Kidnapping',
  'Arms Act',
  'Rape',
  'POCSO',
  'Cheating',
  'Cybercrime',
  'NDPS',
  'Dowry',
  'Others',
  'Accident',
  'Not Recorded',
  'Ladhai Jhagda',
  'DP Act',
  'Fraud/Cheating',
  'UAPA',
  'MCOCA',
  'Cheque Bounce',
  'Sexual Harassment',
];

export const RELATIONSHIP_OPTIONS = [
  'Father',
  'Mother',
  'Brother',
  'Sister',
  'Friend',
  'Other',
];

export const DISCOVERY_MODE_OPTIONS = [
  'Outside Prison',
  'Inside Prison',
  'Other',
];

const initialFormState = {
  sNo: '',
  dateOfFirstContact: new Date().toISOString().split('T')[0],
  contactPerson: {
    name: '',
    relationshipWithInmate: 'Father',
    otherRelationship: '',
    phoneNumbers: '',
  },
  inmate: {
    name: '',
    offenceType: [],
    otherOffence: '',
    pastCaseHistory: 'No',
  },
  discovery: {
    mode: 'Outside Prison',
    otherMode: '',
    sourceOfDiscovery: '',
  },
};

export default function OutreachDashboard() {
  const token = useAuthStore((state) => state.token);
  const [outreachList, setOutreachList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Selected Case for Details Modal
  const [selectedCase, setSelectedCase] = useState(null);

  // Multi-step modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);

  // Follow-up modal state
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState(null);
  const [followUpData, setFollowUpData] = useState({
    round: 1,
    date: new Date().toISOString().split('T')[0],
    notes: '',
    callStatus: 'Call back',
  });

  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  const fetchOutreach = async () => {
    setLoading(true);
    try {
      const url = search
        ? `${apiInstance}/outreach?search=${encodeURIComponent(search)}`
        : `${apiInstance}/outreach`;
      const res = await axios.get(url, authHeaders);
      setOutreachList(res.data.data || []);
      // If a case is currently selected in details modal, keep its data fresh
      if (selectedCase) {
        const fresh = res.data.data?.find((i) => i._id === selectedCase._id);
        if (fresh) setSelectedCase(fresh);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch outreach data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOutreach();
    }
  }, [token]);

  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setCurrentId(null);
    setCurrentStep(1);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record) => {
    setIsEditMode(true);
    setCurrentId(record._id);
    setCurrentStep(1);
    setFormData({
      sNo: record.sNo ?? '',
      dateOfFirstContact: record.dateOfFirstContact
        ? new Date(record.dateOfFirstContact).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      contactPerson: {
        name: record.contactPerson?.name || '',
        relationshipWithInmate: record.contactPerson?.relationshipWithInmate || 'Father',
        otherRelationship: record.contactPerson?.otherRelationship || '',
        phoneNumbers: record.contactPerson?.phoneNumbers?.join(', ') || '',
      },
      inmate: {
        name: record.inmate?.name || '',
        offenceType: record.inmate?.offenceType || [],
        otherOffence: record.inmate?.otherOffence || '',
        pastCaseHistory: record.inmate?.pastCaseHistory || 'No',
      },
      discovery: {
        mode: record.discovery?.mode || 'Outside Prison',
        otherMode: record.discovery?.otherMode || '',
        sourceOfDiscovery: record.discovery?.sourceOfDiscovery || '',
      },
    });
    // Close details modal if open
    setSelectedCase(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this outreach record?')) {
      return;
    }
    try {
      await axios.delete(`${apiInstance}/outreach/${id}`, authHeaders);
      toast.success('Outreach record deleted successfully');
      setOutreachList((prev) => prev.filter((item) => item._id !== id));
      if (selectedCase?._id === id) {
        setSelectedCase(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete record');
    }
  };

  const toggleOffenceType = (offence) => {
    setFormData((prev) => {
      const exists = prev.inmate.offenceType.includes(offence);
      const updated = exists
        ? prev.inmate.offenceType.filter((item) => item !== offence)
        : [...prev.inmate.offenceType, offence];
      return {
        ...prev,
        inmate: {
          ...prev.inmate,
          offenceType: updated,
        },
      };
    });
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!formData.dateOfFirstContact) {
        toast.error('Date of first contact is required');
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    const payload = {
      sNo: formData.sNo !== '' ? Number(formData.sNo) : undefined,
      dateOfFirstContact: formData.dateOfFirstContact,
      contactPerson: {
        name: formData.contactPerson.name,
        relationshipWithInmate: formData.contactPerson.relationshipWithInmate,
        otherRelationship:
          formData.contactPerson.relationshipWithInmate === 'Other'
            ? formData.contactPerson.otherRelationship
            : '',
        phoneNumbers: formData.contactPerson.phoneNumbers
          ? formData.contactPerson.phoneNumbers.split(',').map((p) => p.trim()).filter(Boolean)
          : [],
      },
      inmate: {
        name: formData.inmate.name,
        offenceType: formData.inmate.offenceType,
        otherOffence: formData.inmate.otherOffence,
        pastCaseHistory: formData.inmate.pastCaseHistory,
      },
      discovery: {
        mode: formData.discovery.mode,
        otherMode:
          formData.discovery.mode === 'Other' ? formData.discovery.otherMode : '',
        sourceOfDiscovery: formData.discovery.sourceOfDiscovery,
      },
    };

    try {
      if (isEditMode) {
        const res = await axios.put(`${apiInstance}/outreach/${currentId}`, payload, authHeaders);
        toast.success('Outreach record updated successfully');
        setOutreachList((prev) =>
          prev.map((item) => (item._id === currentId ? res.data.data : item))
        );
      } else {
        const res = await axios.post(`${apiInstance}/outreach`, payload, authHeaders);
        toast.success('Outreach record created successfully');
        setOutreachList((prev) => [res.data.data, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenFollowUp = (record) => {
    setActiveRecord(record);
    setFollowUpData({
      round: (record.followUps?.length || 0) + 1,
      date: new Date().toISOString().split('T')[0],
      notes: '',
      callStatus: 'Call back',
    });
    setIsFollowUpModalOpen(true);
  };

  const handleFollowUpSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${apiInstance}/outreach/${activeRecord._id}/follow-up`,
        followUpData,
        authHeaders
      );
      toast.success('Follow-up recorded successfully');
      setOutreachList((prev) =>
        prev.map((item) => (item._id === activeRecord._id ? res.data.data : item))
      );
      if (selectedCase?._id === activeRecord._id) {
        setSelectedCase(res.data.data);
      }
      setIsFollowUpModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add follow-up');
    }
  };

  const steps = [
    { number: 1, title: 'Basic & Inmate Details' },
    { number: 2, title: 'Contact Person Details' },
    { number: 3, title: 'Discovery Information' },
    { number: 4, title: 'Review & Confirm' },
  ];

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
          onClick={handleOpenCreateModal}
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
              <div
                key={item._id}
                onClick={() => setSelectedCase(item)}
                className="group relative flex flex-col justify-between rounded-3xl bg-white p-6 border border-gray-200 shadow-xs hover:shadow-xl hover:border-indigo-500 hover:-translate-y-1 transition-all duration-200 cursor-pointer min-h-[260px]"
              >
                {/* Card Top: Date & S.No badge */}
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                      <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {item.dateOfFirstContact
                        ? new Date(item.dateOfFirstContact).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'No date'}
                    </span>
                    {item.sNo !== undefined && item.sNo !== null && (
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-600">
                        #{item.sNo}
                      </span>
                    )}
                  </div>

                  {/* Inmate Name */}
                  <div className="mt-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Inmate Name
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition truncate">
                      {item.inmate?.name || 'Unnamed Inmate'}
                    </h3>
                  </div>

                  {/* Offence Type(s) */}
                  <div className="mt-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                      Offence Type
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-20 overflow-hidden">
                      {item.inmate?.offenceType && item.inmate.offenceType.length > 0 ? (
                        item.inmate.offenceType.slice(0, 3).map((off, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 border border-indigo-100"
                          >
                            {off}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400 italic">No offences specified</span>
                      )}
                      {item.inmate?.offenceType && item.inmate.offenceType.length > 3 && (
                        <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                          +{item.inmate.offenceType.length - 3} more
                        </span>
                      )}
                      {item.inmate?.otherOffence && (
                        <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200 truncate max-w-[160px]">
                          Other: {item.inmate.otherOffence}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Click prompt & Follow-up pill */}
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-indigo-600 group-hover:translate-x-1 transition flex items-center gap-1">
                    View Details
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-100">
                    {item.followUps?.length || 0} Follow-up{item.followUps?.length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Case Details Modal (Triggered when clicking any square box) */}
      {selectedCase && (
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
                onClick={() => setSelectedCase(null)}
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
                    onClick={() => handleOpenFollowUp(selectedCase)}
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
                onClick={() => handleDelete(selectedCase._id)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer"
              >
                Delete Record
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleOpenEditModal(selectedCase)}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition cursor-pointer shadow-sm"
                >
                  Edit Case Details
                </button>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Step Modal (Add / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden my-6 border border-gray-100 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">
                  {isEditMode ? 'Edit OutReach Record' : 'Create OutReach Record'}
                </h3>
                <p className="text-xs text-gray-400">Step {currentStep} of 4: {steps[currentStep - 1].title}</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white text-2xl font-light cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Stepper Indicator */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
              <div className="grid grid-cols-4 gap-2">
                {steps.map((s) => (
                  <div key={s.number} className="flex items-center gap-2">
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                        currentStep === s.number
                          ? 'bg-indigo-600 text-white'
                          : currentStep > s.number
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {currentStep > s.number ? '✓' : s.number}
                    </div>
                    <span
                      className={`text-xs font-medium hidden md:inline truncate ${
                        currentStep === s.number ? 'text-indigo-600 font-bold' : 'text-gray-500'
                      }`}
                    >
                      {s.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Steps Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* STEP 1: Basic & Inmate Details */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                    1. Basic & Inmate Profile
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Date of First Contact *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.dateOfFirstContact}
                        onChange={(e) =>
                          setFormData({ ...formData, dateOfFirstContact: e.target.value })
                        }
                        className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        S.No
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 101"
                        value={formData.sNo}
                        onChange={(e) => setFormData({ ...formData, sNo: e.target.value })}
                        className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Inmate Name
                      </label>
                      <input
                        type="text"
                        placeholder="Full name of inmate"
                        value={formData.inmate.name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            inmate: { ...formData.inmate, name: e.target.value },
                          })
                        }
                        className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    {/* Past Case History Radio Button */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Past Case History (Yes / No)
                      </label>
                      <div className="flex items-center gap-6 mt-1 p-2 rounded-xl border border-gray-200 bg-gray-50/70">
                        <label className="inline-flex items-center gap-2 text-sm text-gray-800 cursor-pointer font-medium">
                          <input
                            type="radio"
                            name="pastCaseHistory"
                            value="Yes"
                            checked={formData.inmate.pastCaseHistory === 'Yes'}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                inmate: { ...formData.inmate, pastCaseHistory: e.target.value },
                              })
                            }
                            className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                          />
                          <span>Yes</span>
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm text-gray-800 cursor-pointer font-medium">
                          <input
                            type="radio"
                            name="pastCaseHistory"
                            value="No"
                            checked={formData.inmate.pastCaseHistory === 'No'}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                inmate: { ...formData.inmate, pastCaseHistory: e.target.value },
                              })
                            }
                            className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Offence Type(s) (Select all that apply)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-3 border border-gray-200 rounded-xl bg-gray-50">
                      {OFFENCE_TYPE_OPTIONS.map((offence) => {
                        const isChecked = formData.inmate.offenceType.includes(offence);
                        return (
                          <label
                            key={offence}
                            className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer select-none transition ${
                              isChecked
                                ? 'bg-indigo-600 text-white font-semibold'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleOffenceType(offence)}
                              className="hidden"
                            />
                            <span className="truncate">{offence}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Other offence text area */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Other Offence Details (Text area)
                    </label>
                    <textarea
                      rows="2"
                      placeholder="Specify additional or custom offence details here..."
                      value={formData.inmate.otherOffence}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          inmate: { ...formData.inmate, otherOffence: e.target.value },
                        })
                      }
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Contact Person Details */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                    2. Contact Person Information
                  </h4>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Contact Person Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={formData.contactPerson.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactPerson: { ...formData.contactPerson, name: e.target.value },
                        })
                      }
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Relationship with Inmate (Dropdown)
                    </label>
                    <select
                      value={formData.contactPerson.relationshipWithInmate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactPerson: {
                            ...formData.contactPerson,
                            relationshipWithInmate: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    >
                      {RELATIONSHIP_OPTIONS.map((rel) => (
                        <option key={rel} value={rel}>
                          {rel}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.contactPerson.relationshipWithInmate === 'Other' && (
                    <div>
                      <label className="block text-xs font-semibold text-indigo-700 mb-1">
                        Other Relationship (Text area)
                      </label>
                      <textarea
                        rows="2"
                        placeholder="Describe relationship (e.g. Uncle, Neighbor, Lawyer, Guardian)..."
                        value={formData.contactPerson.otherRelationship}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contactPerson: {
                              ...formData.contactPerson,
                              otherRelationship: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl border border-indigo-300 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Phone Number(s) (Comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210, 9123456780"
                      value={formData.contactPerson.phoneNumbers}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactPerson: {
                            ...formData.contactPerson,
                            phoneNumbers: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: Discovery Information */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                    3. Case Discovery Information
                  </h4>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Discovery Mode
                    </label>
                    <select
                      value={formData.discovery.mode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discovery: { ...formData.discovery, mode: e.target.value },
                        })
                      }
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    >
                      {DISCOVERY_MODE_OPTIONS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.discovery.mode === 'Other' && (
                    <div>
                      <label className="block text-xs font-semibold text-indigo-700 mb-1">
                        Other Discovery Mode (Text area)
                      </label>
                      <textarea
                        rows="2"
                        placeholder="Describe the mode of discovery..."
                        value={formData.discovery.otherMode}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discovery: { ...formData.discovery, otherMode: e.target.value },
                          })
                        }
                        className="w-full rounded-xl border border-indigo-300 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  )}

                  {/* Source of discovery: Plain Text */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Source of Discovery (Plain Text)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Aayushee / Shivani / Legal Camp / Prison Visit..."
                      value={formData.discovery.sourceOfDiscovery}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discovery: {
                            ...formData.discovery,
                            sourceOfDiscovery: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: Review & Confirm */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                    4. Review & Confirm
                  </h4>

                  <div className="rounded-2xl bg-gray-50 p-5 border border-gray-200 space-y-4 text-xs sm:text-sm">
                    {/* Basic & Inmate */}
                    <div className="border-b border-gray-200 pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-800 uppercase tracking-wide">
                          Inmate & Contact Date
                        </span>
                        <button
                          onClick={() => setCurrentStep(1)}
                          className="text-indigo-600 font-semibold text-xs hover:underline cursor-pointer"
                        >
                          Edit Step 1
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-gray-600">
                        <div>
                          Date of Contact:{' '}
                          <strong className="text-gray-900">{formData.dateOfFirstContact}</strong>
                        </div>
                        <div>
                          S.No: <strong className="text-gray-900">{formData.sNo || '-'}</strong>
                        </div>
                        <div>
                          Inmate Name:{' '}
                          <strong className="text-gray-900">{formData.inmate.name || '-'}</strong>
                        </div>
                        <div>
                          Past Case History:{' '}
                          <strong className="text-gray-900">
                            {formData.inmate.pastCaseHistory}
                          </strong>
                        </div>
                        <div className="col-span-2">
                          Offence Types:{' '}
                          <span className="text-gray-900 font-semibold">
                            {formData.inmate.offenceType.join(', ') || 'None selected'}
                          </span>
                          {formData.inmate.otherOffence && (
                            <span className="block text-gray-500 italic mt-0.5">
                              Other offence: {formData.inmate.otherOffence}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact Person */}
                    <div className="border-b border-gray-200 pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-800 uppercase tracking-wide">
                          Contact Person
                        </span>
                        <button
                          onClick={() => setCurrentStep(2)}
                          className="text-indigo-600 font-semibold text-xs hover:underline cursor-pointer"
                        >
                          Edit Step 2
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-gray-600">
                        <div>
                          Name:{' '}
                          <strong className="text-gray-900">
                            {formData.contactPerson.name || '-'}
                          </strong>
                        </div>
                        <div>
                          Relationship:{' '}
                          <strong className="text-gray-900">
                            {formData.contactPerson.relationshipWithInmate}
                          </strong>
                          {formData.contactPerson.otherRelationship && (
                            <span className="italic ml-1 text-gray-500">
                              ({formData.contactPerson.otherRelationship})
                            </span>
                          )}
                        </div>
                        <div className="col-span-2">
                          Phone(s):{' '}
                          <strong className="text-indigo-600">
                            {formData.contactPerson.phoneNumbers || '-'}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Discovery */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-800 uppercase tracking-wide">
                          Discovery Information
                        </span>
                        <button
                          onClick={() => setCurrentStep(3)}
                          className="text-indigo-600 font-semibold text-xs hover:underline cursor-pointer"
                        >
                          Edit Step 3
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-gray-600">
                        <div>
                          Mode:{' '}
                          <strong className="text-gray-900">{formData.discovery.mode}</strong>
                          {formData.discovery.otherMode && (
                            <span className="italic block text-gray-500">
                              Other: {formData.discovery.otherMode}
                            </span>
                          )}
                        </div>
                        <div>
                          Source of Discovery:{' '}
                          <strong className="text-gray-900">
                            {formData.discovery.sourceOfDiscovery || '-'}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-white transition cursor-pointer"
                >
                  ← Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-white transition cursor-pointer"
                >
                  Cancel
                </button>
              )}

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition cursor-pointer shadow-sm"
                >
                  Next Step →
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmit}
                  className="rounded-xl bg-emerald-600 px-7 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition cursor-pointer shadow-md"
                >
                  {submitting
                    ? 'Saving...'
                    : isEditMode
                    ? 'Update Outreach Record'
                    : 'Confirm & Save Record'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Follow-Up Modal */}
      {isFollowUpModalOpen && activeRecord && (
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
                onClick={() => setIsFollowUpModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Past follow-ups list */}
            {activeRecord.followUps && activeRecord.followUps.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-2 border-b pb-3">
                <p className="text-xs font-bold text-gray-500 uppercase">Past Follow-Ups</p>
                {activeRecord.followUps.map((fu, idx) => (
                  <div key={idx} className="rounded-xl bg-gray-50 p-2.5 text-xs text-gray-700 border border-gray-200">
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

            <form onSubmit={handleFollowUpSubmit} className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Follow-up Round</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={followUpData.round}
                    onChange={(e) =>
                      setFollowUpData({ ...followUpData, round: Number(e.target.value) })
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
                      setFollowUpData({ ...followUpData, date: e.target.value })
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
                    setFollowUpData({ ...followUpData, callStatus: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-gray-300 p-2 text-sm focus:border-indigo-500 outline-none"
                >
                  {[
                    'Call back',
                    'Switched off',
                    'Bail out',
                    'Not available',
                    'Incoming not available',
                    'RNR',
                    'Busy',
                    'Transferred to socio-legal support',
                    'No help needed',
                    'Will reach out later',
                    'Invalid number',
                    'Wrong number',
                    'Other person pick up',
                    'Other',
                  ].map((status) => (
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
                    setFollowUpData({ ...followUpData, notes: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-gray-300 p-2 text-sm focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsFollowUpModalOpen(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500"
                >
                  Save Follow-up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
