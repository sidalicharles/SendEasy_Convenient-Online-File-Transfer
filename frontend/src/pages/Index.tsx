import { useState, useEffect } from 'react';
import { Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '../components/ThemeToggle';
import { LandingPage } from '../components/LandingPage';
import { SendInterface } from '../components/SendInterface';
import { apiService } from '../services/api';
import { useToast } from '@/hooks/use-toast';

type AppState = 'landing' | 'receive-input' | 'send-interface';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('landing');
  const [receivePassword, setReceivePassword] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [sessionPassword, setSessionPassword] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  // Generate device ID on first load
  const getDeviceId = () => {
    let deviceId = localStorage.getItem('sendeasy-device-id');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('sendeasy-device-id', deviceId);
    }
    return deviceId;
  };

  const handleSendFile = async () => {
    try {
      const deviceId = getDeviceId();
      const response = await apiService.createSession(deviceId);
      
      if (response.success && response.data) {
        setSessionId(response.data.session.id);
        setSessionPassword(response.data.password);
        setAppState('send-interface');
        
        // Auto-copy password to clipboard
        try {
          await navigator.clipboard.writeText(response.data.password);
          toast({
            title: 'Password copied',
            description: 'Session password copied to clipboard',
          });
        } catch (error) {
          console.error('Failed to copy password:', error);
        }
      } else {
        throw new Error(response.message || 'Failed to create session');
      }
    } catch (error) {
      console.error('Failed to create session:', error);
      toast({
        title: 'Session creation failed',
        description: 'Failed to create sending session. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleReceiveFile = () => {
    setAppState('receive-input');
  };

  const handlePasswordSubmit = async () => {
    if (!receivePassword.trim()) {
      toast({
        title: 'Password required',
        description: 'Please enter a password to receive files',
        variant: 'destructive',
      });
      return;
    }

    setIsValidating(true);
    try {
      const response = await apiService.validateSession(receivePassword.trim().toUpperCase());
      
      if (response.success && response.data?.valid && response.data.sessionId) {
        setSessionId(response.data.sessionId);
        setSessionPassword(receivePassword.trim().toUpperCase());
        setAppState('send-interface');
      } else {
        toast({
          title: 'Invalid password',
          description: 'The password you entered is invalid or expired',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to validate password:', error);
      toast({
        title: 'Validation failed',
        description: 'Failed to validate password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleBack = () => {
    setAppState('landing');
    setReceivePassword('');
    setSessionId('');
    setSessionPassword('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePasswordSubmit();
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-green-200 dark:border-green-800">
        <div className="flex items-center justify-between p-4 max-w-6xl mx-auto">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 text-green-700 dark:text-green-300 hover:text-green-800 dark:hover:text-green-200 transition-colors"
          >
            <Link2 className="h-6 w-6" />
            <span className="text-xl font-bold">SendEasy</span>
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20">
        {appState === 'landing' && (
          <LandingPage
            onSendFile={handleSendFile}
            onReceiveFile={handleReceiveFile}
          />
        )}

        {appState === 'receive-input' && (
          <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 flex flex-col items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg border border-green-200 dark:border-green-800 max-w-md w-full">
              <h2 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-6 text-center">
                Enter Password
              </h2>
              
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter 6-character password"
                  value={receivePassword}
                  onChange={(e) => setReceivePassword(e.target.value.toUpperCase())}
                  onKeyPress={handleKeyPress}
                  maxLength={6}
                  className="text-center text-lg font-mono border-green-200 dark:border-green-700 focus:border-green-500 dark:focus:border-green-400"
                  disabled={isValidating}
                />
                
                <div className="flex space-x-3">
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    className="flex-1 border-green-600 text-green-600 hover:bg-green-50 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-950"
                    disabled={isValidating}
                  >
                    Back
                  </Button>
                  
                  <Button
                    onClick={handlePasswordSubmit}
                    className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                    disabled={isValidating || !receivePassword.trim()}
                  >
                    {isValidating ? 'Validating...' : 'Access Files'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {appState === 'send-interface' && (
          <SendInterface
            sessionId={sessionId}
            sessionPassword={sessionPassword}
            onBack={handleBack}
          />
        )}
      </main>
    </div>
  );
};

export default Index;