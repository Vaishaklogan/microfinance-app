import { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, UserCircle, Calculator } from 'lucide-react';
import type { Member } from '@/types';

const STATUS_OPTIONS = ['Active', 'Completed', 'Defaulted'];

export function MembersPage() {
  const { members, groups, addMember, updateMember, deleteMember } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [showCalculations, setShowCalculations] = useState(false);
  
  const [formData, setFormData] = useState({
    memberId: '',
    memberName: '',
    address: '',
    landmark: '',
    groupNo: '',
    loanAmount: '',
    totalInterest: '',
    weeks: '',
    startDate: new Date().toISOString().split('T')[0],
    status: 'Active' as 'Active' | 'Completed' | 'Defaulted',
    notes: ''
  });

  // Calculate loan details
  const loanCalculations = useMemo(() => {
    const loan = parseFloat(formData.loanAmount) || 0;
    const interest = parseFloat(formData.totalInterest) || 0;
    const weeks = parseInt(formData.weeks) || 1;
    
    const totalPayable = loan + interest;
    const weeklyEMI = weeks > 0 ? Math.round((totalPayable / weeks) * 100) / 100 : 0;
    const principalPerWeek = weeks > 0 ? Math.round((loan / weeks) * 100) / 100 : 0;
    const interestPerWeek = weeks > 0 ? Math.round((interest / weeks) * 100) / 100 : 0;
    
    return {
      totalPayable,
      weeklyEMI,
      principalPerWeek,
      interestPerWeek
    };
  }, [formData.loanAmount, formData.totalInterest, formData.weeks]);

  const filteredMembers = members.filter(member => 
    member.memberId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.groupNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const memberData = {
      memberId: formData.memberId,
      memberName: formData.memberName,
      address: formData.address,
      landmark: formData.landmark,
      groupNo: formData.groupNo,
      loanAmount: parseFloat(formData.loanAmount) || 0,
      totalInterest: parseFloat(formData.totalInterest) || 0,
      weeks: parseInt(formData.weeks) || 0,
      startDate: formData.startDate,
      status: formData.status,
      notes: formData.notes
    };

    if (editingMember) {
      updateMember(editingMember.id, memberData);
      setEditingMember(null);
    } else {
      addMember(memberData);
    }
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setFormData({
      memberId: member.memberId,
      memberName: member.memberName,
      address: member.address,
      landmark: member.landmark,
      groupNo: member.groupNo,
      loanAmount: member.loanAmount.toString(),
      totalInterest: member.totalInterest.toString(),
      weeks: member.weeks.toString(),
      startDate: member.startDate,
      status: member.status,
      notes: member.notes || ''
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this member?')) {
      deleteMember(id);
    }
  };

  const resetForm = () => {
    setEditingMember(null);
    setFormData({
      memberId: '',
      memberName: '',
      address: '',
      landmark: '',
      groupNo: '',
      loanAmount: '',
      totalInterest: '',
      weeks: '',
      startDate: new Date().toISOString().split('T')[0],
      status: 'Active' as 'Active' | 'Completed' | 'Defaulted',
      notes: ''
    });
    setShowCalculations(false);
  };

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
          <h2 className="text-3xl font-bold text-slate-900">Members Management</h2>
          <p className="text-slate-500">Manage members and their loan details</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingMember ? 'Edit Member' : 'Add New Member'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="memberId">Member ID *</Label>
                  <Input
                    id="memberId"
                    value={formData.memberId}
                    onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                    placeholder="M001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="groupNo">Group *</Label>
                  <select
                    id="groupNo"
                    value={formData.groupNo}
                    onChange={(e) => setFormData({ ...formData, groupNo: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    required
                  >
                    <option value="">Select Group</option>
                    {groups.map(group => (
                      <option key={group.id} value={group.groupNo}>{group.groupNo} - {group.groupName}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="memberName">Member Name *</Label>
                <Input
                  id="memberName"
                  value={formData.memberName}
                  onChange={(e) => setFormData({ ...formData, memberName: e.target.value })}
                  placeholder="Full Name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street Address"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="landmark">Landmark</Label>
                <Input
                  id="landmark"
                  value={formData.landmark}
                  onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                  placeholder="Nearby landmark"
                />
              </div>
              
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    Loan Details
                  </h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCalculations(!showCalculations)}
                  >
                    {showCalculations ? 'Hide' : 'Show'} Calculations
                  </Button>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="loanAmount">Loan Amount (₹) *</Label>
                    <Input
                      id="loanAmount"
                      type="number"
                      value={formData.loanAmount}
                      onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
                      placeholder="10000"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalInterest">Total Interest (₹) *</Label>
                    <Input
                      id="totalInterest"
                      type="number"
                      value={formData.totalInterest}
                      onChange={(e) => setFormData({ ...formData, totalInterest: e.target.value })}
                      placeholder="4000"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weeks">Repayment Weeks *</Label>
                    <Input
                      id="weeks"
                      type="number"
                      value={formData.weeks}
                      onChange={(e) => setFormData({ ...formData, weeks: e.target.value })}
                      placeholder="14"
                      required
                    />
                  </div>
                </div>
                
                {showCalculations && (
                  <div className="mt-4 bg-slate-50 p-4 rounded-lg space-y-2">
                    <p className="text-sm font-medium text-slate-700">Auto-Calculated:</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Total Payable:</span>
                        <span className="ml-2 font-semibold">{formatCurrency(loanCalculations.totalPayable)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Weekly EMI:</span>
                        <span className="ml-2 font-semibold text-blue-600">{formatCurrency(loanCalculations.weeklyEMI)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Principal/Week:</span>
                        <span className="ml-2 font-semibold text-green-600">{formatCurrency(loanCalculations.principalPerWeek)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Interest/Week:</span>
                        <span className="ml-2 font-semibold text-orange-600">{formatCurrency(loanCalculations.interestPerWeek)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Completed' | 'Defaulted' })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    {STATUS_OPTIONS.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
              
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                {editingMember ? 'Update Member' : 'Add Member'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
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

      {/* Members Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-blue-600" />
            All Members ({filteredMembers.length})
          </CardTitle>
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
                  <TableHead className="text-right">Interest</TableHead>
                  <TableHead className="text-center">Weeks</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                      No members found. Add your first member to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => (
                    <TableRow key={member.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">{member.memberId}</TableCell>
                      <TableCell>{member.memberName}</TableCell>
                      <TableCell>{member.groupNo}</TableCell>
                      <TableCell className="text-right">{formatCurrency(member.loanAmount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(member.totalInterest)}</TableCell>
                      <TableCell className="text-center">{member.weeks}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={getStatusColor(member.status)}>
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(member)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(member.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
    </div>
  );
}
