import { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import type { DueCollection } from '@/types';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Save, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function DailyCollectionPage() {
    const { getDueCollections, submitBulkCollection } = useData();
    const [date, setDate] = useState<Date>(new Date());
    const [loading, setLoading] = useState(false);
    const [dues, setDues] = useState<DueCollection[]>([]);
    const [payments, setPayments] = useState<Record<string, string>>({}); // memberId -> amount

    const fetchDues = async (selectedDate: Date) => {
        setLoading(true);
        try {
            const data = await getDueCollections(selectedDate);
            setDues(data);
            // Pre-fill payments with amountDue (optional, or leave empty)
            // User said: "balance 200 should be added... I will only enter [actual] amount"
            // So we should pre-fill with Expected Amount? Or 0?
            // Usually pre-fill with Expected is easier.
            const initialPayments: Record<string, string> = {};
            data.forEach(d => {
                initialPayments[d.memberId] = d.amountDue.toString();
            });
            setPayments(initialPayments);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load due collections');
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
            // Refresh list
            fetchDues(date);
        } catch (error) {
            console.error(error);
            toast.error('Failed to save payments');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        // Generate CSV
        const headers = ['Group', 'Member ID', 'Member Name', 'Week No', 'Due Amount', 'Paid Amount', 'Balance'];
        const rows = dues.map(d => [
            d.groupNo,
            d.memberId,
            d.memberName,
            d.weekNo,
            d.amountDue,
            payments[d.memberId] || 0,
            (d.amountDue - parseFloat(payments[d.memberId] || '0')).toFixed(2)
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `collections_${format(date, 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Export Excel
                    </Button>
                </div>
            </div>

            <div className="border rounded-lg shadow-sm bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b">
                            <tr>
                                <th className="px-6 py-3">Group</th>
                                <th className="px-6 py-3">Member</th>
                                <th className="px-6 py-3">Week</th>
                                <th className="px-6 py-3 text-right">Due Amount</th>
                                <th className="px-6 py-3 w-48">Collected Amount</th>
                                <th className="px-6 py-3 text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                        Loading...
                                    </td>
                                </tr>
                            ) : dues.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        No dues found for this date.
                                    </td>
                                </tr>
                            ) : (
                                dues.map((item) => {
                                    const paid = parseFloat(payments[item.memberId] || '0');
                                    const balance = item.amountDue - paid;

                                    return (
                                        <tr key={item.memberId} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 font-medium">{item.groupNo}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium">{item.memberName}</div>
                                                <div className="text-xs text-slate-500">{item.memberId}</div>
                                            </td>
                                            <td className="px-6 py-4">{item.weekNo}</td>
                                            <td className="px-6 py-4 text-right font-medium text-slate-900">
                                                ₹{item.amountDue.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="number"
                                                    className="w-full text-right p-1 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                                    value={payments[item.memberId] || ''}
                                                    onChange={(e) => handleAmountChange(item.memberId, e.target.value)}
                                                />
                                            </td>
                                            <td className={cn("px-6 py-4 text-right font-medium", balance > 0 ? "text-red-600" : "text-green-600")}>
                                                ₹{balance.toFixed(2)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-end sticky bottom-4">
                <Button size="lg" onClick={handleSave} disabled={loading || dues.length === 0} className="shadow-lg">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save All Payments
                </Button>
            </div>
        </div>
    );
}
