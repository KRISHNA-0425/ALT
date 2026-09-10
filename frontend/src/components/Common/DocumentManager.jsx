import React, { useState, useRef } from 'react';
import { DOCUMENTS_SUBMITTED_OPTIONS } from '../SLC Components/constants';

// Format bytes into clean human readable format (KB, MB, GB)
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Document type badge colors
const getDocTypeBadgeClass = (type) => {
  switch (type) {
    case 'FIR':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'Chargesheet':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Court Orders':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Bail/Parole/Appeal Application':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Final Report':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

export default function DocumentManager({
  caseId,
  attachedFiles = [],
  onUpload,
  onDelete,
  readOnly = false,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState('FIR');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (['jpg', 'jpeg', 'png', 'pdf'].includes(ext)) {
        setSelectedFile(file);
      } else {
        alert('Please select only JPEG/PNG images or PDF documents.');
      }
    }
  };

  const handleStartUpload = async () => {
    if (!selectedFile) return;
    if (!caseId) {
      alert('Please save the case before uploading documents.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const success = await onUpload(caseId, selectedFile, documentType, (percent) => {
      setUploadProgress(percent);
    });

    setIsUploading(false);
    if (success) {
      setSelectedFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCancelFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isPdf = (file) => {
    const name = file.originalName || file.name || '';
    const type = file.fileType || '';
    return name.toLowerCase().endsWith('.pdf') || type.includes('pdf');
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      {!readOnly && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-3 border-b border-slate-200">
            <div>
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Case Document / File
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload FIR, Chargesheet, Court Orders, or other legal documents. Supports JPEG images and PDFs up to 2 GB.
              </p>
            </div>
            {!caseId && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                Save case first to enable upload
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Document Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Document Category
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                disabled={isUploading || !caseId}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                {DOCUMENTS_SUBMITTED_OPTIONS.map((doc) => (
                  <option key={doc} value={doc}>
                    {doc}
                  </option>
                ))}
                <option value="Other">Other Document</option>
              </select>
            </div>

            {/* Drag & Drop File Zone */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Select File (PDF, JPEG, JPG, PNG)
              </label>

              {!selectedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => caseId && !isUploading && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
                    !caseId
                      ? 'border-slate-200 bg-slate-100/50 cursor-not-allowed'
                      : isDragging
                      ? 'border-indigo-500 bg-indigo-50/50'
                      : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={!caseId || isUploading}
                  />
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-xs font-semibold text-slate-700">
                      Click to browse or drag & drop file here
                    </span>
                    <span className="text-[11px] text-slate-400">
                      PDFs (up to 2 GB) or JPEG/PNG images
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                        {selectedFile.type.includes('pdf') || selectedFile.name.endsWith('.pdf') ? (
                          <span className="text-xs font-bold text-rose-600">PDF</span>
                        ) : (
                          <span className="text-xs font-bold text-blue-600">IMG</span>
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-800 truncate" title={selectedFile.name}>
                          {selectedFile.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {formatFileSize(selectedFile.size)} • Type: <strong className="text-slate-700">{documentType}</strong>
                        </p>
                      </div>
                    </div>

                    {!isUploading && (
                      <button
                        type="button"
                        onClick={handleCancelFile}
                        className="text-xs text-slate-400 hover:text-rose-600 p-1 transition"
                        title="Remove selection"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Upload progress bar */}
                  {isUploading && (
                    <div className="w-full space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                        <span>Uploading to Cloudinary...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCancelFile}
                      disabled={isUploading}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleStartUpload}
                      disabled={isUploading || !caseId}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isUploading ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          Uploading ({uploadProgress}%)
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          Upload File
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Attached Files List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            Attached Documents ({attachedFiles.length})
          </h4>
        </div>

        {attachedFiles.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50/50">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-slate-600">No documents attached yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Select a document category and upload FIR, Chargesheet, or Court Orders above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {attachedFiles.map((file, idx) => {
              const isFilePdf = isPdf(file);
              return (
                <div
                  key={file._id || file.publicId || idx}
                  className="bg-white border border-slate-200 rounded-xl p-3.5 hover:shadow-xs transition flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                          isFilePdf
                            ? 'bg-rose-50 border-rose-100 text-rose-600'
                            : 'bg-blue-50 border-blue-100 text-blue-600'
                        }`}
                      >
                        {isFilePdf ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold border ${getDocTypeBadgeClass(
                              file.documentType
                            )}`}
                          >
                            {file.documentType || 'Document'}
                          </span>
                        </div>
                        <p
                          className="text-xs font-bold text-slate-800 truncate mt-0.5"
                          title={file.originalName || file.title}
                        >
                          {file.originalName || file.title || 'Attached File'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <div>
                      <span>{formatFileSize(file.fileSize)}</span>
                      {file.uploadedAt && (
                        <span className="ml-1.5 text-slate-400">
                          • {new Date(file.uploadedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View / Open
                      </a>

                      {!readOnly && onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(caseId, file._id || file.publicId)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete document"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
