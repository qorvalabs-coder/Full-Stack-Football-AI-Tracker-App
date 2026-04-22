import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { RadarStatsChart, DonutChart } from '../components/ui/Charts';
import { api, type PlayerDetail } from '../services/api';
import { User, Activity, CheckCircle, Target } from 'lucide-react';

const PlayerProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [player, setPlayer] = useState<PlayerDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPlayer = async () => {
            if (!id) return;
            try {
                const data = await api.players.get(id);
                setPlayer(data);
            } catch (err) {
                console.error("Player fetch error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlayer();
    }, [id]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0f16]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!player) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0f16] text-white">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Player not found</h2>
                    <p className="text-slate-400">The player you are looking for does not exist or has been removed.</p>
                </div>
            </div>
        );
    }

    const radarData = Object.keys(player.attributes).map(key => ({
        subject: key.charAt(0).toUpperCase() + key.slice(1),
        A: player.attributes[key as keyof typeof player.attributes]
    }));

    return (
        <div className="container mx-auto px-4 py-32 max-w-7xl animate-fade-in text-white">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-8 relative overflow-hidden group">
                <div className="absolute -right-20 -top-20 text-emerald-500/10 rotate-12 group-hover:rotate-6 transition-transform duration-500">
                    <span className="text-[250px] font-bold italic block leading-none">{player.number}</span>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center border-4 border-slate-700 shadow-xl">
                        <User className="w-16 h-16 text-slate-500" />
                    </div>
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-bold mb-2">{player.name}</h1>
                        <p className="text-xl text-slate-400">{player.position} • {player.teamName}</p>
                        <div className="mt-4 flex gap-4 justify-center md:justify-start">
                            <div className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl border border-emerald-500/30">
                                <span className="block text-xs uppercase font-bold opacity-70">OVR</span>
                                <span className="text-xl font-black">{player.rating}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Season Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-xl">
                                <div className="flex items-center gap-3"><Target className="w-5 h-5 text-emerald-400" /> Goals</div>
                                <span className="font-bold text-xl">{player.goals}</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-xl">
                                <div className="flex items-center gap-3"><Activity className="w-5 h-5 text-blue-400" /> Assists</div>
                                <span className="font-bold text-xl">{player.assists}</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-xl">
                                <div className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-purple-400" /> Accuracy</div>
                                <span className="font-bold text-xl">{Math.round(player.passAccuracy * 100)}%</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Performance Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <DonutChart data={[
                                { name: 'Passes', value: player.passesCompleted },
                                { name: 'Turnovers', value: player.turnovers },
                            ]} height={250} />
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Technical Attributes</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[450px]">
                            <RadarStatsChart data={radarData} height={400} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default PlayerProfile;
