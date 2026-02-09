import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { Group, Member, Collection, MemberSummary, GroupSummary, OverallSummary, WeeklyData } from '@/types';
import { API_BASE } from '@/config/api';

interface DataContextType {
  groups: Group[];
  members: Member[];
  collections: Collection[];
  loading: boolean;
  error: string | null;
  addGroup: (group: Omit<Group, 'id'>) => Promise<void>;
  updateGroup: (id: string, group: Partial<Group>) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  addMember: (member: Omit<Member, 'id'>) => Promise<void>;
  updateMember: (id: string, member: Partial<Member>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  addCollection: (collection: Omit<Collection, 'id' | 'principalPaid' | 'interestPaid'>) => Promise<void>;
  updateCollection: (id: string, collection: Partial<Collection>) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  getMemberSummary: (memberId: string) => MemberSummary | null;
  getAllMemberSummaries: () => MemberSummary[];
  getGroupSummary: (groupNo: string) => GroupSummary | null;
  getAllGroupSummaries: () => GroupSummary[];
  getOverallSummary: () => OverallSummary;
  getWeeklyData: () => WeeklyData[];
  getCollectionsForWeek: (weekNo: number) => Collection[];
  getExpectedCollectionsForWeek: (weekNo: number) => MemberSummary[];
  exportToJSON: () => string;
  importFromJSON: (json: string) => Promise<void>;
  clearAllData: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data from backend
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [groupsRes, membersRes, collectionsRes] = await Promise.all([
        fetch(`${API_BASE}/groups`),
        fetch(`${API_BASE}/members`),
        fetch(`${API_BASE}/collections`)
      ]);

      if (!groupsRes.ok || !membersRes.ok || !collectionsRes.ok) {
        throw new Error('Failed to fetch data from server');
      }

      const [groupsData, membersData, collectionsData] = await Promise.all([
        groupsRes.json(),
        membersRes.json(),
        collectionsRes.json()
      ]);

      setGroups(groupsData);
      setMembers(membersData);
      setCollections(collectionsData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshData = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Group operations
  const addGroup = useCallback(async (group: Omit<Group, 'id'>) => {
    try {
      const res = await fetch(`${API_BASE}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(group)
      });
      if (!res.ok) throw new Error('Failed to add group');
      const newGroup = await res.json();
      setGroups(prev => [...prev, newGroup]);
    } catch (err) {
      console.error('Error adding group:', err);
      throw err;
    }
  }, []);

  const updateGroup = useCallback(async (id: string, group: Partial<Group>) => {
    try {
      const res = await fetch(`${API_BASE}/groups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(group)
      });
      if (!res.ok) throw new Error('Failed to update group');
      const updatedGroup = await res.json();
      setGroups(prev => prev.map(g => g.id === id ? updatedGroup : g));
    } catch (err) {
      console.error('Error updating group:', err);
      throw err;
    }
  }, []);

  const deleteGroup = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/groups/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete group');
      setGroups(prev => prev.filter(g => g.id !== id));
    } catch (err) {
      console.error('Error deleting group:', err);
      throw err;
    }
  }, []);

  // Member operations
  const addMember = useCallback(async (member: Omit<Member, 'id'>) => {
    try {
      const res = await fetch(`${API_BASE}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(member)
      });
      if (!res.ok) throw new Error('Failed to add member');
      const newMember = await res.json();
      setMembers(prev => [...prev, newMember]);
    } catch (err) {
      console.error('Error adding member:', err);
      throw err;
    }
  }, []);

  const updateMember = useCallback(async (id: string, member: Partial<Member>) => {
    try {
      const res = await fetch(`${API_BASE}/members/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(member)
      });
      if (!res.ok) throw new Error('Failed to update member');
      const updatedMember = await res.json();
      setMembers(prev => prev.map(m => m.id === id ? updatedMember : m));
    } catch (err) {
      console.error('Error updating member:', err);
      throw err;
    }
  }, []);

  const deleteMember = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/members/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete member');
      setMembers(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error('Error deleting member:', err);
      throw err;
    }
  }, []);

  // Collection operations - backend auto-calculates principal/interest
  const addCollection = useCallback(async (collection: Omit<Collection, 'id' | 'principalPaid' | 'interestPaid'>) => {
    try {
      const res = await fetch(`${API_BASE}/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(collection)
      });
      if (!res.ok) throw new Error('Failed to add collection');
      const newCollection = await res.json();
      setCollections(prev => [...prev, newCollection]);
    } catch (err) {
      console.error('Error adding collection:', err);
      throw err;
    }
  }, []);

  const updateCollection = useCallback(async (id: string, collection: Partial<Collection>) => {
    try {
      const res = await fetch(`${API_BASE}/collections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(collection)
      });
      if (!res.ok) throw new Error('Failed to update collection');
      const updatedCollection = await res.json();
      setCollections(prev => prev.map(c => c.id === id ? updatedCollection : c));
    } catch (err) {
      console.error('Error updating collection:', err);
      throw err;
    }
  }, []);

  const deleteCollection = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/collections/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete collection');
      setCollections(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting collection:', err);
      throw err;
    }
  }, []);

  // Summary calculations (computed locally from fetched data)
  const getMemberSummary = useCallback((memberId: string): MemberSummary | null => {
    const member = members.find(m => m.memberId === memberId);
    if (!member) return null;

    const memberCollections = collections.filter(c => c.memberId === memberId);
    const totalPrincipalCollected = memberCollections.reduce((sum, c) => sum + c.principalPaid, 0);
    const totalInterestCollected = memberCollections.reduce((sum, c) => sum + c.interestPaid, 0);
    const totalPayable = member.loanAmount + member.totalInterest;

    return {
      memberId: member.memberId,
      memberName: member.memberName,
      groupNo: member.groupNo,
      loanAmount: member.loanAmount,
      totalPayable,
      totalPrincipalCollected,
      totalInterestCollected,
      principalBalance: member.loanAmount - totalPrincipalCollected,
      interestBalance: member.totalInterest - totalInterestCollected,
      totalCollected: totalPrincipalCollected + totalInterestCollected,
      totalBalance: totalPayable - (totalPrincipalCollected + totalInterestCollected),
      weeksPaid: memberCollections.length,
      status: member.status
    };
  }, [members, collections]);

  const getAllMemberSummaries = useCallback((): MemberSummary[] => {
    return members.map(m => getMemberSummary(m.memberId)).filter((s): s is MemberSummary => s !== null);
  }, [members, getMemberSummary]);

  const getGroupSummary = useCallback((groupNo: string): GroupSummary | null => {
    const group = groups.find(g => g.groupNo === groupNo);
    if (!group) return null;

    const groupMembers = members.filter(m => m.groupNo === groupNo);
    const groupCollections = collections.filter(c => c.groupNo === groupNo);

    const totalLoanAmount = groupMembers.reduce((sum, m) => sum + m.loanAmount, 0);
    const totalInterestAmount = groupMembers.reduce((sum, m) => sum + m.totalInterest, 0);
    const totalPayable = totalLoanAmount + totalInterestAmount;

    const principalCollected = groupCollections.reduce((sum, c) => sum + c.principalPaid, 0);
    const interestCollected = groupCollections.reduce((sum, c) => sum + c.interestPaid, 0);
    const totalCollected = principalCollected + interestCollected;

    return {
      groupNo: group.groupNo,
      groupName: group.groupName,
      groupHead: group.groupHeadName,
      totalMembers: groupMembers.length,
      totalLoanAmount,
      totalPayable,
      principalCollected,
      interestCollected,
      principalBalance: totalLoanAmount - principalCollected,
      interestBalance: totalInterestAmount - interestCollected,
      totalCollected,
      totalBalance: totalPayable - totalCollected,
      collectionRate: totalPayable > 0 ? Math.round((totalCollected / totalPayable) * 10000) / 100 : 0
    };
  }, [groups, members, collections]);

  const getAllGroupSummaries = useCallback((): GroupSummary[] => {
    return groups.map(g => getGroupSummary(g.groupNo)).filter((s): s is GroupSummary => s !== null);
  }, [groups, getGroupSummary]);

  const getOverallSummary = useCallback((): OverallSummary => {
    const totalLoanDisbursed = members.reduce((sum, m) => sum + m.loanAmount, 0);
    const totalInterestAmount = members.reduce((sum, m) => sum + m.totalInterest, 0);
    const totalPayable = totalLoanDisbursed + totalInterestAmount;

    const totalPrincipalCollected = collections.reduce((sum, c) => sum + c.principalPaid, 0);
    const totalInterestCollected = collections.reduce((sum, c) => sum + c.interestPaid, 0);
    const totalAmountCollected = totalPrincipalCollected + totalInterestCollected;

    const activeLoans = members.filter(m => m.status === 'Active').length;
    const completedLoans = members.filter(m => m.status === 'Completed').length;

    return {
      totalGroups: groups.length,
      totalMembers: members.length,
      activeLoans,
      completedLoans,
      totalLoanDisbursed,
      totalPayable,
      totalPrincipalCollected,
      totalInterestCollected,
      totalAmountCollected,
      principalBalanceOutstanding: totalLoanDisbursed - totalPrincipalCollected,
      interestBalanceOutstanding: totalInterestAmount - totalInterestCollected,
      totalBalanceOutstanding: totalPayable - totalAmountCollected,
      overallCollectionRate: totalPayable > 0 ? Math.round((totalAmountCollected / totalPayable) * 10000) / 100 : 0,
      principalRecoveryRate: totalLoanDisbursed > 0 ? Math.round((totalPrincipalCollected / totalLoanDisbursed) * 10000) / 100 : 0,
      interestRecoveryRate: totalInterestAmount > 0 ? Math.round((totalInterestCollected / totalInterestAmount) * 10000) / 100 : 0,
      averageLoanSize: members.length > 0 ? Math.round((totalLoanDisbursed / members.length) * 100) / 100 : 0
    };
  }, [groups, members, collections]);

  const getWeeklyData = useCallback((): WeeklyData[] => {
    const maxWeek = Math.max(...collections.map(c => c.weekNo), 0);
    const weeklyData: WeeklyData[] = [];

    for (let weekNo = 1; weekNo <= maxWeek; weekNo++) {
      const weekCollections = collections.filter(c => c.weekNo === weekNo);
      weeklyData.push({
        weekNo,
        amountCollected: weekCollections.reduce((sum, c) => sum + c.amountPaid, 0),
        numberOfPayments: weekCollections.length
      });
    }

    return weeklyData;
  }, [collections]);

  const getCollectionsForWeek = useCallback((weekNo: number): Collection[] => {
    return collections.filter(c => c.weekNo === weekNo);
  }, [collections]);

  const getExpectedCollectionsForWeek = useCallback((_weekNo: number): MemberSummary[] => {
    const allSummaries = getAllMemberSummaries();
    return allSummaries.filter(summary => {
      const member = members.find(m => m.memberId === summary.memberId);
      if (!member) return false;
      return summary.weeksPaid < member.weeks && member.status === 'Active';
    });
  }, [getAllMemberSummaries, members]);

  // Export/Import
  const exportToJSON = useCallback((): string => {
    return JSON.stringify({ groups, members, collections }, null, 2);
  }, [groups, members, collections]);

  const importFromJSON = useCallback(async (json: string) => {
    try {
      const data = JSON.parse(json);
      const res = await fetch(`${API_BASE}/data/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to import data');
      await fetchData(); // Refresh data after import
    } catch (err) {
      console.error('Failed to import data:', err);
      throw err;
    }
  }, [fetchData]);

  const clearAllData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/data/clear`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to clear data');
      setGroups([]);
      setMembers([]);
      setCollections([]);
    } catch (err) {
      console.error('Failed to clear data:', err);
      throw err;
    }
  }, []);

  const value = useMemo(() => ({
    groups,
    members,
    collections,
    loading,
    error,
    addGroup,
    updateGroup,
    deleteGroup,
    addMember,
    updateMember,
    deleteMember,
    addCollection,
    updateCollection,
    deleteCollection,
    getMemberSummary,
    getAllMemberSummaries,
    getGroupSummary,
    getAllGroupSummaries,
    getOverallSummary,
    getWeeklyData,
    getCollectionsForWeek,
    getExpectedCollectionsForWeek,
    exportToJSON,
    importFromJSON,
    clearAllData,
    refreshData
  }), [
    groups, members, collections, loading, error,
    addGroup, updateGroup, deleteGroup,
    addMember, updateMember, deleteMember,
    addCollection, updateCollection, deleteCollection,
    getMemberSummary, getAllMemberSummaries,
    getGroupSummary, getAllGroupSummaries,
    getOverallSummary, getWeeklyData,
    getCollectionsForWeek, getExpectedCollectionsForWeek,
    exportToJSON, importFromJSON, clearAllData, refreshData
  ]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
