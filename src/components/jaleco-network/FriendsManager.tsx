
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { UserSearchCard } from "./UserSearchCard";
import { PendingRequestsCard } from "./PendingRequestsCard";
import { FriendsListCard } from "./FriendsListCard";
import { SentRequestsCard } from "./SentRequestsCard";

interface FriendsManagerProps {
  user: User;
}

interface Profile {
  id: string;
  username: string;
  full_name: string;
  is_online: boolean;
}

interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  requester: Profile;
  addressee: Profile;
}

export const FriendsManager = ({ user }: FriendsManagerProps) => {
  const [friends, setFriends] = useState<Profile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [sentRequests, setSentRequests] = useState<Friendship[]>([]);

  useEffect(() => {
    loadFriends();
    loadPendingRequests();
  }, [user.id]);

  const loadFriends = async () => {
    try {
      const { data, error } = await supabase
        .from("friendships")
        .select(`
          id,
          requester_id,
          addressee_id,
          status,
          profiles!friendships_requester_id_fkey(id, username, full_name, is_online),
          profiles!friendships_addressee_id_fkey(id, username, full_name, is_online)
        `)
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      if (error) throw error;

      const friendsList = data?.map((friendship: any) => {
        return friendship.requester_id === user.id 
          ? friendship.profiles_addressee 
          : friendship.profiles_requester;
      }).filter(Boolean) || [];

      setFriends(friendsList);
    } catch (error) {
      console.error("Erro ao carregar amigos:", error);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const { data: received, error: receivedError } = await supabase
        .from("friendships")
        .select(`
          id,
          requester_id,
          addressee_id,
          status,
          profiles!friendships_requester_id_fkey(id, username, full_name, is_online)
        `)
        .eq("addressee_id", user.id)
        .eq("status", "pending");

      if (receivedError) throw receivedError;

      const { data: sent, error: sentError } = await supabase
        .from("friendships")
        .select(`
          id,
          requester_id,
          addressee_id,
          status,
          profiles!friendships_addressee_id_fkey(id, username, full_name, is_online)
        `)
        .eq("requester_id", user.id)
        .eq("status", "pending");

      if (sentError) throw sentError;

      const receivedRequests = received?.map(req => ({
        ...req,
        requester: req.profiles,
        addressee: { id: user.id, username: '', full_name: '', is_online: false }
      })) || [];

      const sentRequests = sent?.map(req => ({
        ...req,
        requester: { id: user.id, username: '', full_name: '', is_online: false },
        addressee: req.profiles
      })) || [];

      setPendingRequests(receivedRequests);
      setSentRequests(sentRequests);
    } catch (error) {
      console.error("Erro ao carregar solicitações:", error);
    }
  };

  const handleRequestSent = () => {
    loadPendingRequests();
  };

  const handleRequestResponded = () => {
    loadFriends();
    loadPendingRequests();
  };

  return (
    <div className="space-y-6">
      <UserSearchCard user={user} onRequestSent={handleRequestSent} />
      <PendingRequestsCard pendingRequests={pendingRequests} onRequestResponded={handleRequestResponded} />
      <FriendsListCard friends={friends} />
      <SentRequestsCard sentRequests={sentRequests} />
    </div>
  );
};
