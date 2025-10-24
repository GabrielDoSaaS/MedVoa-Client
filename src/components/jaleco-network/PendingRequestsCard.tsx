
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

interface PendingRequestsCardProps {
  pendingRequests: Friendship[];
  onRequestResponded: () => void;
}

export const PendingRequestsCard = ({ pendingRequests, onRequestResponded }: PendingRequestsCardProps) => {
  const { toast } = useToast();

  const respondToRequest = async (requestId: string, accept: boolean) => {
    try {
      if (accept) {
        const { error } = await supabase
          .from("friendships")
          .update({ status: "accepted" })
          .eq("id", requestId);

        if (error) throw error;

        toast({
          title: "Amizade aceita!",
          description: "Vocês agora são amigos",
        });
      } else {
        const { error } = await supabase
          .from("friendships")
          .delete()
          .eq("id", requestId);

        if (error) throw error;

        toast({
          title: "Solicitação recusada",
          description: "A solicitação foi removida",
        });
      }

      onRequestResponded();
    } catch (error) {
      console.error("Erro ao responder solicitação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível processar a solicitação",
        variant: "destructive",
      });
    }
  };

  if (pendingRequests.length === 0) {
    return null;
  }

  return (
    <Card className="bg-white/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Solicitações Recebidas ({pendingRequests.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {pendingRequests.map((request) => (
          <div key={request.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {request.requester?.username?.charAt(0).toUpperCase() || "?"}
              </div>
              <div>
                <p className="font-medium">@{request.requester?.username || "Usuário"}</p>
                {request.requester?.full_name && (
                  <p className="text-sm text-gray-600">{request.requester.full_name}</p>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" onClick={() => respondToRequest(request.id, true)}>
                <Check className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => respondToRequest(request.id, false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
