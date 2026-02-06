
import React, { useState, useMemo, useEffect } from 'react';
import { 
  UserProfile, 
  Measurements, 
  ComparisonData,
  Gender,
  Unit,
  HistoryEntry
} from './types';
import { 
  AVERAGE_MALE, 
  AVERAGE_FEMALE, 
  calculateIdeals 
} from './constants';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';

// --- Utilities ---
const CM_TO_IN = 0.393701;
const IN_TO_CM = 2.54;

const formatVal = (val: number, unit: Unit) => {
  const displayVal = unit === 'imperial' ? val * CM_TO_IN : val;
  return Math.round(displayVal * 100) / 100;
};

const parseVal = (val: number, unit: Unit) => {
  return unit === 'imperial' ? val * IN_TO_CM : val;
};

const getSpectrumBounds = (avg: number, ideal: number) => {
  const base = Math.min(avg, ideal);
  const peak = Math.max(avg, ideal);
  const range = peak - base;
  const min = Math.max(base * 0.7, base - range * 2);
  const max = peak * 1.3 + range;
  return { min, max };
};

const getPos = (val: number, min: number, max: number) => {
  return Math.min(Math.max(((val - min) / (max - min)) * 100, 0), 100);
};

// --- Sub-Components ---

const AuthScreen: React.FC<{ onLogin: (email: string) => void }> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full"></div>
      </div>
      
      <div className="glass w-full max-w-md p-10 rounded-[2.5rem] border-white/5 relative">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20 mx-auto mb-6">
            <i className="fa-solid fa-lock text-white text-2xl"></i>
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
            {isLogin ? 'Access Vault' : 'Create Profile'}
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-2">
            Secure your anatomical data and progress.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-indigo-500 transition-all"
              placeholder="champion@physique.pro"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-indigo-500 transition-all"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98]"
          >
            {isLogin ? 'Login to Dashboard' : 'Initialize Profile'}
          </button>
        </form>

        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="w-full mt-6 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
        >
          {isLogin ? "Don't have an account? Create one" : "Already registered? Login here"}
        </button>
      </div>
    </div>
  );
};

// Added missing MeasurementStatProps interface to fix type error
interface MeasurementStatProps {
  data: ComparisonData;
  unit: Unit;
}

const SpectrumCard: React.FC<MeasurementStatProps> = ({ data, unit }) => {
  const { label, current, ideal, average, min, max, spectrumPosition, idealPosition, avgPosition } = data;
  
  const displayValue = formatVal(current, unit);
  const displayIdeal = formatVal(ideal, unit);
  const displayAvg = formatVal(average, unit);
  const displayMin = formatVal(min, unit);
  const displayMax = formatVal(max, unit);

  const isLeaningPart = ['waist', 'hips', 'thighs'].includes(data.key);
  const progressPct = isLeaningPart 
    ? Math.round(((max - current) / (max - ideal)) * 100)
    : Math.round(((current - min) / (ideal - min)) * 100);
  
  const diffFromIdeal = Math.abs(current - ideal);
  const pctDiffFromIdeal = (diffFromIdeal / ideal) * 100;

  let statusColor = "text-slate-400";
  let barAccent = "bg-indigo-500";
  let statusLabel = "Developing Status";
  const isGrowthTarget = ideal > average;

  if (isGrowthTarget) {
    if (current < average) {
      statusLabel = "Underdeveloped vs Average";
      statusColor = "text-slate-500";
      barAccent = "bg-slate-700";
    } else if (pctDiffFromIdeal <= 3) {
      statusLabel = "Scientific Ideal Matched";
      statusColor = "text-emerald-400";
      barAccent = "bg-emerald-500";
    } else if (current > ideal) {
      statusLabel = "Exceptional Mass (Over Target)";
      statusColor = "text-orange-400";
      barAccent = "bg-orange-500";
    } else if (current >= average) {
      statusLabel = "Above Average, Close to Ideal";
      statusColor = "text-indigo-400";
      barAccent = "bg-indigo-400";
    }
  } else {
    if (current > average) {
      statusLabel = "Above Average (Needs Definition)";
      statusColor = "text-red-400";
      barAccent = "bg-red-500/50";
    } else if (pctDiffFromIdeal <= 3) {
      statusLabel = "Optimal Symmetry Reached";
      statusColor = "text-emerald-400";
      barAccent = "bg-emerald-500";
    } else if (current < ideal) {
      statusLabel = "Elite Definition (Below Target)";
      statusColor = "text-indigo-400";
      barAccent = "bg-indigo-400";
    } else {
      statusLabel = "Developing Definition";
      statusColor = "text-orange-400";
      barAccent = "bg-orange-400";
    }
  }

  return (
    <div className="glass p-6 rounded-3xl border-white/5 border flex flex-col gap-6 transition-all hover:bg-white/5">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</span>
          <div className="text-2xl font-black text-white mt-1">
            {displayValue} <span className="text-sm font-medium text-slate-600">{unit === 'metric' ? 'cm' : 'in'}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
             <span className={`text-[10px] font-black uppercase tracking-widest ${statusColor}`}>{statusLabel}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Progress</span>
            <span className="text-xl font-black text-white leading-tight">{progressPct}%</span>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">to Ideal</span>
          </div>
        </div>
      </div>

      <div className="relative pt-6 pb-8">
        <div className="relative h-4 w-full bg-slate-900 rounded-full border border-white/5">
          <div className="absolute top-[-16px] w-0.5 h-8 bg-slate-700 z-10" style={{ left: `${avgPosition}%` }}>
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-500 whitespace-nowrap">Avg {displayAvg}</span>
          </div>
          <div className="absolute top-[-4px] w-1 h-6 bg-indigo-500/50 z-20" style={{ left: `${idealPosition}%` }}>
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-black text-indigo-400 whitespace-nowrap uppercase">Ideal</span>
          </div>
          <div 
            className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg rotate-45 border-4 border-slate-900 z-30 shadow-xl transition-all duration-500 ${barAccent}`}
            style={{ left: `calc(${spectrumPosition}% - 12px)` }}
          />
        </div>
        <div className="flex justify-between mt-6 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
          <span>{displayMin} (Small)</span>
          <span>{displayMax} (Large)</span>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

const App: React.FC = () => {
  const [user, setUser] = useState<string | null>(localStorage.getItem('physique_user'));
  const [view, setView] = useState<'current' | 'history'>('current');
  const [unit, setUnit] = useState<Unit>('imperial');
  const [showAverage, setShowAverage] = useState(true);
  const [showCurrent, setShowCurrent] = useState(true);
  
  // State for the date to log measurements on
  const [logDate, setLogDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Champion',
    age: 25,
    gender: 'male',
    height: 175,
    weight: 75,
    wristSize: 17.5 
  });

  const [measurements, setMeasurements] = useState<Measurements>({
    neck: 40.2,
    chest: 108.5,
    waist: 90.1,
    shoulders: 122.4,
    biceps: 37.8,
    forearms: 30.5,
    hips: 101.5,
    thighs: 60.2,
    calves: 38.5
  });

  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    const saved = localStorage.getItem('physique_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('physique_history', JSON.stringify(history));
  }, [history]);

  const handleLogin = (email: string) => {
    setUser(email);
    localStorage.setItem('physique_user', email);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('physique_user');
  };

  const logMeasurement = () => {
    // Construct a date object from the user's selected logDate
    // and the current time to ensure uniqueness if logging multiple entries per day
    const timestamp = new Date(`${logDate}T${new Date().toTimeString().split(' ')[0]}`).toISOString();

    const newEntry: HistoryEntry = {
      ...measurements,
      id: crypto.randomUUID(),
      timestamp: timestamp,
      weight: profile.weight
    };

    setHistory(prev => {
      const updated = [newEntry, ...prev];
      // Always keep history sorted by timestamp descending
      return updated.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    });
    
    alert(`Physique Snapshot Logged for ${new Date(logDate).toLocaleDateString()}!`);
  };

  const averageData = profile.gender === 'male' ? AVERAGE_MALE : AVERAGE_FEMALE;
  const idealData = calculateIdeals(profile.wristSize);

  const comparisonData: ComparisonData[] = useMemo(() => {
    return (Object.keys(measurements) as Array<keyof Measurements>).map(key => {
      const avg = averageData[key];
      const ideal = idealData[key];
      const { min, max } = getSpectrumBounds(avg, ideal);
      return {
        label: key.charAt(0).toUpperCase() + key.slice(1),
        key,
        current: measurements[key],
        average: avg,
        ideal: ideal,
        min,
        max,
        unit: unit === 'metric' ? 'cm' : 'in',
        spectrumPosition: getPos(measurements[key], min, max),
        idealPosition: getPos(ideal, min, max),
        avgPosition: getPos(avg, min, max)
      };
    });
  }, [measurements, averageData, idealData, unit]);

  const sortedSpectrums = useMemo(() => {
    return [...comparisonData].sort((a, b) => {
      const isLeaningA = ['waist', 'hips', 'thighs'].includes(a.key);
      const isLeaningB = ['waist', 'hips', 'thighs'].includes(b.key);
      const progA = isLeaningA ? ((a.max - a.current) / (a.max - a.ideal)) * 100 : ((a.current - a.min) / (a.ideal - a.min)) * 100;
      const progB = isLeaningB ? ((b.max - b.current) / (b.max - b.ideal)) * 100 : ((b.current - b.min) / (b.ideal - b.min)) * 100;
      return progB - progA;
    });
  }, [comparisonData]);

  const radarData = comparisonData.map(d => ({
    subject: d.label,
    Current: (d.current / d.ideal) * 100,
    Average: (d.average / d.ideal) * 100,
    Ideal: 100 
  }));

  const chartData = useMemo(() => {
    // For charts we want ascending order (oldest to newest)
    return [...history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map(h => ({
      ...h,
      date: new Date(h.timestamp).toLocaleDateString(),
      formattedWeight: h.weight // already in kg
    }));
  }, [history]);

  const handleProfileChange = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleMeasurementChange = (key: keyof Measurements, value: number) => {
    setMeasurements(prev => ({ ...prev, [key]: value }));
  };

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#06080b] text-slate-200">
      <header className="sticky top-0 z-50 glass border-b border-white/5 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <i className="fa-solid fa-gauge-high text-white text-xl"></i>
          </div>
          <h1 className="text-xl font-black tracking-tighter text-white uppercase">Physique<span className="text-indigo-400">Pro</span></h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5">
            <button onClick={() => setView('current')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${view === 'current' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Current</button>
            <button onClick={() => setView('history')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${view === 'history' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Trends</button>
          </div>
          <div className="h-6 w-px bg-white/10 hidden md:block"></div>
          <button onClick={handleLogout} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-red-400 transition-colors">Sign Out</button>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
        <aside className="w-full lg:w-[380px] border-r border-white/5 bg-slate-950/20 p-8 space-y-10 overflow-y-auto">
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest">Base Architecture</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {(['male', 'female'] as Gender[]).map(g => (
                  <button key={g} onClick={() => handleProfileChange('gender', g)} className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${profile.gender === g ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400' : 'bg-slate-900 border-white/5 text-slate-600'}`}>
                    {g}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 block mb-2">Wrist Structure ({unit === 'metric' ? 'cm' : 'in'})</label>
                <input type="number" step="0.1" value={formatVal(profile.wristSize, unit)} onChange={(e) => handleProfileChange('wristSize', parseVal(parseFloat(e.target.value) || 0, unit))} className="w-full bg-slate-900 border border-white/5 rounded-2xl p-4 text-xl font-black text-white outline-none focus:border-indigo-500 transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 block mb-2">Current Weight ({unit === 'metric' ? 'kg' : 'lb'})</label>
                <input type="number" step="0.1" value={unit === 'imperial' ? profile.weight * 2.20462 : profile.weight} onChange={(e) => handleProfileChange('weight', unit === 'imperial' ? parseFloat(e.target.value) / 2.20462 : parseFloat(e.target.value))} className="w-full bg-slate-900 border border-white/5 rounded-2xl p-4 text-xl font-black text-white outline-none focus:border-indigo-500 transition-all" />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest">Anatomy Inputs</h2>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {comparisonData.map((d) => (
                <div key={d.key} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-white/5 group hover:border-white/10 transition-colors">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{d.label}</span>
                  <div className="flex items-center gap-2">
                    <input type="number" step="0.1" value={formatVal(measurements[d.key], unit)} onChange={(e) => handleMeasurementChange(d.key, parseVal(parseFloat(e.target.value) || 0, unit))} className="w-20 bg-transparent text-right font-black text-white text-lg outline-none focus:text-indigo-400" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase">{unit === 'metric' ? 'cm' : 'in'}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="space-y-4 pt-4 border-t border-white/5">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block mb-2">Snapshot Date</label>
                <input 
                  type="date" 
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-indigo-500 transition-all text-sm"
                />
              </div>
              <button 
                onClick={logMeasurement}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-500/10 transition-all flex items-center justify-center gap-3"
              >
                <i className="fa-solid fa-camera"></i>
                Log Physique Entry
              </button>
            </div>
          </section>
        </aside>

        <main className="flex-grow p-10 space-y-16 overflow-y-auto bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.03),transparent_50%)]">
          {view === 'current' ? (
            <>
              <section className="space-y-8">
                <div className="flex items-baseline justify-between px-2">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Symmetry Rankings</h2>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Targeting: 100% Greek Proportion</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {sortedSpectrums.map((data) => <SpectrumCard key={data.key} data={data} unit={unit} />)}
                </div>
              </section>

              <section className="glass rounded-[3rem] p-12 flex flex-col items-center">
                <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Symmetry Matrix</h2>
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">Ideal Proportions vs. Current Baseline</p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <button onClick={() => setShowCurrent(!showCurrent)} className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all ${showCurrent ? 'bg-white text-slate-900 border-white font-black' : 'bg-transparent border-white/10 text-slate-500 font-bold'}`}>
                      <div className={`w-3 h-3 rounded-full ${showCurrent ? 'bg-indigo-600' : 'bg-slate-700'}`}></div>
                      <span className="text-[10px] uppercase tracking-widest">My Physique</span>
                    </button>
                    <button onClick={() => setShowAverage(!showAverage)} className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all ${showAverage ? 'bg-slate-700 text-white border-slate-600 font-black' : 'bg-transparent border-white/10 text-slate-500 font-bold'}`}>
                      <div className={`w-3 h-3 rounded-full ${showAverage ? 'bg-slate-300' : 'bg-slate-800'}`}></div>
                      <span className="text-[10px] uppercase tracking-widest">Pop. Average</span>
                    </button>
                  </div>
                </div>
                <div className="w-full max-w-4xl h-[600px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="#1e293b" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12, fontWeight: 900, letterSpacing: '1px' }} />
                      <PolarRadiusAxis angle={90} domain={[0, 110]} tick={false} axisLine={false} />
                      <Radar name="Ideal" dataKey="Ideal" stroke="#6366f1" strokeWidth={2} fill="#6366f1" fillOpacity={0.05} />
                      {showAverage && <Radar name="Average" dataKey="Average" stroke="#475569" strokeWidth={2} fill="#475569" fillOpacity={0.1} strokeDasharray="4 4" />}
                      {showCurrent && <Radar name="Current" dataKey="Current" stroke="#ffffff" strokeWidth={4} fill="#ffffff" fillOpacity={0.3} className="filter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />}
                      <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '20px' }} itemStyle={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </>
          ) : (
            <section className="space-y-12">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Evolution Trends</h2>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Historical Growth & Definition Tracking</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-indigo-400">{history.length}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-600">Snapshots Logged</div>
                </div>
              </div>

              {history.length < 2 ? (
                <div className="glass p-20 rounded-[3rem] flex flex-col items-center text-center gap-6">
                  <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center text-slate-700 text-3xl">
                    <i className="fa-solid fa-chart-line"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Insufficient Data</h3>
                    <p className="text-slate-500 text-sm mt-2 max-w-sm">You need at least two measurements logged to visualize growth trends. Start tracking your progress today.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-12">
                   <div className="glass p-10 rounded-[2.5rem] border-white/5">
                    <h3 className="text-lg font-black text-white uppercase tracking-widest mb-10 flex items-center gap-4">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div> Upper Body Growth
                    </h3>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis dataKey="date" stroke="#475569" tick={{fontSize: 10, fontWeight: 700}} tickLine={false} axisLine={false} />
                          <YAxis stroke="#475569" tick={{fontSize: 10, fontWeight: 700}} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#020617', border: 'none', borderRadius: '15px', color: '#fff' }} />
                          <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} />
                          <Line type="monotone" dataKey="chest" name="Chest" stroke="#818cf8" strokeWidth={4} dot={{ r: 6, fill: '#818cf8', strokeWidth: 4, stroke: '#06080b' }} />
                          <Line type="monotone" dataKey="biceps" name="Biceps" stroke="#c084fc" strokeWidth={4} dot={{ r: 6, fill: '#c084fc', strokeWidth: 4, stroke: '#06080b' }} />
                          <Line type="monotone" dataKey="shoulders" name="Shoulders" stroke="#f472b6" strokeWidth={4} dot={{ r: 6, fill: '#f472b6', strokeWidth: 4, stroke: '#06080b' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="glass p-10 rounded-[2.5rem] border-white/5">
                    <h3 className="text-lg font-black text-white uppercase tracking-widest mb-10 flex items-center gap-4">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div> Midsection & Core
                    </h3>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis dataKey="date" stroke="#475569" tick={{fontSize: 10, fontWeight: 700}} tickLine={false} axisLine={false} />
                          <YAxis stroke="#475569" tick={{fontSize: 10, fontWeight: 700}} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#020617', border: 'none', borderRadius: '15px' }} />
                          <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} />
                          <Line type="monotone" dataKey="waist" name="Waist" stroke="#fb7185" strokeWidth={4} dot={{ r: 6, fill: '#fb7185', strokeWidth: 4, stroke: '#06080b' }} />
                          <Line type="monotone" dataKey="hips" name="Hips" stroke="#34d399" strokeWidth={4} dot={{ r: 6, fill: '#34d399', strokeWidth: 4, stroke: '#06080b' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          <footer className="pt-10 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-10 opacity-60">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Calculations based on John McCallum's Grecian Ideal proportions. Wrist serves as the skeletal anchor.</p>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed text-right">Encrypted local session active for {user}. Data remains on device.</p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default App;
