import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { Group, Member, Collection, Pending, MemberSummary, GroupSummary, OverallSummary, WeeklyData, DueCollection } from '@/types';
import { supabase } from '@/config/supabase';
import { v4 as uuidv4 } from 'uuid';

interface DataContextType {
  groups: Group[];
  members: Member[];
  collections: Collection[];
  pendings: Pending[];
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
  getDueCollections: (date: Date) => Promise<DueCollection[]>;
  submitBulkCollection: (payments: any[]) => Promise<void>;
  bulkUpsertPendings: (pendings: any[]) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper: convert snake_case DB row to camelCase
function toCamelCase(row: any) {
  if (!row) return null;
  const result: any = {};
  for (const key in row) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = row[key];
  }
  return result;
}

// Helper: convert camelCase object to snake_case for DB
function toSnakeCase(obj: any) {
  if (!obj) return null;
  const result: any = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    result[snakeKey] = obj[key];
  }
  return result;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [pendings, setPendings] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to ensure valid numbers
  const ensureNumber = (val: any) => {
    if (val === null || val === undefined || val === '') return 0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  // Fetch all data from Supabase
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [groupsRes, membersRes, collectionsRes, pendingsRes] = await Promise.all([
        supabase.from('groups').select('*').order('group_no'),
        supabase.from('members').select('*').order('member_id'),
        supabase.from('collections').select('*').order('week_no').order('collection_date'),
        supabase.from('pendings').select('*').order('week_no')
      ]);

      if (groupsRes.error) throw groupsRes.error;
      if (membersRes.error) throw membersRes.error;
      if (collectionsRes.error) throw collectionsRes.error;
      if (pendingsRes.error) throw pendingsRes.error;

      setGroups((groupsRes.data || []).map((r: any) => toCamelCase(r)!));

      // Parse numeric fields for members
      setMembers((membersRes.data || []).map((r: any) => {
        const m = toCamelCase(r)!;
        return {
          ...m,
          loanAmount: ensureNumber(m.loanAmount),
          totalInterest: ensureNumber(m.totalInterest),
          weeks: ensureNumber(m.weeks)
        };
      }));

      // Parse numeric fields for collections
      setCollections((collectionsRes.data || []).map((r: any) => {
        const c = toCamelCase(r)!;
        return {
          ...c,
          weekNo: ensureNumber(c.weekNo),
          amountPaid: ensureNumber(c.amountPaid),
          principalPaid: ensureNumber(c.principalPaid),
          interestPaid: ensureNumber(c.interestPaid)
        };
      }));

      // Parse pendings
      setPendings((pendingsRes.data || []).map((r: any) => {
        const p = toCamelCase(r)!;
        return {
          ...p,
          weekNo: ensureNumber(p.weekNo),
          amount: ensureNumber(p.amount)
        };
      }));
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to connect to Supabase');
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

  // ============== GROUP OPERATIONS ==============

  const addGroup = useCallback(async (group: Omit<Group, 'id'>) => {
    try {
      const id = uuidv4();
      const dbRow = toSnakeCase({ id, ...group });
      const { error: err } = await supabase.from('groups').insert(dbRow);
      if (err) throw err;
      setGroups(prev => [...prev, { id, ...group } as Group]);
    } catch (err: any) {
      console.error('Error adding group:', err);
      throw err;
    }
  }, []);

  const updateGroup = useCallback(async (id: string, group: Partial<Group>) => {
    try {
      const dbRow = toSnakeCase(group);
      const { error: err } = await supabase.from('groups').update(dbRow).eq('id', id);
      if (err) throw err;
      setGroups(prev => prev.map(g => g.id === id ? { ...g, ...group } : g));
    } catch (err: any) {
      console.error('Error updating group:', err);
      throw err;
    }
  }, []);

  const deleteGroup = useCallback(async (id: string) => {
    try {
      const { error: err } = await supabase.from('groups').delete().eq('id', id);
      if (err) throw err;
      setGroups(prev => prev.filter(g => g.id !== id));
    } catch (err: any) {
      console.error('Error deleting group:', err);
      throw err;
    }
  }, []);

  // ============== MEMBER OPERATIONS ==============

  const addMember = useCallback(async (member: Omit<Member, 'id'>) => {
    try {
      const id = uuidv4();
      const dbRow = toSnakeCase({ id, ...member });
      const { error: err } = await supabase.from('members').insert(dbRow);
      if (err) throw err;
      setMembers(prev => [...prev, { id, ...member } as Member]);
    } catch (err: any) {
      console.error('Error adding member:', err);
      throw err;
    }
  }, []);

  const updateMember = useCallback(async (id: string, member: Partial<Member>) => {
    try {
      const dbRow = toSnakeCase(member);
      const { error: err } = await supabase.from('members').update(dbRow).eq('id', id);
      if (err) throw err;
      setMembers(prev => prev.map(m => m.id === id ? { ...m, ...member } : m));
    } catch (err: any) {
      console.error('Error updating member:', err);
      throw err;
    }
  }, []);

  const deleteMember = useCallback(async (id: string) => {
    try {
      const { error: err } = await supabase.from('members').delete().eq('id', id);
      if (err) throw err;
      setMembers(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      console.error('Error deleting member:', err);
      throw err;
    }
  }, []);

  // ============== COLLECTION OPERATIONS ==============

  const addCollection = useCallback(async (collection: Omit<Collection, 'id' | 'principalPaid' | 'interestPaid'>) => {
    try {
      const id = uuidv4();
      // Use the RPC function for auto principal/interest split
      const { data, error: err } = await supabase.rpc('insert_collection_auto_split', {
        p_id: id,
        p_collection_date: collection.collectionDate,
        p_member_id: collection.memberId,
        p_group_no: collection.groupNo,
        p_week_no: collection.weekNo,
        p_amount_paid: collection.amountPaid,
        p_status: collection.status,
        p_collected_by: collection.collectedBy
      });
      if (err) throw err;
      // Add the returned collection to state
      const newCollection = data || {
        id,
        ...collection,
        principalPaid: 0,
        interestPaid: 0
      };
      setCollections(prev => [...prev, typeof newCollection === 'object' ? newCollection : { id, ...collection, principalPaid: 0, interestPaid: 0 }]);
    } catch (err: any) {
      console.error('Error adding collection:', err);
      throw err;
    }
  }, []);

  const updateCollection = useCallback(async (id: string, collection: Partial<Collection>) => {
    try {
      const dbRow = toSnakeCase(collection);
      const { error: err } = await supabase.from('collections').update(dbRow).eq('id', id);
      if (err) throw err;
      setCollections(prev => prev.map(c => c.id === id ? { ...c, ...collection } : c));
    } catch (err: any) {
      console.error('Error updating collection:', err);
      throw err;
    }
  }, []);

  const deleteCollection = useCallback(async (id: string) => {
    try {
      const { error: err } = await supabase.from('collections').delete().eq('id', id);
      if (err) throw err;
      setCollections(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      console.error('Error deleting collection:', err);
      throw err;
    }
  }, []);

  // ============== SUMMARY CALCULATIONS (computed locally) ==============

  const getMemberSummary = useCallback((memberId: string): MemberSummary | null => {
    const member = members.find(m => m.memberId === memberId);
    if (!member) return null;

    const memberCollections = collections.filter(c => c.memberId === memberId);
    const totalPrincipalCollected = memberCollections.reduce((sum, c) => sum + ensureNumber(c.principalPaid), 0);
    const totalInterestCollected = memberCollections.reduce((sum, c) => sum + ensureNumber(c.interestPaid), 0);
    const totalPayable = ensureNumber(member.loanAmount) + ensureNumber(member.totalInterest);

    return {
      memberId: member.memberId,
      memberName: member.memberName,
      groupNo: member.groupNo,
      loanAmount: ensureNumber(member.loanAmount),
      totalPayable,
      totalPrincipalCollected,
      totalInterestCollected,
      principalBalance: ensureNumber(member.loanAmount) - totalPrincipalCollected,
      interestBalance: ensureNumber(member.totalInterest) - totalInterestCollected,
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

    const totalLoanAmount = groupMembers.reduce((sum, m) => sum + ensureNumber(m.loanAmount), 0);
    const totalInterestAmount = groupMembers.reduce((sum, m) => sum + ensureNumber(m.totalInterest), 0);
    const totalPayable = totalLoanAmount + totalInterestAmount;

    const principalCollected = groupCollections.reduce((sum, c) => sum + ensureNumber(c.principalPaid), 0);
    const interestCollected = groupCollections.reduce((sum, c) => sum + ensureNumber(c.interestPaid), 0);
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
    const totalLoanDisbursed = members.reduce((sum, m) => sum + ensureNumber(m.loanAmount), 0);
    const totalInterestAmount = members.reduce((sum, m) => sum + ensureNumber(m.totalInterest), 0);
    const totalPayable = totalLoanDisbursed + totalInterestAmount;

    const totalPrincipalCollected = collections.reduce((sum, c) => sum + ensureNumber(c.principalPaid), 0);
    const totalInterestCollected = collections.reduce((sum, c) => sum + ensureNumber(c.interestPaid), 0);
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
        amountCollected: weekCollections.reduce((sum, c) => sum + ensureNumber(c.amountPaid), 0),
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

  // ============== EXPORT/IMPORT ==============

  const exportToJSON = useCallback((): string => {
    return JSON.stringify({ groups, members, collections, pendings }, null, 2);
  }, [groups, members, collections, pendings]);

  const importFromJSON = useCallback(async (json: string) => {
    try {
      const data = JSON.parse(json);

      // Import groups
      if (data.groups && data.groups.length > 0) {
        const dbRows = data.groups.map((g: any) => toSnakeCase(g));
        const { error: err } = await supabase.from('groups').upsert(dbRows);
        if (err) throw err;
      }

      // Import members
      if (data.members && data.members.length > 0) {
        const dbRows = data.members.map((m: any) => toSnakeCase(m));
        const { error: err } = await supabase.from('members').upsert(dbRows);
        if (err) throw err;
      }

      // Import collections
      if (data.collections && data.collections.length > 0) {
        const dbRows = data.collections.map((c: any) => toSnakeCase(c));
        const { error: err } = await supabase.from('collections').upsert(dbRows);
        if (err) throw err;
      }

      // Import pendings
      if (data.pendings && data.pendings.length > 0) {
        const dbRows = data.pendings.map((p: any) => toSnakeCase(p));
        const { error: err } = await supabase.from('pendings').upsert(dbRows);
        if (err) throw err;
      }

      await fetchData(); // Refresh data after import
    } catch (err) {
      console.error('Failed to import data:', err);
      throw err;
    }
  }, [fetchData]);

  const clearAllData = useCallback(async () => {
    try {
      const { error: err } = await supabase.rpc('clear_all_data');
      if (err) throw err;
      setGroups([]);
      setMembers([]);
      setCollections([]);
      setPendings([]);
    } catch (err: any) {
      console.error('Failed to clear data:', err);
      throw err;
    }
  }, []);

  // ============== DAILY COLLECTION & BULK PAYMENT ==============

  const getDueCollections = useCallback(async (date: Date) => {
    try {
      const dateStr = date.toISOString().split('T')[0]; // yyyy-MM-dd format
      const { data, error: err } = await supabase.rpc('get_due_collections', { target_date: dateStr });
      if (err) throw err;

      const rawData = data || [];
      return rawData.map((item: any) => ({
        ...item,
        weeklyInstallment: ensureNumber(item.weeklyInstallment),
        totalPaid: ensureNumber(item.totalPaid),
        paidToday: ensureNumber(item.paidToday),
        amountDue: ensureNumber(item.amountDue),
        outstandingBalance: ensureNumber(item.outstandingBalance)
      }));
    } catch (err: any) {
      console.error('Error fetching due collections:', err);
      throw err;
    }
  }, []);

  const submitBulkCollection = useCallback(async (payments: any[]) => {
    try {
      const { error: err } = await supabase.rpc('bulk_insert_collections', { payments: payments });
      if (err) throw err;
      await fetchData();
    } catch (err: any) {
      console.error('Error submitting bulk collections:', err);
      throw err;
    }
  }, [fetchData]);

  const bulkUpsertPendings = useCallback(async (newPendings: any[]) => {
    try {
      const dbRows = newPendings.map(p => toSnakeCase(p));
      const { error: err } = await supabase.rpc('bulk_upsert_pendings', { new_pendings: dbRows });
      if (err) throw err;
      await fetchData();
    } catch (err: any) {
      console.error('Error submitting bulk pendings:', err);
      throw err;
    }
  }, [fetchData]);

  const value = useMemo(() => ({
    groups,
    members,
    collections,
    pendings,
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
    refreshData,
    getDueCollections,
    submitBulkCollection,
    bulkUpsertPendings
  }), [
    groups, members, collections, pendings, loading, error,
    addGroup, updateGroup, deleteGroup,
    addMember, updateMember, deleteMember,
    addCollection, updateCollection, deleteCollection,
    getMemberSummary, getAllMemberSummaries,
    getGroupSummary, getAllGroupSummaries,
    getOverallSummary, getWeeklyData,
    getCollectionsForWeek, getExpectedCollectionsForWeek,
    exportToJSON, importFromJSON, clearAllData, refreshData,
    getDueCollections, submitBulkCollection, bulkUpsertPendings
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
