import { Link } from 'react-router-dom';
import { LogOut, User, BarChart3 } from 'lucide-react';
import useAuthStore from '@/hooks/useAuth';
import { PLAN_LABELS } from '@/utils/constants';
import { Button, Badge } from '@/components/ui';

const Header = () => {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="bg-primary-600 text-white rounded-lg p-2">
              <BarChart3 className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Perfect Links
            </span>
          </Link>

          {/* User info & Actions */}
          {user && (
            <div className="flex items-center space-x-4">
              {/* User stats */}
              <div className="hidden md:flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Plan:</span>
                  <Badge variant="info">
                    {PLAN_LABELS[user.plan] || user.plan}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Requêtes:</span>
                  <span className="font-semibold text-gray-900">
                    {user.requestsMade || 0} / {user.requestsLimit || 100}
                  </span>
                </div>
              </div>

              {/* User menu */}
              <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="bg-primary-100 rounded-full p-2">
                    <User className="h-4 w-4 text-primary-600" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {user.email}
                  </span>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Déconnexion</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
