import { create } from 'zustand';
import axios from 'axios';
import toast from 'react-hot-toast';
import { apiInstance } from '../App';
import { useAuthStore } from './useAuthStore';
import { initialFormState } from '../components/Outreach Components/constants';

const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
};

export const useOutreachStore = create((set, get) => ({
  outreachList: [],
  loading: false,
  search: '',
  caseCategoryFilter: 'All',
  callStatusFilter: 'All',

  // Selected Case (for details modal)
  selectedCase: null,
  setSelectedCase: (selectedCase) => set({ selectedCase }),

  // Multi-step modal state
  isModalOpen: false,
  isEditMode: false,
  currentId: null,
  currentStep: 1,
  formData: initialFormState,
  submitting: false,

  // Follow-up modal state
  isFollowUpModalOpen: false,
  activeRecord: null,
  followUpData: {
    round: 1,
    date: new Date().toISOString().split('T')[0],
    notes: '',
    callStatus: 'Call back',
  },

  // State setters
  setSearch: (search) => set({ search }),
  setCaseCategoryFilter: (category) => {
    set({ caseCategoryFilter: category });
    get().fetchOutreach();
  },
  setCallStatusFilter: (status) => {
    set({ callStatusFilter: status });
    get().fetchOutreach();
  },
  resetFilters: () => {
    set({ search: '', caseCategoryFilter: 'All', callStatusFilter: 'All' });
    get().fetchOutreach();
  },
  setCurrentStep: (currentStep) => set({ currentStep }),
  setFormData: (formData) => set({ formData }),
  setFollowUpData: (followUpData) => set({ followUpData }),

  // Step Navigation
  nextStep: () => {
    const { currentStep, formData } = get();
    if (currentStep === 1 && !formData.dateOfFirstContact) {
      toast.error('Date of first contact is required');
      return;
    }
    set({ currentStep: Math.min(currentStep + 1, 4) });
  },
  prevStep: () => {
    const { currentStep } = get();
    set({ currentStep: Math.max(currentStep - 1, 1) });
  },

  toggleOffenceType: (offence) => {
    const { formData } = get();
    const exists = formData.inmate.offenceType.includes(offence);
    const updated = exists
      ? formData.inmate.offenceType.filter((item) => item !== offence)
      : [...formData.inmate.offenceType, offence];

    set({
      formData: {
        ...formData,
        inmate: {
          ...formData.inmate,
          offenceType: updated,
        },
      },
    });
  },

  // Modal open/close actions
  openCreateModal: () => {
    set({
      isEditMode: false,
      currentId: null,
      currentStep: 1,
      formData: initialFormState,
      isModalOpen: true,
    });
  },

  openEditModal: (record) => {
    set({
      isEditMode: true,
      currentId: record._id,
      currentStep: 1,
      formData: {
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
      },
      selectedCase: null,
      isModalOpen: true,
    });
  },

  closeModal: () => set({ isModalOpen: false }),

  openFollowUpModal: (record) => {
    set({
      activeRecord: record,
      followUpData: {
        round: (record.followUps?.length || 0) + 1,
        date: new Date().toISOString().split('T')[0],
        notes: '',
        callStatus: 'Call back',
      },
      isFollowUpModalOpen: true,
    });
  },

  closeFollowUpModal: () => set({ isFollowUpModalOpen: false }),

  // Async API Calls
  fetchOutreach: async () => {
    set({ loading: true });
    const { search, caseCategoryFilter, callStatusFilter, selectedCase } = get();
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (caseCategoryFilter && caseCategoryFilter !== 'All') params.append('category', caseCategoryFilter);
      if (callStatusFilter && callStatusFilter !== 'All') params.append('callStatus', callStatusFilter);

      const queryString = params.toString();
      const url = queryString ? `${apiInstance}/outreach?${queryString}` : `${apiInstance}/outreach`;

      const res = await axios.get(url, getAuthHeaders());
      const data = res.data.data || [];
      set({ outreachList: data });
      if (selectedCase) {
        const fresh = data.find((i) => i._id === selectedCase._id);
        if (fresh) set({ selectedCase: fresh });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch outreach data');
    } finally {
      set({ loading: false });
    }
  },

  handleDelete: async (id) => {
    if (!window.confirm('Are you sure you want to delete this outreach record?')) {
      return;
    }
    try {
      await axios.delete(`${apiInstance}/outreach/${id}`, getAuthHeaders());
      toast.success('Outreach record deleted successfully');
      const { outreachList, selectedCase } = get();
      set({
        outreachList: outreachList.filter((item) => item._id !== id),
        selectedCase: selectedCase?._id === id ? null : selectedCase,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete record');
    }
  },

  handleSubmit: async () => {
    const { isEditMode, currentId, formData, outreachList } = get();
    set({ submitting: true });

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
        const res = await axios.put(`${apiInstance}/outreach/${currentId}`, payload, getAuthHeaders());
        toast.success('Outreach record updated successfully');
        set({
          outreachList: outreachList.map((item) =>
            item._id === currentId ? res.data.data : item
          ),
          isModalOpen: false,
        });
      } else {
        const res = await axios.post(`${apiInstance}/outreach`, payload, getAuthHeaders());
        toast.success('Outreach record created successfully');
        set({
          outreachList: [res.data.data, ...outreachList],
          isModalOpen: false,
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit form');
    } finally {
      set({ submitting: false });
    }
  },

  handleFollowUpSubmit: async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const { activeRecord, followUpData, outreachList, selectedCase } = get();
    try {
      const res = await axios.post(
        `${apiInstance}/outreach/${activeRecord._id}/follow-up`,
        followUpData,
        getAuthHeaders()
      );
      toast.success('Follow-up recorded successfully');
      set({
        outreachList: outreachList.map((item) =>
          item._id === activeRecord._id ? res.data.data : item
        ),
        selectedCase:
          selectedCase?._id === activeRecord._id ? res.data.data : selectedCase,
        isFollowUpModalOpen: false,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add follow-up');
    }
  },
}));
