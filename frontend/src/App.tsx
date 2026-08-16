import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { SiteNav } from './components/layout/SiteNav';
import { SiteFooter } from './components/layout/SiteFooter';
import { ConsoleLayout } from './components/layout/ConsoleLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { TelegramChatWidget } from './components/telegram/TelegramChatWidget';
import { ToastProvider } from './components/ui/toast';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

import ConsoleDashboard from './pages/console/ConsoleDashboard';
import ConsoleRedeem from './pages/console/ConsoleRedeem';
import ConsoleNodes from './pages/console/ConsoleNodes';
import ConsoleInvite from './pages/console/ConsoleInvite';
import ConsoleTraffic from './pages/console/ConsoleTraffic';
import ConsoleProfile from './pages/console/ConsoleProfile';
import ConsoleApiLab from './pages/console/ConsoleApiLab';
import ConsoleApiChat from './pages/console/ConsoleApiChat';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminNodes from './pages/admin/AdminNodes';
import AdminCdks from './pages/admin/AdminCdks';
import AdminUsers from './pages/admin/AdminUsers';
import AdminShops from './pages/admin/AdminShops';
import AdminTelegram from './pages/admin/AdminTelegram';
import AdminSmtp from './pages/admin/AdminSmtp';
import AdminApi from './pages/admin/AdminApi';
import AdminSettings from './pages/admin/AdminSettings';

function SiteShell() {
  return (
    <div className="site-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SiteNav />
      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <SiteFooter />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <HashRouter>
        <Routes>
          <Route path="/*" element={<SiteShell />} />
          <Route path="/console/*" element={<ConsoleLayout />}>
            <Route index element={<ConsoleDashboard />} />
            <Route path="redeem" element={<ConsoleRedeem />} />
            <Route path="nodes" element={<ConsoleNodes />} />
            <Route path="invite" element={<ConsoleInvite />} />
            <Route path="traffic" element={<ConsoleTraffic />} />
            <Route path="profile" element={<ConsoleProfile />} />
            <Route path="api-lab" element={<ConsoleApiLab />} />
            <Route path="api-chat" element={<ConsoleApiChat />} />
          </Route>
          <Route path="/admin/*" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="nodes" element={<AdminNodes />} />
            <Route path="cdks" element={<AdminCdks />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="shops" element={<AdminShops />} />
            <Route path="telegram" element={<AdminTelegram />} />
            <Route path="smtp" element={<AdminSmtp />} />
            <Route path="api" element={<AdminApi />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
        <TelegramChatWidget />
      </HashRouter>
    </ToastProvider>
  );
}
