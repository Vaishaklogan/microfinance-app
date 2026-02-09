import { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Search, BarChart3, UserCheck, Wallet, TrendingDown } from 'lucide-react';

export function MemberSummaryPage() {
  const { getAllMemberSummaries } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  
  const memberSummaries = getAllMemberSummaries();
  
  const filteredSummaries = memberSummaries.filter(summary => 
    summary.memberId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    summary.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    summary.groupNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate totals
  const totals = useMemo(() => {
    return filteredSummaries.reduce((acc, summary) => ({
      loanAmount: acc.loanAmount + summary.loanAmount,
      totalPayable: acc.totalPayable + summary.totalPayable,
      totalPrincipalCollected: acc.totalPrincipalCollected + summary.totalPrincipalCollected,
      totalInterestCollected: acc.totalInterestCollected + summary.totalInterestCollected,
      principalBalance: acc.principalBalance + summary.principalBalance,
      interestBalance: acc.interestBalance + summary.interestBalance,
      totalCollected: acc.totalCollected + summary.totalCollected,
      totalBalance: acc.totalBalance + summary.totalBalance,
    }), {
      loanAmount: 0,
      totalPayable: 0,
      totalPrincipalCollected: 0,
      totalInterestCollected: 0,
      principalBalance: 0,
      interestBalance: 0,
      totalCollected: 0,
      totalBalance: 0,
    });
  }, [filteredSummaries]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'Completed': return 'bg-blue-100 text-blue-700';
      case 'Defaulted': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Member Summary</h2>
          <p className="text-slate-500">Detailed view of each member's loan and collection status</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Members</p>
                <p className="text-2xl font-bold text-slate-900">{filteredSummaries.length}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Collected</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.totalCollected)}</p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <Wallet className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Balance</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(totals.totalBalance)}</p>
              </div>
              <div className="bg-orange-500 p-3 rounded-lg">
                <TrendingDown className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active Members</p>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredSummaries.filter(s => s.status === 'Active').length}
                </p>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search by member ID, name, or group..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Member Summaries Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Member-wise Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Member ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead className="text-right">Loan Amount</TableHead>
                  <TableHead className="text-right">Total Payable</TableHead>
                  <TableHead className="text-right">Principal Collected</TableHead>
                  <TableHead className="text-right">Interest Collected</TableHead>
                  <TableHead className="text-right">Total Collected</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-center">Weeks Paid</TableHead>
                  <TableHead className="text-center">Progress</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSummaries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-slate-500">
                      No members found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSummaries.map((summary) => {
                    const progress = summary.totalPayable > 0 
                      ? (summary.totalCollected / summary.totalPayable) * 100 
                      : 0;
                    
                    return (
                      <TableRow key={summary.memberId} className="hover:bg-slate-50">
                        <TableCell className="font-medium">{summary.memberId}</TableCell>
                        <TableCell>{summary.memberName}</TableCell>
                        <TableCell>{summary.groupNo}</TableCell>
                        <TableCell className="text-right">{formatCurrency(summary.loanAmount)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(summary.totalPayable)}</TableCell>
                        <TableCell className="text-right text-green-600">
                          {formatCurrency(summary.totalPrincipalCollected)}
                        </TableCell>
                        <TableCell className="text-right text-blue-600">
                          {formatCurrency(summary.totalInterestCollected)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(summary.totalCollected)}
                        </TableCell>
                        <TableCell className="text-right text-orange-600">
                          {formatCurrency(summary.totalBalance)}
                        </TableCell>
                        <TableCell className="text-center">{summary.weeksPaid}</TableCell>
                        <TableCell className="text-center">
                          <div className="w-24 mx-auto">
                            <Progress value={progress} className="h-2" />
                            <span className="text-xs text-slate-500">{progress.toFixed(1)}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={getStatusColor(summary.status)}>
                            {summary.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Totals Row */}
      <Card className="border-0 shadow-md bg-slate-50">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Total Loan:</span>
              <p className="font-semibold">{formatCurrency(totals.loanAmount)}</p>
            </div>
            <div>
              <span className="text-slate-500">Total Payable:</span>
              <p className="font-semibold">{formatCurrency(totals.totalPayable)}</p>
            </div>
            <div>
              <span className="text-slate-500">Principal Collected:</span>
              <p className="font-semibold text-green-600">{formatCurrency(totals.totalPrincipalCollected)}</p>
            </div>
            <div>
              <span className="text-slate-500">Interest Collected:</span>
              <p className="font-semibold text-blue-600">{formatCurrency(totals.totalInterestCollected)}</p>
            </div>
            <div>
              <span className="text-slate-500">Total Collected:</span>
              <p className="font-semibold">{formatCurrency(totals.totalCollected)}</p>
            </div>
            <div>
              <span className="text-slate-500">Principal Balance:</span>
              <p className="font-semibold text-orange-600">{formatCurrency(totals.principalBalance)}</p>
            </div>
            <div>
              <span className="text-slate-500">Interest Balance:</span>
              <p className="font-semibold text-orange-600">{formatCurrency(totals.interestBalance)}</p>
            </div>
            <div>
              <span className="text-slate-500">Total Balance:</span>
              <p className="font-semibold text-red-600">{formatCurrency(totals.totalBalance)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
