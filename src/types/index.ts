// Microfinance Management System - Types

export interface Group {
  id: string;
  groupNo: string;
  groupName: string;
  groupHeadName: string;
  headContact: string;
  meetingDay: string;
  formationDate: string;
}

export interface Member {
  id: string;
  memberId: string;
  memberName: string;
  address: string;
  landmark: string;
  groupNo: string;
  loanAmount: number;
  totalInterest: number;
  weeks: number;
  startDate: string;
  status: 'Active' | 'Completed' | 'Defaulted';
  notes?: string;
}

export interface Collection {
  id: string;
  collectionDate: string;
  memberId: string;
  groupNo: string;
  weekNo: number;
  amountPaid: number;
  principalPaid: number;
  interestPaid: number;
  status: 'Paid' | 'Partial' | 'Pending';
  collectedBy: string;
}

export interface MemberSummary {
  memberId: string;
  memberName: string;
  groupNo: string;
  loanAmount: number;
  totalPayable: number;
  totalPrincipalCollected: number;
  totalInterestCollected: number;
  principalBalance: number;
  interestBalance: number;
  totalCollected: number;
  totalBalance: number;
  weeksPaid: number;
  status: string;
}

export interface GroupSummary {
  groupNo: string;
  groupName: string;
  groupHead: string;
  totalMembers: number;
  totalLoanAmount: number;
  totalPayable: number;
  principalCollected: number;
  interestCollected: number;
  principalBalance: number;
  interestBalance: number;
  totalCollected: number;
  totalBalance: number;
  collectionRate: number;
}

export interface OverallSummary {
  totalGroups: number;
  totalMembers: number;
  activeLoans: number;
  completedLoans: number;
  totalLoanDisbursed: number;
  totalPayable: number;
  totalPrincipalCollected: number;
  totalInterestCollected: number;
  totalAmountCollected: number;
  principalBalanceOutstanding: number;
  interestBalanceOutstanding: number;
  totalBalanceOutstanding: number;
  overallCollectionRate: number;
  principalRecoveryRate: number;
  interestRecoveryRate: number;
  averageLoanSize: number;
}

export interface WeeklyData {
  weekNo: number;
  amountCollected: number;
  numberOfPayments: number;
}

export type ViewType = 'dashboard' | 'groups' | 'members' | 'collections' | 'memberSummary' | 'groupSummary' | 'overallSummary';
