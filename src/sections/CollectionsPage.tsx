import { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Receipt, TrendingUp } from 'lucide-react';
import type { Collection } from '@/types';

const STATUS_OPTIONS = ['Paid', 'Partial', 'Pending'];

export function CollectionsPage() {
  const { collections, members, addCollection, updateCollection, deleteCollection } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  
  const [formData, setFormData] = useState({
    collectionDate: new Date().toISOString().split('T')[0],
    memberId: '',
    groupNo: '',
    weekNo: '',
    amountPaid: '',
    status: 'Paid' as 'Paid' | 'Partial' | 'Pending',
    collectedBy: ''
  });

  // Auto-calculate principal and interest split
  const splitCalculation = useMemo(() => {
    const member = members.find(m => m.memberId === formData.memberId);
    if (!member) return { principal: 0, interest: 0 };
    
    const amount = parseFloat(formData.amountPaid) || 0;
    const totalPayable = member.loanAmount + member.totalInterest;
    const principalRatio = member.loanAmount / totalPayable;
    const interestRatio = member.totalInterest / totalPayable;
    
    return {
      principal: Math.round(amount * principalRatio * 100) / 100,
      interest: Math.round(amount * interestRatio * 100) / 100
    };
  }, [formData.memberId, formData.amountPaid, members]);

  const filteredCollections = collections.filter(collection => 
    collection.memberId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collection.groupNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collection.collectedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const collectionData = {
      collectionDate: formData.collectionDate,
      memberId: formData.memberId,
      groupNo: formData.groupNo,
      weekNo: parseInt(formData.weekNo) || 0,
      amountPaid: parseFloat(formData.amountPaid) || 0,
      status: formData.status,
      collectedBy: formData.collectedBy
    };

    if (editingCollection) {
      updateCollection(editingCollection.id, collectionData);
      setEditingCollection(null);
    } else {
      addCollection(collectionData);
    }
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEdit = (collection: Collection) => {
    setEditingCollection(collection);
    setFormData({
      collectionDate: collection.collectionDate,
      memberId: collection.memberId,
      groupNo: collection.groupNo,
      weekNo: collection.weekNo.toString(),
      amountPaid: collection.amountPaid.toString(),
      status: collection.status,
      collectedBy: collection.collectedBy
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this collection record?')) {
      deleteCollection(id);
    }
  };

  const resetForm = () => {
    setEditingCollection(null);
    setFormData({
      collectionDate: new Date().toISOString().split('T')[0],
      memberId: '',
      groupNo: '',
      weekNo: '',
      amountPaid: '',
      status: 'Paid' as 'Paid' | 'Partial' | 'Pending',
      collectedBy: ''
    });
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
      case 'Paid': return 'bg-green-100 text-green-700';
      case 'Partial': return 'bg-yellow-100 text-yellow-700';
      case 'Pending': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  // Get member's group automatically
  const handleMemberChange = (memberId: string) => {
    const member = members.find(m => m.memberId === memberId);
    if (member) {
      setFormData(prev => ({ ...prev, memberId, groupNo: member.groupNo }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Weekly Collections</h2>
          <p className="text-slate-500">Record and manage weekly loan repayments</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Collection
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCollection ? 'Edit Collection' : 'Add New Collection'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="collectionDate">Collection Date *</Label>
                  <Input
                    id="collectionDate"
                    type="date"
                    value={formData.collectionDate}
                    onChange={(e) => setFormData({ ...formData, collectionDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weekNo">Week Number *</Label>
                  <Input
                    id="weekNo"
                    type="number"
                    min={1}
                    value={formData.weekNo}
                    onChange={(e) => setFormData({ ...formData, weekNo: e.target.value })}
                    placeholder="1"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="memberId">Member *</Label>
                <select
                  id="memberId"
                  value={formData.memberId}
                  onChange={(e) => handleMemberChange(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  required
                >
                  <option value="">Select Member</option>
                  {members.filter(m => m.status === 'Active').map(member => (
                    <option key={member.id} value={member.memberId}>
                      {member.memberId} - {member.memberName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="groupNo">Group</Label>
                <Input
                  id="groupNo"
                  value={formData.groupNo}
                  readOnly
                  className="bg-slate-100"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amountPaid">Amount Paid (₹) *</Label>
                <Input
                  id="amountPaid"
                  type="number"
                  value={formData.amountPaid}
                  onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                  placeholder="1000"
                  required
                />
              </div>
              
              {formData.memberId && formData.amountPaid && (
                <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Auto-Calculated Split:
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Principal:</span>
                      <span className="ml-2 font-semibold text-green-600">
                        {formatCurrency(splitCalculation.principal)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Interest:</span>
                      <span className="ml-2 font-semibold text-blue-600">
                        {formatCurrency(splitCalculation.interest)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Paid' | 'Partial' | 'Pending' })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    {STATUS_OPTIONS.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="collectedBy">Collected By</Label>
                  <Input
                    id="collectedBy"
                    value={formData.collectedBy}
                    onChange={(e) => setFormData({ ...formData, collectedBy: e.target.value })}
                    placeholder="Agent Name"
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                {editingCollection ? 'Update Collection' : 'Add Collection'}
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
              placeholder="Search by member ID, group, or collector..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Collections Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            All Collections ({filteredCollections.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Date</TableHead>
                  <TableHead>Member ID</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead className="text-center">Week</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">Interest</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Collected By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCollections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-slate-500">
                      No collections found. Add your first collection to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCollections.slice().reverse().map((collection) => (
                    <TableRow key={collection.id} className="hover:bg-slate-50">
                      <TableCell>{collection.collectionDate}</TableCell>
                      <TableCell className="font-medium">{collection.memberId}</TableCell>
                      <TableCell>{collection.groupNo}</TableCell>
                      <TableCell className="text-center">{collection.weekNo}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(collection.amountPaid)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(collection.principalPaid)}
                      </TableCell>
                      <TableCell className="text-right text-blue-600">
                        {formatCurrency(collection.interestPaid)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={getStatusColor(collection.status)}>
                          {collection.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{collection.collectedBy}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(collection)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(collection.id)}
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
