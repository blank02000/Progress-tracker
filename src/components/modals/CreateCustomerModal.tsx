import React, { useState, useMemo } from 'react';
import { DrillType } from '../../types';
import { generateAnnualTimeline, formatDisplayDate, formatMonthShort, SYSTEM_TODAY } from '../../utils/drillCalculator';
import { X, Calendar, Building2, User, Mail, Phone, ShieldCheck, Sparkles, Check } from 'lucide-react';

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    companyName: string;
    customerContact: string;
    contactEmail?: string;
    contactPhone?: string;
    accountOwner: string;
    startDate: string;
    annualRequirement: number;
    intervalMonths: number;
    defaultDrillType: DrillType;
    industry?: string;
    notes?: string;
  }) => void;
}

const DRILL_TYPES: DrillType[] = [
  'Phishing Email Simulation',
  'Spear Phishing / Executive',
  'Smishing (SMS)',
  'Credential Harvesting',
  'Ransomware Awareness',
  'USB Drop / Physical',
  'Social Engineering Call',
  'Custom Drill',
];

export const CreateCustomerModal: React.FC<CreateCustomerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [companyName, setCompanyName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [accountOwner, setAccountOwner] = useState('David Miller');
  const [industry, setIndustry] = useState('');
  const [startDate, setStartDate] = useState(SYSTEM_TODAY);
  const [annualRequirement, setAnnualRequirement] = useState<number>(4);
  const [intervalMonths, setIntervalMonths] = useState<number>(3);
  const [defaultDrillType, setDefaultDrillType] = useState<DrillType>('Phishing Email Simulation');
  const [notes, setNotes] = useState('');
  const [products, setProducts] = useState({
    prophish: true,
    proLms: true,
    proPatrol: true,
  });

  // When annualRequirement changes, auto adjust intervalMonths if standard
  const handleRequirementChange = (count: number) => {
    setAnnualRequirement(count);
    if (count === 4) setIntervalMonths(3);
    else if (count === 6) setIntervalMonths(2);
    else if (count === 12) setIntervalMonths(1);
    else if (count === 2) setIntervalMonths(6);
    else if (count === 1) setIntervalMonths(12);
  };

  // Preview generated timeline dynamically
  const previewDrills = useMemo(() => {
    if (!startDate) return [];
    return generateAnnualTimeline(startDate, annualRequirement, intervalMonths, defaultDrillType);
  }, [startDate, annualRequirement, intervalMonths, defaultDrillType]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !customerContact.trim() || !startDate) return;

    onSubmit({
      companyName: companyName.trim(),
      customerContact: customerContact.trim(),
      contactEmail: contactEmail.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      accountOwner: accountOwner.trim() || 'SecOps Team',
      startDate,
      annualRequirement,
      intervalMonths,
      defaultDrillType,
      industry: industry.trim() || undefined,
      notes: notes.trim() || undefined,
      products,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="modal-create-customer"
        className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Create Customer Account</h2>
              <p className="text-xs text-slate-500">
                Setup annual cybersecurity awareness requirement and automated drill timeline.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Section 1: Customer Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> 1. Customer Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-company-name"
                  type="text"
                  required
                  placeholder="e.g. ABC Company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Customer Contact <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-customer-contact"
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins (CISO)"
                  value={customerContact}
                  onChange={(e) => setCustomerContact(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Email
                </label>
                <input
                  id="input-contact-email"
                  type="email"
                  placeholder="s.jenkins@abccompany.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone
                </label>
                <input
                  id="input-contact-phone"
                  type="text"
                  placeholder="+1 (555) 019-2834"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Owner (Internal Team) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-account-owner"
                  type="text"
                  required
                  value={accountOwner}
                  onChange={(e) => setAccountOwner(e.target.value)}
                  placeholder="e.g. David Miller"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Industry</label>
                <input
                  id="input-industry"
                  type="text"
                  placeholder="e.g. Financial Technology, Healthcare"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Annual Drill Plan & Automatic Timeline */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> 2. Annual Drill Plan Configuration
              </h3>
              <span className="text-[11px] text-blue-600 bg-blue-50 font-medium px-2 py-0.5 rounded flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Automatic Timeline Generator
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  First Drill / Start Date <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-first-drill-date"
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Annual Requirement
                </label>
                <select
                  id="select-annual-requirement"
                  value={annualRequirement}
                  onChange={(e) => handleRequirementChange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                >
                  <option value={4}>4 Drills / Year (Quarterly)</option>
                  <option value={6}>6 Drills / Year (Bi-Monthly)</option>
                  <option value={12}>12 Drills / Year (Monthly)</option>
                  <option value={2}>2 Drills / Year (Semi-Annual)</option>
                  <option value={1}>1 Drill / Year (Annual)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preferred Interval
                </label>
                <select
                  id="select-drill-interval"
                  value={intervalMonths}
                  onChange={(e) => setIntervalMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                >
                  <option value={1}>Every 1 Month</option>
                  <option value={2}>Every 2 Months</option>
                  <option value={3}>Every 3 Months (Standard Quarter)</option>
                  <option value={4}>Every 4 Months</option>
                  <option value={6}>Every 6 Months</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Simulation Type
              </label>
              <select
                id="select-default-drill-type"
                value={defaultDrillType}
                onChange={(e) => setDefaultDrillType(e.target.value as DrillType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
              >
                {DRILL_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Live Generated Timeline Preview Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Calculated Schedule Preview ({previewDrills.length} Drills)
                </span>
                <span className="text-xs text-slate-500">
                  Dates can be adjusted manually after creation
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {previewDrills.map((drill) => (
                  <div
                    key={drill.drillNumber}
                    className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs text-left"
                  >
                    <div className="text-[11px] font-bold uppercase text-blue-600">
                      {formatMonthShort(drill.plannedDate)} — Drill {drill.drillNumber}
                    </div>
                    <div className="text-xs font-medium text-slate-800 mt-0.5">
                      {formatDisplayDate(drill.plannedDate)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Status: Upcoming</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Product Subscriptions */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Product Subscriptions & Opted Products
            </h3>
            <p className="text-xs text-slate-500">
              Select the products this customer has opted for:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${products.prophish ? 'bg-blue-50/50 border-blue-200 text-blue-950 shadow-2xs' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <input
                  type="checkbox"
                  checked={products.prophish}
                  onChange={(e) => setProducts({ ...products, prophish: e.target.checked })}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-xs font-bold">Prophish</div>
                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">Phishing simulation drills</div>
                </div>
              </label>

              <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${products.proLms ? 'bg-blue-50/50 border-blue-200 text-blue-950 shadow-2xs' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <input
                  type="checkbox"
                  checked={products.proLms}
                  onChange={(e) => setProducts({ ...products, proLms: e.target.checked })}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-xs font-bold">Pro LMS</div>
                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">Online learning management system</div>
                </div>
              </label>

              <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${products.proPatrol ? 'bg-blue-50/50 border-blue-200 text-blue-950 shadow-2xs' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <input
                  type="checkbox"
                  checked={products.proPatrol}
                  onChange={(e) => setProducts({ ...products, proPatrol: e.target.checked })}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-xs font-bold">Pro Patrol</div>
                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">MS & Google reporting button plugin</div>
                </div>
              </label>
            </div>
          </div>

          {/* Section 3: Notes */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Account Notes / Audit Details
            </label>
            <textarea
              id="textarea-customer-notes"
              rows={2}
              placeholder="e.g. Special compliance requirements (SOC2, HIPAA, ISO 27001), executive team preferences, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-submit-create-customer"
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Create Customer & Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
