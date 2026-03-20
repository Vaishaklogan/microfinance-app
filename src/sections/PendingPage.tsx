import { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Clock, History } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Pending } from '@/types';

export function PendingPage() {
    const { pendings, members, bulkUpsertPendings } = useData();
    const [isSaving, setIsSaving] = useState<string | null>(null);

    const ongoingPendings = useMemo(() =>
        pendings.filter(p => p.status === 'Ongoing').sort((a, b) => b.weekNo - a.weekNo),
        [pendings]);

    const historyPendings = useMemo(() =>
        pendings.filter(p => p.status === 'Cleared').sort((a, b) => b.weekNo - a.weekNo),
        [pendings]);

    const getMemberDetails = (memberId: string) => {
        const member = members.find(m => m.memberId === memberId);
        return {
            memberName: member?.memberName || 'Unknown Member',
            groupNo: member?.groupNo || 'Unknown Group'
        };
    };

    const handleClearPending = async (pending: Pending) => {
        setIsSaving(pending.id);
        try {
            const clearedPending = {
                ...pending,
                status: 'Cleared',
                clearedAt: format(new Date(), 'yyyy-MM-dd')
            };
            await bulkUpsertPendings([clearedPending]);
            toast.success('Pending cleared successfully!');
        } catch (error) {
            console.error('Failed to clear pending:', error);
            toast.error('Failed to clear pending');
        } finally {
            setIsSaving(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Pending Overview</h2>
                    <p className="text-slate-500">Track and manage outstanding weekly collection amounts.</p>
                </div>
            </div>

            <Tabs defaultValue="ongoing" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
                    <TabsTrigger value="ongoing" className="text-base">
                        <Clock className="w-4 h-4 mr-2" />
                        Ongoing Pendings
                        {ongoingPendings.length > 0 && (
                            <span className="ml-2 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                {ongoingPendings.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="history" className="text-base">
                        <History className="w-4 h-4 mr-2" />
                        Pending History
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="ongoing" className="mt-0 outline-none">
                    <div className="bg-white border rounded-lg shadow-sm overflow-hidden animate-in fade-in">
                        {ongoingPendings.length === 0 ? (
                            <div className="p-12 text-center text-slate-500">
                                <CheckCircle className="w-12 h-12 mx-auto text-green-400 mb-3" />
                                <h3 className="text-lg font-medium text-slate-700">No Ongoing Pendings</h3>
                                <p className="mt-1">All members are up to date on their collections.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold">Week No</th>
                                            <th className="px-6 py-4 font-semibold">Group</th>
                                            <th className="px-6 py-4 font-semibold">Member</th>
                                            <th className="px-6 py-4 font-semibold text-right">Pending Amount</th>
                                            <th className="px-6 py-4 font-semibold text-right">Date Recorded</th>
                                            <th className="px-6 py-4 font-semibold text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {ongoingPendings.map(pending => {
                                            const details = getMemberDetails(pending.memberId);
                                            return (
                                                <tr key={pending.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-slate-700">
                                                        <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md text-xs font-bold">
                                                            Week {pending.weekNo}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-slate-600">{details.groupNo}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-semibold text-slate-900">{details.memberName}</div>
                                                        <div className="text-xs text-slate-500">{pending.memberId}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-amber-600">
                                                        ₹{pending.amount.toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-slate-500 tabular-nums">
                                                        {pending.createdAt}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleClearPending(pending)}
                                                            disabled={isSaving === pending.id}
                                                            className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                                                        >
                                                            {isSaving === pending.id ? (
                                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                            ) : (
                                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                            )}
                                                            Mark Cleared
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="history" className="mt-0 outline-none">
                    <div className="bg-white border rounded-lg shadow-sm overflow-hidden animate-in fade-in">
                        {historyPendings.length === 0 ? (
                            <div className="p-12 text-center text-slate-500">
                                <History className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                <h3 className="text-lg font-medium text-slate-700">No History Found</h3>
                                <p className="mt-1">Cleared pendings will appear here.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left opacity-80">
                                    <thead className="text-xs text-slate-600 uppercase bg-slate-50 border-b">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold">Week No</th>
                                            <th className="px-6 py-4 font-semibold">Group</th>
                                            <th className="px-6 py-4 font-semibold">Member</th>
                                            <th className="px-6 py-4 font-semibold text-right">Amount</th>
                                            <th className="px-6 py-4 font-semibold text-right">Date Recorded</th>
                                            <th className="px-6 py-4 font-semibold text-right">Date Cleared</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {historyPendings.map(pending => {
                                            const details = getMemberDetails(pending.memberId);
                                            return (
                                                <tr key={pending.id} className="hover:bg-slate-50">
                                                    <td className="px-6 py-4 font-medium text-slate-600">Week {pending.weekNo}</td>
                                                    <td className="px-6 py-4 text-slate-600">{details.groupNo}</td>
                                                    <td className="px-6 py-4 text-slate-600">
                                                        <div>{details.memberName}</div>
                                                        <div className="text-xs text-slate-400">{pending.memberId}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-medium line-through decoration-slate-300 text-slate-500">
                                                        ₹{pending.amount.toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-slate-500 tabular-nums">
                                                        {pending.createdAt}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-medium text-green-700 tabular-nums">
                                                        {pending.clearedAt}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
