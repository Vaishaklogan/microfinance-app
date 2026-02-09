import { useState } from 'react';
import { useData } from '@/context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Users, 
  Wallet, 
  PieChart, 
  Download, 
  Trash2, 
  FileJson,
  CheckCircle,
  Clock
} from 'lucide-react';

export function OverallSummaryPage() {
  const { 
    getOverallSummary, 
    getWeeklyData, 
    getAllGroupSummaries,
    exportToJSON, 
    importFromJSON, 
    clearAllData 
  } = useData();
  
  const [importData, setImportData] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  
  const summary = getOverallSummary();
  const weeklyData = getWeeklyData();
  const groupSummaries = getAllGroupSummaries();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  const handleExport = () => {
    const data = exportToJSON();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `microfinance_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (importData.trim()) {
      importFromJSON(importData);
      setImportData('');
      setShowImportDialog(false);
      alert('Data imported successfully!');
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear ALL data? This cannot be undone!')) {
      clearAllData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Overall Report</h2>
          <p className="text-slate-500">Complete portfolio overview and analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            Export Data
          </Button>
          <Button variant="outline" onClick={() => setShowImportDialog(true)} className="gap-2">
            <FileJson className="w-4 h-4" />
            Import
          </Button>
          <Button variant="destructive" onClick={handleClearAll} className="gap-2">
            <Trash2 className="w-4 h-4" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Import Dialog */}
      {showImportDialog && (
        <Card className="border-0 shadow-md bg-yellow-50">
          <CardContent className="p-4 space-y-4">
            <h4 className="font-semibold">Import Data (JSON)</h4>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="Paste your JSON data here..."
              className="w-full h-32 p-3 rounded-md border border-input bg-white font-mono text-sm"
            />
            <div className="flex gap-2">
              <Button onClick={handleImport} className="bg-blue-600 hover:bg-blue-700">
                Import
              </Button>
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Groups</p>
                <p className="text-2xl font-bold text-slate-900">{summary.totalGroups}</p>
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
                <p className="text-2xl font-bold text-slate-900">{summary.totalMembers}</p>
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
                <p className="text-sm text-slate-500">Active Loans</p>
                <p className="text-2xl font-bold text-green-600">{summary.activeLoans}</p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Completed Loans</p>
                <p className="text-2xl font-bold text-blue-600">{summary.completedLoans}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-600" />
              Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-xs text-slate-500">Total Loan Disbursed</p>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(summary.totalLoanDisbursed)}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-xs text-slate-500">Total Payable</p>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(summary.totalPayable)}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-xs text-slate-500">Principal Collected</p>
                <p className="text-lg font-bold text-green-700">{formatCurrency(summary.totalPrincipalCollected)}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-xs text-slate-500">Interest Collected</p>
                <p className="text-lg font-bold text-blue-700">{formatCurrency(summary.totalInterestCollected)}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg col-span-2">
                <p className="text-xs text-slate-500">Total Amount Collected</p>
                <p className="text-xl font-bold text-purple-700">{formatCurrency(summary.totalAmountCollected)}</p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <h4 className="text-sm font-medium text-slate-700 mb-3">Outstanding Balances</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Principal Balance</span>
                  <span className="font-semibold text-orange-600">{formatCurrency(summary.principalBalanceOutstanding)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Interest Balance</span>
                  <span className="font-semibold text-orange-600">{formatCurrency(summary.interestBalanceOutstanding)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <span className="text-sm font-medium">Total Balance Outstanding</span>
                  <span className="font-bold text-red-600">{formatCurrency(summary.totalBalanceOutstanding)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Collection Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-500">Overall Collection Rate</span>
                  <span className="font-bold text-slate-900">{summary.overallCollectionRate}%</span>
                </div>
                <Progress value={summary.overallCollectionRate} className="h-3" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-500">Principal Recovery Rate</span>
                  <span className="font-bold text-green-600">{summary.principalRecoveryRate}%</span>
                </div>
                <Progress value={summary.principalRecoveryRate} className="h-3 bg-green-100" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-500">Interest Recovery Rate</span>
                  <span className="font-bold text-blue-600">{summary.interestRecoveryRate}%</span>
                </div>
                <Progress value={summary.interestRecoveryRate} className="h-3 bg-blue-100" />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <h4 className="text-sm font-medium text-slate-700 mb-3">Additional Metrics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500">Average Loan Size</p>
                  <p className="text-lg font-bold text-slate-900">{formatCurrency(summary.averageLoanSize)}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500">Portfolio Health</p>
                  <Badge className={summary.overallCollectionRate >= 80 ? 'bg-green-100 text-green-700' : summary.overallCollectionRate >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}>
                    {summary.overallCollectionRate >= 80 ? 'Excellent' : summary.overallCollectionRate >= 50 ? 'Good' : 'Needs Attention'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Breakdown */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Weekly Collection Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Week No</TableHead>
                  <TableHead className="text-right">Amount Collected</TableHead>
                  <TableHead className="text-center">No. of Payments</TableHead>
                  <TableHead className="text-center">Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weeklyData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                      No collection data available.
                    </TableCell>
                  </TableRow>
                ) : (
                  weeklyData.map((week) => (
                    <TableRow key={week.weekNo} className="hover:bg-slate-50">
                      <TableCell className="font-medium">Week {week.weekNo}</TableCell>
                      <TableCell className="text-right">{formatCurrency(week.amountCollected)}</TableCell>
                      <TableCell className="text-center">{week.numberOfPayments}</TableCell>
                      <TableCell className="text-center">
                        <Progress 
                          value={week.numberOfPayments > 0 ? (week.numberOfPayments / summary.totalMembers) * 100 : 0} 
                          className="w-24 mx-auto h-2" 
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Top Groups */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Top Groups by Collection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Group No</TableHead>
                  <TableHead>Group Name</TableHead>
                  <TableHead className="text-right">Total Collected</TableHead>
                  <TableHead className="text-right">Total Balance</TableHead>
                  <TableHead className="text-center">Collection %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupSummaries
                  .sort((a, b) => b.totalCollected - a.totalCollected)
                  .slice(0, 5)
                  .map((group) => (
                    <TableRow key={group.groupNo} className="hover:bg-slate-50">
                      <TableCell className="font-medium">{group.groupNo}</TableCell>
                      <TableCell>{group.groupName}</TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(group.totalCollected)}
                      </TableCell>
                      <TableCell className="text-right text-orange-600">
                        {formatCurrency(group.totalBalance)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={group.collectionRate >= 80 ? 'bg-green-100 text-green-700' : group.collectionRate >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}>
                          {group.collectionRate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
