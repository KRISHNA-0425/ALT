import { create } from 'zustand';
import axios from 'axios';
import toast from 'react-hot-toast';
import { apiInstance } from '../App';
import { useAuthStore } from './useAuthStore';
import { initialSlcFormState } from '../components/SLC Components/constants';

const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
};

export const useSlcStore = create((set, get) => ({
  slcList: [],
  outreachCases: [],
  loading: false,
  submitting: false,
  activeTab: 'slc', // 'slc' or 'outreach'

  // Filters
  search: '',
  tierFilter: 'All',
  crimeCategoryFilter: 'All',

  // Active viewing/editing record
  selectedRecord: null,
  isModalOpen: false,
  isEditMode: false,
  currentId: null,
  formData: initialSlcFormState,

  // Follow-up modal state
  isFollowUpModalOpen: false,
  activeSlcRecord: null,
  followUpData: {
    followUpNumber: 1,
    scheduledDate: '',
    callDate: new Date().toISOString().split('T')[0],
    poc: '',
    documentBottleneck: '',
    notes: '',
  },

  // Setters
  setActiveTab: (activeTab) => set({ activeTab }),
  setSearch: (search) => set({ search }),
  setTierFilter: (tierFilter) => {
    set({ tierFilter });
    get().fetchSlcRecords();
  },
  setCrimeCategoryFilter: (crimeCategoryFilter) => {
    set({ crimeCategoryFilter });
    get().fetchSlcRecords();
  },
  resetFilters: () => {
    set({ search: '', tierFilter: 'All', crimeCategoryFilter: 'All' });
    get().fetchSlcRecords();
  },
  setSelectedRecord: (selectedRecord) => set({ selectedRecord }),
  setFormData: (formData) => set({ formData }),
  setFollowUpData: (followUpData) => set({ followUpData }),

  // Modal controls
  openCreateModal: () => {
    set({
      formData: {
        ...initialSlcFormState,
        dateOfContact: new Date().toISOString().split('T')[0],
      },
      isEditMode: false,
      currentId: null,
      isModalOpen: true,
    });
  },

  openEditModal: (record) => {
    const contactPhones = Array.isArray(record.contactPerson?.phoneNumbers)
      ? record.contactPerson.phoneNumbers.join(', ')
      : record.contactPerson?.phoneNumbers || '';

    set({
      formData: {
        ...initialSlcFormState,
        ...record,
        dateOfContact: record.dateOfContact
          ? record.dateOfContact.split('T')[0]
          : record.dateOfFirstContact
          ? record.dateOfFirstContact.split('T')[0]
          : new Date().toISOString().split('T')[0],
        dateOfArrest: record.dateOfArrest ? record.dateOfArrest.split('T')[0] : '',
        modeOfDiscovery: record.modeOfDiscovery || record.discovery?.mode || 'Outside Prison',
        familyMember: {
          name: record.familyMember?.name || record.contactPerson?.name || '',
          relationshipWithInmate:
            record.familyMember?.relationshipWithInmate ||
            record.contactPerson?.relationshipWithInmate ||
            '',
          phoneNumber: record.familyMember?.phoneNumber || contactPhones,
        },
        inmate: {
          ...initialSlcFormState.inmate,
          ...record.inmate,
          name: record.inmate?.name || '',
        },
        legalAssessment: {
          ...initialSlcFormState.legalAssessment,
          ...record.legalAssessment,
          caseType: record.legalAssessment?.caseType?.length
            ? record.legalAssessment.caseType
            : record.inmate?.offenceType || [],
        },
        caseDetails: {
          ...initialSlcFormState.caseDetails,
          ...record.caseDetails,
          caseSectionsInput: record.caseDetails?.caseSections?.join(', ') || '',
        },
      },
      isEditMode: true,
      currentId: record._id,
      isModalOpen: true,
      selectedRecord: record,
    });
  },

  // Initialize an SLC case directly from an Outreach case
  initSlcFromOutreach: (outreachCase) => {
    const prefilled = {
      ...initialSlcFormState,
      outreachId: outreachCase._id,
      dateOfContact: outreachCase.dateOfFirstContact
        ? outreachCase.dateOfFirstContact.split('T')[0]
        : new Date().toISOString().split('T')[0],
      modeOfDiscovery: outreachCase.discovery?.mode || 'Outside Prison',
      familyMember: {
        name: outreachCase.contactPerson?.name || '',
        relationshipWithInmate: outreachCase.contactPerson?.relationshipWithInmate || '',
        phoneNumber: outreachCase.contactPerson?.phoneNumbers || '',
      },
      inmate: {
        ...initialSlcFormState.inmate,
        name: outreachCase.inmate?.name || '',
      },
      legalAssessment: {
        ...initialSlcFormState.legalAssessment,
        caseType: outreachCase.inmate?.offenceType || [],
      },
    };

    set({
      formData: prefilled,
      isEditMode: false,
      currentId: null,
      isModalOpen: true,
      activeTab: 'slc',
    });
  },

  closeModal: () => {
    set({
      isModalOpen: false,
      isEditMode: false,
      currentId: null,
      formData: initialSlcFormState,
    });
  },

  openFollowUpModal: (record) => {
    set({
      activeSlcRecord: record,
      followUpData: {
        followUpNumber: (record.followUps?.length || 0) + 1,
        scheduledDate: '',
        callDate: new Date().toISOString().split('T')[0],
        poc: '',
        documentBottleneck: '',
        notes: '',
      },
      isFollowUpModalOpen: true,
    });
  },

  closeFollowUpModal: () => set({ isFollowUpModalOpen: false, activeSlcRecord: null }),

  // Async API Calls - operating on the unified case document via /api/outreach
  fetchSlcRecords: async () => {
    set({ loading: true });
    const { search, tierFilter, crimeCategoryFilter, selectedRecord } = get();
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (tierFilter && tierFilter !== 'All') params.append('tier', tierFilter);
      if (crimeCategoryFilter && crimeCategoryFilter !== 'All') params.append('crimeCategory', crimeCategoryFilter);

      const queryStr = params.toString();
      const url = queryStr ? `${apiInstance}/outreach?${queryStr}` : `${apiInstance}/outreach`;

      const res = await axios.get(url, getAuthHeaders());
      const data = res.data.data || [];
      set({ slcList: data, outreachCases: data });

      if (selectedRecord) {
        const fresh = data.find((r) => r._id === selectedRecord._id);
        if (fresh) set({ selectedRecord: fresh });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch case records');
    } finally {
      set({ loading: false });
    }
  },

  fetchOutreachCasesForSlc: async () => {
    try {
      const res = await axios.get(`${apiInstance}/outreach`, getAuthHeaders());
      const data = res.data.data || [];
      set({ outreachCases: data, slcList: data });
    } catch (err) {
      console.error('Error fetching cases for SLC:', err);
    }
  },

  handleSubmit: async (e) => {
    if (e) e.preventDefault();
    const { isEditMode, currentId, formData } = get();

    if (!formData.inmate?.name || formData.inmate.name.trim().length === 0) {
      toast.error('Inmate name is required');
      return;
    }

    set({ submitting: true });

    try {
      const processedSections = formData.caseDetails?.caseSectionsInput
        ? formData.caseDetails.caseSectionsInput
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : formData.caseDetails?.caseSections || [];

      const payload = {
        ...formData,
        caseDetails: {
          ...formData.caseDetails,
          caseSections: processedSections,
        },
      };

      if (currentId) {
        // Enrich or update the existing document
        const res = await axios.put(`${apiInstance}/outreach/${currentId}`, payload, getAuthHeaders());
        toast.success('Case updated with Socio-Legal assessment!');
        set((state) => ({
          slcList: state.slcList.map((item) => (item._id === currentId ? res.data.data : item)),
          outreachCases: state.outreachCases.map((item) => (item._id === currentId ? res.data.data : item)),
          selectedRecord: res.data.data,
        }));
      } else {
        // Create new unified case document
        const res = await axios.post(`${apiInstance}/outreach`, payload, getAuthHeaders());
        toast.success('Case created successfully!');
        set((state) => ({
          slcList: [res.data.data, ...state.slcList],
          outreachCases: [res.data.data, ...state.outreachCases],
          selectedRecord: res.data.data,
        }));
      }

      get().closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save case record');
    } finally {
      set({ submitting: false });
    }
  },

  handleFollowUpSubmit: async (e) => {
    if (e) e.preventDefault();
    const { activeSlcRecord, followUpData } = get();
    if (!activeSlcRecord) return;

    try {
      const res = await axios.post(
        `${apiInstance}/outreach/${activeSlcRecord._id}/follow-up`,
        followUpData,
        getAuthHeaders()
      );
      toast.success('Follow-up call note added to case!');
      set((state) => ({
        slcList: state.slcList.map((item) =>
          item._id === activeSlcRecord._id ? res.data.data : item
        ),
        outreachCases: state.outreachCases.map((item) =>
          item._id === activeSlcRecord._id ? res.data.data : item
        ),
        selectedRecord:
          state.selectedRecord?._id === activeSlcRecord._id ? res.data.data : state.selectedRecord,
      }));
      get().closeFollowUpModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add follow-up');
    }
  },

  handleDelete: async (id) => {
    if (!window.confirm('Are you sure you want to delete this case?')) return;
    try {
      await axios.delete(`${apiInstance}/outreach/${id}`, getAuthHeaders());
      toast.success('Case record deleted successfully');
      set((state) => ({
        slcList: state.slcList.filter((item) => item._id !== id),
        outreachCases: state.outreachCases.filter((item) => item._id !== id),
        selectedRecord: state.selectedRecord?._id === id ? null : state.selectedRecord,
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete record');
    }
  },
}));
