import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { apiInstance } from '../App';
import { useAuthStore } from '../store/useAuthStore';

// Sub-components from Outreach Components folder
import { initialFormState } from './Outreach Components/constants';
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
  const [outreachList, setOutreachList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Selected Case for Details Modal (Square click)
  const [selectedCase, setSelectedCase] = useState(null);

  // Multi-step modal state (Create / Edit)
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
    if (currentStep === 1 && !formData.dateOfFirstContact) {
      toast.error('Date of first contact is required');
      return;
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
        onEdit={handleOpenEditModal}
        onDelete={handleDelete}
        onAddFollowUp={handleOpenFollowUp}
      />

      {/* Multi-Step Add/Edit Modal */}
      <MultiStepModal
        isOpen={isModalOpen}
        isEditMode={isEditMode}
        currentStep={currentStep}
        formData={formData}
        submitting={submitting}
        onClose={() => setIsModalOpen(false)}
        onNextStep={handleNextStep}
        onPrevStep={handlePrevStep}
        onSetStep={(step) => setCurrentStep(step)}
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
        onClose={() => setIsFollowUpModalOpen(false)}
        onSubmit={handleFollowUpSubmit}
      />
    </div>
  );
}
