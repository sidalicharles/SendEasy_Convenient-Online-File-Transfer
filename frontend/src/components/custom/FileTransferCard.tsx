import { TransferBlock, FileItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2Icon, ClockIcon, DownloadIcon, PlayIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileTransferCardProps {
  transfer: TransferBlock;
  onDeleteBlock: (transferId: string) => void;
  onExtendBlock: (transferId: string) => void;
  onDeleteItem: (transferId: string, itemId: string, type: 'file' | 'image') => void;
}

export function FileTransferCard({ transfer, onDeleteBlock, onExtendBlock, onDeleteItem }: FileTransferCardProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const downloadFile = (file: FileItem) => {
    if (!file.url) return;
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const isExpired = new Date() > new Date(transfer.expiresAt);
  const hasContent = transfer.textContent || transfer.files.length > 0 || transfer.images.length > 0;
  
  if (!hasContent) return null;
  
  return (
    <Card className={cn(
      "p-4 border-2 transition-all duration-200",
      isExpired 
        ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20" 
        : "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20 hover:border-green-300 dark:hover:border-green-700"
    )}>
      <div className="space-y-4">
        {/* Header with timestamp */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Created: {formatDate(transfer.createdAt)}</span>
          <span className={cn(
            "flex items-center gap-1",
            isExpired ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
          )}>
            <ClockIcon className="h-3 w-3" />
            Expires: {formatDate(transfer.expiresAt)}
          </span>
        </div>
        
        {/* Text content */}
        {transfer.textContent && (
          <div className="bg-white dark:bg-gray-800 p-3 rounded border">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {transfer.textContent}
            </p>
          </div>
        )}
        
        {/* Images */}
        {transfer.images.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-green-700 dark:text-green-300">Images ({transfer.images.length})</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {transfer.images.map((image) => (
                <div key={image.id} className="bg-white dark:bg-gray-800 p-3 rounded border">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded border overflow-hidden flex-shrink-0">
                      <img 
                        src={image.url} 
                        alt={image.name}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => downloadFile(image)}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{image.name}</p>
                      <p className="text-xs text-muted-foreground mb-2">{formatFileSize(image.size)}</p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/20"
                          onClick={() => downloadFile(image)}
                        >
                          <DownloadIcon className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                          onClick={() => onDeleteItem(transfer.id, image.id, 'image')}
                        >
                          <Trash2Icon className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Files */}
        {transfer.files.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-green-700 dark:text-green-300">Files ({transfer.files.length})</h4>
            <div className="space-y-2">
              {transfer.files.map((file) => {
                const isVideo = file.type?.startsWith('video/');
                return (
                  <div key={file.id} className="bg-white dark:bg-gray-800 p-3 rounded border">
                    <div className="flex items-center gap-3">
                      {isVideo ? (
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded border overflow-hidden flex-shrink-0 relative">
                          <video 
                            src={file.url}
                            className="w-full h-full object-cover"
                            muted
                            preload="metadata"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <PlayIcon className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded border flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center px-1">
                            {file.name.split('.').pop()?.toUpperCase() || 'FILE'}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground mb-2">{formatFileSize(file.size)} • {file.type}</p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/20"
                            onClick={() => downloadFile(file)}
                          >
                            <DownloadIcon className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                            onClick={() => onDeleteItem(transfer.id, file.id, 'file')}
                          >
                            <Trash2Icon className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-green-200 dark:border-green-800">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDeleteBlock(transfer.id)}
            className="text-xs"
          >
            Delete All
          </Button>
          
          {!isExpired && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExtendBlock(transfer.id)}
              className="text-xs border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-950/20"
            >
              Extend
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}