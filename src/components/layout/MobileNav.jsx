import React from 'react';
import { 
  LayoutDashboard, 
  MessagesSquare, 
  CheckSquare, 
  ShieldAlert, 
  MoreHorizontal 
} from 'lucide-react';

export function MobileNav({ activeTab, setActiveTab, onOpenMore, pendingApprovalCount = 0 }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'community', label: 'Community', icon: MessagesSquare },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'approvals', label: 'Approvals', icon: ShieldAlert, badge: pendingApprovalCount }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg px-2 py-1 flex items-center justify-around safe-bottom">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${
              isActive ? 'text-iei-navy-900 font-bold' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'text-iei-gold-600' : 'text-slate-500'}`} />
              {tab.badge > 0 && (
                <span className="absolute -top-1 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">{tab.label}</span>
          </button>
        );
      })}

      <button
        onClick={onOpenMore}
        className="flex flex-col items-center py-1 px-3 rounded-lg text-slate-500 hover:text-slate-700"
      >
        <MoreHorizontal className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">More</span>
      </button>
    </div>
  );
}
