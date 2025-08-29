"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { toast } from 'sonner@2.0.3';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, User, Key, TestTube, Trash2 } from 'lucide-react';

interface DevAuthHelperProps {
  isVisible?: boolean;
}

export function DevAuthHelper({ isVisible = false }: DevAuthHelperProps) {
  const [showHelper, setShowHelper] = useState(isVisible);
  const [testEmail, setTestEmail] = useState('johnferreira@gmail.com');
  const [testPassword, setTestPassword] = useState('HealthScan2024!');
  const [testName, setTestName] = useState('John Ferreira');
  const [showPassword, setShowPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { signUp, signIn } = useAuth();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!showHelper) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          onClick={() => setShowHelper(true)}
          size="sm"
          variant="outline"
          className="bg-blue-500 text-white hover:bg-blue-600 border-blue-500"
        >
          <TestTube className="w-4 h-4 mr-2" />
          Dev Auth
        </Button>
      </div>
    );
  }

  const createTestAccount = async () => {
    if (!testEmail || !testPassword || !testName) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await signUp(testEmail, testPassword, testName);
      
      if (error) {
        if (error.type === 'existing_account') {
          toast.success(`✅ Test account already exists: ${testEmail}`);
          toast.info(`Try signing in with password: ${testPassword}`);
        } else {
          toast.error(`Failed to create test account: ${error.message}`);
        }
      } else {
        toast.success(`✅ Test account created successfully!`);
        toast.info(`Email: ${testEmail} | Password: ${testPassword}`);
      }
    } catch (err: any) {
      console.error('Test account creation error:', err);
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const testSignIn = async () => {
    if (!testEmail || !testPassword) {
      toast.error('Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signIn(testEmail, testPassword);
      
      if (error) {
        toast.error(`Sign in failed: ${error.message}`);
        if (error.type === 'invalid_credentials') {
          toast.info('💡 Try creating the test account first, or check the password');
        }
      } else {
        toast.success(`✅ Successfully signed in as ${testEmail}`);
        setShowHelper(false);
      }
    } catch (err: any) {
      console.error('Test sign in error:', err);
      toast.error(`Sign in error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetTestAccount = async () => {
    toast.info('🔄 To reset the test account, delete it from Supabase Auth dashboard and recreate it');
    toast.info('Or try the password reset feature in the main login form');
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Card className="w-80 p-4 bg-white shadow-lg border-2 border-blue-500">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TestTube className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Development Auth Helper</h3>
          </div>
          <Button
            onClick={() => setShowHelper(false)}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
          >
            ✕
          </Button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              <User className="w-3 h-3 inline mr-1" />
              Test Email
            </label>
            <Input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="h-8 text-xs"
              placeholder="test@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              <Key className="w-3 h-3 inline mr-1" />
              Test Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                className="h-8 text-xs pr-8"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <Input
              type="text"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              className="h-8 text-xs"
              placeholder="Test User"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={createTestAccount}
              disabled={isCreating}
              size="sm"
              className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700"
            >
              {isCreating ? (
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </div>
              ) : (
                'Create Account'
              )}
            </Button>

            <Button
              onClick={testSignIn}
              disabled={isLoading}
              size="sm"
              variant="outline"
              className="flex-1 h-8 text-xs"
            >
              {isLoading ? (
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Signing In...
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </div>

          <Button
            onClick={resetTestAccount}
            size="sm"
            variant="ghost"
            className="w-full h-7 text-xs text-gray-600 hover:text-gray-800"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Reset Account
          </Button>
        </div>

        <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-800">
          <p className="font-medium mb-1">💡 Authentication Status:</p>
          <p>• "Invalid credentials" = System working correctly</p>
          <p>• "User already registered" = Expected response</p>
          <p>• These are NOT system errors</p>
        </div>
      </Card>
    </div>
  );
}