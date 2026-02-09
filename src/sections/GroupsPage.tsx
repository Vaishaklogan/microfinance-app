import { useState } from 'react';
import { useData } from '@/context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Edit, Trash2, Users } from 'lucide-react';
import type { Group } from '@/types';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function GroupsPage() {
  const { groups, addGroup, updateGroup, deleteGroup } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  
  const [formData, setFormData] = useState({
    groupNo: '',
    groupName: '',
    groupHeadName: '',
    headContact: '',
    meetingDay: 'Monday',
    formationDate: new Date().toISOString().split('T')[0]
  });

  const filteredGroups = groups.filter(group => 
    group.groupNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.groupHeadName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGroup) {
      updateGroup(editingGroup.id, formData);
      setEditingGroup(null);
    } else {
      addGroup(formData);
    }
    setFormData({
      groupNo: '',
      groupName: '',
      groupHeadName: '',
      headContact: '',
      meetingDay: 'Monday',
      formationDate: new Date().toISOString().split('T')[0]
    });
    setIsAddDialogOpen(false);
  };

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setFormData({
      groupNo: group.groupNo,
      groupName: group.groupName,
      groupHeadName: group.groupHeadName,
      headContact: group.headContact,
      meetingDay: group.meetingDay,
      formationDate: group.formationDate
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this group?')) {
      deleteGroup(id);
    }
  };

  const resetForm = () => {
    setEditingGroup(null);
    setFormData({
      groupNo: '',
      groupName: '',
      groupHeadName: '',
      headContact: '',
      meetingDay: 'Monday',
      formationDate: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Groups Management</h2>
          <p className="text-slate-500">Manage your microfinance groups</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Group
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingGroup ? 'Edit Group' : 'Add New Group'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="groupNo">Group No *</Label>
                  <Input
                    id="groupNo"
                    value={formData.groupNo}
                    onChange={(e) => setFormData({ ...formData, groupNo: e.target.value })}
                    placeholder="G001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="formationDate">Formation Date</Label>
                  <Input
                    id="formationDate"
                    type="date"
                    value={formData.formationDate}
                    onChange={(e) => setFormData({ ...formData, formationDate: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="groupName">Group Name *</Label>
                <Input
                  id="groupName"
                  value={formData.groupName}
                  onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                  placeholder="Sakthi Group"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="groupHeadName">Group Head Name *</Label>
                <Input
                  id="groupHeadName"
                  value={formData.groupHeadName}
                  onChange={(e) => setFormData({ ...formData, groupHeadName: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="headContact">Contact Number</Label>
                  <Input
                    id="headContact"
                    value={formData.headContact}
                    onChange={(e) => setFormData({ ...formData, headContact: e.target.value })}
                    placeholder="9876543210"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meetingDay">Meeting Day</Label>
                  <select
                    id="meetingDay"
                    value={formData.meetingDay}
                    onChange={(e) => setFormData({ ...formData, meetingDay: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    {DAYS_OF_WEEK.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                {editingGroup ? 'Update Group' : 'Add Group'}
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
              placeholder="Search by group number, name, or head name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Groups Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            All Groups ({filteredGroups.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Group No</TableHead>
                  <TableHead>Group Name</TableHead>
                  <TableHead>Group Head</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Meeting Day</TableHead>
                  <TableHead>Formation Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGroups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No groups found. Add your first group to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGroups.map((group) => (
                    <TableRow key={group.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">{group.groupNo}</TableCell>
                      <TableCell>{group.groupName}</TableCell>
                      <TableCell>{group.groupHeadName}</TableCell>
                      <TableCell>{group.headContact}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {group.meetingDay}
                        </span>
                      </TableCell>
                      <TableCell>{group.formationDate}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(group)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(group.id)}
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
