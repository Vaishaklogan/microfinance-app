import { useState, useMemo, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Save, Loader2, MapPin, Search } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export function WeeklyCollectionPage() {
    const { members, collections, submitBulkCollection, bulkUpsertPendings } = useData();

    // Find initial max week
    const initialWeek = useMemo(() => {
        if (!collections || collections.length === 0) return 1;
        return Math.max(...collections.map(c => c.weekNo));
    }, [collections]);

    const [weekNoInput, setWeekNoInput] = useState<string>(initialWeek.toString());
    const [weekNo, setWeekNo] = useState<number>(initialWeek);
    const [payments, setPayments] = useState<Record<string, string>>({});
    const [pendingAmounts, setPendingAmounts] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Sync input when initialWeek is computed the first time
    useEffect(() => {
        setWeekNoInput(initialWeek.toString());
        setWeekNo(initialWeek);
    }, [initialWeek]);

    const handleSearch = () => {
        const parsed = parseInt(weekNoInput, 10);
        if (!isNaN(parsed) && parsed > 0) {
            setWeekNo(parsed);
        } else {
            toast.error('Please enter a valid week number');
        }
    };

    const groupedData = useMemo(() => {
        const locationsMap: Record<string, Record<string, any[]>> = {};

        members.forEach(m => {
            if (m.status !== 'Active') return; // only active members

            const loc = m.landmark?.trim() || 'Unspecified Location';
            const grp = m.groupNo || 'Unspecified Group';

            // Calculate due for this week
            const totalPayable = m.loanAmount + m.totalInterest;
            const weeklyInstallment = Math.ceil(totalPayable / m.weeks);

            const memberCollectionsForWeek = collections.filter(c => c.memberId === m.memberId && c.weekNo === weekNo);
            const paidThisWeek = memberCollectionsForWeek.reduce((sum, c) => sum + (c.amountPaid || 0), 0);
            const amountDue = weeklyInstallment - paidThisWeek;

            // Only show members who still have something to pay this week
            if (amountDue <= 0) return;

            const memberData = {
                memberId: m.memberId,
                memberName: m.memberName,
                groupNo: grp,
                landmark: loc,
                weeklyInstallment,
                paidThisWeek,
                amountDue,
            };

            if (!locationsMap[loc]) locationsMap[loc] = {};
            if (!locationsMap[loc][grp]) locationsMap[loc][grp] = [];
            locationsMap[loc][grp].push(memberData);
        });

        // Sort locations alphabetically
        const sortedLocations = Object.keys(locationsMap).sort((a, b) => a.localeCompare(b));

        return sortedLocations.map(loc => {
            const groupsInLoc = locationsMap[loc];
            const sortedGroupNames = Object.keys(groupsInLoc).sort((a, b) => {
                // Try natural sort for group names like "Group 1", "Group 2"
                return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
            });

            const groupsData = sortedGroupNames.map(grpName => {
                const grpMembers = groupsInLoc[grpName].sort((a, b) => a.memberName.localeCompare(b.memberName));
                return {
                    groupNo: grpName,
                    members: grpMembers
                };
            });

            return {
                landmark: loc,
                groups: groupsData
            };
        });
    }, [members, collections, weekNo]);

    // Pre-fill payments when weekNo or groupedData changes
    useEffect(() => {
        const initialPayments: Record<string, string> = {};
        groupedData.forEach(loc => {
            loc.groups.forEach(grp => {
                grp.members.forEach(m => {
                    initialPayments[m.memberId] = m.amountDue.toString();
                });
            });
        });
        setPayments(initialPayments);
    }, [groupedData]);

    const handleAmountChange = (memberId: string, amount: string) => {
        setPayments(prev => ({ ...prev, [memberId]: amount }));
    };

    const handlePendingChange = (memberId: string, amount: string) => {
        setPendingAmounts(prev => ({ ...prev, [memberId]: amount }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload: any[] = [];
            const pendingPayload: any[] = [];
            const todayStr = format(new Date(), 'yyyy-MM-dd');

            groupedData.forEach(loc => {
                loc.groups.forEach(grp => {
                    grp.members.forEach(m => {
                        const amount = parseFloat(payments[m.memberId] || '0');
                        if (amount > 0) {
                            payload.push({
                                memberId: m.memberId,
                                amount: amount,
                                date: todayStr,
                                weekNo: weekNo,
                                groupNo: m.groupNo
                            });
                        }

                        const pendingAmt = parseFloat(pendingAmounts[m.memberId] || '0');
                        if (pendingAmt > 0) {
                            pendingPayload.push({
                                id: `${m.memberId}-wk${weekNo}-${Date.now()}`,
                                memberId: m.memberId,
                                groupNo: m.groupNo,
                                weekNo: weekNo,
                                amount: pendingAmt,
                                status: 'Ongoing',
                                createdAt: todayStr
                            });
                        }
                    });
                });
            });

            if (payload.length === 0 && pendingPayload.length === 0) {
                toast.warning('No payments or pendings to save');
                return;
            }

            const promises = [];
            if (payload.length > 0) promises.push(submitBulkCollection(payload));
            if (pendingPayload.length > 0) promises.push(bulkUpsertPendings(pendingPayload));

            await Promise.all(promises);

            toast.success(`Saved successfully! ${payload.length} collections, ${pendingPayload.length} pendings.`);

            // Clear pendings input after save
            setPendingAmounts({});

        } catch (error) {
            console.error('Error saving collections:', error);
            toast.error('Failed to save payments');
        } finally {
            setIsSaving(false);
        }
    };

    const hasMembers = groupedData.length > 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Weekly Collection By Location</h2>
                    <p className="text-slate-500">Collect payments by selecting a week to view dues grouped by location.</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-lg border shadow-sm">
                <label className="font-semibold whitespace-nowrap">Week Number:</label>
                <input
                    type="number"
                    min="1"
                    className="w-24 p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"
                    value={weekNoInput}
                    onChange={e => setWeekNoInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} variant="secondary">
                    <Search className="w-4 h-4 mr-2" />
                    Load Week
                </Button>
            </div>

            {groupedData.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-white border rounded-lg shadow-sm">
                    <MapPin className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium text-slate-600">No dues found for Week {weekNo}</p>
                    <p className="text-sm mt-1">All active members might have paid, or no members exist.</p>
                </div>
            ) : (
                <div className="space-y-8 pb-16">
                    {groupedData.map(locData => (
                        <div key={locData.landmark} className="bg-white border rounded-lg shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                            <div className="bg-slate-50 px-6 py-4 border-b flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <MapPin className="text-blue-600 w-5 h-5 shrink-0" />
                                    <h3 className="text-xl font-bold text-slate-800">{locData.landmark}</h3>
                                </div>
                                <div className="text-sm text-slate-500 font-medium bg-slate-200 px-3 py-1 rounded-full">
                                    {locData.groups.reduce((acc, g) => acc + g.members.length, 0)} due
                                </div>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {locData.groups.map(grpData => (
                                    <div key={grpData.groupNo} className="p-4 sm:p-6 bg-white">
                                        <h4 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                            {grpData.groupNo}
                                            <span className="text-xs font-normal text-slate-500 bg-slate-100 border px-2 py-0.5 rounded-full">
                                                {grpData.members.length} member{grpData.members.length > 1 ? 's' : ''}
                                            </span>
                                        </h4>
                                        <div className="border rounded-lg overflow-x-auto shadow-sm">
                                            <table className="w-full text-sm text-left">
                                                <thead className="text-xs text-slate-600 uppercase bg-slate-50 border-b">
                                                    <tr>
                                                        <th className="px-4 py-3 h-10 align-middle font-semibold">Member ID</th>
                                                        <th className="px-4 py-3 h-10 align-middle font-semibold">Member Name</th>
                                                        <th className="px-4 py-3 h-10 align-middle font-semibold text-right">Expected amount</th>
                                                        <th className="px-4 py-3 h-10 align-middle font-semibold text-right w-40 bg-blue-50/50">Collect Amount</th>
                                                        <th className="px-4 py-3 h-10 align-middle font-semibold text-right w-40 bg-amber-50/50">Pending Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {grpData.members.map(m => {
                                                        const bal = m.amountDue - parseFloat(payments[m.memberId] || '0');
                                                        return (
                                                            <tr key={m.memberId} className="hover:bg-slate-50/80 transition-colors">
                                                                <td className="px-4 py-3 font-medium text-slate-600">{m.memberId}</td>
                                                                <td className="px-4 py-3 font-medium text-slate-900">{m.memberName}</td>
                                                                <td className="px-4 py-3 text-right text-slate-600">
                                                                    ₹{m.amountDue.toFixed(2)}
                                                                </td>
                                                                <td className="px-4 py-2 bg-blue-50/30">
                                                                    <div className="flex items-center justify-end">
                                                                        <span className="text-slate-500 mr-2 text-xs">₹</span>
                                                                        <input
                                                                            type="number"
                                                                            className={cn(
                                                                                "w-full text-right p-1.5 border rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium",
                                                                                bal < 0 ? "text-amber-600" : "text-slate-900"
                                                                            )}
                                                                            value={payments[m.memberId] ?? ''}
                                                                            onChange={(e) => handleAmountChange(m.memberId, e.target.value)}
                                                                            min="0"
                                                                            step="0.01"
                                                                        />
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-2 bg-amber-50/30 border-l border-white">
                                                                    <div className="flex items-center justify-end">
                                                                        <span className="text-slate-500 mr-2 text-xs">₹</span>
                                                                        <input
                                                                            type="number"
                                                                            className="w-full text-right p-1.5 border rounded outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-medium text-amber-700"
                                                                            value={pendingAmounts[m.memberId] ?? ''}
                                                                            onChange={(e) => handlePendingChange(m.memberId, e.target.value)}
                                                                            min="0"
                                                                            step="0.01"
                                                                        />
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t flex justify-end z-10 md:static md:bg-transparent md:backdrop-blur-none md:border-none md:p-0">
                <Button size="lg" onClick={handleSave} disabled={isSaving || !hasMembers} className="shadow-md focus:ring-4 focus:ring-blue-500/20 w-full md:w-auto">
                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                    Save Week {weekNo} Payments
                </Button>
            </div>
        </div>
    );
}
