import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import useAuthStore from '@/hooks/useAuth';
import { Button, Input, Card, CardBody } from '@/components/ui';

const Register = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    plan: 'free',
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
    } else if (formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmation requise';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
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
      await register({
        email: formData.email,
        password: formData.password,
        plan: formData.plan,
      });

      // Redirect to login after successful registration
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      // Error handled by the store
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center px-4 py-12">
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
            Créez votre compte gratuitement
          </p>
        </div>

        {/* Register Form */}
        <Card>
          <CardBody>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Inscription
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
                helperText="Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre"
                required
                autoComplete="new-password"
              />

              <Input
                type="password"
                name="confirmPassword"
                label="Confirmer le mot de passe"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                required
                autoComplete="new-password"
              />

              <div className="mb-4">
                <label className="label">Plan</label>
                <select
                  name="plan"
                  value={formData.plan}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="free">Gratuit (100 requêtes/mois)</option>
                  <option value="premium">Premium (500 requêtes/mois)</option>
                  <option value="pro">Pro (1000 requêtes/mois)</option>
                </select>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
                disabled={isLoading}
              >
                Créer mon compte
              </Button>
            </form>

            {/* Login link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Déjà un compte ?{' '}
                <Link
                  to="/login"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Se connecter
                </Link>
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default Register;
