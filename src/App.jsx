import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { toPng } from 'html-to-image';
import {
  Share2,
  Flame,
  Users,
  Sparkles,
  Compass,
  ScrollText,
  Volume2,
  VolumeX,
} from 'lucide-react';
import milestones from './data/milestones.json';

const CIVILIZATIONS = [
  'All',
  'Ancient India',
  'Ancient Greece',
  'Ancient Egypt',
  'Ptolemaic Egypt',
  'Roman Egypt',
  'Ancient Rome',
  'Ancient China',
  'Mesopotamia',
];

const milestoneData = Array.isArray(milestones)
  ? milestones
  : Array.isArray(milestones?.milestones)
    ? milestones.milestones
    : [];

function useAncientAmbience() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef(null);

  const toggleSound = () => {
    if (isPlaying) {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      setIsPlaying(false);
      return;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const bufferSize = ctx.sampleRate * 3;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 0.18;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;

    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.25;

    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    whiteNoise.start(0);

    setIsPlaying(true);
  };

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return { isPlaying, toggleSound };
}

function EmberCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const embers = Array.from({ length: 48 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2.1 + 0.5,
      vx: (Math.random() - 0.5) * 0.45,
      vy: -(Math.random() * 0.65 + 0.2),
      alpha: Math.random() * 0.75 + 0.2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      embers.forEach((e) => {
        e.x += e.vx + Math.sin(e.y * 0.012) * 0.22;
        e.y += e.vy;
        if (e.y < 0) {
          e.y = canvas.height;
          e.x = Math.random() * canvas.width;
        }
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 158, 11, ${e.alpha})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#f59e0b';
        ctx.fill();
      });
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
}

function LivingAlleyBackdrop() {
  const { scrollY } = useScroll();
  const yFar = useTransform(scrollY, [0, 800], [0, -35]);
  const yNear = useTransform(scrollY, [0, 800], [0, -80]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-45">
      <motion.svg
        style={{ y: yFar }}
        viewBox="0 0 1200 600"
        className="w-full h-full object-cover"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="archGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d97706" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#090705" stopOpacity="0.98" />
          </linearGradient>
        </defs>
        <path
          d="M0,600 L0,0 L1200,0 L1200,600 L1020,600 L1020,240 C1020,90 180,90 180,240 L180,600 Z"
          fill="url(#archGrad)"
        />
        <path
          d="M280,600 L280,280 C280,160 920,160 920,280 L920,600 L840,600 L840,300 C840,210 360,210 360,300 L360,600 Z"
          fill="#1c140d"
          opacity="0.78"
        />
        <rect x="430" y="250" width="24" height="350" fill="#120c07" opacity="0.85" />
        <rect x="746" y="250" width="24" height="350" fill="#120c07" opacity="0.85" />
      </motion.svg>

      <motion.div
        style={{ y: yNear }}
        className="absolute top-24 left-6 md:left-16 w-32 h-32 rounded-full bg-amber-500/25 blur-3xl animate-pulse"
      />
      <motion.div
        style={{ y: yNear }}
        className="absolute top-24 right-6 md:right-16 w-32 h-32 rounded-full bg-orange-600/25 blur-3xl animate-pulse"
      />
    </div>
  );
}

export default function App() {
  const [age, setAge] = useState(26);
  const [userMilestone, setUserMilestone] = useState('');
  const [civFilter, setCivFilter] = useState('All');
  const [downloadError, setDownloadError] = useState('');
  const cardRefs = useRef({});
  const { isPlaying, toggleSound } = useAncientAmbience();

  const filteredByCiv = useMemo(
    () =>
      milestoneData.filter(
        (item) => civFilter === 'All' || item.civilization === civFilter
      ),
    [civFilter]
  );

  const exactMatches = useMemo(
    () => filteredByCiv.filter((item) => item.age === Number(age)),
    [filteredByCiv, age]
  );

  const nearbyMatches = useMemo(
    () =>
      filteredByCiv.filter(
        (item) =>
          Math.abs(item.age - Number(age)) > 0 &&
          Math.abs(item.age - Number(age)) <= 3
      ),
    [filteredByCiv, age]
  );

  const results = exactMatches.length > 0 ? exactMatches : nearbyMatches;

  const handleDownloadCard = async (id) => {
    const node = cardRefs.current[id];
    if (!node) return;
    try {
      setDownloadError('');
      const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `parallel-lives-age-${age}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      setDownloadError('Could not export image. Please try again.');
    }
  };

  return (
    <div className="relative min-h-screen ancient-vignette text-amber-50 selection:bg-amber-500 selection:text-stone-950">
      <LivingAlleyBackdrop />
      <EmberCanvas />

      <div className="relative z-20 max-w-2xl mx-auto px-4 pt-6 flex justify-end">
        <button
          onClick={toggleSound}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-900/80 border border-amber-500/25 text-amber-300 text-xs hover:border-amber-400 transition cursor-pointer backdrop-blur-md"
        >
          {isPlaying ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> Ambience On
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-stone-400" /> Ambience Off
            </>
          )}
        </button>
      </div>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-4 pb-16 space-y-10">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs uppercase tracking-[0.25em] backdrop-blur-md">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            Chronicles of Antiquity
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-amber-600 drop-shadow">
            PARALLEL LIVES
          </h1>
          <p className="text-sm md:text-base text-stone-300/80 max-w-md mx-auto">
            Walk the torch-lit corridors of history. Dial your age to reveal who stood in your shoes across ancient empires.
          </p>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="bg-stone-950/75 backdrop-blur-xl border border-amber-500/25 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(217,119,6,0.12)] space-y-6"
        >
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-amber-400/80">
                <Compass className="w-4 h-4 animate-spin" style={{ animationDuration: '18s' }} />
                Temporal Dial
              </span>
              <motion.span
                key={age}
                initial={{ scale: 1.25, color: '#fbbf24' }}
                animate={{ scale: 1, color: '#fef3c7' }}
                className="font-imperial text-3xl md:text-4xl font-extrabold"
              >
                {age} <span className="text-xs font-sans font-normal text-stone-400">YEARS</span>
              </motion.span>
            </div>

            <input
              type="range"
              min="16"
              max="65"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-stone-500 font-mono">
              <span>AGE 16</span>
              <span>AGE 30</span>
              <span>AGE 45</span>
              <span>AGE 65</span>
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-[0.18em] text-stone-400 block mb-2">
              Inscribe Your Present Milestone (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Building full-stack applications in Hyderabad..."
              value={userMilestone}
              onChange={(e) => setUserMilestone(e.target.value)}
              className="w-full bg-black/60 border border-amber-500/20 rounded-xl px-4 py-3 text-sm text-amber-50 placeholder-stone-600 focus:outline-none focus:border-amber-400 transition"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {CIVILIZATIONS.map((civ) => (
              <button
                key={civ}
                onClick={() => setCivFilter(civ)}
                className={`px-3.5 py-1.5 rounded-full text-xs tracking-wide whitespace-nowrap transition-all cursor-pointer border ${
                  civFilter === civ
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 font-bold border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                    : 'bg-stone-900/80 text-stone-300 border-stone-800 hover:border-amber-500/40'
                }`}
              >
                {civ}
              </button>
            ))}
          </div>
        </motion.section>

        <section className="space-y-6">
          {exactMatches.length === 0 && results.length > 0 && (
            <p className="text-xs text-amber-300/80 text-center tracking-wider uppercase">
              Showing closest chronicles within ±3 years of age {age}
            </p>
          )}

          {downloadError && (
            <p className="text-xs text-red-400 text-center">{downloadError}</p>
          )}

          <AnimatePresence mode="popLayout">
            {results.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center p-10 bg-stone-950/70 backdrop-blur-md rounded-3xl border border-stone-800 text-stone-400 text-sm"
              >
                The archives are silent for age {age} in this realm. Turn the dial or select &quot;All&quot;.
              </motion.div>
            ) : (
              results.map((item, idx) => (
                <motion.article
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 30, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 24, delay: idx * 0.08 }}
                  whileHover={{ y: -4 }}
                  ref={(el) => {
                    cardRefs.current[item.id] = el;
                  }}
                  className="group relative bg-gradient-to-b from-stone-900/90 to-black/95 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-6 md:p-7 space-y-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden"
                >
                  <div className="absolute -top-16 -right-16 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition" />

                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-[0.2em]">
                        <ScrollText className="w-3.5 h-3.5" />
                        {item.civilization} • Age {item.age}
                      </div>
                      <h2 className="text-2xl font-bold text-amber-50 mt-1 tracking-wide">
                        {item.figure}
                      </h2>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {item.role} — <span className="text-amber-200/70">{item.age_note}</span>
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px] font-medium">
                      {item.category}
                    </span>
                  </div>

                  <p className="text-sm md:text-base text-stone-200 leading-relaxed">
                    {item.achievement}
                  </p>

                  <div className="bg-black/60 border border-amber-500/15 rounded-2xl p-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 uppercase tracking-wider">
                      <Users className="w-3.5 h-3.5" /> In the Alleyways Below (Ordinary Citizen)
                    </div>
                    <p className="text-xs md:text-sm text-stone-400 leading-relaxed">
                      {item.everyday_parallel}
                    </p>
                  </div>

                  {userMilestone && (
                    <div className="border-t border-amber-500/20 pt-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" /> Your Chronicle at {age}
                      </div>
                      <p className="text-sm text-stone-200 mt-1">{userMilestone}</p>
                    </div>
                  )}

                  <button
                    onClick={() => handleDownloadCard(item.id)}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-bold text-xs uppercase tracking-widest py-3 rounded-xl transition shadow-lg cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" /> Export Relic Card
                  </button>
                </motion.article>
              ))
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}
