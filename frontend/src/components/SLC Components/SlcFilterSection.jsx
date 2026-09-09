import React from 'react';
import { useSlcStore } from '../../store/useSlcStore';
import { TIER_OPTIONS, CRIME_CATEGORY_OPTIONS } from './constants';

export default function SlcFilterSection() {
  const {
    search,
    setSearch,
    tierFilter,
    setTierFilter,
    crimeCategoryFilter,
    setCrimeCategoryFilter,
    resetFilters,
    fetchSlcRecords,
    slcList,
    loading,
  } = useSlcStore();

  const isFiltered = Boolean(search) || tierFilter !== 'All' || crimeCategoryFilter !== 'All';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 mt-6 transition-all">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        {/* Search */}
        <div className="md:col-span-6 flex flex-col">
          <label htmlFor="slc-search" className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search Socio-Legal Cases
          </label>
          <div className="relative flex items-center">
            <input
              id="slc-search"
              type="text"
              placeholder="Search by Inmate, Family, FIR No, Police Station, Court, or POC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchSlcRecords()}
              className="w-full rounded-xl border border-gray-300 pl-3.5 pr-20 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
            />
            <div className="absolute right-1.5 flex items-center gap-1">
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    fetchSlcRecords();
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
                onClick={fetchSlcRecords}
                className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 transition cursor-pointer"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Priority Tier Filter */}
        <div className="md:col-span-3 flex flex-col">
          <label htmlFor="filter-tier" className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Priority Tier
          </label>
          <div className="relative">
            <select
              id="filter-tier"
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition cursor-pointer pr-9"
            >
              <option value="All">All Tiers</option>
              {TIER_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
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

        {/* Crime Category Filter */}
        <div className="md:col-span-3 flex flex-col">
          <label htmlFor="filter-crime" className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Crime Category
          </label>
          <div className="relative">
            <select
              id="filter-crime"
              value={crimeCategoryFilter}
              onChange={(e) => setCrimeCategoryFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition cursor-pointer pr-9"
            >
              <option value="All">All Categories</option>
              {CRIME_CATEGORY_OPTIONS.map((cat) => (
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
      </div>

      {/* Active Tags */}
      <div className="mt-4 pt-3.5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-gray-500 font-medium">
            {loading ? 'Filtering...' : `Showing ${slcList.length} ${slcList.length === 1 ? 'case' : 'cases'}`}
          </span>

          {tierFilter !== 'All' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 border border-rose-200">
              <span>Tier: <strong>{tierFilter}</strong></span>
              <button type="button" onClick={() => setTierFilter('All')} className="hover:text-rose-900 cursor-pointer">
                &times;
              </button>
            </span>
          )}

          {crimeCategoryFilter !== 'All' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 border border-indigo-200">
              <span>Category: <strong>{crimeCategoryFilter}</strong></span>
              <button type="button" onClick={() => setCrimeCategoryFilter('All')} className="hover:text-indigo-900 cursor-pointer">
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
                  fetchSlcRecords();
                }}
                className="hover:text-gray-900 cursor-pointer"
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
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
}
