import { useState, useEffect, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import type { DueCollection } from '@/types';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Save, Download, Loader2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ApiError } from '@/lib/error';
import { ErrorDialog } from '@/components/ErrorDialog';

export function DailyCollectionPage() {
    const { getDueCollections, submitBulkCollection } = useData();
    const [date, setDate] = useState<Date>(new Date());
    const [loading, setLoading] = useState(false);
    const [dues, setDues] = useState<DueCollection[]>([]);
    const [payments, setPayments] = useState<Record<string, string>>({});
    const [remarks, setRemarks] = useState<Record<string, string>>({});
    const [cash, setCash] = useState<Record<string, string>>({});
    const [gpay, setGpay] = useState<Record<string, string>>({});
    const [dueInput, setDueInput] = useState<Record<string, string>>({});
    const [totalInput, setTotalInput] = useState<Record<string, string>>({});
    const [error, setError] = useState<ApiError | Error | null>(null);
    const [isErrorOpen, setIsErrorOpen] = useState(false);

    const fetchDues = async (selectedDate: Date) => {
        setLoading(true);
        try {
            const data = await getDueCollections(selectedDate);
            setDues(data);
            const initialPayments: Record<string, string> = {};
            data.forEach(d => {
                initialPayments[d.memberId] = d.amountDue.toString();
            });
            setPayments(initialPayments);
        } catch (error) {
            console.error(error);
            setError(error instanceof Error ? error : new Error('Unknown error'));
            setIsErrorOpen(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDues(date);
    }, [date]);

    const handleAmountChange = (memberId: string, amount: string) => {
        setPayments(prev => ({ ...prev, [memberId]: amount }));
    };

    const handleRemarksChange = (memberId: string, remark: string) => setRemarks(prev => ({ ...prev, [memberId]: remark }));
    const handleCashChange = (memberId: string, val: string) => setCash(prev => ({ ...prev, [memberId]: val }));
    const handleGpayChange = (memberId: string, val: string) => setGpay(prev => ({ ...prev, [memberId]: val }));
    const handleDueInputChange = (memberId: string, val: string) => setDueInput(prev => ({ ...prev, [memberId]: val }));
    const handleTotalInputChange = (memberId: string, val: string) => setTotalInput(prev => ({ ...prev, [memberId]: val }));

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload = dues.map(d => {
                const amount = parseFloat(payments[d.memberId] || '0');
                if (amount <= 0) return null;
                return {
                    memberId: d.memberId,
                    amount,
                    date: format(date, 'yyyy-MM-dd'),
                    weekNo: d.weekNo,
                    groupNo: d.groupNo
                };
            }).filter(p => p !== null);

            if (payload.length === 0) {
                toast.warning('No payments to save');
                return;
            }

            await submitBulkCollection(payload);
            toast.success(`Saved ${payload.length} payments`);
            fetchDues(date);
        } catch (error) {
            console.error(error);
            setError(error instanceof Error ? error : new Error('Unknown error'));
            setIsErrorOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const headers = ['Location', 'Group', 'Member ID', 'Member Name', 'Week No', 'Due Amount', 'Collected Amount', 'Balance', 'Remarks', 'Cash', 'GPay', 'Due', 'Total'];
        const rows: any[] = [];

        groupedData.forEach(locData => {
            locData.groups.forEach(grpData => {
                grpData.members.forEach(item => {
                    const paid = parseFloat(payments[item.memberId] || '0');
                    const balance = item.amountDue - paid;
                    rows.push([
                        locData.landmark,
                        item.groupNo,
                        item.memberId,
                        `"${item.memberName}"`,
                        item.weekNo,
                        item.amountDue,
                        payments[item.memberId] || 0,
                        balance.toFixed(2),
                        `"${remarks[item.memberId] || ''}"`,
                        `"${cash[item.memberId] || ''}"`,
                        `"${gpay[item.memberId] || ''}"`,
                        `"${dueInput[item.memberId] || ''}"`,
                        `"${totalInput[item.memberId] || ''}"`
                    ]);
                });
            });
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `daily_collection_${format(date, 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const groupedData = useMemo(() => {
        const locationsMap: Record<string, Record<string, DueCollection[]>> = {};

        dues.forEach(m => {
            const loc = m.landmark || 'Unassigned Location';
            const grp = m.groupNo || 'Unassigned Group';

            if (!locationsMap[loc]) locationsMap[loc] = {};
            if (!locationsMap[loc][grp]) locationsMap[loc][grp] = [];

            locationsMap[loc][grp].push(m);
        });

        const result = Object.keys(locationsMap).sort().map(loc => {
            const groups = Object.keys(locationsMap[loc]).sort().map(grp => {
                return {
                    groupNo: grp,
                    members: locationsMap[loc][grp].sort((a, b) => a.memberId.localeCompare(b.memberId))
                };
            });
            return { landmark: loc, groups };
        });

        return result;
    }, [dues]);

    const hasMembers = dues.length > 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Daily Collection</h2>
                    <p className="text-slate-500">Record payments for a specific date</p>
                </div>
                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
                        </PopoverContent>
                    </Popover>
                    <Button variant="outline" onClick={handleExport} disabled={!hasMembers}>
                        <Download className="mr-2 h-4 w-4" />
                        Export Excel
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="p-8 text-center text-slate-500 bg-white border rounded-lg shadow-sm">
                    <Loader2 className="w-8 h-8 mx-auto mb-3 text-slate-300 animate-spin" />
                    <p className="font-medium text-slate-600">Loading dues...</p>
                </div>
            ) : !hasMembers ? (
                <div className="p-8 text-center text-slate-500 bg-white border rounded-lg shadow-sm">
                    <CalendarIcon className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium text-slate-600">No dues found for {format(date, "PPP")}</p>
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
                                                        <th className="px-4 py-3 h-10 align-middle font-semibold text-center">Week</th>
                                                        <th className="px-4 py-3 h-10 align-middle font-semibold text-right">Due Amount</th>
                                                        <th className="px-4 py-3 h-10 align-middle font-semibold text-right w-40 bg-blue-50/50">Collected Amount</th>
                                                        <th className="px-4 py-3 h-10 align-middle font-semibold text-right w-32">Balance</th>
                                                        <th className="px-4 py-3 h-10 align-middle font-semibold w-40">Remarks</th>
                                                        <th className="px-4 py-3 h-10 align-middle font-semibold w-24">Cash</th>
                                                        <th className="px-4 py-3 h-10 align-middle font-semibold w-24">GPay</th>
                                                        <th className="px-4 py-3 h-10 align-middle font-semibold w-24">Due</th>
                                                        <th className="px-4 py-3 h-10 align-middle font-semibold w-24">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {grpData.members.map(item => {
                                                        const paid = parseFloat(payments[item.memberId] || '0');
                                                        const balance = item.amountDue - paid;
                                                        return (
                                                            <tr key={item.memberId} className="hover:bg-slate-50/80 transition-colors">
                                                                <td className="px-4 py-3 font-medium text-slate-600">{item.memberId}</td>
                                                                <td className="px-4 py-3 font-medium text-slate-900">{item.memberName}</td>
                                                                <td className="px-4 py-3 text-center text-slate-600 font-medium whitespace-nowrap">{item.weekNo}</td>
                                                                <td className="px-4 py-3 text-right text-slate-600">
                                                                    ₹{item.amountDue.toFixed(2)}
                                                                </td>
                                                                <td className="px-4 py-2 bg-blue-50/30">
                                                                    <div className="flex items-center justify-end">
                                                                        <span className="text-slate-500 mr-2 text-xs">₹</span>
                                                                        <input
                                                                            type="number"
                                                                            className="w-full text-right p-1.5 border rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium text-slate-900"
                                                                            value={payments[item.memberId] ?? ''}
                                                                            onChange={(e) => handleAmountChange(item.memberId, e.target.value)}
                                                                            min="0"
                                                                            step="0.01"
                                                                        />
                                                                    </div>
                                                                </td>
                                                                <td className={cn("px-4 py-3 text-right font-medium", balance > 0 ? "text-red-600" : "text-green-600")}>
                                                                    ₹{balance.toFixed(2)}
                                                                </td>
                                                                <td className="px-4 py-2">
                                                                    <input type="text" className="w-full p-1.5 border rounded outline-none text-sm" placeholder="Remarks..." value={remarks[item.memberId] ?? ''} onChange={(e) => handleRemarksChange(item.memberId, e.target.value)} />
                                                                </td>
                                                                <td className="px-4 py-2">
                                                                    <input type="text" className="w-full p-1.5 border rounded outline-none text-sm" value={cash[item.memberId] ?? ''} onChange={(e) => handleCashChange(item.memberId, e.target.value)} />
                                                                </td>
                                                                <td className="px-4 py-2">
                                                                    <input type="text" className="w-full p-1.5 border rounded outline-none text-sm" value={gpay[item.memberId] ?? ''} onChange={(e) => handleGpayChange(item.memberId, e.target.value)} />
                                                                </td>
                                                                <td className="px-4 py-2">
                                                                    <input type="text" className="w-full p-1.5 border rounded outline-none text-sm" value={dueInput[item.memberId] ?? ''} onChange={(e) => handleDueInputChange(item.memberId, e.target.value)} />
                                                                </td>
                                                                <td className="px-4 py-2">
                                                                    <input type="text" className="w-full p-1.5 border rounded outline-none text-sm" value={totalInput[item.memberId] ?? ''} onChange={(e) => handleTotalInputChange(item.memberId, e.target.value)} />
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
                <Button size="lg" onClick={handleSave} disabled={loading || !hasMembers} className="shadow-md focus:ring-4 focus:ring-blue-500/20 w-full md:w-auto">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                    Save All Payments
                </Button>
            </div>
            <ErrorDialog
                open={isErrorOpen}
                onOpenChange={setIsErrorOpen}
                error={error}
            />
        </div>
    );
}
