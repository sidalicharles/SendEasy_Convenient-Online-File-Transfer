import { Button } from '@/components/ui/button';
import { Link2 } from 'lucide-react';

interface LandingPageProps {
  onSendFile: () => void;
  onReceiveFile: () => void;
}

export const LandingPage = ({ onSendFile, onReceiveFile }: LandingPageProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-md w-full">
        <div className="flex items-center justify-center space-x-2 mb-8">
          <Link2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          <h1 className="text-3xl font-bold text-green-800 dark:text-green-200">
            SendEasy
          </h1>
        </div>
        
        <div className="space-y-4">
          <Button
            onClick={onSendFile}
            className="w-full h-14 text-lg bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
            size="lg"
          >
            Send File
          </Button>
          
          <Button
            onClick={onReceiveFile}
            variant="outline"
            className="w-full h-14 text-lg border-green-600 text-green-600 hover:bg-green-50 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-950"
            size="lg"
          >
            Receive File
          </Button>
        </div>
      </div>
    </div>
  );
};