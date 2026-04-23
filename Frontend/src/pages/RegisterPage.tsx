import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, UserPlus, User, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.auth.register({ name, email, password });
            login(response);
            toast.success('Account created successfully!');
            navigate('/dashboard');
        } catch (err) {
            console.error("Registration error:", err);
            // Error is already toasted by api.request
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-[80vh] flex items-center justify-center px-4 pt-28 pb-20 overflow-hidden">
            {/* Dark green glow background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blur-[120px] rounded-full" />
            </div>

            <div className="w-full max-w-[420px] relative z-10 mt-6 md:mt-8">
                <div className="bg-[#0f151c]/90 backdrop-blur-md p-10 rounded-[20px] border border-white/5 shadow-2xl">

                    <div className="text-center mb-8 flex flex-col items-center">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center mb-5 shadow-[0_0_15px_rgba(0,230,118,0.3)]">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" />
                                <circle cx="12" cy="12" r="3" fill="white" />
                                <path d="M12 2V6" />
                                <path d="M12 18V22" />
                                <path d="M4.5 16.5L7.5 14.5" />
                                <path d="M16.5 9.5L19.5 7.5" />
                                <path d="M16.5 14.5L19.5 16.5" />
                                <path d="M4.5 7.5L7.5 9.5" />
                            </svg>
                        </div>
                        <h2 className="text-[22px] font-bold text-white tracking-tight">Create Account</h2>
                        <p className="text-[#8495a7] text-[13px] mt-1.5">Join GoalSense and start analyzing</p>
                    </div>

                    <form className="space-y-4" onSubmit={handleRegister}>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold text-white/80 ml-1">Username</label>
                                <div className="relative group">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#5e6b7e] group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="YourUsername"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="w-full bg-[#0a0f16] border border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-[13px] text-white placeholder:text-[#5e6b7e] focus:border-primary/50 focus:bg-[#0a0f16] focus:outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold text-white/80 ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#5e6b7e] group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full bg-[#0a0f16] border border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-[13px] text-white placeholder:text-[#5e6b7e] focus:border-primary/50 focus:bg-[#0a0f16] focus:outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold text-white/80 ml-1">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#5e6b7e] group-focus-within:text-primary transition-colors" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Min. 6 characters"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="w-full bg-[#0a0f16] border border-white/5 rounded-xl py-3.5 pl-11 pr-10 text-[13px] text-white placeholder:text-[#5e6b7e] focus:border-primary/50 focus:bg-[#0a0f16] focus:outline-none transition-all"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5 shadow-sm">
                                <label className="text-[12px] font-semibold text-white/80 ml-1">Confirm Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#5e6b7e] group-focus-within:text-primary transition-colors" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Repeat your password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="w-full bg-[#0a0f16] border border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-[13px] text-white placeholder:text-[#5e6b7e] focus:border-primary/50 focus:bg-[#0a0f16] focus:outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-[#00c968] text-black font-bold h-[46px] rounded-xl text-[14px] flex items-center justify-center gap-2 transition-colors mt-6 disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    <p className="text-center text-[13px] text-[#8495a7] mt-6">
                        Already have an account? <Link to="/login" className="text-primary hover:text-primary/80 transition-colors font-semibold">Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
