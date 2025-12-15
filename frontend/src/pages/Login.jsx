import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import useAuthStore from '@/hooks/useAuth';
import { Button, Input, Card, CardBody } from '@/components/ui';

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!formData.password) {
      newErrors.password = 'Mot de passe requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (error) {
      // Error handled by the store
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-primary-600 text-white rounded-2xl p-4 mb-4">
            <BarChart3 className="h-12 w-12" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Perfect Links
          </h1>
          <p className="text-gray-600">
            Analysez le maillage interne de vos sites web
          </p>
        </div>

        {/* Login Form */}
        <Card>
          <CardBody>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Connexion
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                name="email"
                label="Email"
                placeholder="votre@email.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                required
                autoComplete="email"
              />

              <Input
                type="password"
                name="password"
                label="Mot de passe"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required
                autoComplete="current-password"
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
                disabled={isLoading}
              >
                Se connecter
              </Button>
            </form>

            {/* Register link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Pas encore de compte ?{' '}
                <Link
                  to="/register"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Créer un compte
                </Link>
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Demo account info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Compte de démo :</strong><br />
            Email: demo@test.com<br />
            Mot de passe: Demo123!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
