import { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserCircle, 
  Receipt, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  Clock
} from 'lucide-react';

export function Dashboard() {
  const { 
    groups, 
    members, 
    collections, 
    getOverallSummary, 
    getExpectedCollectionsForWeek 
  } = useData();
  
  const [selectedWeek, setSelectedWeek] = useState(4);
  
  const summary = getOverallSummary();
  const expectedCollections = useMemo(() => 
    getExpectedCollectionsForWeek(selectedWeek), 
    [selectedWeek, getExpectedCollectionsForWeek]
  );
  
  const weekCollections = useMemo(() => 
    collections.filter(c => c.weekNo === selectedWeek),
    [collections, selectedWeek]
  );

  const stats = [
    { 
      label: 'Total Groups', 
      value: groups.length, 
      icon: Users, 
      color: 'bg-blue-500' 
    },
    { 
      label: 'Total Members', 
      value: members.length, 
      icon: UserCircle, 
      color: 'bg-green-500' 
    },
    { 
      label: 'Active Loans', 
      value: summary.activeLoans, 
      icon: Receipt, 
      color: 'bg-orange-500' 
    },
    { 
      label: 'Collection Rate', 
      value: `${summary.overallCollectionRate}%`, 
      icon: TrendingUp, 
      color: 'bg-purple-500' 
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-slate-500">Overview of your microfinance portfolio</p>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="week-select" className="text-sm font-medium">Week:</Label>
          <Input
            id="week-select"
            type="number"
            min={1}
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(parseInt(e.target.value) || 1)}
            className="w-20"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-md lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Week {selectedWeek} Collections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-xs text-slate-500">Expected</p>
                  <p className="text-lg font-bold text-slate-900">
                    {formatCurrency(expectedCollections.reduce((sum, m) => sum + m.totalPayable / m.weeksPaid, 0))}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-xs text-slate-500">Collected</p>
                  <p className="text-lg font-bold text-green-700">
                    {formatCurrency(weekCollections.reduce((sum, c) => sum + c.amountPaid, 0))}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-xs text-slate-500">Members Due</p>
                  <p className="text-lg font-bold text-blue-700">{expectedCollections.length}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-xs text-slate-500">Payments</p>
                  <p className="text-lg font-bold text-purple-700">{weekCollections.length}</p>
                </div>
              </div>

              {/* Collection List */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="text-left p-3 font-medium">Member</th>
                      <th className="text-left p-3 font-medium">Group</th>
                      <th className="text-right p-3 font-medium">Expected</th>
                      <th className="text-right p-3 font-medium">Paid</th>
                      <th className="text-center p-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expectedCollections.slice(0, 5).map((member) => {
                      const payment = weekCollections.find(c => c.memberId === member.memberId);
                      const weeklyEMI = member.totalPayable / (member.weeksPaid + member.totalBalance / (member.totalPayable / (member.weeksPaid || 1)));
                      
                      return (
                        <tr key={member.memberId} className="border-b border-slate-100">
                          <td className="p-3">{member.memberName}</td>
                          <td className="p-3">{member.groupNo}</td>
                          <td className="p-3 text-right">{formatCurrency(weeklyEMI)}</td>
                          <td className="p-3 text-right">
                            {payment ? formatCurrency(payment.amountPaid) : '-'}
                          </td>
                          <td className="p-3 text-center">
                            {payment ? (
                              <Badge className="bg-green-100 text-green-700">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Paid
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-orange-600 border-orange-300">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Financial Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Total Disbursed</span>
                <span className="font-semibold">{formatCurrency(summary.totalLoanDisbursed)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Total Payable</span>
                <span className="font-semibold">{formatCurrency(summary.totalPayable)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Total Collected</span>
                <span className="font-semibold text-green-600">{formatCurrency(summary.totalAmountCollected)}</span>
              </div>
              <div className="h-px bg-slate-200" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Principal Balance</span>
                <span className="font-semibold text-orange-600">{formatCurrency(summary.principalBalanceOutstanding)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Interest Balance</span>
                <span className="font-semibold text-orange-600">{formatCurrency(summary.interestBalanceOutstanding)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Balance</span>
                <span className="font-bold text-red-600">{formatCurrency(summary.totalBalanceOutstanding)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span>Principal Recovery</span>
                  <span className="font-medium">{summary.principalRecoveryRate}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${Math.min(summary.principalRecoveryRate, 100)}%` }}
                  />
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span>Interest Recovery</span>
                  <span className="font-medium">{summary.interestRecoveryRate}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${Math.min(summary.interestRecoveryRate, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Collections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Member ID</th>
                  <th className="text-left p-3 font-medium">Group</th>
                  <th className="text-center p-3 font-medium">Week</th>
                  <th className="text-right p-3 font-medium">Amount</th>
                  <th className="text-right p-3 font-medium">Principal</th>
                  <th className="text-right p-3 font-medium">Interest</th>
                </tr>
              </thead>
              <tbody>
                {collections.slice(-5).reverse().map((collection) => (
                  <tr key={collection.id} className="border-b border-slate-100">
                    <td className="p-3">{collection.collectionDate}</td>
                    <td className="p-3">{collection.memberId}</td>
                    <td className="p-3">{collection.groupNo}</td>
                    <td className="p-3 text-center">{collection.weekNo}</td>
                    <td className="p-3 text-right font-medium">{formatCurrency(collection.amountPaid)}</td>
                    <td className="p-3 text-right text-green-600">{formatCurrency(collection.principalPaid)}</td>
                    <td className="p-3 text-right text-blue-600">{formatCurrency(collection.interestPaid)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
