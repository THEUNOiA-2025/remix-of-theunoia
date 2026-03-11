import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConversationItem } from '@/components/ConversationItem';
import { MessageBubble } from '@/components/MessageBubble';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { Send, MessageSquare, Paperclip, Image as ImageIcon, X, IndianRupee, Clock, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { recordActivity } from '@/utils/dailyStreak';

export default function MessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to real-time updates for the selected conversation
  const { isSubscribed } = useRealtimeMessages(selectedConversationId);

  // Fetch current user's profile for avatar
  const { data: currentUserProfile } = useQuery({
    queryKey: ['currentUserProfile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('first_name, last_name, profile_picture_url')
        .eq('user_id', user?.id)
        .single();

      console.log("User ID:", user?.id);
      console.log("Data:", data);
      console.log("Error:", error);

      return data ?? null;
    },
    enabled: !!user?.id,
  });

  // Fetch conversations with full project details
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data: convos, error } = await supabase
        .from('conversations')
        .select(`
          id,
          project_id,
          client_id,
          freelancer_id,
          last_message_at,
          user_projects (
            id,
            title,
            description,
            budget,
            timeline,
            status,
            skills_required,
            category,
            subcategory,
            cover_image_url
          )
        `)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Fetch user profiles and last messages for each conversation
      const enrichedConvos = await Promise.all(
        (convos || []).map(async (convo) => {
          const otherUserId = convo.client_id === user?.id ? convo.freelancer_id : convo.client_id;
          
          // Fetch other user's profile
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('first_name, last_name, profile_picture_url')
            .eq('user_id', otherUserId)
            .single();

          console.log("User ID:", otherUserId);
          console.log("Data:", profile);
          console.log("Error:", profileError);

          // Fetch last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content')
            .eq('conversation_id', convo.id)
            .order('created_at', { ascending: false })
            .limit(1);

          // Count unread messages
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', convo.id)
            .eq('is_read', false)
            .neq('sender_id', user?.id || '');

          return {
            id: convo.id,
            project_id: convo.project_id,
            project: convo.user_projects,
            project_title: convo.user_projects?.title || 'Unknown Project',
            other_user_id: otherUserId,
            other_user_name: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown User',
            other_user_avatar: profile?.profile_picture_url,
            last_message: lastMessage?.[0]?.content,
            last_message_at: convo.last_message_at,
            unread_count: unreadCount || 0,
            is_client: convo.client_id === user?.id,
          };
        })
      );

      return enrichedConvos;
    },
  });

  // Fetch messages for selected conversation
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedConversationId],
    queryFn: async () => {
      if (!selectedConversationId) return [];

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!selectedConversationId,
  });

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (selectedConversationId && messages && user) {
      const unreadMessages = messages.filter(
        (msg) => !msg.is_read && msg.sender_id !== user.id
      );

      if (unreadMessages.length > 0) {
        unreadMessages.forEach(async (msg) => {
          await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('id', msg.id);
        });
        
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    }
  }, [selectedConversationId, messages, user, queryClient]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Upload files and send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, files }: { content: string; files: File[] }) => {
      if (!selectedConversationId || !user) throw new Error('No conversation selected');

      let attachments: { name: string; url: string; type: string; size: number }[] = [];

      // Upload files if any
      if (files.length > 0) {
        setIsUploading(true);
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('message-attachments')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('message-attachments')
            .getPublicUrl(fileName);

          attachments.push({
            name: file.name,
            url: publicUrl,
            type: file.type,
            size: file.size,
          });
        }
      }

      const { error } = await supabase.from('messages').insert({
        conversation_id: selectedConversationId,
        sender_id: user.id,
        content: content.trim(),
        attachments: attachments.length > 0 ? attachments : null,
      });

      if (error) throw error;

      // Update last_message_at for the conversation
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedConversationId);
    },
    onSuccess: () => {
      setMessageInput('');
      setSelectedFiles([]);
      setIsUploading(false);
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      // Record activity for daily streak (message sent)
      if (user?.id) {
        recordActivity(user.id);
      }
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      setIsUploading(false);
      toast.error('Failed to send message');
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((messageInput.trim() || selectedFiles.length > 0) && !sendMessageMutation.isPending && !isUploading) {
      sendMessageMutation.mutate({ content: messageInput, files: selectedFiles });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024); // 10MB limit
    
    if (validFiles.length !== files.length) {
      toast.error('Some files exceed the 10MB limit');
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 files
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const selectedConversation = conversations?.find(c => c.id === selectedConversationId);

  return (
    <main className="flex h-screen overflow-hidden">
      {/* Left Column - Conversations List */}
      <div className="w-80 border-r border-border flex flex-col bg-background h-full">
        <div className="p-5 border-b border-border bg-gradient-to-r from-primary/10 to-accent-purple/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Messages</h1>
              <p className="text-xs text-muted-foreground">Chat with clients & freelancers</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversationsLoading ? (
            <div className="p-4 text-center text-muted-foreground">Loading conversations...</div>
          ) : conversations && conversations.length > 0 ? (
            conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={selectedConversationId === conversation.id}
                onClick={() => setSelectedConversationId(conversation.id)}
              />
            ))
          ) : (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent-purple/20 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <p className="text-foreground font-medium mb-2">No conversations yet</p>
              <p className="text-sm text-muted-foreground">
                Start by bidding on a project or posting your own
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Middle Column - Active Chat */}
      <div className="flex-1 flex flex-col bg-background h-full">
        {selectedConversationId && selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-muted/30">
              <h2 className="font-semibold text-foreground">{selectedConversation.other_user_name}</h2>
              <p className="text-sm text-muted-foreground">{selectedConversation.project_title}</p>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-background">
              {messagesLoading ? (
                <div className="text-center text-muted-foreground">Loading messages...</div>
              ) : messages && messages.length > 0 ? (
                <>
                  {messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isSender={message.sender_id === user?.id}
                      senderAvatar={message.sender_id === user?.id 
                        ? currentUserProfile?.profile_picture_url 
                        : selectedConversation.other_user_avatar}
                      senderName={message.sender_id === user?.id 
                        ? `${currentUserProfile?.first_name || ''} ${currentUserProfile?.last_name || ''}`.trim() 
                        : selectedConversation.other_user_name}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No messages yet. Start the conversation!
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-border bg-background">
              {/* Selected Files Preview */}
              {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg text-sm">
                      {file.type.startsWith('image/') ? (
                        <ImageIcon className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Paperclip className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="truncate max-w-32">{file.name}</span>
                      <button 
                        type="button" 
                        onClick={() => removeFile(index)}
                        className="hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sendMessageMutation.isPending || isUploading}
                >
                  <Paperclip className="h-5 w-5 text-muted-foreground" />
                </Button>
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-muted border-border focus:border-primary rounded-full px-4"
                  disabled={sendMessageMutation.isPending || isUploading}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="rounded-full w-11 h-11 bg-primary hover:bg-primary/90 flex-shrink-0"
                  disabled={(!messageInput.trim() && selectedFiles.length === 0) || sendMessageMutation.isPending || isUploading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              {isUploading && (
                <p className="text-xs text-muted-foreground mt-2">Uploading files...</p>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/5">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-10 h-10 text-primary/60" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">Choose a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Column - Project Details */}
      {selectedConversationId && selectedConversation && (
        <div className="w-80 border-l border-border p-4 bg-background h-full overflow-y-auto">
          <Card className="p-4 border-border bg-muted/20 space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-1">Project Details</h3>
              <p className="text-xs text-muted-foreground">
                {selectedConversation.is_client ? 'You are the client' : 'You are the freelancer'}
              </p>
            </div>

            {/* Project Cover Image */}
            {selectedConversation.project?.cover_image_url && (
              <div className="rounded-lg overflow-hidden">
                <img 
                  src={selectedConversation.project.cover_image_url} 
                  alt={selectedConversation.project_title}
                  className="w-full h-32 object-cover"
                />
              </div>
            )}
            
            {/* Project Title & Category */}
            <div>
              <h4 className="font-medium text-foreground line-clamp-2">{selectedConversation.project_title}</h4>
              {selectedConversation.project?.category && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {selectedConversation.project.category}
                  </Badge>
                  {selectedConversation.project?.subcategory && (
                    <Badge variant="outline" className="text-xs">
                      {selectedConversation.project.subcategory}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Budget & Timeline */}
            <div className="grid grid-cols-2 gap-3">
              {selectedConversation.project?.budget && (
                <div className="bg-background rounded-lg p-2.5">
                  <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
                    <IndianRupee className="w-3 h-3" />
                    <span className="text-xs">Budget</span>
                  </div>
                  <p className="font-semibold text-foreground text-sm">₹{selectedConversation.project.budget}</p>
                </div>
              )}
              {selectedConversation.project?.timeline && (
                <div className="bg-background rounded-lg p-2.5">
                  <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">Timeline</span>
                  </div>
                  <p className="font-semibold text-foreground text-sm">{selectedConversation.project.timeline}</p>
                </div>
              )}
            </div>

            {/* Status */}
            {selectedConversation.project?.status && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Badge variant={selectedConversation.project.status === 'open' ? 'secondary' : selectedConversation.project.status === 'in_progress' ? 'default' : 'outline'}>
                  {selectedConversation.project.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              </div>
            )}

            {/* Description */}
            {selectedConversation.project?.description && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Description</p>
                <p className="text-sm text-foreground line-clamp-4">{selectedConversation.project.description}</p>
              </div>
            )}

            {/* Skills Required */}
            {selectedConversation.project?.skills_required && selectedConversation.project.skills_required.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Skills Required</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedConversation.project.skills_required.map((skill: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Participant */}
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">
                {selectedConversation.is_client ? 'Freelancer' : 'Client'}
              </p>
              <p className="text-sm font-medium text-foreground">{selectedConversation.other_user_name}</p>
            </div>

            {/* View Project Button */}
            {selectedConversation.project_id && (
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={() => navigate(`/projects/${selectedConversation.project_id}`)}
              >
                <ExternalLink className="w-4 h-4" />
                View Full Project
              </Button>
            )}
          </Card>
        </div>
      )}
    </main>
  );
}
