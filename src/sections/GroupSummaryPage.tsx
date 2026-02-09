import { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Search, Users, Wallet, TrendingDown, PieChart } from 'lucide-react';

export function GroupSummaryPage() {
  const { getAllGroupSummaries } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  
  const groupSummaries = getAllGroupSummaries();
  
  const filteredSummaries = groupSummaries.filter(summary => 
    summary.groupNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    summary.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    summary.groupHead.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate totals
  const totals = useMemo(() => {
    return filteredSummaries.reduce((acc, summary) => ({
      totalMembers: acc.totalMembers + summary.totalMembers,
      totalLoanAmount: acc.totalLoanAmount + summary.totalLoanAmount,
      totalPayable: acc.totalPayable + summary.totalPayable,
      principalCollected: acc.principalCollected + summary.principalCollected,
      interestCollected: acc.interestCollected + summary.interestCollected,
      principalBalance: acc.principalBalance + summary.principalBalance,
      interestBalance: acc.interestBalance + summary.interestBalance,
      totalCollected: acc.totalCollected + summary.totalCollected,
      totalBalance: acc.totalBalance + summary.totalBalance,
    }), {
      totalMembers: 0,
      totalLoanAmount: 0,
      totalPayable: 0,
      principalCollected: 0,
      interestCollected: 0,
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Group Summary</h2>
          <p className="text-slate-500">Aggregated view of loan portfolio by group</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Groups</p>
                <p className="text-2xl font-bold text-slate-900">{filteredSummaries.length}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <PieChart className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Members</p>
                <p className="text-2xl font-bold text-slate-900">{totals.totalMembers}</p>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
                <Users className="w-5 h-5 text-white" />
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
      </div>

      {/* Search */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search by group number, name, or head name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Group Summaries Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Group-wise Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Group No</TableHead>
                  <TableHead>Group Name</TableHead>
                  <TableHead>Group Head</TableHead>
                  <TableHead className="text-center">Members</TableHead>
                  <TableHead className="text-right">Loan Amount</TableHead>
                  <TableHead className="text-right">Total Payable</TableHead>
                  <TableHead className="text-right">Principal Collected</TableHead>
                  <TableHead className="text-right">Interest Collected</TableHead>
                  <TableHead className="text-right">Total Collected</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-center">Collection %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSummaries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-slate-500">
                      No groups found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSummaries.map((summary) => (
                    <TableRow key={summary.groupNo} className="hover:bg-slate-50">
                      <TableCell className="font-medium">{summary.groupNo}</TableCell>
                      <TableCell>{summary.groupName}</TableCell>
                      <TableCell>{summary.groupHead}</TableCell>
                      <TableCell className="text-center">{summary.totalMembers}</TableCell>
                      <TableCell className="text-right">{formatCurrency(summary.totalLoanAmount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(summary.totalPayable)}</TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(summary.principalCollected)}
                      </TableCell>
                      <TableCell className="text-right text-blue-600">
                        {formatCurrency(summary.interestCollected)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(summary.totalCollected)}
                      </TableCell>
                      <TableCell className="text-right text-orange-600">
                        {formatCurrency(summary.totalBalance)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="w-20 mx-auto">
                          <Progress value={summary.collectionRate} className="h-2" />
                          <span className={`text-xs ${summary.collectionRate >= 80 ? 'text-green-600' : summary.collectionRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {summary.collectionRate.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Totals Row */}
      <Card className="border-0 shadow-md bg-slate-50">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Total Members:</span>
              <p className="font-semibold">{totals.totalMembers}</p>
            </div>
            <div>
              <span className="text-slate-500">Loan Amount:</span>
              <p className="font-semibold">{formatCurrency(totals.totalLoanAmount)}</p>
            </div>
            <div>
              <span className="text-slate-500">Total Payable:</span>
              <p className="font-semibold">{formatCurrency(totals.totalPayable)}</p>
            </div>
            <div>
              <span className="text-slate-500">Principal:</span>
              <p className="font-semibold text-green-600">{formatCurrency(totals.principalCollected)}</p>
            </div>
            <div>
              <span className="text-slate-500">Interest:</span>
              <p className="font-semibold text-blue-600">{formatCurrency(totals.interestCollected)}</p>
            </div>
            <div>
              <span className="text-slate-500">Total Collected:</span>
              <p className="font-semibold">{formatCurrency(totals.totalCollected)}</p>
            </div>
            <div>
              <span className="text-slate-500">Principal Bal:</span>
              <p className="font-semibold text-orange-600">{formatCurrency(totals.principalBalance)}</p>
            </div>
            <div>
              <span className="text-slate-500">Interest Bal:</span>
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
