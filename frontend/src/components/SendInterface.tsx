import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Copy, Paperclip, Send, Plus } from 'lucide-react';
import { apiService } from '../services/api';
import { TransferBlock } from '../types';
import { TransferCard } from './TransferCard';
import { useToast } from '@/hooks/use-toast';

interface SendInterfaceProps {
  sessionId: string;
  sessionPassword: string;
  onBack: () => void;
}

export const SendInterface = ({ sessionId, sessionPassword, onBack }: SendInterfaceProps) => {
  const [textContent, setTextContent] = useState('');
  const [transferBlocks, setTransferBlocks] = useState<TransferBlock[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTransferHistory();
  }, [sessionId]);

  const loadTransferHistory = async () => {
    try {
      const response = await apiService.getTransferHistory(sessionId);
      if (response.success && response.data) {
        setTransferBlocks(response.data.transferBlocks);
      }
    } catch (error) {
      console.error('Failed to load transfer history:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied to clipboard',
        description: 'Password copied successfully',
      });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handlePaste = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      
      for (const item of clipboardItems) {
        if (item.types.includes('text/plain')) {
          const text = await (await item.getType('text/plain')).text();
          setTextContent(prev => prev + (prev ? '\n' : '') + text);
        }
        
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            const file = new File([blob], `pasted-image-${Date.now()}.png`, { type });
            await handleUpload(undefined, [file]);
            return;
          }
        }
      }
    } catch (error) {
      console.error('Failed to paste from clipboard:', error);
      toast({
        title: 'Paste failed',
        description: 'Could not access clipboard content',
        variant: 'destructive',
      });
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleUpload(undefined, Array.from(files));
    }
  };

  const handleUpload = async (text?: string, files?: File[]) => {
    if (!text?.trim() && (!files || files.length === 0)) {
      toast({
        title: 'Nothing to send',
        description: 'Please add text or files to send',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileList = files ? {
        length: files.length,
        item: (index: number) => files[index],
        [Symbol.iterator]: function* () {
          for (let i = 0; i < files.length; i++) {
            yield files[i];
          }
        }
      } as FileList : undefined;

      const response = await apiService.uploadContent(
        sessionId,
        text?.trim(),
        fileList
      );

      if (response.success && response.data) {
        setTextContent('');
        await loadTransferHistory();
        toast({
          title: 'Content sent',
          description: 'Your content has been uploaded successfully',
        });
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSend = () => {
    handleUpload(textContent);
  };

  const handleExtend = async (blockId: string) => {
    try {
      const response = await apiService.extendTransferBlock(blockId);
      if (response.success) {
        await loadTransferHistory();
        toast({
          title: 'Extended successfully',
          description: 'Transfer block expiration extended to next day',
        });
      }
    } catch (error) {
      console.error('Failed to extend:', error);
      toast({
        title: 'Extension failed',
        description: 'Failed to extend expiration',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    try {
      const response = await apiService.deleteTransferBlock(blockId);
      if (response.success) {
        await loadTransferHistory();
        toast({
          title: 'Deleted successfully',
          description: 'Transfer block deleted',
        });
      }
    } catch (error) {
      console.error('Failed to delete block:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete transfer block',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteItem = async (itemId: string, type: 'text' | 'file') => {
    try {
      const response = type === 'text' 
        ? await apiService.deleteTextItem(itemId)
        : await apiService.deleteFileItem(itemId);
      
      if (response.success) {
        await loadTransferHistory();
        toast({
          title: 'Deleted successfully',
          description: `${type === 'text' ? 'Text' : 'File'} deleted`,
        });
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
      toast({
        title: 'Delete failed',
        description: `Failed to delete ${type}`,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Content Input */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-green-200 dark:border-green-800">
          <Textarea
            placeholder="Enter text, paste images, or add files..."
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            className="min-h-32 mb-4 border-green-200 dark:border-green-700 focus:border-green-500 dark:focus:border-green-400"
          />
          
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handlePaste}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-950"
            >
              Paste
            </Button>
            
            <Button
              onClick={handleFileSelect}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-950"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add File
            </Button>
            
            <Button
              onClick={handleSend}
              disabled={isUploading || (!textContent.trim())}
              className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
            >
              <Send className="h-4 w-4 mr-2" />
              {isUploading ? 'Sending...' : 'Send'}
            </Button>
          </div>
          
          <Input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Session Password */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Session Password:</span>
              <span className="ml-2 font-mono text-lg font-bold text-green-700 dark:text-green-300">
                {sessionPassword}
              </span>
            </div>
            <Button
              onClick={() => copyToClipboard(sessionPassword)}
              variant="outline"
              size="sm"
              className="border-green-600 text-green-600 hover:bg-green-50 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-950"
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
          </div>
        </div>

        {/* Transfer History */}
        {transferBlocks.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
              Transfer History
            </h3>
            {transferBlocks.map((block) => (
              <TransferCard
                key={block.id}
                transferBlock={block}
                onExtend={() => handleExtend(block.id)}
                onDeleteBlock={() => handleDeleteBlock(block.id)}
                onDeleteItem={handleDeleteItem}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};