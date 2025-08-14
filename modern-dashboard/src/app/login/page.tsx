"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, AlertCircle, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(username, password);

    if (!result.success) {
      setError(language === 'ar' ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials');
    }

    setIsLoading(false);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const texts = {
    en: {
      title: 'TacticalOps Command',
      subtitle: 'Secure Tactical Access Portal',
      username: 'Username',
      password: 'Password',
      signIn: 'Sign In',
      signingIn: 'Signing in...',
      forgotPassword: 'Forgot Password?',
      signUp: 'Create Account',
      backToLogin: 'Back to Login',
      enterUsername: 'Enter your username',
      enterPassword: 'Enter your password',
      secureAccess: 'Authorized Personnel Only',
      contactAdmin: 'Contact system administrator',
      forgotPasswordMsg: 'Contact system administrator for password recovery',
      signUpMsg: 'Contact system administrator to create new account',
      allActivitiesMonitored: 'All activities monitored and logged'
    },
    ar: {
      title: 'قيادة العمليات التكتيكية',
      subtitle: 'بوابة الوصول التكتيكي الآمن',
      username: 'اسم المستخدم',
      password: 'كلمة المرور',
      signIn: 'تسجيل الدخول',
      signingIn: 'جاري تسجيل الدخول...',
      forgotPassword: 'نسيت كلمة المرور؟',
      signUp: 'إنشاء حساب',
      backToLogin: 'العودة لتسجيل الدخول',
      enterUsername: 'أدخل اسم المستخدم',
      enterPassword: 'أدخل كلمة المرور',
      secureAccess: 'للموظفين المخولين فقط',
      contactAdmin: 'اتصل بمسؤول النظام',
      forgotPasswordMsg: 'اتصل بمسؤول النظام لاستعادة كلمة المرور',
      signUpMsg: 'اتصل بمسؤول النظام لإنشاء حساب جديد',
      allActivitiesMonitored: 'جميع الأنشطة مراقبة ومسجلة'
    }
  };

  const t = texts[language];

  return (
    <div className="min-h-screen relative" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Tactical Camo Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-green-900/30 to-amber-800/20"></div>
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(139, 69, 19, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(85, 107, 47, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(160, 82, 45, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 60% 30%, rgba(107, 142, 35, 0.2) 0%, transparent 50%)
          `,
          backgroundSize: '400px 400px, 300px 300px, 500px 500px, 350px 350px'
        }}
      ></div>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"></div>
      
      {/* Language Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLanguage}
          className="text-amber-400 hover:text-amber-300 hover:bg-amber-600/10 border border-amber-600/30"
        >
          <Globe className="w-4 h-4 mr-2" />
          {language === 'en' ? 'العربية' : 'English'}
        </Button>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-black/80 backdrop-blur-md border-amber-600/30 shadow-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center border-2 border-amber-500/50">
                <Shield className="w-10 h-10 text-amber-100" />
              </div>
              <CardTitle className="text-2xl font-bold text-amber-400 mb-2">{t.title}</CardTitle>
              <CardDescription className="text-amber-200/80 text-sm">
                {t.subtitle}
              </CardDescription>
              <div className="text-xs text-amber-500/70 mt-2 font-mono">
                {t.secureAccess}
              </div>
            </CardHeader>
            <CardContent>
              {!showForgotPassword && !showSignUp ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-amber-200 font-medium">{t.username}</Label>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-black/50 border-amber-600/50 text-amber-100 placeholder-amber-400/50 focus:border-amber-500 focus:ring-amber-500/20"
                      placeholder={t.enterUsername}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-amber-200 font-medium">{t.password}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-black/50 border-amber-600/50 text-amber-100 placeholder-amber-400/50 focus:border-amber-500 focus:ring-amber-500/20"
                      placeholder={t.enterPassword}
                      required
                    />
                  </div>
                  {error && (
                    <Alert className="border-red-500/50 bg-red-500/10">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <AlertDescription className="text-red-300">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-black font-semibold border border-amber-500/50 shadow-lg" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t.signingIn}
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        {t.signIn}
                      </>
                    )}
                  </Button>
                  
                  {/* Action Links */}
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-amber-600/20">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-amber-400 hover:text-amber-300 text-sm underline"
                    >
                      {t.forgotPassword}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSignUp(true)}
                      className="text-amber-400 hover:text-amber-300 text-sm underline"
                    >
                      {t.signUp}
                    </button>
                  </div>
                </form>
              ) : showForgotPassword ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-amber-400 mb-2">
                      {language === 'ar' ? 'استعادة كلمة المرور' : 'Password Recovery'}
                    </h3>
                    <p className="text-amber-200/80 text-sm">
                      {t.forgotPasswordMsg}
                    </p>
                  </div>
                  <div className="bg-amber-600/10 border border-amber-600/30 rounded-lg p-4">
                    <p className="text-amber-300 text-sm font-mono">
                      admin@tac.consulting.sa
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowForgotPassword(false)}
                    variant="outline"
                    className="w-full border-amber-600/50 text-amber-400 hover:bg-amber-600/10"
                  >
                    {t.backToLogin}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-amber-400 mb-2">
                      {language === 'ar' ? 'إنشاء حساب جديد' : 'Create New Account'}
                    </h3>
                    <p className="text-amber-200/80 text-sm">
                      {t.signUpMsg}
                    </p>
                  </div>
                  <div className="bg-amber-600/10 border border-amber-600/30 rounded-lg p-4">
                    <p className="text-amber-300 text-sm font-mono">
                      admin@tac.consulting.sa
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowSignUp(false)}
                    variant="outline"
                    className="w-full border-amber-600/50 text-amber-400 hover:bg-amber-600/10"
                  >
                    {t.backToLogin}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Security Notice */}
          <div className="mt-4 text-center">
            <p className="text-amber-500/70 text-xs font-mono">
              {t.allActivitiesMonitored}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}