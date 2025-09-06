import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import {
  Trophy,
  Clock,
  Coins,
  ArrowRight,
  Filter,
  Search,
  Award,
  Send,
  Image,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { QuestService } from '../services/quest.service';
import { UserProfileButton } from '../components/ui/AuthButtons';
import type { Quest } from '../types/api';
import { Link } from 'react-router-dom';

export default function Quests() {
  const { user, dbUser, isLoading } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [userQuests, setUserQuests] = useState<
    Array<{ questId: string; status: string; userId: string }>
  >([]);
  const [isLoadingQuests, setIsLoadingQuests] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadQuests();
  }, []);

  useEffect(() => {
    if (dbUser?.id) {
      loadUserQuests();
    }
  }, [dbUser]);

  const loadQuests = async () => {
    try {
      setIsLoadingQuests(true);
      const fetchedQuests = await QuestService.getAllQuests();
      setQuests(fetchedQuests);
      const userQuestsResponse = await QuestService.getUserQuests();
      setUserQuests(userQuestsResponse.data || []);
    } catch (error) {
      console.error('Failed to load quests:', error);
    } finally {
      setIsLoadingQuests(false);
    }
  };

  const loadUserQuests = async () => {
    if (!dbUser?.id) return;

    try {
      const fetchedUserQuests = await QuestService.getUserQuests(dbUser.id);
      setUserQuests(fetchedUserQuests);
    } catch (error) {
      console.error('Failed to load user quests:', error);
    }
  };

  const getQuestTypeIcon = (type: string) => {
    switch (type) {
      case 'SEND_ERC20':
      case 'RECEIVE_ERC20':
        return <Send className="w-5 h-5" />;
      case 'SEND_NFT':
      case 'RECEIVE_NFT':
        return <Image className="w-5 h-5" />;
      default:
        return <Trophy className="w-5 h-5" />;
    }
  };

  const getQuestTypeColor = (type: string) => {
    switch (type) {
      case 'SEND_ERC20':
      case 'RECEIVE_ERC20':
        return 'text-green-400';
      case 'SEND_NFT':
      case 'RECEIVE_NFT':
        return 'text-purple-400';
      default:
        return 'text-blue-400';
    }
  };

  const filteredQuests = quests.filter((quest) => {
    const matchesSearch =
      quest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quest.description.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'available') return matchesSearch;
    if (activeTab === 'completed') {
      const userQuest = userQuests.find((uq) => uq.questId === quest.id);
      return matchesSearch && userQuest?.status === 'COMPLETED';
    }
    if (activeTab === 'in-progress') {
      const userQuest = userQuests.find((uq) => uq.questId === quest.id);
      return matchesSearch && userQuest?.status === 'IN_PROGRESS';
    }
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              Web3{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                Quests
              </span>
            </h1>
            <p className="text-gray-300 text-lg">
              Discover and complete exciting blockchain challenges
            </p>
          </div>

          <div className="flex items-center gap-4 mt-4 md:mt-0">
            {user && <UserProfileButton />}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              placeholder="Search quests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400 backdrop-blur-sm rounded-md px-3 py-2 w-full"
            />
          </div>
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Total Quests</p>
                  <p className="text-2xl font-bold text-white">
                    {quests.length}
                  </p>
                </div>
                <Trophy className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Completed</p>
                  <p className="text-2xl font-bold text-white">
                    {userQuests.filter((q) => q.status === 'COMPLETED').length}
                  </p>
                </div>
                <Award className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">In Progress</p>
                  <p className="text-2xl font-bold text-white">
                    {
                      userQuests.filter((q) => q.status === 'IN_PROGRESS')
                        .length
                    }
                  </p>
                </div>
                <Clock className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Total Rewards</p>
                  <p className="text-2xl font-bold text-white">
                    {userQuests.reduce((sum, q) => {
                      const quest = quests.find(
                        (quest) => quest.id === q.questId
                      );
                      return sum + Number(quest?.reward || 0n);
                    }, 0)}
                  </p>
                </div>
                <Coins className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quest Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-white/10 border-white/20 backdrop-blur-sm">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-white/20 text-white"
            >
              All Quests
            </TabsTrigger>
            <TabsTrigger
              value="available"
              className="data-[state=active]:bg-white/20 text-white"
            >
              Available
            </TabsTrigger>
            <TabsTrigger
              value="in-progress"
              className="data-[state=active]:bg-white/20 text-white"
            >
              In Progress
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="data-[state=active]:bg-white/20 text-white"
            >
              Completed
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoadingQuests ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 animate-pulse"
                  >
                    <CardContent className="p-6">
                      <div className="h-4 bg-white/20 rounded mb-4" />
                      <div className="h-3 bg-white/20 rounded mb-2" />
                      <div className="h-3 bg-white/20 rounded mb-4" />
                      <div className="h-8 bg-white/20 rounded" />
                    </CardContent>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredQuests.map((quest) => {
                  const userQuest = userQuests.find(
                    (uq) => uq.questId === quest.id
                  );

                  return (
                    <Card
                      key={quest.id}
                      className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300 group"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getQuestTypeIcon(quest.questType)}
                            <Badge
                              className={`${getQuestTypeColor(
                                quest.questType
                              )} border`}
                            >
                              {quest.questType}
                            </Badge>
                          </div>
                          {userQuest && (
                            <Badge
                              variant={
                                userQuest.status === 'COMPLETED'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {userQuest.status.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-white group-hover:text-cyan-400 transition-colors">
                          {quest.name}
                        </CardTitle>
                        <CardDescription className="text-gray-300">
                          {quest.description}
                        </CardDescription>
                      </CardHeader>

                      <CardContent>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4 text-sm text-gray-300">
                            <div className="flex items-center gap-1">
                              <Coins className="w-4 h-4 text-yellow-400" />
                              <span>
                                {Number(quest.reward).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-blue-400" />
                              <span>
                                Expires:{' '}
                                {new Date(
                                  quest.expiry * 1000
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <Link to={`/quest/${quest.id}`}>
                          <Button className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white border-0 group">
                            {userQuest?.status === 'COMPLETED'
                              ? 'View Details'
                              : 'Start Quest'}
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {!isLoadingQuests && filteredQuests.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  No quests found
                </h3>
                <p className="text-gray-400">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
