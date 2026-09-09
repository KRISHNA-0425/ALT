import React from 'react';
import { useOutreachStore } from '../../store/useOutreachStore';
import { OFFENCE_TYPE_OPTIONS, CALL_STATUS_OPTIONS } from './constants';

export default function FilterSection() {
  const {
    search,
    setSearch,
    caseCategoryFilter,
    setCaseCategoryFilter,
    callStatusFilter,
    setCallStatusFilter,
    resetFilters,
    fetchOutreach,
    outreachList,
    loading,
  } = useOutreachStore();

  const isFiltered =
    Boolean(search) ||
    caseCategoryFilter !== 'All' ||
    callStatusFilter !== 'All';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 mt-6 transition-all">
      {/* Search and Main Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        {/* Search Input */}
        <div className="md:col-span-6 flex flex-col">
          <label htmlFor="outreach-search" className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search Cases
          </label>
          <div className="relative flex items-center">
            <input
              id="outreach-search"
              type="text"
              placeholder="Search by Inmate Name, Contact Name, Offence, or Source..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchOutreach()}
              className="w-full rounded-xl border border-gray-300 pl-3.5 pr-20 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
            />
            <div className="absolute right-1.5 flex items-center gap-1">
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    fetchOutreach();
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-md text-xs cursor-pointer"
                  title="Clear search"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                onClick={fetchOutreach}
                className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 transition cursor-pointer"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Case Category Filter */}
        <div className="md:col-span-3 flex flex-col">
          <label htmlFor="filter-category" className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Case Category ({OFFENCE_TYPE_OPTIONS.length})
          </label>
          <div className="relative">
            <select
              id="filter-category"
              value={caseCategoryFilter}
              onChange={(e) => setCaseCategoryFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition cursor-pointer pr-9"
            >
              <option value="All">All Case Categories</option>
              {OFFENCE_TYPE_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Call Status Filter */}
        <div className="md:col-span-3 flex flex-col">
          <label htmlFor="filter-call-status" className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Call Status ({CALL_STATUS_OPTIONS.length})
          </label>
          <div className="relative">
            <select
              id="filter-call-status"
              value={callStatusFilter}
              onChange={(e) => setCallStatusFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition cursor-pointer pr-9"
            >
              <option value="All">All Call Statuses</option>
              <option value="No Calls">No Calls Logged</option>
              {CALL_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Active Filter Tags & Results Counter */}
      <div className="mt-4 pt-3.5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-gray-500 font-medium">
            {loading ? 'Filtering...' : `Showing ${outreachList.length} ${outreachList.length === 1 ? 'case' : 'cases'}`}
          </span>

          {caseCategoryFilter !== 'All' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 border border-indigo-200">
              <span>Category: <strong>{caseCategoryFilter}</strong></span>
              <button
                type="button"
                onClick={() => setCaseCategoryFilter('All')}
                className="hover:text-indigo-900 cursor-pointer"
                title="Remove category filter"
              >
                &times;
              </button>
            </span>
          )}

          {callStatusFilter !== 'All' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
              <span>Call: <strong>{callStatusFilter}</strong></span>
              <button
                type="button"
                onClick={() => setCallStatusFilter('All')}
                className="hover:text-emerald-900 cursor-pointer"
                title="Remove call status filter"
              >
                &times;
              </button>
            </span>
          )}

          {search && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 border border-gray-200">
              <span>Query: <strong>"{search}"</strong></span>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  fetchOutreach();
                }}
                className="hover:text-gray-900 cursor-pointer"
                title="Clear search query"
              >
                &times;
              </button>
            </span>
          )}
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 transition cursor-pointer hover:underline"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset All Filters
          </button>
        )}
      </div>
    </div>
  );
}
