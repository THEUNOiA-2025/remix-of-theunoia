import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileText, Image as ImageIcon, Download } from 'lucide-react';

interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    is_read: boolean;
    attachments?: Attachment[] | unknown | null;
  };
  isSender: boolean;
  senderAvatar?: string | null;
  senderName?: string;
}

export const MessageBubble = ({ message, isSender, senderAvatar, senderName }: MessageBubbleProps) => {
  const initials = senderName
    ? senderName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const isImage = (type: string) => type.startsWith('image/');

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={`flex items-end gap-2 ${isSender ? 'justify-end' : 'justify-start'} mb-4`}>
      {/* Avatar on left for received messages */}
      {!isSender && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={senderAvatar || undefined} alt={senderName} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
        </Avatar>
      )}

      <div
        className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
          isSender
            ? 'bg-secondary text-secondary-foreground rounded-br-sm'
            : 'bg-accent text-accent-foreground rounded-bl-sm border border-accent'
        }`}
      >
        {/* Attachments */}
        {message.attachments && Array.isArray(message.attachments) && message.attachments.length > 0 && (
          <div className="space-y-2 mb-2">
            {(message.attachments as Attachment[]).map((attachment, index) => (
              <div key={index}>
                {isImage(attachment.type) ? (
                  <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="block">
                    <img 
                      src={attachment.url} 
                      alt={attachment.name} 
                      className="max-w-full rounded-lg max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    />
                  </a>
                ) : (
                  <a 
                    href={attachment.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 p-2 rounded-lg ${
                      isSender ? 'bg-secondary-foreground/10' : 'bg-background/50'
                    } hover:opacity-80 transition-opacity`}
                  >
                    <FileText className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{attachment.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
                    </div>
                    <Download className="w-4 h-4 flex-shrink-0" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Text content */}
        {message.content && (
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
        )}
        
        <div className="flex items-center justify-end gap-2 mt-1.5">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* Avatar on right for sent messages */}
      {isSender && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={senderAvatar || undefined} alt={senderName} />
          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">{initials}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};
