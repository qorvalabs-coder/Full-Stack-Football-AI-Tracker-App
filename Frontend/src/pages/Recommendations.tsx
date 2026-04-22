import React, { useEffect, useState } from 'react';
import { Share2, Download, TrendingUp, TrendingDown, Lightbulb, Zap, ChevronRight, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { containerVariants, itemVariants, hoverScale, tapScale } from '../utils/animations';
import { api, type Recommendation } from '../services/api';

const Recommendations: React.FC = () => {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const data = await api.recommendations.list();
                setRecommendations(data);
            } catch (err) {
                console.error("Recommendations fetch error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecommendations();
    }, []);

    const topPerformers = recommendations.filter(r => r.scope === 'player' && r.priority === 'high');
    const needsImprovement = recommendations.filter(r => r.scope === 'player' && r.priority === 'low' || r.priority === 'medium');
    const teamInsights = recommendations.filter(r => r.scope === 'team');

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0f16]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12 py-32 text-white">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
            >
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Recommendations</h1>
                    <p className="text-[#8495a7] text-sm">AI-powered performance insights</p>
                </div>
                <div className="flex items-center gap-3">
                    <motion.button whileHover={hoverScale} whileTap={tapScale} className="flex items-center gap-2 px-4 py-2 bg-[#0d151c] hover:bg-[#15202b] border border-[#242e3a] rounded-lg text-sm font-medium transition-colors text-white">
                        <Share2 className="w-4 h-4" /> Share
                    </motion.button>
                    <motion.button whileHover={hoverScale} whileTap={tapScale} className="flex items-center gap-2 px-4 py-2 bg-[#0d151c] hover:bg-[#15202b] border border-[#242e3a] rounded-lg text-sm font-medium transition-colors text-white">
                        <Download className="w-4 h-4" /> PDF
                    </motion.button>
                </div>
            </motion.div>

            {recommendations.length === 0 ? (
                <div className="bg-[#0b1016] border border-[#242e3a] rounded-2xl p-12 text-center text-[#8495a7]">
                    No recommendations available yet. Try analyzing a match first.
                </div>
            ) : (
                <>
                    {/* Top Performers Section */}
                    {topPerformers.length > 0 && (
                        <motion.section
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="mb-8"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <TrendingUp className="w-5 h-5 text-green-500" />
                                <h2 className="text-xl font-bold text-white">Top Performers</h2>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
                                    {topPerformers.length} players
                                </span>
                            </div>
                            <div className="bg-[#0b1016] border border-[#242e3a] rounded-2xl flex flex-col p-1">
                                {topPerformers.map((rec) => (
                                    <motion.div key={rec.id} variants={itemVariants} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors rounded-xl group cursor-pointer border-b border-[#242e3a] border-opacity-50 last:border-0 relative">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-lg">
                                                {rec.title.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-bold text-white">{rec.title}</h3>
                                                    <span className="text-xs font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">HIGH</span>
                                                </div>
                                                <p className="text-[#8495a7] text-xs mb-2 leading-relaxed max-w-xl">
                                                    {rec.description}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-3 text-xs">
                                                    <div className="flex items-center gap-1.5 text-green-400/80">
                                                        <Activity className="w-3.5 h-3.5" /> Confidence: {Math.round(rec.confidence * 100)}%
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <ChevronRight className="w-5 h-5 text-[#8495a7] opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.section>
                    )}

                    {/* Needs Improvement Section */}
                    {needsImprovement.length > 0 && (
                        <motion.section
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="mb-8"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <TrendingDown className="w-5 h-5 text-orange-500" />
                                <h2 className="text-xl font-bold text-white">Needs Improvement</h2>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                    {needsImprovement.length} insights
                                </span>
                            </div>
                            <div className="bg-[#0b1016] border border-[#242e3a] rounded-2xl flex flex-col p-1">
                                {needsImprovement.map((rec) => (
                                    <motion.div key={rec.id} variants={itemVariants} className="p-4 hover:bg-white/[0.02] transition-colors rounded-xl group cursor-pointer border-b border-[#242e3a] border-opacity-50 last:border-0 relative">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-full bg-orange-900 border border-orange-700 flex items-center justify-center text-orange-100 font-bold text-lg mt-1">
                                                    {rec.title.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-bold text-white">{rec.title}</h3>
                                                        <span className="text-xs font-bold text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded">{rec.priority.toUpperCase()}</span>
                                                    </div>
                                                    <p className="text-[#8495a7] text-xs mb-3 leading-relaxed max-w-xl">
                                                        {rec.description}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 text-xs text-orange-300">
                                                        <Lightbulb className="w-4 h-4" /> Reasoning: {rec.reasoning}
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-[#8495a7] opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.section>
                    )}

                    {/* Team Improvement Recommendations Section */}
                    {teamInsights.length > 0 && (
                        <motion.section
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="mb-8"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <Lightbulb className="w-5 h-5 text-white" />
                                <h2 className="text-xl font-bold text-white">Team Improvement Recommendations</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {teamInsights.map((rec) => (
                                    <motion.div
                                        key={rec.id}
                                        variants={itemVariants}
                                        whileHover={hoverScale}
                                        className="bg-[#0b1016] border border-[#242e3a] rounded-2xl p-6 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <Zap className="w-5 h-5 text-yellow-500" />
                                            <h3 className="font-bold text-white">{rec.title}</h3>
                                        </div>
                                        <p className="text-[#8495a7] text-sm leading-relaxed">
                                            {rec.description}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.section>
                    )}
                </>
            )}
        </div>
    );
};

export default Recommendations;

