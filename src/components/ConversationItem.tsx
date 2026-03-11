import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface ConversationItemProps {
  conversation: {
    id: string;
    project_title: string;
    other_user_name: string;
    other_user_avatar?: string;
    last_message?: string;
    last_message_at?: string;
    unread_count?: number;
  };
  isActive: boolean;
  onClick: () => void;
}

export const ConversationItem = ({ conversation, isActive, onClick }: ConversationItemProps) => {
  const initials = conversation.other_user_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Generate a consistent pastel color based on the user name
  const colors = [
    'bg-purple-100 text-purple-700',
    'bg-pink-100 text-pink-700',
    'bg-blue-100 text-blue-700',
    'bg-green-100 text-green-700',
    'bg-yellow-100 text-yellow-700',
    'bg-indigo-100 text-indigo-700',
  ];
  const colorIndex = conversation.other_user_name.charCodeAt(0) % colors.length;

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 flex items-start gap-3 hover:bg-primary/5 transition-all border-b border-border text-left relative ${
        isActive ? 'bg-primary/10 border-l-4 border-l-primary' : ''
      }`}
    >
      <Avatar className="h-12 w-12 ring-2 ring-background shadow-md">
        <AvatarImage src={conversation.other_user_avatar} />
        <AvatarFallback className={`${colors[colorIndex]} font-semibold`}>{initials}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-foreground truncate">
            {conversation.other_user_name}
          </h3>
          {conversation.last_message_at && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
            </span>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground mb-1 truncate">
          {conversation.project_title}
        </p>
        
        <div className="flex items-center justify-between gap-2">
          {conversation.last_message && (
            <p className="text-sm text-muted-foreground truncate flex-1">
              {conversation.last_message}
            </p>
          )}
          {conversation.unread_count && conversation.unread_count > 0 && (
            <Badge variant="default" className="ml-auto bg-primary text-primary-foreground border-0 shadow-md">
              {conversation.unread_count}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
};
