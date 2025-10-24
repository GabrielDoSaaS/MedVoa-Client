
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface Profile {
  id: string;
  username: string;
  full_name: string;
  is_online: boolean;
}

interface FriendsListCardProps {
  friends: Profile[];
}

export const FriendsListCard = ({ friends }: FriendsListCardProps) => {
  return (
    <Card className="bg-white/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="w-5 h-5" />
          <span>Meus Amigos ({friends.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {friends.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Você ainda não tem amigos. Busque por outros usuários acima!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {friends.map((friend) => (
              <div key={friend.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {friend.username?.charAt(0).toUpperCase() || "?"}
                </div>
                <div className="flex-1">
                  <p className="font-medium">@{friend.username}</p>
                  {friend.full_name && (
                    <p className="text-sm text-gray-600">{friend.full_name}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {friend.is_online ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Online
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                      Offline
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
