
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

interface SentRequestsCardProps {
  sentRequests: Friendship[];
}

export const SentRequestsCard = ({ sentRequests }: SentRequestsCardProps) => {
  if (sentRequests.length === 0) {
    return null;
  }

  return (
    <Card className="bg-white/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Solicitações Enviadas ({sentRequests.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sentRequests.map((request) => (
          <div key={request.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {request.addressee?.username?.charAt(0).toUpperCase() || "?"}
              </div>
              <div>
                <p className="font-medium">@{request.addressee?.username || "Usuário"}</p>
                {request.addressee?.full_name && (
                  <p className="text-sm text-gray-600">{request.addressee.full_name}</p>
                )}
              </div>
            </div>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              Pendente
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
