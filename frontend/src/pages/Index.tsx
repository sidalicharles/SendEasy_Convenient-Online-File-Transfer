import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Toaster } from '@/components/ui/toaster';
import { LinkIcon, SunIcon, MoonIcon, CopyIcon } from 'lucide-react';
import { FileTransferCard } from '@/components/custom/FileTransferCard';
import { FileUploadArea } from '@/components/custom/FileUploadArea';
import { AppState, Session, FileItem } from '@/types';
import { mockApi } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/use-localStorage';

const Index = () => {
  const [appState, setAppState] = useLocalStorage<AppState>('sendeasy_app_state', {
    currentView: 'landing',
    currentSession: null,
    isDarkMode: false,
    receiverPassword: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Apply dark mode
  useEffect(() => {
    if (appState.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [appState.isDarkMode]);
  
  const toggleDarkMode = () => {
    setAppState(prev => ({ ...prev, isDarkMode: !prev.isDarkMode }));
  };
  
  const handleSendFile = () => {
    setIsLoading(true);
    
    const sessionResponse = mockApi.generateSession();
    if (sessionResponse.success && sessionResponse.data) {
      const saveResponse = mockApi.saveSession(sessionResponse.data);
      if (saveResponse.success) {
        setAppState(prev => ({
          ...prev,
          currentView: 'send',
          currentSession: sessionResponse.data
        }));
        
        toast({
          title: "Session created",
          description: `Your password ${sessionResponse.data.password} has been copied to clipboard`,
        });
      } else {
        toast({
          title: "Error",
          description: saveResponse.message || "Failed to create session",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Error",
        description: sessionResponse.message || "Failed to generate session",
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
  };
  
  const handleReceiveFile = () => {
    if (!appState.receiverPassword.trim()) {
      toast({
        title: "Password required",
        description: "Please enter a password to receive files",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    const validateResponse = mockApi.validatePassword(appState.receiverPassword.trim());
    if (validateResponse.success && validateResponse.data) {
      setAppState(prev => ({
        ...prev,
        currentView: 'receive',
        currentSession: validateResponse.data,
        receiverPassword: ''
      }));
      
      toast({
        title: "Access granted",
        description: "You can now view and receive files",
      });
    } else {
      toast({
        title: "Invalid password",
        description: validateResponse.message || "Please check your password and try again",
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
  };
  
  const handleSendTransfer = (textContent: string, files: FileItem[], images: FileItem[]) => {
    if (!appState.currentSession) return;
    
    setIsLoading(true);
    
    const transferResponse = mockApi.addTransferBlock(
      appState.currentSession.id,
      textContent,
      files,
      images
    );
    
    if (transferResponse.success && transferResponse.data) {
      // Refresh session data
      const sessionsResponse = mockApi.getAllSessions();
      if (sessionsResponse.success && sessionsResponse.data) {
        const updatedSession = sessionsResponse.data.find(s => s.id === appState.currentSession?.id);
        if (updatedSession) {
          setAppState(prev => ({ ...prev, currentSession: updatedSession }));
        }
      }
      
      toast({
        title: "Content sent",
        description: "Your files and message have been added to the transfer",
      });
    } else {
      toast({
        title: "Send failed",
        description: transferResponse.message || "Failed to send content",
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
  };
  
  const handleDeleteBlock = (transferId: string) => {
    if (!appState.currentSession) return;
    
    const deleteResponse = mockApi.deleteTransferBlock(appState.currentSession.id, transferId);
    if (deleteResponse.success) {
      // Refresh session data
      const sessionsResponse = mockApi.getAllSessions();
      if (sessionsResponse.success && sessionsResponse.data) {
        const updatedSession = sessionsResponse.data.find(s => s.id === appState.currentSession?.id);
        if (updatedSession) {
          setAppState(prev => ({ ...prev, currentSession: updatedSession }));
        }
      }
      
      toast({
        title: "Block deleted",
        description: "Transfer block has been removed",
      });
    } else {
      toast({
        title: "Delete failed",
        description: deleteResponse.message || "Failed to delete block",
        variant: "destructive"
      });
    }
  };
  
  const handleExtendBlock = (transferId: string) => {
    if (!appState.currentSession) return;
    
    const extendResponse = mockApi.extendTransferBlock(appState.currentSession.id, transferId);
    if (extendResponse.success) {
      // Refresh session data
      const sessionsResponse = mockApi.getAllSessions();
      if (sessionsResponse.success && sessionsResponse.data) {
        const updatedSession = sessionsResponse.data.find(s => s.id === appState.currentSession?.id);
        if (updatedSession) {
          setAppState(prev => ({ ...prev, currentSession: updatedSession }));
        }
      }
      
      toast({
        title: "Extended",
        description: "Transfer expiration extended by 1 day",
      });
    } else {
      toast({
        title: "Extend failed",
        description: extendResponse.message || "Failed to extend block",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteItem = (transferId: string, itemId: string, type: 'file' | 'image') => {
    if (!appState.currentSession) return;
    
    const sessionsResponse = mockApi.getAllSessions();
    if (sessionsResponse.success && sessionsResponse.data) {
      const sessions = sessionsResponse.data;
      const sessionIndex = sessions.findIndex(s => s.id === appState.currentSession?.id);
      
      if (sessionIndex >= 0) {
        const transferIndex = sessions[sessionIndex].transfers.findIndex(t => t.id === transferId);
        if (transferIndex >= 0) {
          if (type === 'file') {
            sessions[sessionIndex].transfers[transferIndex].files = 
              sessions[sessionIndex].transfers[transferIndex].files.filter(f => f.id !== itemId);
          } else {
            sessions[sessionIndex].transfers[transferIndex].images = 
              sessions[sessionIndex].transfers[transferIndex].images.filter(f => f.id !== itemId);
          }
          
          localStorage.setItem('sendeasy_sessions', JSON.stringify(sessions));
          setAppState(prev => ({ ...prev, currentSession: sessions[sessionIndex] }));
          
          toast({
            title: "Item deleted",
            description: `${type === 'file' ? 'File' : 'Image'} has been removed`,
          });
        }
      }
    }
  };
  
  const copyPassword = () => {
    if (appState.currentSession?.password) {
      navigator.clipboard.writeText(appState.currentSession.password).then(() => {
        toast({
          title: "Copied",
          description: "Password copied to clipboard",
        });
      }).catch(() => {
        toast({
          title: "Copy failed",
          description: "Could not copy password to clipboard",
          variant: "destructive"
        });
      });
    }
  };
  
  const goToLanding = () => {
    setAppState(prev => ({
      ...prev,
      currentView: 'landing',
      currentSession: null,
      receiverPassword: ''
    }));
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
      {/* Header */}
      <header className="border-b border-green-200 dark:border-green-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={goToLanding}
            className="flex items-center gap-2 text-green-700 dark:text-green-300 hover:text-green-800 dark:hover:text-green-200 transition-colors"
          >
            <LinkIcon className="h-6 w-6" />
            <span className="text-xl font-bold">SendEasy</span>
          </button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDarkMode}
            className="text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/20"
          >
            {appState.isDarkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </Button>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {/* Landing Page */}
        {appState.currentView === 'landing' && (
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <LinkIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-green-800 dark:text-green-200">SendEasy</h1>
              <p className="text-green-600 dark:text-green-400">Simple, secure file transfers without accounts</p>
            </div>
            
            <div className="space-y-4">
              <Button
                onClick={handleSendFile}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
              >
                Send File
              </Button>
              
              <div className="space-y-2">
                <Input
                  placeholder="Enter password to receive files"
                  value={appState.receiverPassword}
                  onChange={(e) => setAppState(prev => ({ ...prev, receiverPassword: e.target.value }))}
                  className="border-green-300 focus:border-green-500 dark:border-green-700 dark:focus:border-green-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleReceiveFile()}
                />
                <Button
                  onClick={handleReceiveFile}
                  disabled={isLoading || !appState.receiverPassword.trim()}
                  variant="outline"
                  className="w-full border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-950/20 py-6 text-lg"
                >
                  Receive File
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Send/Receive Interface */}
        {(appState.currentView === 'send' || appState.currentView === 'receive') && appState.currentSession && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Session info */}
            <Card className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-green-800 dark:text-green-200">
                    {appState.currentView === 'send' ? 'Send Files' : 'Receive Files'}
                  </h2>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Session active • Password: <span className="font-mono font-bold">{appState.currentSession.password}</span>
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyPassword}
                  className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-950/20"
                >
                  <CopyIcon className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            </Card>
            
            {/* Upload area (only for send mode) */}
            {appState.currentView === 'send' && (
              <FileUploadArea
                onSend={handleSendTransfer}
                isLoading={isLoading}
              />
            )}
            
            {/* Transfer history */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                Transfer History ({appState.currentSession.transfers.length})
              </h3>
              
              {appState.currentSession.transfers.length === 0 ? (
                <Card className="p-8 text-center border-green-200 dark:border-green-800">
                  <p className="text-green-600 dark:text-green-400">
                    {appState.currentView === 'send' 
                      ? 'No transfers yet. Use the form above to send your first file or message.'
                      : 'No transfers available for this session.'}
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {appState.currentSession.transfers
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((transfer) => (
                      <FileTransferCard
                        key={transfer.id}
                        transfer={transfer}
                        onDeleteBlock={handleDeleteBlock}
                        onExtendBlock={handleExtendBlock}
                        onDeleteItem={handleDeleteItem}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      
      <Toaster />
    </div>
  );
};

export default Index;