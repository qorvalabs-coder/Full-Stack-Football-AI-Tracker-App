import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { containerVariants, itemVariants, hoverScale, tapScale } from '../utils/animations';
import { api, type PlayerSummary, type PlayerHeatmap, type PlayerDetail } from '../services/api';
import { Users, Map as MapIcon, Activity, Trophy, Loader2 as LucideLoader } from 'lucide-react';

const Heatmaps = () => {
    const [players, setPlayers] = useState<PlayerSummary[]>([]);
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const [playerDetail, setPlayerDetail] = useState<PlayerDetail | null>(null);
    const [heatmap, setHeatmap] = useState<PlayerHeatmap | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDetailLoading, setIsDetailLoading] = useState(false);

    useEffect(() => {
        const fetchPlayers = async () => {
            try {
                const data = await api.players.list();
                setPlayers(data);
                if (data.length > 0) {
                    setSelectedPlayerId(data[0].id);
                }
            } catch (err) {
                console.error("Players fetch error:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPlayers();
    }, []);

    useEffect(() => {
        const fetchPlayerDetail = async () => {
            if (!selectedPlayerId) return;
            setIsDetailLoading(true);
            try {
                const [detail, heat] = await Promise.all([
                    api.players.get(selectedPlayerId),
                    api.players.getHeatmap(selectedPlayerId)
                ]);
                setPlayerDetail(detail);
                setHeatmap(heat);
            } catch (err) {
                console.error("Player detail fetch error:", err);
            } finally {
                setIsDetailLoading(false);
            }
        };
        fetchPlayerDetail();
    }, [selectedPlayerId]);

    const PitchGrid = ({ zones }: { zones?: { x: number, y: number, value: number }[] }) => {
        // Create a 10x6 grid map
        const gridValues = Array(60).fill(0);
        if (zones) {
            zones.forEach(z => {
                const index = Math.floor(z.y / 16.6) * 10 + Math.floor(z.x / 10);
                if (index >= 0 && index < 60) gridValues[index] = z.value;
            });
        }

        return (
            <div className="relative w-full aspect-[1.6] bg-[#0a0f16] border border-white/10 rounded-xl overflow-hidden mt-4">
                <div className="absolute inset-0 grid grid-cols-10 grid-rows-6 opacity-40">
                    {gridValues.map((val, i) => (
                        <motion.div
                            key={i}
                            className="border border-white/5 transition-colors"
                            style={{ backgroundColor: `rgba(16, 185, 129, ${val / 100})` }}
                        />
                    ))}
                </div>
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20 -translate-x-1/2" />
                <div className="absolute left-1/2 top-1/2 w-[20%] h-[30%] border border-white/20 rounded-full -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute left-0 top-[20%] w-[15%] h-[60%] border border-white/20 border-l-0" />
                <div className="absolute right-0 top-[20%] w-[15%] h-[60%] border border-white/20 border-r-0" />
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0f16]">
                <LucideLoader className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    if (players.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-32 text-center">
                <div className="bg-[#0f151c] rounded-2xl p-12 border border-white/5">
                    <Users className="h-16 w-16 text-white/10 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-white mb-2">No Tracking Data Available</h2>
                    <p className="text-[#8495a7] mb-8">Upload and analyze a match to see player heatmaps and positional stats.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-32 max-w-7xl">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold text-white mb-2">Heatmaps & Visualization</h1>
                <p className="text-[#8495a7] text-sm">Real-time positional data from AI analysis</p>
            </motion.div>

            {/* Individual Player Section */}
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="bg-[#0f151c] border border-white/5 rounded-3xl p-6 mb-6"
            >
                <div className="flex items-center gap-3 mb-6">
                    <MapIcon className="w-5 h-5 text-primary" />
                    <h2 className="text-sm font-bold text-white">Positional Activity</h2>
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                    {players.map(p => (
                        <motion.button
                            key={p.id}
                            variants={itemVariants}
                            whileHover={hoverScale}
                            whileTap={tapScale}
                            onClick={() => setSelectedPlayerId(p.id)}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-colors border ${selectedPlayerId === p.id ? 'bg-primary/20 border-primary text-primary' : 'bg-[#0a0f16] border-white/5 text-white/70 hover:text-white'}`}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full ${selectedPlayerId === p.id ? 'bg-primary' : 'bg-white/30'}`}></div>
                            {p.name} <span className="text-white/30">({p.position})</span>
                        </motion.button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {isDetailLoading ? (
                        <div className="h-80 flex items-center justify-center">
                            <LucideLoader className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    ) : playerDetail && (
                        <motion.div
                            key={selectedPlayerId}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-12"
                        >
                            <div>
                                <h3 className="text-[13px] font-bold text-white mb-4 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-[#10b981]" /> 
                                    Activity Heatmap — {playerDetail.name}
                                </h3>
                                <PitchGrid zones={heatmap?.points} />
                                <div className="mt-4 flex justify-end items-center gap-2 text-[10px] font-bold text-white/30">
                                    <span>Low Intensity</span>
                                    <div className="w-16 h-1.5 bg-gradient-to-r from-primary/10 to-primary rounded-full"></div>
                                    <span>High</span>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-[13px] font-bold text-white mb-6 flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-primary" />
                                    Attribute Profile
                                </h3>
                                <div className="space-y-4">
                                    {Object.entries(playerDetail.attributes).map(([key, val], idx) => (
                                        <motion.div
                                            key={key}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                        >
                                            <div className="flex justify-between text-[11px] font-bold text-white/70 mb-2">
                                                <span className="capitalize">{key}</span>
                                                <span>{val}/100</span>
                                            </div>
                                            <div className="h-2 bg-[#0a0f16] rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${val}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                    className="h-full bg-primary rounded-full"
                                                ></motion.div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                                
                                <div className="mt-8 grid grid-cols-2 gap-4">
                                    <div className="bg-[#0a0f16] border border-white/5 rounded-xl p-4">
                                        <div className="text-[10px] text-[#8495a7] mb-1 font-bold uppercase">Pass Accuracy</div>
                                        <div className="text-xl font-bold text-white">{Math.round(playerDetail.passAccuracy * 100)}%</div>
                                    </div>
                                    <div className="bg-[#0a0f16] border border-white/5 rounded-xl p-4">
                                        <div className="text-[10px] text-[#8495a7] mb-1 font-bold uppercase">Minutes Played</div>
                                        <div className="text-xl font-bold text-white">{playerDetail.minutesPlayed}'</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default Heatmaps;

