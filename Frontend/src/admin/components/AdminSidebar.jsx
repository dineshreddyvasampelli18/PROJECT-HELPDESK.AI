import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Inbox,
    Users,
    BarChart3,
    UserCircle,
    ShieldCheck,
    Settings,
    LogOut,
    Activity,
    Bug
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

/**
 * AdminSidebar Component
 * Responsive navigation for the administrative console.
 * - Desktop: Fixed 260px width with labels.
 * - Tablet (md): Collapses to 80px width with icons only.
 * - Mobile: Hidden (handled by AdminLayout drawer).
 */
const AdminSidebar = ({ isMobile, onClose }) => {
    const navItems = [
        { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Tickets', path: '/admin/tickets', icon: Inbox },
        { label: 'Bug Reports', path: '/admin/bug-reports', icon: Bug },
        { label: 'Users', path: '/admin/users', icon: Users },
        { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
        { label: 'AI Benchmarking', path: '/admin/benchmarking', icon: Activity },
        { label: 'Profile', path: '/admin/profile', icon: UserCircle },
    ];

    const { logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <aside className={`
            ${isMobile ? 'w-full h-full' : 'md:w-20 lg:w-[260px] fixed left-0 top-0 h-full underline-none'} 
            bg-slate-900 flex flex-col border-r border-slate-800 text-slate-400 z-40 transition-all duration-300 overflow-hidden
        `}>
            {/* Logo Section */}
            <div className="p-6 lg:p-8 border-b border-slate-800/50 flex justify-center lg:justify-start">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-emerald-500/20 shrink-0">
                        <ShieldCheck size={24} />
                    </div>
                    <div className="hidden lg:block animate-in fade-in duration-500">
                        <h1 className="text-white font-black tracking-tighter leading-none text-xl italic">PRIME.</h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Admin Console</p>
                    </div>
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
                {!isMobile && (
                    <p className="hidden lg:block px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Core Modules</p>
                )}
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={isMobile ? onClose : undefined}
                        className={({ isActive }) =>
                            `flex items-center lg:gap-3 p-3 lg:px-4 lg:py-3 rounded-2xl transition-all group font-bold justify-center lg:justify-start ${isActive
                                ? 'bg-emerald-500/10 text-emerald-400 shadow-sm'
                                : 'hover:bg-slate-800/50 hover:text-slate-200'
                            }`
                        }
                    >
                        <item.icon size={22} className="shrink-0 transition-transform group-hover:scale-110" />
                        <span className="hidden lg:block text-sm tracking-tight truncate animate-in fade-in slide-in-from-left-2 duration-300">
                            {item.label}
                        </span>

                        {/* Tooltip for collapsed mode (simple title) */}
                        {!isMobile && (
                            <div className="lg:hidden absolute left-20 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap border border-slate-700 ml-2">
                                {item.label}
                            </div>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Bottom Profile / Logout Shortcut */}
            <div className="p-4 lg:p-6 border-t border-slate-800/50 space-y-2 pb-10 flex flex-col items-center lg:items-stretch">
                <NavLink
                    to="/admin/settings"
                    onClick={isMobile ? onClose : undefined}
                    className={({ isActive }) =>
                        `flex items-center lg:gap-3 p-3 lg:px-4 lg:py-3 rounded-2xl transition-all group font-bold justify-center lg:justify-start ${isActive
                            ? 'bg-slate-800 text-white'
                            : 'hover:bg-slate-800/30 hover:text-slate-200'
                        }`
                    }
                >
                    <Settings size={22} className="shrink-0" />
                    <span className="hidden lg:block text-sm tracking-tight animate-in fade-in duration-300">Settings</span>
                </NavLink>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center lg:gap-3 p-3 lg:px-4 lg:py-3 rounded-2xl hover:bg-red-500/10 hover:text-red-400 transition-all font-bold group justify-center lg:justify-start text-slate-500"
                >
                    <LogOut size={22} className="shrink-0 group-hover:translate-x-1 transition-transform" />
                    <span className="hidden lg:block text-sm tracking-tight animate-in fade-in duration-300">Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
