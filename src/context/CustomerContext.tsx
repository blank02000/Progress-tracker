import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Customer, DrillRecord, ReviewMeeting, DrillType, UserAccount, UserRole, CustomerProducts, LmsDeliverable, DeliverableFrequency } from '../types';
import { INITIAL_CUSTOMERS, INITIAL_USERS } from '../data/seedData';
import { SYSTEM_TODAY, generateAnnualTimeline, computeDrillStatus, computeDeliverableStatus } from '../utils/drillCalculator';

interface CustomerContextType {
  // Customers
  customers: Customer[]; // Filtered by current user role/assignment (accessible customers)
  allCustomers: Customer[]; // All customers (unfiltered, for admin management)
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;
  referenceDate: string;
  setReferenceDate: (date: string) => void;
  dueSoonDays: number;
  setDueSoonDays: (days: number) => void;

  // RBAC & User Management
  users: UserAccount[];
  currentUser: UserAccount;
  setCurrentUserId: (id: string) => void;
  addCsmUser: (data: { name: string; email: string; title: string }) => UserAccount;
  updateCsmUser: (id: string, partial: Partial<UserAccount>) => void;
  toggleCsmStatus: (id: string) => void;
  assignCustomerCsm: (customerId: string, csmId: string | undefined) => void;
  canUserAccessCustomer: (customer: Customer | null | undefined, user?: UserAccount) => boolean;
  canUserMutateCustomer: (customer: Customer | null | undefined, user?: UserAccount) => boolean;
  
  // Actions
  addCustomer: (customerData: {
    companyName: string;
    customerContact: string;
    contactEmail?: string;
    contactPhone?: string;
    accountOwner: string;
    csmId?: string;
    startDate: string;
    annualRequirement: number;
    intervalMonths: number;
    defaultDrillType: DrillType;
    industry?: string;
    notes?: string;
    products?: CustomerProducts;
  }) => Customer;
  updateCustomer: (id: string, partial: Partial<Customer>) => boolean;
  deleteCustomer: (id: string) => boolean;
  markDrillCompleted: (
    customerId: string,
    yearOrDrillId: number | string,
    drillIdOrData: any,
    maybeData?: any
  ) => boolean;
  updateDrillSchedule: (
    customerId: string,
    yearOrDrillId: number | string,
    drillIdOrData: any,
    maybeData?: any
  ) => boolean;
  updateReviewMeeting: (
    customerId: string,
    yearOrDrillId: number | string,
    drillIdOrMeeting: any,
    maybeMeeting?: any
  ) => boolean;
  createNewYearPlan: (
    customerId: string,
    newYear: number,
    startDate: string,
    annualRequirement: number,
    intervalMonths: number,
    defaultDrillType?: DrillType,
    notes?: string
  ) => boolean;
  addLmsDeliverable: (
    customerId: string,
    year: number,
    data: {
      title: string;
      frequency: DeliverableFrequency;
      plannedDate: string;
      targetAudience?: string;
      notes?: string;
    }
  ) => LmsDeliverable | null;
  updateLmsDeliverable: (
    customerId: string,
    year: number,
    deliverableId: string,
    partial: Partial<LmsDeliverable>
  ) => boolean;
  deleteLmsDeliverable: (
    customerId: string,
    year: number,
    deliverableId: string
  ) => boolean;
  markDeliverableCompleted: (
    customerId: string,
    year: number,
    deliverableId: string,
    completionData: {
      actualCompletionDate: string;
      completionRate?: number;
      notes?: string;
    }
  ) => boolean;
  resetToDemoData: () => void;
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => boolean;
  lastSentEmail: { to: string; subject: string; body: string; timestamp: string } | null;
  clearLastSentEmail: () => void;
}

const STORAGE_KEY = 'cyberdrill_customers_v2';
const USERS_STORAGE_KEY = 'cyberdrill_users_v2';
const CURRENT_USER_KEY = 'cyberdrill_current_user_v2';
const DATE_STORAGE_KEY = 'cyberdrill_ref_date_v2';

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Users state
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read saved users data, defaulting to initial users', e);
    }
    return INITIAL_USERS;
  });

  const [currentUserId, setCurrentUserIdState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(CURRENT_USER_KEY);
      if (saved) return saved;
    } catch {
      // ignore
    }
    return INITIAL_USERS[0].id; // Default to Admin Sarah Jenkins
  });

  // Master customers list (all customers in the system)
  const [allCustomers, setAllCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read saved customer data, defaulting to seed data', e);
    }
    return INITIAL_CUSTOMERS;
  });

  const [selectedCustomerId, setSelectedCustomerIdState] = useState<string | null>(null);
  
  const [referenceDate, setReferenceDateState] = useState<string>(() => {
    try {
      const savedDate = localStorage.getItem(DATE_STORAGE_KEY);
      if (savedDate) return savedDate;
    } catch {
      // ignore
    }
    return SYSTEM_TODAY;
  });

  const [dueSoonDays, setDueSoonDays] = useState<number>(14);

  const [lastSentEmail, setLastSentEmail] = useState<{
    to: string;
    subject: string;
    body: string;
    timestamp: string;
  } | null>(null);

  const clearLastSentEmail = () => setLastSentEmail(null);

  // Derive currentUser object
  const currentUser: UserAccount = useMemo(() => {
    const found = users.find((u) => u.id === currentUserId);
    return found || users[0] || INITIAL_USERS[0];
  }, [users, currentUserId]);

  // Sync users & current user to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users to localStorage', e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(CURRENT_USER_KEY, currentUser.id);
    } catch (e) {
      console.error('Failed to save current user to localStorage', e);
    }
  }, [currentUser]);

  // Sync allCustomers to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allCustomers));
    } catch (e) {
      console.error('Failed to save customers to localStorage', e);
    }
  }, [allCustomers]);

  const setCurrentUserId = (id: string) => {
    setCurrentUserIdState(id);
    // If switching to a CSM and the currently selected customer is not assigned to them, clear selection
    const targetUser = users.find((u) => u.id === id);
    if (targetUser && targetUser.role === 'CSM' && selectedCustomerId) {
      const currentCust = allCustomers.find((c) => c.id === selectedCustomerId);
      if (currentCust && currentCust.csmId !== targetUser.id) {
        setSelectedCustomerIdState(null);
      }
    }
  };

  const setReferenceDate = (date: string) => {
    setReferenceDateState(date);
    try {
      localStorage.setItem(DATE_STORAGE_KEY, date);
    } catch {
      // ignore
    }
  };

  // Helper to check read access
  const canUserAccessCustomer = (customer: Customer | null | undefined, user: UserAccount = currentUser): boolean => {
    if (!customer) return false;
    if (user.role === 'Admin') return true;
    return customer.csmId === user.id;
  };

  // Helper to check write access
  const canUserMutateCustomer = (customer: Customer | null | undefined, user: UserAccount = currentUser): boolean => {
    if (!customer) return false;
    if (user.role === 'Admin') return true;
    return customer.csmId === user.id;
  };

  // Dynamic Accessible Customers based on current user role
  const customers = useMemo(() => {
    if (currentUser.role === 'Admin') {
      return allCustomers;
    }
    // CSM role: Strictly return assigned customers
    return allCustomers.filter((c) => c.csmId === currentUser.id);
  }, [allCustomers, currentUser]);

  const setSelectedCustomerId = (id: string | null) => {
    if (!id) {
      setSelectedCustomerIdState(null);
      return;
    }
    // Verify access
    const targetCust = allCustomers.find((c) => c.id === id);
    if (targetCust && canUserAccessCustomer(targetCust, currentUser)) {
      setSelectedCustomerIdState(id);
    } else {
      console.warn('Access denied: User is not authorized to access this customer');
      setSelectedCustomerIdState(null);
    }
  };

  // CSM User Management Actions (Admin only)
  const addCsmUser = (data: { name: string; email: string; title: string }): UserAccount => {
    const colors = ['bg-emerald-600', 'bg-violet-600', 'bg-amber-600', 'bg-rose-600', 'bg-teal-600', 'bg-indigo-600'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newCsm: UserAccount = {
      id: `user-csm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      role: 'CSM',
      title: data.title.trim() || 'Customer Success Manager',
      avatarColor: randomColor,
      status: 'Active',
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => [...prev, newCsm]);

    // Simulate sending welcome email to the newly created CSM
    setLastSentEmail({
      to: newCsm.email,
      subject: `Welcome to CyberDrill - Your CSM Account & Portal Access`,
      body: `Hello ${newCsm.name},\n\nYour Customer Success Manager account has been created successfully with the title "${newCsm.title}".\n\nYou can now log in to the portal to manage your assigned customers, drills, and compliance reviews.\n\nBest regards,\nCyberDrill Admin & SecOps`,
      timestamp: new Date().toLocaleTimeString(),
    });

    return newCsm;
  };

  const updateCsmUser = (id: string, partial: Partial<UserAccount>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...partial };
          // If name changed, update csmName in customers
          if (partial.name && partial.name !== u.name) {
            setAllCustomers((custPrev) =>
              custPrev.map((c) => (c.csmId === id ? { ...c, csmName: partial.name } : c))
            );
          }
          return updated;
        }
        return u;
      })
    );
  };

  const toggleCsmStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          return {
            ...u,
            status: u.status === 'Active' ? 'Inactive' : 'Active',
          };
        }
        return u;
      })
    );
  };

  const assignCustomerCsm = (customerId: string, csmId: string | undefined) => {
    const assignedUser = csmId ? users.find((u) => u.id === csmId) : undefined;
    setAllCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          return {
            ...c,
            csmId: csmId || undefined,
            csmName: assignedUser ? assignedUser.name : undefined,
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    );
  };

  const addCustomer: CustomerContextType['addCustomer'] = (data) => {
    const newId = `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const startYear = parseInt(data.startDate.substring(0, 4), 10) || 2026;
    
    // Auto generate timeline for the first year
    const generatedDrills = generateAnnualTimeline(
      data.startDate,
      data.annualRequirement,
      data.intervalMonths,
      data.defaultDrillType
    );

    // Resolve assigned CSM
    const assignedUser = data.csmId ? users.find((u) => u.id === data.csmId) : undefined;

    const newCustomer: Customer = {
      id: newId,
      companyName: data.companyName.trim(),
      customerContact: data.customerContact.trim(),
      contactEmail: data.contactEmail?.trim(),
      contactPhone: data.contactPhone?.trim(),
      accountOwner: data.accountOwner.trim() || 'Internal SecOps',
      csmId: data.csmId || (currentUser.role === 'CSM' ? currentUser.id : undefined),
      csmName: assignedUser ? assignedUser.name : currentUser.role === 'CSM' ? currentUser.name : undefined,
      startDate: data.startDate,
      status: 'Active',
      industry: data.industry?.trim(),
      notes: data.notes?.trim(),
      products: data.products || { prophish: true, proLms: true, proPatrol: true },
      currentYear: startYear,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      annualPlans: {
        [startYear]: {
          year: startYear,
          annualRequirement: data.annualRequirement,
          startDate: data.startDate,
          intervalMonths: data.intervalMonths,
          defaultDrillType: data.defaultDrillType,
          drills: generatedDrills,
        },
      },
    };

    setAllCustomers((prev) => [newCustomer, ...prev]);
    return newCustomer;
  };

  const updateCustomer = (id: string, partial: Partial<Customer>): boolean => {
    const target = allCustomers.find((c) => c.id === id);
    if (!target || !canUserMutateCustomer(target, currentUser)) {
      console.warn('Unauthorized update attempt on customer', id);
      return false;
    }

    // If CSM assignment changed, resolve csmName
    let updatedPartial = { ...partial };
    if (partial.csmId !== undefined) {
      if (currentUser.role !== 'Admin') {
        // Only admin can change CSM assignment
        delete updatedPartial.csmId;
      } else {
        const assignedUser = partial.csmId ? users.find((u) => u.id === partial.csmId) : undefined;
        updatedPartial.csmName = assignedUser ? assignedUser.name : undefined;
      }
    }

    setAllCustomers((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            ...updatedPartial,
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    );
    return true;
  };

  const deleteCustomer = (id: string): boolean => {
    if (currentUser.role !== 'Admin') {
      console.warn('Only Admin can delete customer accounts');
      return false;
    }
    setAllCustomers((prev) => prev.filter((c) => c.id !== id));
    if (selectedCustomerId === id) {
      setSelectedCustomerIdState(null);
    }
    return true;
  };

  const markDrillCompleted: CustomerContextType['markDrillCompleted'] = (
    customerId,
    yearOrDrillId,
    drillIdOrData,
    maybeData
  ): boolean => {
    let year: number | undefined = undefined;
    let drillId: string;
    let completionData: any;

    if (typeof yearOrDrillId === 'number') {
      year = yearOrDrillId;
      drillId = drillIdOrData as string;
      completionData = maybeData;
    } else {
      drillId = yearOrDrillId as string;
      completionData = drillIdOrData;
    }

    const target = allCustomers.find((c) => c.id === customerId);
    if (!target || !canUserMutateCustomer(target, currentUser)) {
      return false;
    }

    // Auto locate year if omitted or invalid
    if (year === undefined || !target.annualPlans[year]) {
      for (const y in target.annualPlans) {
        if (target.annualPlans[y]?.drills?.some((d) => d.id === drillId)) {
          year = Number(y);
          break;
        }
      }
      if (year === undefined) {
        year = target.currentYear || 2026;
      }
    }

    const targetYear = year;

    setAllCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;
        const currentPlan = c.annualPlans[targetYear];
        if (!currentPlan) return c;

        const updatedDrills = currentPlan.drills.map((d) => {
          if (d.id !== drillId) return d;

          // Determine status dynamically
          const isLate = completionData.actualCompletionDate > d.plannedDate;
          const status = isLate ? 'Completed Late' : 'Completed';

          return {
            ...d,
            ...completionData,
            status,
            actualCompletionDate: completionData.actualCompletionDate,
          };
        });

        return {
          ...c,
          updatedAt: new Date().toISOString(),
          annualPlans: {
            ...c.annualPlans,
            [targetYear]: {
              ...currentPlan,
              drills: updatedDrills,
            },
          },
        };
      })
    );
    return true;
  };

  const updateDrillSchedule: CustomerContextType['updateDrillSchedule'] = (
    customerId,
    yearOrDrillId,
    drillIdOrData,
    maybeData
  ): boolean => {
    let year: number | undefined = undefined;
    let drillId: string;
    let data: any;

    if (typeof yearOrDrillId === 'number') {
      year = yearOrDrillId;
      drillId = drillIdOrData as string;
      data = maybeData;
    } else {
      drillId = yearOrDrillId as string;
      data = drillIdOrData;
    }

    const target = allCustomers.find((c) => c.id === customerId);
    if (!target || !canUserMutateCustomer(target, currentUser)) {
      return false;
    }

    // Auto locate year if omitted or invalid
    if (year === undefined || !target.annualPlans[year]) {
      for (const y in target.annualPlans) {
        if (target.annualPlans[y]?.drills?.some((d) => d.id === drillId)) {
          year = Number(y);
          break;
        }
      }
      if (year === undefined) {
        year = target.currentYear || 2026;
      }
    }

    const targetYear = year;

    setAllCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;
        const currentPlan = c.annualPlans[targetYear];
        if (!currentPlan) return c;

        const updatedDrills = currentPlan.drills.map((d) => {
          if (d.id !== drillId) return d;
          const updated = { ...d, ...data };
          // Recompute status
          updated.status = computeDrillStatus(updated, referenceDate, dueSoonDays);
          return updated;
        });

        return {
          ...c,
          updatedAt: new Date().toISOString(),
          annualPlans: {
            ...c.annualPlans,
            [targetYear]: {
              ...currentPlan,
              drills: updatedDrills,
            },
          },
        };
      })
    );
    return true;
  };

  const updateReviewMeeting: CustomerContextType['updateReviewMeeting'] = (
    customerId,
    yearOrDrillId,
    drillIdOrMeeting,
    maybeMeeting
  ): boolean => {
    let year: number | undefined = undefined;
    let drillId: string;
    let meeting: any;

    if (typeof yearOrDrillId === 'number') {
      year = yearOrDrillId;
      drillId = drillIdOrMeeting as string;
      meeting = maybeMeeting;
    } else {
      drillId = yearOrDrillId as string;
      meeting = drillIdOrMeeting;
    }

    const target = allCustomers.find((c) => c.id === customerId);
    if (!target || !canUserMutateCustomer(target, currentUser)) {
      return false;
    }

    // Auto locate year if omitted or invalid
    if (year === undefined || !target.annualPlans[year]) {
      for (const y in target.annualPlans) {
        if (target.annualPlans[y]?.drills?.some((d) => d.id === drillId)) {
          year = Number(y);
          break;
        }
      }
      if (year === undefined) {
        year = target.currentYear || 2026;
      }
    }

    const targetYear = year;

    setAllCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;
        const currentPlan = c.annualPlans[targetYear];
        if (!currentPlan) return c;

        const updatedDrills = currentPlan.drills.map((d) => {
          if (d.id !== drillId) return d;
          return {
            ...d,
            reviewMeeting: {
              ...d.reviewMeeting,
              ...meeting,
            },
          };
        });

        return {
          ...c,
          updatedAt: new Date().toISOString(),
          annualPlans: {
            ...c.annualPlans,
            [targetYear]: {
              ...currentPlan,
              drills: updatedDrills,
            },
          },
        };
      })
    );
    return true;
  };

  const createNewYearPlan: CustomerContextType['createNewYearPlan'] = (
    customerId,
    newYear,
    startDate,
    annualRequirement,
    intervalMonths,
    defaultDrillType = 'Phishing Email Simulation',
    notes
  ): boolean => {
    const target = allCustomers.find((c) => c.id === customerId);
    if (!target || !canUserMutateCustomer(target, currentUser)) {
      return false;
    }

    setAllCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;

        const generatedDrills = generateAnnualTimeline(
          startDate,
          annualRequirement,
          intervalMonths,
          defaultDrillType
        );

        return {
          ...c,
          currentYear: newYear,
          updatedAt: new Date().toISOString(),
          annualPlans: {
            ...c.annualPlans,
            [newYear]: {
              year: newYear,
              annualRequirement,
              startDate,
              intervalMonths,
              defaultDrillType,
              drills: generatedDrills,
              notes,
            },
          },
        };
      })
    );
    return true;
  };

  const addLmsDeliverable: CustomerContextType['addLmsDeliverable'] = (customerId, year, data) => {
    const target = allCustomers.find((c) => c.id === customerId);
    if (!target || !canUserMutateCustomer(target, currentUser)) {
      return null;
    }
    const currentPlan = target.annualPlans[year];
    if (!currentPlan) return null;

    const newId = `del-${customerId}-${year}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newDeliverable: LmsDeliverable = {
      id: newId,
      title: data.title,
      frequency: data.frequency,
      plannedDate: data.plannedDate,
      targetAudience: data.targetAudience,
      notes: data.notes,
      status: 'Upcoming',
    };
    newDeliverable.status = computeDeliverableStatus(newDeliverable, referenceDate, dueSoonDays);

    const updatedDeliverables = [...(currentPlan.deliverables || []), newDeliverable];

    setAllCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;
        const plan = c.annualPlans[year];
        if (!plan) return c;
        return {
          ...c,
          updatedAt: new Date().toISOString(),
          annualPlans: {
            ...c.annualPlans,
            [year]: {
              ...plan,
              deliverables: updatedDeliverables,
            },
          },
        };
      })
    );

    return newDeliverable;
  };

  const updateLmsDeliverable: CustomerContextType['updateLmsDeliverable'] = (customerId, year, deliverableId, partial) => {
    const target = allCustomers.find((c) => c.id === customerId);
    if (!target || !canUserMutateCustomer(target, currentUser)) {
      return false;
    }
    const currentPlan = target.annualPlans[year];
    if (!currentPlan || !currentPlan.deliverables) return false;

    const updatedDeliverables = currentPlan.deliverables.map((d) => {
      if (d.id !== deliverableId) return d;
      const updated = { ...d, ...partial };
      updated.status = computeDeliverableStatus(updated, referenceDate, dueSoonDays);
      return updated;
    });

    setAllCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;
        const plan = c.annualPlans[year];
        if (!plan) return c;
        return {
          ...c,
          updatedAt: new Date().toISOString(),
          annualPlans: {
            ...c.annualPlans,
            [year]: {
              ...plan,
              deliverables: updatedDeliverables,
            },
          },
        };
      })
    );
    return true;
  };

  const deleteLmsDeliverable: CustomerContextType['deleteLmsDeliverable'] = (customerId, year, deliverableId) => {
    const target = allCustomers.find((c) => c.id === customerId);
    if (!target || !canUserMutateCustomer(target, currentUser)) {
      return false;
    }
    const currentPlan = target.annualPlans[year];
    if (!currentPlan || !currentPlan.deliverables) return false;

    const updatedDeliverables = currentPlan.deliverables.filter((d) => d.id !== deliverableId);

    setAllCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;
        const plan = c.annualPlans[year];
        if (!plan) return c;
        return {
          ...c,
          updatedAt: new Date().toISOString(),
          annualPlans: {
            ...c.annualPlans,
            [year]: {
              ...plan,
              deliverables: updatedDeliverables,
            },
          },
        };
      })
    );
    return true;
  };

  const markDeliverableCompleted: CustomerContextType['markDeliverableCompleted'] = (customerId, year, deliverableId, completionData) => {
    const target = allCustomers.find((c) => c.id === customerId);
    if (!target || !canUserMutateCustomer(target, currentUser)) {
      return false;
    }
    const currentPlan = target.annualPlans[year];
    if (!currentPlan || !currentPlan.deliverables) return false;

    const updatedDeliverables = currentPlan.deliverables.map((d) => {
      if (d.id !== deliverableId) return d;
      const isLate = completionData.actualCompletionDate > d.plannedDate;
      const status = isLate ? 'Completed Late' : 'Completed';
      return {
        ...d,
        ...completionData,
        status,
      };
    });

    setAllCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;
        const plan = c.annualPlans[year];
        if (!plan) return c;
        return {
          ...c,
          updatedAt: new Date().toISOString(),
          annualPlans: {
            ...c.annualPlans,
            [year]: {
              ...plan,
              deliverables: updatedDeliverables,
            },
          },
        };
      })
    );
    return true;
  };

  const resetToDemoData = () => {
    setAllCustomers(INITIAL_CUSTOMERS);
    setUsers(INITIAL_USERS);
    setCurrentUserIdState(INITIAL_USERS[0].id);
    setSelectedCustomerIdState(null);
    setReferenceDate(SYSTEM_TODAY);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CUSTOMERS));
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      localStorage.setItem(CURRENT_USER_KEY, INITIAL_USERS[0].id);
      localStorage.setItem(DATE_STORAGE_KEY, SYSTEM_TODAY);
    } catch {
      // ignore
    }
  };

  const exportDataJSON = () => {
    return JSON.stringify({ customers: allCustomers, users }, null, 2);
  };

  const importDataJSON = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        setAllCustomers(parsed);
        return true;
      } else if (parsed && Array.isArray(parsed.customers)) {
        setAllCustomers(parsed.customers);
        if (Array.isArray(parsed.users)) {
          setUsers(parsed.users);
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to import JSON data', e);
      return false;
    }
  };

  return (
    <CustomerContext.Provider
      value={{
        customers,
        allCustomers,
        selectedCustomerId,
        setSelectedCustomerId,
        referenceDate,
        setReferenceDate,
        dueSoonDays,
        setDueSoonDays,
        users,
        currentUser,
        setCurrentUserId,
        addCsmUser,
        updateCsmUser,
        toggleCsmStatus,
        assignCustomerCsm,
        canUserAccessCustomer,
        canUserMutateCustomer,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        markDrillCompleted,
        updateDrillSchedule,
        updateReviewMeeting,
        createNewYearPlan,
        addLmsDeliverable,
        updateLmsDeliverable,
        deleteLmsDeliverable,
        markDeliverableCompleted,
        resetToDemoData,
        exportDataJSON,
        importDataJSON,
        lastSentEmail,
        clearLastSentEmail,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomerContext = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomerContext must be used within a CustomerProvider');
  }
  return context;
};

