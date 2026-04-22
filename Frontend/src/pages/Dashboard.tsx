import { useEffect, useState } from 'react';
import { Play, Upload, BarChart3, Users, Map, Settings, Trash2, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { containerVariants, itemVariants, hoverScale, tapScale } from '../utils/animations';
import { api, type MatchSummary } from '../services/api';
import { useAuth } from '../hooks/useAuth';
const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [recordings, setRecordings] = useState<MatchSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // User info formatting
    const userName = user?.name || 'User';
    const userAvatar = user?.name ? user.name.substring(0, 2).toUpperCase() : 'US';

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch recordings
                const matchesData = await api.matches.list();
                setRecordings(matchesData);
                
                // Fetch user if token exists (optional check for now)
                try {
                    // This might fail if no token, so we wrap it
                    // const me = await api.auth.me(); 
                    // setUser({ name: me.name, avatar: me.name.substring(0, 2).toUpperCase() });
                } catch {
                    console.log("Not logged in or no profile route yet");
                }
            } catch (err) {
                console.error("Dashboard data fetch error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleDelete = async (id: string | number) => {
        if (!confirm('Are you sure you want to delete this recording?')) return;
        try {
            await api.matches.delete(id);
            setRecordings(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            console.error("Delete error:", err);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12 py-32">
            {/* Welcome Header */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="flex flex-col gap-6 mb-12"
            >
                <div className="flex items-center gap-4">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                        className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-[#0a0f16]"
                    >
                        {userAvatar}
                    </motion.div>
                    <div>
                        <p className="text-white/50 text-sm font-medium">Welcome back,</p>
                        <h1 className="text-4xl font-bold text-white">{userName}!</h1>
                    </div>
                </div>
                <p className="text-[#8495a7] text-sm max-w-md leading-relaxed">
                    Your match recordings are ready for analysis. Explore insights,
                    compare teams, and get performance recommendations.
                </p>
                <div className="flex gap-4 mt-2">
                    <motion.div whileHover={hoverScale} whileTap={tapScale}>
                        <Link to="/upload" className="flex items-center justify-center gap-2 rounded-full border border-primary text-primary font-bold px-5 py-2 hover:bg-primary/10 transition-colors text-xs">
                            <Upload className="h-4 w-4" /> Upload New Video
                        </Link>
                    </motion.div>
                    <motion.div whileHover={hoverScale} whileTap={tapScale}>
                        <Link to="/analysis" className="flex items-center justify-center gap-2 rounded-full border border-white/10 text-white font-bold px-5 py-2 hover:bg-white/5 transition-colors text-xs">
                            <BarChart3 className="h-4 w-4" /> View Analysis
                        </Link>
                    </motion.div>
                </div>
            </motion.div>

            {/* Quick Actions */}
            <div className="mb-12">
                <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                    {[
                        { label: 'In-Depth Analysis', desc: 'Full match breakdown', icon: BarChart3, path: '/analysis' },
                        { label: 'Team Comparison', desc: 'Side-by-side stats', icon: Users, path: '/comparison' },
                        { label: 'Recommendations', desc: 'Performance tips', icon: Settings, path: '/recommendations' },
                        { label: 'Heatmaps', desc: 'Positional data', icon: Map, path: '/heatmaps' },
                    ].map((action, i) => (
                        <motion.div variants={itemVariants} key={i}>
                            <Link to={action.path} className="block h-full bg-[#0f151c] rounded-2xl p-5 border border-white/5 hover:border-primary/20 hover:bg-[#131b24] transition-all cursor-pointer group flex flex-col items-start gap-4">
                                <action.icon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                                <div>
                                    <h3 className="text-sm font-bold text-white mb-1">{action.label}</h3>
                                    <p className="text-[11px] text-[#5e6b7e]">{action.desc}</p>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            {/* Your Recordings */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-white">Your Recordings</h2>
                    <Link to="/upload" className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1">
                        Upload New <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                ) : recordings.length === 0 ? (
                    <div className="bg-[#0f151c] rounded-2xl p-12 border border-white/5 text-center">
                        <p className="text-[#8495a7] mb-6">No recordings found. Start by uploading your first match!</p>
                        <Link to="/upload" className="inline-flex items-center gap-2 rounded-full bg-primary text-[#0a0f16] font-bold px-6 py-2.5 hover:bg-[#00c968] transition-colors text-sm">
                            <Upload className="h-4 w-4" /> Upload Video
                        </Link>
                    </div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {recordings.map((rec) => (
                            <motion.div
                                variants={itemVariants}
                                whileHover={hoverScale}
                                key={rec.id}
                                className="bg-[#0f151c] rounded-2xl overflow-hidden border border-white/5 flex flex-col group"
                            >
                                <div className="w-full h-40 relative bg-black/40">
                                    {/* Real thumbnail would go here, using a placeholder for now */}
                                    <div className="w-full h-full flex items-center justify-center text-white/10">
                                        <Play className="h-12 w-12" />
                                    </div>
                                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-[#0a0f16] flex items-center gap-1">
                                        ✓ {rec.status}
                                    </div>
                                </div>
                                <div className="p-4 flex-grow flex flex-col">
                                    <h3 className="font-bold text-sm text-white mb-1">{rec.homeTeam} vs {rec.awayTeam}</h3>
                                    <div className="text-[10px] text-[#5e6b7e] font-medium mb-4">{rec.date}</div>

                                    <div className="mt-auto flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <motion.button
                                                whileTap={tapScale}
                                                className="flex-grow flex items-center justify-center gap-2 text-[11px] font-bold bg-primary text-[#0a0f16] px-4 py-2.5 rounded-xl hover:bg-[#00c968] transition-colors"
                                                onClick={() => navigate(`/analysis/${rec.id}`)}
                                            >
                                                <Play className="h-3.5 w-3.5 fill-current" /> Analyze
                                            </motion.button>
                                            <motion.button
                                                whileTap={tapScale}
                                                title='delete'
                                                onClick={() => handleDelete(rec.id)}
                                                className="bg-[#151b23] text-red-500 hover:bg-black p-2.5 rounded-xl transition-colors border border-white/5"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </motion.button>
                                        </div>
                                        <Link 
                                            to={`/comparison?matchId=${rec.id}`}
                                            className="flex items-center justify-center gap-2 text-[10px] font-bold bg-[#1e293b] text-white/70 px-4 py-2 rounded-lg hover:bg-[#2d3748] transition-colors border border-white/5"
                                        >
                                            <Users className="h-3 w-3" /> Compare Teams
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
