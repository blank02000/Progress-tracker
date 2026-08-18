/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { CustomerProvider, useCustomerContext } from './context/CustomerContext';
import { NavTab } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { DashboardView } from './components/DashboardView';
import { CustomerListView } from './components/CustomerListView';
import { CustomerDetailView } from './components/CustomerDetailView';
import { CalendarView } from './components/CalendarView';
import { RemindersView } from './components/RemindersView';
import { AnnualReportView } from './components/AnnualReportView';
import { ReviewsView } from './components/ReviewsView';
import { CsmManagementView } from './components/CsmManagementView';
import { SettingsView } from './components/SettingsView';

import { CreateCustomerModal } from './components/modals/CreateCustomerModal';
import { CompleteDrillModal } from './components/modals/CompleteDrillModal';
import { EditDrillModal } from './components/modals/EditDrillModal';
import { ReviewMeetingModal } from './components/modals/ReviewMeetingModal';
import { NewYearPlanModal } from './components/modals/NewYearPlanModal';
import { CreateEditDeliverableModal } from './components/modals/CreateEditDeliverableModal';
import { CompleteDeliverableModal } from './components/modals/CompleteDeliverableModal';
import { Customer, DrillRecord, ReviewMeeting, LmsDeliverable } from './types';
import { generateReminders } from './utils/drillCalculator';

function AppContent() {
  const {
    customers,
    currentUser,
    selectedCustomerId,
    setSelectedCustomerId,
    referenceDate,
    dueSoonDays,
    addCustomer,
    markDrillCompleted,
    updateDrillSchedule,
    updateReviewMeeting,
    createNewYearPlan,
    deleteLmsDeliverable,
  } = useCustomerContext();

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  const urgentAlertsCount = useMemo(() => {
    const reminders = generateReminders(customers, referenceDate, dueSoonDays);
    return reminders.filter((r) => r.severity === 'high' || r.severity === 'medium').length;
  }, [customers, referenceDate, dueSoonDays]);

  // Modal States
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false);

  const [completeDrillState, setCompleteDrillState] = useState<{
    isOpen: boolean;
    customer: Customer | null;
    drill: DrillRecord | null;
  }>({
    isOpen: false,
    customer: null,
    drill: null,
  });

  const [editDrillState, setEditDrillState] = useState<{
    isOpen: boolean;
    customer: Customer | null;
    drill: DrillRecord | null;
  }>({
    isOpen: false,
    customer: null,
    drill: null,
  });

  const [reviewMeetingState, setReviewMeetingState] = useState<{
    isOpen: boolean;
    customer: Customer | null;
    drill: DrillRecord | null;
  }>({
    isOpen: false,
    customer: null,
    drill: null,
  });

  const [newYearPlanState, setNewYearPlanState] = useState<{
    isOpen: boolean;
    customer: Customer | null;
    currentYear: number;
  }>({
    isOpen: false,
    customer: null,
    currentYear: 2026,
  });

  const [reportParams, setReportParams] = useState<{
    customerId?: string;
    year?: number;
  }>({});

  const [deliverableModalState, setDeliverableModalState] = useState<{
    isOpen: boolean;
    customer: Customer | null;
    deliverable: LmsDeliverable | null;
    selectedYear: number;
  }>({
    isOpen: false,
    customer: null,
    deliverable: null,
    selectedYear: 2026,
  });

  const [completeDeliverableState, setCompleteDeliverableState] = useState<{
    isOpen: boolean;
    customer: Customer | null;
    deliverable: LmsDeliverable | null;
    selectedYear: number;
  }>({
    isOpen: false,
    customer: null,
    deliverable: null,
    selectedYear: 2026,
  });

  // Handlers
  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setActiveTab('customers');
  };

  const handleOpenCompleteDrill = (customer: Customer, drill: DrillRecord) => {
    setCompleteDrillState({
      isOpen: true,
      customer,
      drill,
    });
  };

  const handleOpenEditDrill = (customer: Customer, drill: DrillRecord) => {
    setEditDrillState({
      isOpen: true,
      customer,
      drill,
    });
  };

  const handleOpenReviewMeeting = (customer: Customer, drill: DrillRecord) => {
    setReviewMeetingState({
      isOpen: true,
      customer,
      drill,
    });
  };

  const handleOpenNewYearPlan = (customer: Customer, currentYear: number) => {
    setNewYearPlanState({
      isOpen: true,
      customer,
      currentYear,
    });
  };

  const handleOpenAddDeliverable = (customer: Customer, year: number) => {
    setDeliverableModalState({
      isOpen: true,
      customer,
      deliverable: null,
      selectedYear: year,
    });
  };

  const handleOpenEditDeliverable = (customer: Customer, deliverable: LmsDeliverable) => {
    const year = Object.keys(customer.annualPlans).map(Number).find(yr => 
      customer.annualPlans[yr].deliverables?.some(d => d.id === deliverable.id)
    ) || customer.currentYear || 2026;

    setDeliverableModalState({
      isOpen: true,
      customer,
      deliverable,
      selectedYear: year,
    });
  };

  const handleOpenCompleteDeliverable = (customer: Customer, deliverable: LmsDeliverable) => {
    const year = Object.keys(customer.annualPlans).map(Number).find(yr => 
      customer.annualPlans[yr].deliverables?.some(d => d.id === deliverable.id)
    ) || customer.currentYear || 2026;

    setCompleteDeliverableState({
      isOpen: true,
      customer,
      deliverable,
      selectedYear: year,
    });
  };

  const handleDeleteDeliverable = (customer: Customer, year: number, deliverableId: string) => {
    if (window.confirm('Are you sure you want to delete this Pro LMS deliverable?')) {
      deleteLmsDeliverable(customer.id, year, deliverableId);
    }
  };

  const handleViewAnnualReport = (customerId: string, year: number) => {
    setReportParams({ customerId, year });
    setActiveTab('reports');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans antialiased text-slate-900 overflow-hidden">
      {/* Left Icon Navigation Rail */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab !== 'customers') setSelectedCustomerId(null);
          setActiveTab(tab);
        }}
        urgentAlertsCount={urgentAlertsCount}
      />

      {/* Main View Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header Bar with Breadcrumbs & Simulation Controls */}
        <TopHeader
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab !== 'customers') setSelectedCustomerId(null);
            setActiveTab(tab);
          }}
          onOpenCreateCustomer={() => setIsCreateCustomerOpen(true)}
        />

        {/* Scrollable Main Stage */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70">
          <div className="max-w-7xl mx-auto">
            {/* Render Customer Detail if selected */}
            {selectedCustomerId && activeTab === 'customers' ? (
              <CustomerDetailView
                customerId={selectedCustomerId}
                onBack={() => setSelectedCustomerId(null)}
                onOpenCompleteDrill={handleOpenCompleteDrill}
                onOpenEditDrill={handleOpenEditDrill}
                onOpenReviewMeeting={handleOpenReviewMeeting}
                onOpenNewYearPlan={handleOpenNewYearPlan}
                onViewAnnualReport={handleViewAnnualReport}
                onOpenAddDeliverable={handleOpenAddDeliverable}
                onOpenEditDeliverable={handleOpenEditDeliverable}
                onOpenCompleteDeliverable={handleOpenCompleteDeliverable}
                onDeleteDeliverable={handleDeleteDeliverable}
              />
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <DashboardView
                    onSelectCustomer={handleSelectCustomer}
                    onOpenCreateCustomer={() => setIsCreateCustomerOpen(true)}
                    onMarkDrillComplete={handleOpenCompleteDrill}
                    onNavigateTab={(tab) => {
                      if (tab === 'customers') setSelectedCustomerId(null);
                      setActiveTab(tab);
                    }}
                  />
                )}

                {activeTab === 'customers' && (
                  <CustomerListView
                    onSelectCustomer={handleSelectCustomer}
                    onOpenCreateCustomer={() => setIsCreateCustomerOpen(true)}
                    onMarkDrillComplete={handleOpenCompleteDrill}
                  />
                )}

                {activeTab === 'calendar' && (
                  <CalendarView
                    onSelectCustomer={handleSelectCustomer}
                    onMarkDrillComplete={handleOpenCompleteDrill}
                  />
                )}

                {activeTab === 'reviews' && (
                  <ReviewsView
                    onSelectCustomer={handleSelectCustomer}
                    onOpenReviewMeeting={handleOpenReviewMeeting}
                  />
                )}

                {activeTab === 'reminders' && (
                  <RemindersView
                    onSelectCustomer={handleSelectCustomer}
                    onMarkDrillComplete={handleOpenCompleteDrill}
                  />
                )}

                {activeTab === 'reports' && (
                  <AnnualReportView
                    initialCustomerId={reportParams.customerId}
                    initialYear={reportParams.year}
                    onSelectCustomer={handleSelectCustomer}
                  />
                )}

                {activeTab === 'team' && (
                  <CsmManagementView
                    onSelectCustomer={handleSelectCustomer}
                  />
                )}

                {activeTab === 'settings' && <SettingsView />}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <CreateCustomerModal
        isOpen={isCreateCustomerOpen}
        onClose={() => setIsCreateCustomerOpen(false)}
        onSubmit={(data) => {
          const newCust = addCustomer(data);
          handleSelectCustomer(newCust.id);
        }}
      />

      <CompleteDrillModal
        isOpen={completeDrillState.isOpen}
        onClose={() => setCompleteDrillState({ isOpen: false, customer: null, drill: null })}
        customer={completeDrillState.customer}
        drill={completeDrillState.drill}
        onSubmit={(results) => {
          if (completeDrillState.customer && completeDrillState.drill) {
            markDrillCompleted(
              completeDrillState.customer.id,
              completeDrillState.drill.id,
              results
            );
          }
        }}
      />

      <EditDrillModal
        isOpen={editDrillState.isOpen}
        onClose={() => setEditDrillState({ isOpen: false, customer: null, drill: null })}
        customer={editDrillState.customer}
        drill={editDrillState.drill}
        onSubmit={(drillData) => {
          if (editDrillState.customer && editDrillState.drill) {
            updateDrillSchedule(
              editDrillState.customer.id,
              editDrillState.drill.id,
              drillData
            );
          }
        }}
      />

      <ReviewMeetingModal
        isOpen={reviewMeetingState.isOpen}
        onClose={() => setReviewMeetingState({ isOpen: false, customer: null, drill: null })}
        customer={reviewMeetingState.customer}
        drill={reviewMeetingState.drill}
        onSubmit={(meetingData) => {
          if (reviewMeetingState.customer && reviewMeetingState.drill) {
            updateReviewMeeting(
              reviewMeetingState.customer.id,
              reviewMeetingState.drill.id,
              meetingData
            );
          }
        }}
      />

      <NewYearPlanModal
        isOpen={newYearPlanState.isOpen}
        onClose={() => setNewYearPlanState({ isOpen: false, customer: null, currentYear: 2026 })}
        customer={newYearPlanState.customer}
        currentYear={newYearPlanState.currentYear}
        onSubmit={(year, startDate, annualRequirement, intervalMonths, defaultDrillType, notes) => {
          if (newYearPlanState.customer) {
            createNewYearPlan(
              newYearPlanState.customer.id,
              year,
              startDate,
              annualRequirement,
              intervalMonths,
              defaultDrillType,
              notes
            );
          }
        }}
      />

      <CreateEditDeliverableModal
        isOpen={deliverableModalState.isOpen}
        onClose={() => setDeliverableModalState({ isOpen: false, customer: null, deliverable: null, selectedYear: 2026 })}
        customer={deliverableModalState.customer}
        deliverable={deliverableModalState.deliverable}
        selectedYear={deliverableModalState.selectedYear}
      />

      <CompleteDeliverableModal
        isOpen={completeDeliverableState.isOpen}
        onClose={() => setCompleteDeliverableState({ isOpen: false, customer: null, deliverable: null, selectedYear: 2026 })}
        customer={completeDeliverableState.customer}
        deliverable={completeDeliverableState.deliverable}
        selectedYear={completeDeliverableState.selectedYear}
      />
    </div>
  );
}

export default function App() {
  return (
    <CustomerProvider>
      <AppContent />
    </CustomerProvider>
  );
}
