import { useState } from 'react';
import { DataProvider } from '@/context/DataContext';
import { Dashboard } from '@/sections/Dashboard';
import { GroupsPage } from '@/sections/GroupsPage';
import { MembersPage } from '@/sections/MembersPage';
import { CollectionsPage } from '@/sections/CollectionsPage';
import { MemberSummaryPage } from '@/sections/MemberSummaryPage';
import { GroupSummaryPage } from '@/sections/GroupSummaryPage';
import { OverallSummaryPage } from '@/sections/OverallSummaryPage';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  UserCircle, 
  Receipt, 
  BarChart3, 
  PieChart, 
  TrendingUp,
  Menu,
  X
} from 'lucide-react';
import type { ViewType } from '@/types';
import './App.css';

function Navigation({ currentView, setView }: { currentView: ViewType; setView: (view: ViewType) => void }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { view: ViewType; label: string; icon: React.ElementType }[] = [
    { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { view: 'groups', label: 'Groups', icon: Users },
    { view: 'members', label: 'Members', icon: UserCircle },
    { view: 'collections', label: 'Collections', icon: Receipt },
    { view: 'memberSummary', label: 'Member Summary', icon: BarChart3 },
    { view: 'groupSummary', label: 'Group Summary', icon: PieChart },
    { view: 'overallSummary', label: 'Overall Report', icon: TrendingUp },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex flex-col w-64 bg-slate-900 text-white min-h-screen p-4">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-center">Microfinance</h1>
          <p className="text-xs text-slate-400 text-center">Management System</p>
        </div>
        
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.view}
                variant={currentView === item.view ? 'secondary' : 'ghost'}
                className={`w-full justify-start gap-3 ${
                  currentView === item.view 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                onClick={() => setView(item.view)}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <div className="flex items-center justify-between bg-slate-900 text-white p-4">
          <div>
            <h1 className="text-lg font-bold">Microfinance</h1>
            <p className="text-xs text-slate-400">Management System</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
        
        {mobileMenuOpen && (
          <div className="bg-slate-900 text-white p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.view}
                  variant={currentView === item.view ? 'secondary' : 'ghost'}
                  className={`w-full justify-start gap-3 ${
                    currentView === item.view 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-300'
                  }`}
                  onClick={() => {
                    setView(item.view);
                    setMobileMenuOpen(false);
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function MainContent({ view }: { view: ViewType }) {
  switch (view) {
    case 'dashboard':
      return <Dashboard />;
    case 'groups':
      return <GroupsPage />;
    case 'members':
      return <MembersPage />;
    case 'collections':
      return <CollectionsPage />;
    case 'memberSummary':
      return <MemberSummaryPage />;
    case 'groupSummary':
      return <GroupSummaryPage />;
    case 'overallSummary':
      return <OverallSummaryPage />;
    default:
      return <Dashboard />;
  }
}

function AppContent() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navigation currentView={currentView} setView={setCurrentView} />
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <MainContent view={currentView} />
      </main>
    </div>
  );
}

function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}

export default App;
