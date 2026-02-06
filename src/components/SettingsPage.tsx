"use client";

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';
import { 
  ArrowLeft,
  User, 
  Mail, 
  Lock, 
  Bell, 
  Shield, 
  Trash2,
  Save,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react';

interface SettingsPageProps {
  onNavigateBack: () => void;
}

export function SettingsPage({ onNavigateBack }: SettingsPageProps) {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Check if user has a password (vs email-only account)
  // For now, assume all authenticated users have passwords
  // This would be enhanced to check account type from user metadata
  const hasPassword = Boolean(user?.email);

  // Profile settings
  const [profileData, setProfileData] = useState({
    name: user?.user_metadata?.name || '',
    email: user?.email || ''
  });

  // Password change/set
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // For initial password setting (email-only accounts)
  const [initialPasswordData, setInitialPasswordData] = useState({
    password: '',
    confirmPassword: ''
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    referralNotifications: true,
    launchUpdates: true,
    weeklyDigest: false
  });

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    showInLeaderboard: true,
    shareReferralStats: true
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Here you would typically call an API to update the user profile
      // For now, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      // Here you would typically call an API to change the password
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      toast.success('Password changed successfully!');
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleSetInitialPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (initialPasswordData.password !== initialPasswordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (initialPasswordData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      // Here you would typically call an API to set the initial password
      // This would convert the email-only account to a full account
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setInitialPasswordData({
        password: '',
        confirmPassword: ''
      });
      
      toast.success('Password set successfully! Your account has been upgraded.');
    } catch (error) {
      toast.error('Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and you will lose all your referral progress.'
    );

    if (!confirmed) return;

    const doubleConfirmed = window.confirm(
      'This will permanently delete your account and all associated data. Type "DELETE" in the next prompt to confirm.'
    );

    if (!doubleConfirmed) return;

    const confirmText = window.prompt('Type "DELETE" to confirm account deletion:');
    
    if (confirmText !== 'DELETE') {
      toast.error('Account deletion cancelled');
      return;
    }

    setLoading(true);

    try {
      // Here you would typically call an API to delete the account
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Account deleted successfully');
      await signOut();
    } catch (error) {
      toast.error('Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--healthscan-bg-light)] pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="btn-standard mb-4 -ml-2"
            onClick={onNavigateBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-[var(--healthscan-text-muted)] mt-2">
            Manage your account preferences and security settings
          </p>
        </div>

        <div className="space-y-8">
          {/* Profile Settings */}
          <Card className="p-6 bg-white">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </h2>
            
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    placeholder="Enter your full name"
                    className="input-standard"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    placeholder="Enter your email"
                    className="input-standard"
                  />
                </div>
              </div>
              
              <Button
                type="submit"
                disabled={loading}
                className="btn-standard bg-[var(--healthscan-green)] hover:bg-[var(--healthscan-light-green)] text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </Card>

          {/* Password Settings */}
          <Card className="p-6 bg-white">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              {hasPassword ? 'Change Password' : 'Set Password'}
            </h2>
            
            {!hasPassword && (
              <Alert className="mb-6 bg-blue-50 border-blue-200">
                <Shield className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  You currently have an email-only account. Setting a password will allow you to sign in with your email and password combination.
                </AlertDescription>
              </Alert>
            )}
            
            {hasPassword ? (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                      className="input-standard pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="Enter new password"
                        minLength={6}
                        className="input-standard pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="Confirm new password"
                        minLength={6}
                        className="input-standard pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  disabled={loading}
                  className="btn-standard bg-[var(--healthscan-green)] hover:bg-[var(--healthscan-light-green)] text-white"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {loading ? 'Changing...' : 'Change Password'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSetInitialPassword} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="initial-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="initial-password"
                        type={showNewPassword ? "text" : "password"}
                        value={initialPasswordData.password}
                        onChange={(e) => setInitialPasswordData({ ...initialPasswordData, password: e.target.value })}
                        placeholder="Enter your password"
                        minLength={6}
                        className="input-standard pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="initial-confirm">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="initial-confirm"
                        type={showConfirmPassword ? "text" : "password"}
                        value={initialPasswordData.confirmPassword}
                        onChange={(e) => setInitialPasswordData({ ...initialPasswordData, confirmPassword: e.target.value })}
                        placeholder="Confirm your password"
                        minLength={6}
                        className="input-standard pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  disabled={loading}
                  className="btn-standard bg-[var(--healthscan-green)] hover:bg-[var(--healthscan-light-green)] text-white"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {loading ? 'Setting Password...' : 'Set Password'}
                </Button>
              </form>
            )}
          </Card>

          {/* Notification Preferences */}
          <Card className="p-6 bg-white">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Preferences
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Updates</p>
                  <p className="text-sm text-[var(--healthscan-text-muted)]">Receive general updates about HealthScan</p>
                </div>
                <Switch
                  checked={notifications.emailUpdates}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, emailUpdates: checked })}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Referral Notifications</p>
                  <p className="text-sm text-[var(--healthscan-text-muted)]">Get notified when someone uses your referral link</p>
                </div>
                <Switch
                  checked={notifications.referralNotifications}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, referralNotifications: checked })}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Launch Updates</p>
                  <p className="text-sm text-[var(--healthscan-text-muted)]">Important announcements about the app launch</p>
                </div>
                <Switch
                  checked={notifications.launchUpdates}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, launchUpdates: checked })}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Weekly Digest</p>
                  <p className="text-sm text-[var(--healthscan-text-muted)]">Weekly summary of your referral progress</p>
                </div>
                <Switch
                  checked={notifications.weeklyDigest}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyDigest: checked })}
                />
              </div>
            </div>
          </Card>

          {/* Privacy Settings */}
          <Card className="p-6 bg-white">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy Settings
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show in Leaderboard</p>
                  <p className="text-sm text-[var(--healthscan-text-muted)]">Display your referral progress on the public leaderboard</p>
                </div>
                <Switch
                  checked={privacy.showInLeaderboard}
                  onCheckedChange={(checked) => setPrivacy({ ...privacy, showInLeaderboard: checked })}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Share Referral Stats</p>
                  <p className="text-sm text-[var(--healthscan-text-muted)]">Allow others to see your referral statistics</p>
                </div>
                <Switch
                  checked={privacy.shareReferralStats}
                  onCheckedChange={(checked) => setPrivacy({ ...privacy, shareReferralStats: checked })}
                />
              </div>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="p-6 bg-white border-red-200">
            <h2 className="text-xl font-semibold text-red-600 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </h2>
            
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Deleting your account will permanently remove all your data, including your referral progress and waitlist position. This action cannot be undone.
              </AlertDescription>
            </Alert>
            
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={loading}
              className="btn-standard bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {loading ? 'Deleting Account...' : 'Delete Account'}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}