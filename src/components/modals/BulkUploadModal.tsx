import React, { useState } from 'react';
import { useCustomerContext } from '../../context/CustomerContext';
import { X, Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ isOpen, onClose }) => {
  const { bulkImportCustomers, users } = useCustomerContext();
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccessCount(null);
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = (uploadFile: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        if (!json || json.length === 0) {
          setError('The uploaded file contains no rows or valid data.');
          setParsedRows([]);
          return;
        }

        setParsedRows(json);
      } catch (err) {
        console.error('Error parsing file:', err);
        setError('Failed to parse Excel/CSV file. Please check the file format.');
        setParsedRows([]);
      }
    };
    reader.readAsArrayBuffer(uploadFile);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        companyName: 'Acme Financial Corp',
        customerContact: 'Sarah Connor',
        contactEmail: 'sarah@acmefinancial.com',
        contactPhone: '+1-555-0192',
        accountOwner: 'Internal Security',
        csmEmail: users.find((u) => u.role === 'CSM')?.email || 'alex.morgan@cyberdrill.io',
        startDate: '2026-01-01',
        annualRequirement: 4,
        intervalMonths: 3,
        defaultDrillType: 'Phishing',
        industry: 'Banking & Finance',
        notes: 'Enterprise Tier 1 client',
      },
      {
        companyName: 'Apex Health Systems',
        customerContact: 'Dr. Marcus Vance',
        contactEmail: 'mvance@apexhealth.org',
        contactPhone: '+1-555-0482',
        accountOwner: 'Compliance Team',
        csmEmail: users.find((u) => u.role === 'CSM')?.email || 'alex.morgan@cyberdrill.io',
        startDate: '2026-02-01',
        annualRequirement: 6,
        intervalMonths: 2,
        defaultDrillType: 'Ransomware',
        industry: 'Healthcare',
        notes: 'HIPAA compliance mandated',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'CustomersTemplate');
    XLSX.writeFile(workbook, 'cyberdrill_customers_template.xlsx');
  };

  const handleImport = () => {
    if (parsedRows.length === 0) return;
    const count = bulkImportCustomers(parsedRows);
    setSuccessCount(count);
    setTimeout(() => {
      onClose();
      setFile(null);
      setParsedRows([]);
      setSuccessCount(null);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/30 text-blue-400 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Bulk Excel / CSV Customer Upload</h3>
              <p className="text-xs text-slate-400">Import multiple customer accounts and drill schedules instantly</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {successCount !== null ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Successfully Imported {successCount} Customers!</h4>
              <p className="text-xs text-slate-500">All customer accounts and annual drill timelines have been generated.</p>
            </div>
          ) : (
            <>
              {/* Instructions & Template Download */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Excel Format Guide</h4>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Your file should include columns like <code className="bg-blue-100 px-1 py-0.5 rounded">companyName</code>, <code className="bg-blue-100 px-1 py-0.5 rounded">customerContact</code>, <code className="bg-blue-100 px-1 py-0.5 rounded">csmEmail</code>, <code className="bg-blue-100 px-1 py-0.5 rounded">annualRequirement</code>, etc.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                >
                  <Download className="w-4 h-4" /> Download Excel Template
                </button>
              </div>

              {/* File Dropzone */}
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center bg-slate-50/50 transition-colors relative">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shadow-xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {file ? file.name : 'Click to upload or drag & drop Excel / CSV file'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Supports .xlsx, .xls, and .csv formats</p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Preview Table */}
              {parsedRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Preview Parsed Data ({parsedRows.length} customers found)
                    </h4>
                    <span className="text-xs text-emerald-600 font-medium">Ready to import</span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100 text-slate-700 sticky top-0">
                        <tr>
                          <th className="p-2.5 font-semibold">Company Name</th>
                          <th className="p-2.5 font-semibold">Contact</th>
                          <th className="p-2.5 font-semibold">Email</th>
                          <th className="p-2.5 font-semibold">CSM Email</th>
                          <th className="p-2.5 font-semibold">Drills/Yr</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {parsedRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2.5 font-medium text-slate-900">
                              {row.companyName || row['Company Name'] || row.company || '—'}
                            </td>
                            <td className="p-2.5 text-slate-600">
                              {row.customerContact || row['Customer Contact'] || row['Primary Contact'] || '—'}
                            </td>
                            <td className="p-2.5 text-slate-600">
                              {row.contactEmail || row['Contact Email'] || row.email || '—'}
                            </td>
                            <td className="p-2.5 text-slate-600">
                              {row.csmEmail || row['CSM Email'] || row.csmName || row['CSM Name'] || 'Unassigned'}
                            </td>
                            <td className="p-2.5 text-slate-600">
                              {row.annualRequirement || row['Annual Requirement'] || row['Drills'] || '4'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          {parsedRows.length > 0 && successCount === null && (
            <button
              type="button"
              onClick={handleImport}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" /> Import {parsedRows.length} Customers
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
