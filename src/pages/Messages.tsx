import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MessageCircle, Send, ArrowLeft, Loader2, Search, MoreVertical, Phone, Video, CheckCheck, Check
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { UpgradeToAgentDialog } from "@/components/UpgradeToAgentDialog";

interface Conversation {
  id: string;
  property_id: string | null;
  participant_1: string;
  participant_2: string;
  last_message_at: string;
  other_user?: { id: string; name: string; profile_photo_url: string | null; };
  property?: { title: string; photos: string[]; };
  unread_count?: number;
  last_message?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export default function Messages() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(searchParams.get("conversation"));
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
    if (user) {
      const checkRole = async () => {
        const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (data?.role === "property_owner") { setShowUpgrade(true); setLoading(false); }
      };
      checkRole();
    }
  }, [user, authLoading, navigate]);

  useEffect(() => { if (user && !showUpgrade) fetchConversations(); }, [user, showUpgrade]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation);
      markMessagesAsRead(activeConversation);
      const channel = supabase.channel(`messages:${activeConversation}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeConversation}` }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages((prev) => [...prev, newMsg]);
        if (newMsg.sender_id !== user?.id) markMessagesAsRead(activeConversation);
      }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [activeConversation, user]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const fetchConversations = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("conversations").select(`*, properties:property_id (title, photos)`).or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`).order("last_message_at", { ascending: false });
    if (!error && data) {
      const convosWithProfiles = await Promise.all(data.map(async (convo: any) => {
        const otherId = convo.participant_1 === user.id ? convo.participant_2 : convo.participant_1;
        const { data: profile } = await supabase.from("profiles").select("id, name, profile_photo_url").eq("id", otherId).single();
        const { count } = await supabase.from("messages").select("*", { count: "exact", head: true }).eq("conversation_id", convo.id).eq("is_read", false).neq("sender_id", user.id);
        const { data: lastMsg } = await supabase.from("messages").select("content").eq("conversation_id", convo.id).order("created_at", { ascending: false }).limit(1).single();
        return { ...convo, other_user: profile, property: convo.properties, unread_count: count || 0, last_message: lastMsg?.content || "" };
      }));
      setConversations(convosWithProfiles);
    }
    setLoading(false);
  };

  const fetchMessages = async (conversationId: string) => { const { data, error } = await supabase.from("messages").select("*").eq("conversation_id", conversationId).order("created_at", { ascending: true }); if (!error && data) setMessages(data); };
  const markMessagesAsRead = async (conversationId: string) => { if (!user) return; await supabase.from("messages").update({ is_read: true }).eq("conversation_id", conversationId).neq("sender_id", user.id).eq("is_read", false); };
  const sendMessage = async (e: React.FormEvent) => { e.preventDefault(); if (!newMessage.trim() || !activeConversation || !user) return; setSendingMessage(true); const { error } = await supabase.from("messages").insert({ conversation_id: activeConversation, sender_id: user.id, content: newMessage.trim() }); if (!error) { setNewMessage(""); inputRef.current?.focus(); } setSendingMessage(false); };
  const formatMessageDate = (date: Date) => { if (isToday(date)) return format(date, "h:mm a"); if (isYesterday(date)) return "Yesterday"; return format(date, "MMM d"); };
  const formatMessageTime = (date: Date) => format(date, "h:mm a");
  const groupMessagesByDate = (msgs: Message[]) => { const groups: { date: string; messages: Message[] }[] = []; let currentDate = ""; msgs.forEach((msg) => { const msgDate = format(new Date(msg.created_at), "yyyy-MM-dd"); if (msgDate !== currentDate) { currentDate = msgDate; groups.push({ date: msgDate, messages: [msg] }); } else { groups[groups.length - 1].messages.push(msg); } }); return groups; };
  const getDateLabel = (dateStr: string) => { const date = new Date(dateStr); if (isToday(date)) return "Today"; if (isYesterday(date)) return "Yesterday"; return format(date, "MMMM d, yyyy"); };
  const activeConvo = conversations.find((c) => c.id === activeConversation);
  const filteredConversations = conversations.filter((c) => c.other_user?.name?.toLowerCase().includes(searchQuery.toLowerCase()));

  if (showUpgrade) return <div className="min-h-screen bg-background"><Navbar /><UpgradeToAgentDialog open={true} onOpenChange={(open) => { if (!open) navigate(-1); }} featureName="Messages" /></div>;
  if (authLoading) return <div className="min-h-screen bg-background"><Navbar /><div className="flex flex-col gap-4 p-4">{[1,2,3,4].map((i) => (<div key={i} className="flex items-center gap-3"><Skeleton className="h-14 w-14 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-48" /></div></div>))}</div></div>;

  // Desktop: side-by-side layout
  const ConversationsList = ({ className = "" }: { className?: string }) => (
    <div className={className}>
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-2xl font-bold mb-4">Messages</h1>
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search conversations..." className="pl-10 rounded-full bg-muted border-0" />
        </div>
      </div>
      <div className="divide-y divide-border">
        {loading ? (
          <div className="space-y-1">{[1,2,3,4,5].map((i) => (<div key={i} className="flex items-center gap-3 p-4"><Skeleton className="h-14 w-14 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-48" /></div><Skeleton className="h-3 w-12" /></div>))}</div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4"><MessageCircle className="h-10 w-10 text-muted-foreground" /></div>
            <h3 className="font-semibold text-lg mb-1">No messages yet</h3>
            <p className="text-muted-foreground text-sm max-w-xs">Start a conversation by contacting a property owner or agent</p>
            <Button className="mt-4 rounded-full" onClick={() => navigate("/explore")}>Browse Properties</Button>
          </div>
        ) : (
          filteredConversations.map((convo) => (
            <div key={convo.id} className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors ${convo.unread_count && convo.unread_count > 0 ? "bg-primary/5" : ""} ${activeConversation === convo.id ? "bg-muted" : ""}`} onClick={() => setActiveConversation(convo.id)}>
              <div className="relative">
                <Avatar className="h-14 w-14"><AvatarImage src={convo.other_user?.profile_photo_url || undefined} /><AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">{convo.other_user?.name?.charAt(0) || "U"}</AvatarFallback></Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-background" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between"><h3 className="font-semibold truncate">{convo.other_user?.name || "Unknown"}</h3><span className="text-xs text-muted-foreground shrink-0 ml-2">{formatMessageDate(new Date(convo.last_message_at))}</span></div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className={`text-sm truncate ${convo.unread_count && convo.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>{convo.last_message || "Start a conversation"}</p>
                  {convo.unread_count && convo.unread_count > 0 ? <Badge className="ml-2 h-5 min-w-[20px] flex items-center justify-center rounded-full text-[10px] px-1.5">{convo.unread_count}</Badge> : null}
                </div>
                {convo.property && <p className="text-xs text-muted-foreground mt-0.5 truncate">📍 {convo.property.title}</p>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const ChatView = ({ showBack = true }: { showBack?: boolean }) => {
    if (!activeConversation || !activeConvo) return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center"><MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted" /><p>Select a conversation to start messaging</p></div>
      </div>
    );
    const messageGroups = groupMessagesByDate(messages);
    return (
      <div className="flex flex-col h-full">
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="flex items-center gap-3 p-3">
            {showBack && <Button variant="ghost" size="icon" className="shrink-0 h-10 w-10 rounded-full" onClick={() => setActiveConversation(null)}><ArrowLeft className="h-5 w-5" /></Button>}
            <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => activeConvo.other_user && navigate(`/profile/${activeConvo.other_user.id}`)}>
              <div className="relative"><Avatar className="h-11 w-11 ring-2 ring-primary/20"><AvatarImage src={activeConvo.other_user?.profile_photo_url || undefined} /><AvatarFallback className="bg-primary/10 text-primary font-semibold">{activeConvo.other_user?.name?.charAt(0) || "U"}</AvatarFallback></Avatar><div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-background" /></div>
              <div className="flex-1 min-w-0"><h2 className="font-semibold text-base truncate">{activeConvo.other_user?.name || "Unknown"}</h2><p className="text-xs text-muted-foreground">Online</p></div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hidden sm:flex"><Phone className="h-5 w-5" /></Button>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hidden sm:flex"><Video className="h-5 w-5" /></Button>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full"><MoreVertical className="h-5 w-5" /></Button>
            </div>
          </div>
          {activeConvo.property && (
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 cursor-pointer hover:bg-muted transition-colors" onClick={() => navigate(`/property/${activeConvo.property_id}`)}>
              {activeConvo.property.photos?.[0] && <img src={activeConvo.property.photos[0]} alt="" className="h-8 w-8 rounded-md object-cover" />}
              <p className="text-xs text-muted-foreground truncate flex-1">Discussing: <span className="text-foreground font-medium">{activeConvo.property.title}</span></p>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messageGroups.map((group) => (
            <div key={group.date}>
              <div className="flex items-center justify-center my-4"><span className="px-3 py-1 text-xs font-medium text-muted-foreground bg-muted rounded-full">{getDateLabel(group.date)}</span></div>
              <div className="space-y-1">
                {group.messages.map((msg, idx) => {
                  const isOwn = msg.sender_id === user?.id;
                  const showAvatar = !isOwn && (idx === 0 || group.messages[idx - 1]?.sender_id !== msg.sender_id);
                  const isLast = idx === group.messages.length - 1 || group.messages[idx + 1]?.sender_id !== msg.sender_id;
                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"}`}>
                      {!isOwn && (<div className="w-8">{showAvatar && (<Avatar className="h-8 w-8"><AvatarImage src={activeConvo.other_user?.profile_photo_url || undefined} /><AvatarFallback className="text-xs bg-muted">{activeConvo.other_user?.name?.charAt(0) || "U"}</AvatarFallback></Avatar>)}</div>)}
                      <div className={`max-w-[75%] px-4 py-2.5 ${isOwn ? `bg-primary text-primary-foreground ${isLast ? "rounded-2xl rounded-br-md" : "rounded-2xl"}` : `bg-muted ${isLast ? "rounded-2xl rounded-bl-md" : "rounded-2xl"}`}`}>
                        <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                        <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}><span className="text-[10px]">{formatMessageTime(new Date(msg.created_at))}</span>{isOwn && (msg.is_read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-lg border-t border-border p-3 pb-6 md:pb-3">
          <form onSubmit={sendMessage} className="flex items-center gap-2">
            <div className="flex-1 relative"><Input ref={inputRef} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." disabled={sendingMessage} className="rounded-full pl-4 pr-4 py-6 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-primary" /></div>
            <Button type="submit" size="icon" disabled={sendingMessage || !newMessage.trim()} className="h-12 w-12 rounded-full shrink-0">{sendingMessage ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}</Button>
          </form>
        </div>
      </div>
    );
  };

  // Mobile: show either list or chat
  if (isMobile) {
    if (activeConversation && activeConvo) return <div className="min-h-screen bg-background flex flex-col"><ChatView showBack={true} /></div>;
    return <div className="min-h-screen bg-background pb-20"><Navbar /><ConversationsList /></div>;
  }

  // Desktop: side-by-side
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 pt-4" style={{ height: "calc(100vh - 64px)" }}>
        <div className="grid grid-cols-[380px_1fr] gap-0 h-full border border-border rounded-2xl overflow-hidden bg-card">
          <div className="border-r border-border overflow-y-auto"><ConversationsList /></div>
          <ChatView showBack={false} />
        </div>
      </div>
    </div>
  );
}
