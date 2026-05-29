import { motion } from 'framer-motion';

interface TeamShieldProps {
    teamName: string;
    variant?: 'home' | 'away';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const sizeMap = {
    sm: { shield: 'w-10 h-10', text: 'text-sm', inner: 'w-7 h-7' },
    md: { shield: 'w-14 h-14', text: 'text-lg', inner: 'w-10 h-10' },
    lg: { shield: 'w-16 h-16', text: 'text-xl', inner: 'w-12 h-12' },
};

const TeamShield = ({ teamName, variant = 'home', size = 'md', className = '' }: TeamShieldProps) => {
    const initial = teamName?.charAt(0)?.toUpperCase() || '?';
    const s = sizeMap[size];
    const isHome = variant === 'home';

    return (
        <motion.div
            whileHover={{ scale: 1.08, rotate: 2 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className={`relative ${s.shield} ${className}`}
        >
            {/* Shield SVG */}
            <svg
                viewBox="0 0 64 72"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full drop-shadow-lg"
            >
                <defs>
                    <linearGradient id={`shield-grad-${variant}`} x1="0" y1="0" x2="64" y2="72" gradientUnits="userSpaceOnUse">
                        {isHome ? (
                            <>
                                <stop stopColor="#10b981" />
                                <stop offset="1" stopColor="#059669" />
                            </>
                        ) : (
                            <>
                                <stop stopColor="#334155" />
                                <stop offset="1" stopColor="#1e293b" />
                            </>
                        )}
                    </linearGradient>
                    <linearGradient id={`shield-inner-${variant}`} x1="0" y1="0" x2="64" y2="72" gradientUnits="userSpaceOnUse">
                        {isHome ? (
                            <>
                                <stop stopColor="#065f46" />
                                <stop offset="1" stopColor="#064e3b" />
                            </>
                        ) : (
                            <>
                                <stop stopColor="#1e293b" />
                                <stop offset="1" stopColor="#0f172a" />
                            </>
                        )}
                    </linearGradient>
                </defs>
                {/* Outer shield shape */}
                <path
                    d="M32 2L4 14V38C4 52 16 64 32 70C48 64 60 52 60 38V14L32 2Z"
                    fill={`url(#shield-grad-${variant})`}
                    stroke={isHome ? '#34d399' : '#475569'}
                    strokeWidth="1.5"
                />
                {/* Inner shield */}
                <path
                    d="M32 8L10 18V38C10 49 20 59 32 64C44 59 54 49 54 38V18L32 8Z"
                    fill={`url(#shield-inner-${variant})`}
                />
                {/* Three decorative lines at top */}
                <path d="M32 12L14 20V22L32 14L50 22V20L32 12Z" fill={isHome ? '#10b981' : '#475569'} opacity="0.4" />
                {/* Star accent at top */}
                <circle cx="32" cy="22" r="2" fill={isHome ? '#34d399' : '#64748b'} opacity="0.6" />
                {/* Team initial */}
                <text
                    x="32"
                    y="48"
                    textAnchor="middle"
                    fontFamily="system-ui, sans-serif"
                    fontWeight="800"
                    fontSize="22"
                    fill={isHome ? '#ecfdf5' : '#cbd5e1'}
                    letterSpacing="1"
                >
                    {initial}
                </text>
            </svg>
            {/* Subtle glow effect for home team */}
            {isHome && (
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl -z-10 scale-75" />
            )}
        </motion.div>
    );
};

export default TeamShield;
