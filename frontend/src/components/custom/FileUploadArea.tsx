import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { PlusIcon, ClipboardIcon, SendIcon } from 'lucide-react';
import { FileItem } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface FileUploadAreaProps {
  onSend: (textContent: string, files: FileItem[], images: FileItem[]) => void;
  isLoading?: boolean;
}

export function FileUploadArea({ onSend, isLoading = false }: FileUploadAreaProps) {
  const [textContent, setTextContent] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [images, setImages] = useState<FileItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const createFileItem = (file: File): FileItem => {
    return {
      id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file)
    };
  };
  
  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    
    const newFiles: FileItem[] = [];
    const newImages: FileItem[] = [];
    
    Array.from(selectedFiles).forEach(file => {
      const fileItem = createFileItem(file);
      
      if (file.type.startsWith('image/')) {
        newImages.push(fileItem);
      } else {
        newFiles.push(fileItem);
      }
    });
    
    setFiles(prev => [...prev, ...newFiles]);
    setImages(prev => [...prev, ...newImages]);
    
    toast({
      title: "Files added",
      description: `Added ${selectedFiles.length} file(s) to your transfer`,
    });
  };
  
  const handlePaste = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      
      for (const clipboardItem of clipboardItems) {
        // Handle images
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type);
            const file = new File([blob], `pasted-image-${Date.now()}.png`, { type });
            const imageItem = createFileItem(file);
            setImages(prev => [...prev, imageItem]);
            
            toast({
              title: "Image pasted",
              description: "Image added from clipboard",
            });
            return;
          }
        }
      }
      
      // Handle text
      const text = await navigator.clipboard.readText();
      if (text) {
        setTextContent(prev => prev + (prev ? '\n' : '') + text);
        toast({
          title: "Text pasted",
          description: "Text added from clipboard",
        });
      }
    } catch (error) {
      toast({
        title: "Paste failed",
        description: "Could not access clipboard. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const removeFile = (id: string, type: 'file' | 'image') => {
    if (type === 'file') {
      setFiles(prev => prev.filter(f => f.id !== id));
    } else {
      setImages(prev => prev.filter(f => f.id !== id));
    }
  };
  
  const handleSend = () => {
    if (!textContent.trim() && files.length === 0 && images.length === 0) {
      toast({
        title: "Nothing to send",
        description: "Please add some content before sending",
        variant: "destructive"
      });
      return;
    }
    
    onSend(textContent.trim(), files, images);
    
    // Clear form
    setTextContent('');
    setFiles([]);
    setImages([]);
  };
  
  const totalItems = files.length + images.length;
  
  return (
    <Card className="p-4 border-2 border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/10">
      <div className="space-y-4">
        {/* Text input area */}
        <div>
          <Textarea
            placeholder="Type your message here... You can also paste images and files using the buttons below."
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            className="min-h-[100px] resize-none border-green-300 focus:border-green-500 dark:border-green-700 dark:focus:border-green-500"
          />
        </div>
        
        {/* File preview */}
        {totalItems > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-green-700 dark:text-green-300">
              Attached Files ({totalItems})
            </h4>
            
            {/* Images preview */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {images.map((image) => (
                  <div key={image.id} className="relative group">
                    <div className="bg-white dark:bg-gray-800 p-2 rounded border">
                      <p className="text-xs font-medium truncate">{image.name}</p>
                      <p className="text-xs text-muted-foreground">{(image.size / 1024).toFixed(1)} KB</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-1 right-1 h-5 w-5 p-0 text-red-500 hover:text-red-700"
                        onClick={() => removeFile(image.id, 'image')}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Files list */}
            {files.length > 0 && (
              <div className="space-y-1">
                {files.map((file) => (
                  <div key={file.id} className="bg-white dark:bg-gray-800 p-2 rounded border flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                      onClick={() => removeFile(file.id, 'file')}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePaste}
            className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-950/20"
          >
            <ClipboardIcon className="h-4 w-4 mr-2" />
            Paste
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-950/20"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add File
          </Button>
          
          <Button
            onClick={handleSend}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 text-white ml-auto"
          >
            <SendIcon className="h-4 w-4 mr-2" />
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </div>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </div>
    </Card>
  );
}