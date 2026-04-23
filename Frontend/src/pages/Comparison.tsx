import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Share2, Download, Loader2, Trophy } from 'lucide-react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip
} from 'recharts';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'framer-motion';
import { itemVariants, hoverScale, tapScale } from '../utils/animations';
import { api, type MatchOverview } from '../services/api';

const Comparison = () => {
    const [searchParams] = useSearchParams();
    const matchId = searchParams.get('matchId');
    const pageRef = useRef<HTMLDivElement>(null);
    
    const [isExporting, setIsExporting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [matchData, setMatchData] = useState<MatchOverview | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                let id = matchId;
                if (!id) {
                    const matches = await api.matches.list();
                    if (matches.length > 0) id = matches[0].id;
                }
                
                if (id) {
                    const overview = await api.matches.getOverview(id);
                    setMatchData(overview);
                }
            } catch (err) {
                console.error("Comparison data fetch error:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [matchId]);

    // Map API data to Recharts format
    const radarData = matchData?.stats
        .filter(s => ['Possession', 'Pass Accuracy', 'Shots', 'Corner Kicks', 'Fouls'].includes(s.name))
        .map(s => ({
            subject: s.name,
            A: Number(s.home),
            B: Number(s.away)
        })) || [];

    const comparisons = matchData?.stats || [];

    const statsData = comparisons.map(s => ({
        name: s.name,
        A: Number(s.home),
        B: Number(s.away)
    }));

    const barData = statsData
        .filter(s => !['Possession', 'Pass Accuracy'].includes(s.name))
        .slice(0, 5);

    const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { dataKey: string; color?: string; fill?: string; value: number | string }[]; label?: string }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#0b1016] border border-[#242e3a] p-3 rounded-lg shadow-xl">
                    <p className="text-white font-medium mb-2">{label}</p>
                    {payload.map((p, i) => (
                        <div key={i} className="flex items-center gap-2 mb-1 last:mb-0 text-sm">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color || p.fill }}></div>
                            <span className="text-[#a4b4c4]">{p.dataKey === 'A' ? matchData?.homeTeam : matchData?.awayTeam}:</span>
                            <span className="text-white font-bold">{p.value}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    const MetricBar = ({ label, leftVal, rightVal, leftPct, showSymbol = '', delay = 0 }: { label: string; leftVal: number; rightVal: number; leftPct: number; showSymbol?: string; delay?: number }) => (
        <motion.div variants={itemVariants} className="mb-6 last:mb-0">
            <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-[#10b981]">{leftVal}{showSymbol}</span>
                <span className="text-[#8495a7] font-medium">{label}</span>
                <span className="text-[#64748b]">{rightVal}{showSymbol}</span>
            </div>
            <div className="h-1.5 w-full bg-[#1e293b] rounded-full overflow-hidden flex">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${leftPct}%` }}
                    transition={{ duration: 1, delay: 1 + delay }}
                    className="h-full bg-[#10b981] rounded-r-full"
                ></motion.div>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${100 - leftPct}%` }}
                    transition={{ duration: 1, delay: 1 + delay }}
                    className="h-full bg-[#334155] rounded-l-full"
                ></motion.div>
            </div>
        </motion.div>
    );

    const TableRow = ({ label, left, right }: { label: string; left: string | number; right: string | number }) => {
        const isLeftHigher = Number(left) > Number(right);
        const isRightHigher = Number(right) > Number(left);
        return (
            <motion.div variants={itemVariants} className="flex items-center justify-between py-4 border-b border-[#242e3a]/50 last:border-0 text-sm">
                <span className={`w-1/3 text-center font-bold ${isLeftHigher ? 'text-[#10b981]' : 'text-white'}`}>{left}</span>
                <span className="w-1/3 text-center text-[#8495a7] text-xs font-medium">{label}</span>
                <span className={`w-1/3 text-center font-bold ${isRightHigher ? 'text-[#10b981]' : 'text-[#8495a7]'}`}>{right}</span>
            </motion.div>
        );
    };

    const handleExportPDF = async () => {
        if (!pageRef.current) return;
        setIsExporting(true);
        try {
            const dataUrl = await toPng(pageRef.current, {
                backgroundColor: '#0a0f16',
                cacheBust: true,
                filter: (node: HTMLElement) => {
                    return node.getAttribute?.('data-html2canvas-ignore') !== 'true';
                }
            });

            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const img = new Image();
            img.src = dataUrl;

            await new Promise((resolve) => {
                img.onload = resolve;
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (img.height * pdfWidth) / img.width;

            pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save('team-comparison.pdf');
        } catch (error) {
            console.error("Error exporting PDF:", error);
        } finally {
            setIsExporting(false);
        }
    };


    const handleShare = async () => {
        const shareData = {
            title: `Team Comparison - ${matchData?.homeTeam} vs ${matchData?.awayTeam}`,
            text: 'Check out this AI-powered team comparison!',
            url: window.location.href,
        };

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            } catch (error) {
                console.log('Error sharing', error);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert("Link copied to clipboard!");
        }
    };

    return (
        <div ref={pageRef} className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12 py-32 text-white bg-[#0a0f16]">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
            >
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Team Comparison</h1>
                    <p className="text-[#8495a7] text-sm">Head-to-head analysis</p>
                </div>
                <div className="flex items-center gap-3" data-html2canvas-ignore="true">
                    <motion.button whileHover={hoverScale} whileTap={tapScale} onClick={handleShare} className="flex items-center gap-2 px-4 py-2 bg-[#0d151c] hover:bg-[#15202b] border border-[#242e3a] rounded-lg text-sm font-medium transition-colors text-white">
                        <Share2 className="w-4 h-4" /> Share
                    </motion.button>
                    <motion.button whileHover={hoverScale} whileTap={tapScale} onClick={handleExportPDF} disabled={isExporting} className="flex items-center gap-2 px-4 py-2 bg-[#0d151c] hover:bg-[#15202b] border border-[#242e3a] rounded-lg text-sm font-medium transition-colors text-[#10b981] disabled:opacity-50">
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        {isExporting ? 'Exporting...' : 'PDF'}
                    </motion.button>
                </div>
            </motion.div>

            <AnimatePresence mode="wait">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-40 bg-[#0b1016] rounded-2xl border border-[#242e3a]">
                        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                        <p className="text-[#8495a7] font-medium">Fetching Head-to-Head Data...</p>
                    </div>
                ) : !matchData ? (
                    <div className="flex flex-col items-center justify-center py-40 bg-[#0b1016] rounded-2xl border border-[#242e3a]">
                        <p className="text-[#8495a7] font-medium mb-6">No match selected for comparison.</p>
                        <motion.button whileHover={hoverScale} whileTap={tapScale} onClick={() => window.history.back()} className="px-6 py-2 bg-primary text-black font-bold rounded-lg text-sm">
                            Go Back
                        </motion.button>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Match Result Banner */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8 }}
                            className="bg-[#0b1016] border border-[#242e3a] rounded-2xl p-6 lg:p-10 mb-6 flex flex-col md:flex-row items-center justify-between relative overflow-hidden"
                        >
                            {/* Left Team */}
                            <motion.div variants={itemVariants} className="flex flex-col items-center z-10 w-1/3">
                                <div className="w-16 h-16 bg-[#064e3b]/30 border border-[#10b981]/30 rounded-xl flex items-center justify-center mb-3 text-2xl">
                                    ⚽
                                </div>
                                <h3 className="font-bold text-white mb-2 text-center">{matchData.homeTeam}</h3>
                                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20">
                                    Home
                                </span>
                            </motion.div>

                            {/* Score Center */}
                            <motion.div variants={itemVariants} className="flex flex-col items-center justify-center z-10 my-8 md:my-0 w-1/3">
                                <div className="text-5xl md:text-6xl font-black text-white mb-2 tracking-tight">
                                    {matchData.homeScore}<span className="text-[#8495a7] font-light mx-2">-</span>{matchData.awayScore}
                                </div>
                                <div className="text-[#8495a7] text-[10px] uppercase tracking-widest mb-1">{matchData.date}</div>
                                <div className="text-[#10b981] text-xs font-semibold flex items-center gap-1">
                                    <Trophy className="w-3 h-3" /> {matchData.status}
                                </div>
                            </motion.div>

                            {/* Right Team */}
                            <motion.div variants={itemVariants} className="flex flex-col items-center z-10 w-1/3">
                                <div className="w-16 h-16 bg-[#1e293b]/50 border border-[#334155] rounded-xl flex items-center justify-center mb-3 text-2xl">
                                    ⚽
                                </div>
                                <h3 className="font-bold text-[#e2e8f0] mb-2 text-center">{matchData.awayTeam}</h3>
                                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#1e293b] text-[#94a3b8] border border-[#334155]">
                                    Away
                                </span>
                            </motion.div>
                        </motion.div>

                        {/* Charts Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            {/* Radar Chart */}
                            <motion.div variants={itemVariants} className="bg-[#0b1016] border border-[#242e3a] rounded-2xl p-6">
                                <h3 className="font-bold text-white mb-6 text-sm">Performance Radar</h3>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                            <PolarGrid stroke="#242e3a" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#8495a7', fontSize: 10 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                            <Radar name="A" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
                                            <Radar name="B" dataKey="B" stroke="#64748b" fill="#64748b" fillOpacity={0.2} strokeWidth={2} />
                                            <RechartsTooltip content={<CustomTooltip />} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex justify-center items-center gap-6 mt-4">
                                    <div className="flex items-center gap-2 text-[10px] text-[#8495a7]">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></div> {matchData.homeTeam}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-[#8495a7]">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#64748b]"></div> {matchData.awayTeam}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Bar Chart */}
                            <motion.div variants={itemVariants} className="bg-[#0b1016] border border-[#242e3a] rounded-2xl p-6">
                                <h3 className="font-bold text-white mb-6 text-sm">Team Attributes</h3>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={barData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#242e3a" vertical={false} />
                                            <XAxis dataKey="name" stroke="#8495a7" tick={{ fill: '#8495a7', fontSize: 10 }} axisLine={false} tickLine={false} dy={10} />
                                            <YAxis stroke="#8495a7" tick={{ fill: '#8495a7', fontSize: 10 }} axisLine={false} tickLine={false} />
                                            <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b', opacity: 0.4 }} />
                                            <Bar dataKey="A" fill="#10b981" radius={[4, 4, 0, 0]} barSize={18} />
                                            <Bar dataKey="B" fill="#64748b" radius={[4, 4, 0, 0]} barSize={18} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex justify-center items-center gap-6 mt-4">
                                    <div className="flex items-center gap-2 text-[10px] text-[#8495a7]">
                                        <div className="w-2.5 h-2.5 bg-[#10b981] rounded-sm"></div> {matchData.homeTeam}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-[#8495a7]">
                                        <div className="w-2.5 h-2.5 bg-[#64748b] rounded-sm"></div> {matchData.awayTeam}
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Key Metrics */}
                        <div className="bg-[#0b1016] border border-[#242e3a] rounded-2xl p-6 mb-6">
                            <h3 className="font-bold text-white mb-8 text-sm">Key Metrics</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                                <MetricBar 
                                    label="Possession" 
                                    leftVal={matchData.possession.home} 
                                    rightVal={matchData.possession.away} 
                                    leftPct={matchData.possession.home} 
                                    showSymbol="%" 
                                />
                                <MetricBar 
                                    label="Pass Accuracy" 
                                    leftVal={matchData.passAccuracy.home} 
                                    rightVal={matchData.passAccuracy.away} 
                                    leftPct={matchData.passAccuracy.home} 
                                    showSymbol="%" 
                                />
                                {matchData.stats.slice(0, 4).map((s, i) => (
                                    <MetricBar 
                                        key={i}
                                        label={s.name}
                                        leftVal={Number(s.home)}
                                        rightVal={Number(s.away)}
                                        leftPct={(Number(s.home) / (Number(s.home) + Number(s.away) || 1)) * 100}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Statistics Breakdown */}
                        <div className="bg-[#0b1016] border border-[#242e3a] rounded-2xl p-6 mb-8">
                            <h3 className="font-bold text-white mb-6 text-sm">Full Statistics Breakdown</h3>
                            <div className="w-full">
                                <div className="flex items-center justify-between pb-4 border-b border-[#242e3a] text-[10px] font-bold text-[#8495a7] uppercase tracking-wider">
                                    <span className="w-1/3 text-center text-[#10b981]">{matchData.homeTeam}</span>
                                    <span className="w-1/3 text-center">Stat</span>
                                    <span className="w-1/3 text-center">{matchData.awayTeam}</span>
                                </div>
                                <div className="flex flex-col">
                                    {matchData.stats.map((s, i) => (
                                        <TableRow key={i} left={s.home} label={s.name} right={s.away} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Comparison;
