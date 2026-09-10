import React, { useState } from 'react';
import { useSlcStore } from '../../store/useSlcStore';
import {
  DOCUMENTS_SUBMITTED_OPTIONS,
  TIER_OPTIONS,
  CRIME_CATEGORY_OPTIONS,
  PRISONER_TYPE_OPTIONS,
  LAWYER_TYPE_OPTIONS,
  SUPPORT_NEEDED_OPTIONS,
  EDUCATION_OPTIONS,
  GENDER_OPTIONS,
  DISCOVERY_MODE_OPTIONS,
  ACCESS_DOCUMENTS_OPTIONS,
  STAGE_OF_CASE_OPTIONS,
} from './constants';
import DocumentManager from '../Common/DocumentManager';

export default function SlcModal() {
  const {
    isModalOpen,
    isEditMode,
    currentId,
    formData,
    setFormData,
    closeModal,
    handleSubmit,
    submitting,
    openFollowUpModal,
    selectedRecord,
    uploadCaseDocument,
    deleteCaseDocument,
  } = useSlcStore();

  const [activeTab, setActiveTab] = useState('demographics');

  if (!isModalOpen) return null;

  // Helpers for multi-select arrays
  const toggleDocument = (doc) => {
    const list = formData.documentsSubmitted || [];
    const exists = list.includes(doc);
    setFormData({
      ...formData,
      documentsSubmitted: exists ? list.filter((d) => d !== doc) : [...list, doc],
    });
  };

  const toggleSupportNeeded = (sup) => {
    const list = formData.supportNeeded || [];
    const exists = list.includes(sup);
    setFormData({
      ...formData,
      supportNeeded: exists ? list.filter((s) => s !== sup) : [...list, sup],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-gray-100 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              SLC
            </span>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">
                {isEditMode ? `Socio-Legal Case #${formData.slcNo || '—'}` : 'New Socio-Legal Case'}
              </h2>
              <p className="text-xs text-gray-500">
                Inmate: <strong className="text-gray-700">{formData.inmate?.name || 'New Inmate'}</strong>
                {formData.outreachId && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold text-cyan-700 border border-cyan-100">
                    Linked to OutReach Record
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1.5 transition cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 px-6 bg-gray-50/70 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'demographics', label: '1. Demographics & Family' },
            { id: 'incarceration', label: '2. Documents & Priority' },
            { id: 'legal', label: '3. Legal Assessment' },
            { id: 'court', label: '4. Court & Support' },
            { id: 'followups', label: `5. Follow-ups (${formData.followUps?.length || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-4 border-b-2 whitespace-nowrap transition cursor-pointer ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: Demographics & Family */}
          {activeTab === 'demographics' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
                Basic Case Identifiers & Inmate Demographics
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">SLC No</label>
                  <input
                    type="number"
                    placeholder="Auto-generated if blank"
                    value={formData.slcNo || ''}
                    onChange={(e) => setFormData({ ...formData, slcNo: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date of Contact</label>
                  <input
                    type="date"
                    value={formData.dateOfContact || ''}
                    onChange={(e) => setFormData({ ...formData, dateOfContact: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Point of Contact (POC)</label>
                  <input
                    type="text"
                    placeholder="e.g. Aayushee, Tanishqua"
                    value={formData.poc || ''}
                    onChange={(e) => setFormData({ ...formData, poc: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Mode of Discovery</label>
                  <select
                    value={formData.modeOfDiscovery}
                    onChange={(e) => setFormData({ ...formData, modeOfDiscovery: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    {DISCOVERY_MODE_OPTIONS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Inmate Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full name of inmate"
                    value={formData.inmate?.name || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        inmate: { ...formData.inmate, name: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Gender</label>
                  <select
                    value={formData.inmate?.gender || 'Male'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        inmate: { ...formData.inmate, gender: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    placeholder="Years"
                    value={formData.inmate?.age || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        inmate: { ...formData.inmate, age: e.target.value ? Number(e.target.value) : '' },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Education</label>
                  <select
                    value={formData.inmate?.education || '10th Pass'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        inmate: { ...formData.inmate, education: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    {EDUCATION_OPTIONS.map((ed) => (
                      <option key={ed} value={ed}>{ed}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Occupation</label>
                  <input
                    type="text"
                    placeholder="e.g. Daily wage, Driver"
                    value={formData.inmate?.occupation || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        inmate: { ...formData.inmate, occupation: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Monthly Income</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹10,000 / month"
                    value={formData.inmate?.monthlyIncome || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        inmate: { ...formData.inmate, monthlyIncome: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Sole Breadwinner?</label>
                  <div className="flex gap-4 pt-1">
                    <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="soleBreadwinner"
                        checked={formData.inmate?.isSoleBreadwinner === true}
                        onChange={() =>
                          setFormData({
                            ...formData,
                            inmate: { ...formData.inmate, isSoleBreadwinner: true },
                          })
                        }
                      />
                      Yes
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="soleBreadwinner"
                        checked={formData.inmate?.isSoleBreadwinner === false}
                        onChange={() =>
                          setFormData({
                            ...formData,
                            inmate: { ...formData.inmate, isSoleBreadwinner: false },
                          })
                        }
                      />
                      No
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  placeholder="Full address of the inmate"
                  value={formData.inmate?.address || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      inmate: { ...formData.inmate, address: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 pt-2">
                Family Member / Primary Contact
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    placeholder="Contact person's name"
                    value={formData.familyMember?.name || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        familyMember: { ...formData.familyMember, name: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Relationship</label>
                  <input
                    type="text"
                    placeholder="e.g. Father, Mother, Brother"
                    value={formData.familyMember?.relationshipWithInmate || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        familyMember: { ...formData.familyMember, relationshipWithInmate: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="Contact phone"
                    value={formData.familyMember?.phoneNumber || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        familyMember: { ...formData.familyMember, phoneNumber: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Documents & Priority & Incarceration */}
          {activeTab === 'incarceration' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
                Documents Submitted & Priority Tier
              </h4>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Documents Submitted (Select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {DOCUMENTS_SUBMITTED_OPTIONS.map((doc) => {
                    const isSelected = (formData.documentsSubmitted || []).includes(doc);
                    return (
                      <button
                        key={doc}
                        type="button"
                        onClick={() => toggleDocument(doc)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold border transition cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '} {doc}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Priority Tier</label>
                  <select
                    value={formData.tier}
                    onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    {TIER_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Prisoner Type</label>
                  <select
                    value={formData.prisonDetails?.prisonerType || 'In-prison (Undertrial)'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        prisonDetails: { ...formData.prisonDetails, prisonerType: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    {PRISONER_TYPE_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Case Document Attachments & Uploads */}
              <div className="pt-3">
                <DocumentManager
                  caseId={currentId || selectedRecord?._id || formData._id}
                  attachedFiles={formData.attachedFiles || selectedRecord?.attachedFiles || []}
                  onUpload={uploadCaseDocument}
                  onDelete={deleteCaseDocument}
                />
              </div>

              <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 pt-2">
                Incarceration Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date of Arrest</label>
                  <input
                    type="date"
                    value={formData.dateOfArrest || ''}
                    onChange={(e) => setFormData({ ...formData, dateOfArrest: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Duration in Custody (Months)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 6"
                    value={formData.durationInCustodyMonths || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        durationInCustodyMonths: e.target.value ? Number(e.target.value) : '',
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Prison Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Jail No.4, Tihar"
                    value={formData.prisonDetails?.prisonName || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        prisonDetails: { ...formData.prisonDetails, prisonName: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Legal Assessment */}
          {activeTab === 'legal' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
                Scoring Areas & Legal Profile
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Crime Category</label>
                  <select
                    value={formData.legalAssessment?.crimeCategory || 'Non-Heinous'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        legalAssessment: { ...formData.legalAssessment, crimeCategory: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    {CRIME_CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Pending Cases</label>
                  <input
                    type="text"
                    placeholder="e.g. 1 or More than one"
                    value={formData.legalAssessment?.numberOfPendingCases || '1'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        legalAssessment: { ...formData.legalAssessment, numberOfPendingCases: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Access to Documents</label>
                  <select
                    value={formData.legalAssessment?.accessToDocuments || 'Not Available'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        legalAssessment: { ...formData.legalAssessment, accessToDocuments: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    {ACCESS_DOCUMENTS_OPTIONS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Stage of Case</label>
                  <select
                    value={formData.legalAssessment?.stageOfCase || 'FIR'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        legalAssessment: { ...formData.legalAssessment, stageOfCase: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    {STAGE_OF_CASE_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">First Time Offender?</label>
                  <div className="flex gap-4 pt-2">
                    <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="firstTimeOffender"
                        checked={formData.legalAssessment?.firstTimeOffender === true}
                        onChange={() =>
                          setFormData({
                            ...formData,
                            legalAssessment: { ...formData.legalAssessment, firstTimeOffender: true },
                          })
                        }
                      />
                      Yes
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="firstTimeOffender"
                        checked={formData.legalAssessment?.firstTimeOffender === false}
                        onChange={() =>
                          setFormData({
                            ...formData,
                            legalAssessment: { ...formData.legalAssessment, firstTimeOffender: false },
                          })
                        }
                      />
                      No
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">RLI Score / Assessment</label>
                  <input
                    type="text"
                    placeholder="e.g. 7.5 or Incomplete"
                    value={formData.legalAssessment?.rliScore || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        legalAssessment: { ...formData.legalAssessment, rliScore: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Health Concerns</label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="hasConcerns"
                    checked={formData.legalAssessment?.healthConcerns?.hasConcerns || false}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        legalAssessment: {
                          ...formData.legalAssessment,
                          healthConcerns: {
                            ...formData.legalAssessment?.healthConcerns,
                            hasConcerns: e.target.checked,
                          },
                        },
                      })
                    }
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="hasConcerns" className="text-xs text-gray-700 font-medium cursor-pointer">
                    Inmate has acute or chronic health concerns
                  </label>
                </div>
                {formData.legalAssessment?.healthConcerns?.hasConcerns && (
                  <textarea
                    rows="2"
                    placeholder="Specify medical condition, medications, or treatment needed..."
                    value={formData.legalAssessment?.healthConcerns?.notes || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        legalAssessment: {
                          ...formData.legalAssessment,
                          healthConcerns: {
                            ...formData.legalAssessment?.healthConcerns,
                            notes: e.target.value,
                          },
                        },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  ></textarea>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Court & Support */}
          {activeTab === 'court' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
                Case & Court Particulars
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">FIR Number</label>
                  <input
                    type="text"
                    placeholder="e.g. FIR 124/2024"
                    value={formData.caseDetails?.firNumber || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        caseDetails: { ...formData.caseDetails, firNumber: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Police Station</label>
                  <input
                    type="text"
                    placeholder="e.g. Kotwali, Hauz Khas"
                    value={formData.caseDetails?.policeStation || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        caseDetails: { ...formData.caseDetails, policeStation: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Court Name / Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Tis Hazari, Patiala House"
                    value={formData.caseDetails?.court || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        caseDetails: { ...formData.caseDetails, court: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Case Sections (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. IPC 379, IPC 411"
                    value={formData.caseDetails?.caseSectionsInput || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        caseDetails: { ...formData.caseDetails, caseSectionsInput: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Lawyer Type</label>
                  <select
                    value={formData.caseDetails?.lawyerType || 'Private Lawyer'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        caseDetails: { ...formData.caseDetails, lawyerType: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    {LAWYER_TYPE_OPTIONS.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Bail Applications Filed?</label>
                  <div className="flex gap-4 pt-2">
                    <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="bailFiled"
                        checked={formData.caseDetails?.bailApplicationsFiled === true}
                        onChange={() =>
                          setFormData({
                            ...formData,
                            caseDetails: { ...formData.caseDetails, bailApplicationsFiled: true },
                          })
                        }
                      />
                      Yes
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="bailFiled"
                        checked={formData.caseDetails?.bailApplicationsFiled === false}
                        onChange={() =>
                          setFormData({
                            ...formData,
                            caseDetails: { ...formData.caseDetails, bailApplicationsFiled: false },
                          })
                        }
                      />
                      No
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Support Needed (Select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {SUPPORT_NEEDED_OPTIONS.map((sup) => {
                    const isSelected = (formData.supportNeeded || []).includes(sup);
                    return (
                      <button
                        key={sup}
                        type="button"
                        onClick={() => toggleSupportNeeded(sup)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold border transition cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '} {sup}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Initial Call / Support Provided Notes
                </label>
                <textarea
                  rows="3"
                  placeholder="Summary of initial conversation and socio-legal advisory provided..."
                  value={formData.initialCallNotes || ''}
                  onChange={(e) => setFormData({ ...formData, initialCallNotes: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 p-3 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                ></textarea>
              </div>
            </div>
          )}

          {/* TAB 5: Follow-ups Timeline */}
          {activeTab === 'followups' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h4 className="text-sm font-bold text-gray-900">Follow-up Call Timeline</h4>
                {selectedRecord && (
                  <button
                    type="button"
                    onClick={() => openFollowUpModal(selectedRecord)}
                    className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition cursor-pointer"
                  >
                    + Log New Follow-up
                  </button>
                )}
              </div>

              {(!formData.followUps || formData.followUps.length === 0) ? (
                <div className="p-8 text-center text-gray-400 text-xs border border-dashed border-gray-200 rounded-2xl">
                  No follow-up calls logged yet. Save this case or click "Log New Follow-up" to record progress.
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.followUps.map((fu, idx) => (
                    <div key={fu._id || idx} className="rounded-xl bg-gray-50 p-4 border border-gray-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-700">
                          Follow-up Round #{fu.followUpNumber || idx + 1}
                        </span>
                        <span className="text-gray-400">
                          {fu.callDate ? new Date(fu.callDate).toLocaleDateString('en-GB') : 'No date'}
                        </span>
                      </div>
                      <div className="text-gray-600">
                        POC: <strong className="text-gray-800">{fu.poc || 'Unassigned'}</strong>
                        {fu.scheduledDate && (
                          <span className="ml-3 text-gray-500">
                            Scheduled Next: {new Date(fu.scheduledDate).toLocaleDateString('en-GB')}
                          </span>
                        )}
                      </div>
                      {fu.documentBottleneck && (
                        <div className="text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                          <strong>Bottleneck:</strong> {fu.documentBottleneck}
                        </div>
                      )}
                      {fu.notes && (
                        <p className="text-gray-700 bg-white p-2.5 rounded-lg border border-gray-100">
                          {fu.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition cursor-pointer disabled:opacity-60"
            >
              {submitting ? 'Saving Case...' : isEditMode ? 'Update Socio-Legal Case' : 'Create Socio-Legal Case'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
