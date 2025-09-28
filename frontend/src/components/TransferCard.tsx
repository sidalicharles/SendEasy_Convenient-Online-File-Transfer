import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Trash2, Clock, FileText, Download } from 'lucide-react';
import { TransferBlock } from '../types';

interface TransferCardProps {
  transferBlock: TransferBlock;
  onExtend: () => void;
  onDeleteBlock: () => void;
  onDeleteItem: (itemId: string, type: 'text' | 'file') => void;
}

export const TransferCard = ({ 
  transferBlock, 
  onExtend, 
  onDeleteBlock, 
  onDeleteItem 
}: TransferCardProps) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isExpiringSoon = () => {
    const expiresAt = new Date(transferBlock.expiresAt);
    const now = new Date();
    const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilExpiry < 2;
  };

  return (
    <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/50">
      <CardContent className="p-4 space-y-4">
        {/* Text Items */}
        {transferBlock.textItems && transferBlock.textItems.length > 0 && (
          <div className="space-y-2">
            {transferBlock.textItems.map((textItem) => (
              <div key={textItem.id} className="flex items-start justify-between bg-white dark:bg-gray-800 p-3 rounded border">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <FileText className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Text • {formatDate(textItem.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {textItem.content}
                  </p>
                </div>
                <Button
                  onClick={() => onDeleteItem(textItem.id, 'text')}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/50 ml-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* File Items */}
        {transferBlock.fileItems && transferBlock.fileItems.length > 0 && (
          <div className="space-y-2">
            {transferBlock.fileItems.map((fileItem) => (
              <div key={fileItem.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded border">
                <div className="flex items-center flex-1">
                  <Download className="h-4 w-4 text-green-600 dark:text-green-400 mr-3" />
                  <div>
                    <p className="font-medium text-sm">{fileItem.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {formatFileSize(fileItem.size)} • {formatDate(fileItem.uploadedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => window.open(fileItem.url, '_blank')}
                    variant="outline"
                    size="sm"
                    className="border-green-600 text-green-600 hover:bg-green-50 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-950"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => onDeleteItem(fileItem.id, 'file')}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Expiration Info */}
        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
          <Clock className="h-3 w-3 mr-1" />
          <span className={isExpiringSoon() ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
            Expires: {formatDate(transferBlock.expiresAt)}
          </span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex justify-between">
        <Button
          onClick={onDeleteBlock}
          variant="destructive"
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Delete All
        </Button>
        <Button
          onClick={onExtend}
          variant="outline"
          size="sm"
          className="border-green-600 text-green-600 hover:bg-green-50 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-950"
        >
          Extend
        </Button>
      </CardFooter>
    </Card>
  );
};