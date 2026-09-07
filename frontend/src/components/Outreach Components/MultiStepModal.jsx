import React from 'react';
import {
  OFFENCE_TYPE_OPTIONS,
  RELATIONSHIP_OPTIONS,
  DISCOVERY_MODE_OPTIONS,
} from './constants';

export default function MultiStepModal({
  isOpen,
  isEditMode,
  currentStep,
  formData,
  submitting,
  onClose,
  onNextStep,
  onPrevStep,
  onSetStep,
  onToggleOffenceType,
  onChangeFormData,
  onSubmit,
}) {
  if (!isOpen) return null;

  const steps = [
    { number: 1, title: 'Basic & Inmate Details' },
    { number: 2, title: 'Contact Person Details' },
    { number: 3, title: 'Discovery Information' },
    { number: 4, title: 'Review & Confirm' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden my-6 border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">
              {isEditMode ? 'Edit OutReach Record' : 'Create OutReach Record'}
            </h3>
            <p className="text-xs text-gray-400">
              Step {currentStep} of 4: {steps[currentStep - 1].title}
            </p>
          </div>
          <button
            onClick={onClose}
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
                      onChangeFormData({ ...formData, dateOfFirstContact: e.target.value })
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
                    onChange={(e) => onChangeFormData({ ...formData, sNo: e.target.value })}
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
                      onChangeFormData({
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
                          onChangeFormData({
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
                          onChangeFormData({
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
                          onChange={() => onToggleOffenceType(offence)}
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
                    onChangeFormData({
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
                    onChangeFormData({
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
                    onChangeFormData({
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
                      onChangeFormData({
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
                    onChangeFormData({
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
                    onChangeFormData({
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
                      onChangeFormData({
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
                    onChangeFormData({
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
                      onClick={() => onSetStep(1)}
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
                      onClick={() => onSetStep(2)}
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
                      onClick={() => onSetStep(3)}
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
              onClick={onPrevStep}
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-white transition cursor-pointer"
            >
              ← Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-white transition cursor-pointer"
            >
              Cancel
            </button>
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={onNextStep}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition cursor-pointer shadow-sm"
            >
              Next Step →
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={onSubmit}
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
  );
}
