'use client';

export type AvatarState = 'idle' | 'listening' | 'thinking' | 'speaking';

export function DoctorAvatar({ state, mouthOpen = false, className = '' }: { state: AvatarState; mouthOpen?: boolean; className?: string }) {
  return (
    <div className={`relative ${className}`} aria-label="Dr. Maya beauty consultant avatar">
      <style>{`
        .dr-maya {
          animation: maya-breathe 5s ease-in-out infinite;
        }
        @keyframes maya-breathe {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-4px); }
        }

        /* ── Blink ── */
        .maya-lid {
          transform-box: fill-box;
          transform-origin: 50% 0%;
          transform: scaleY(0);
          animation: maya-blink 5s infinite;
        }
        .maya-lid-r { animation-delay: 0.06s; }
        @keyframes maya-blink {
          0%, 84%, 94%, 100% { transform: scaleY(0); }
          89%                { transform: scaleY(1); }
        }

        /* ── Speaking mouth ── */
        .maya-gap {
          transform-box: fill-box;
          transform-origin: 50% 50%;
          transform: scaleY(0);
          transition: transform 0.09s ease-in-out;
        }
        /* Slightly parted during speech (fallback for browsers without onboundary) */
        .maya-speaking .maya-gap { transform: scaleY(0.12); }
        /* Full open when a word boundary fires */
        .maya-mouth-open .maya-gap { transform: scaleY(1); }

        /* ── Thinking brows ── */
        .maya-brow-l { transition: transform 0.35s ease; }
        .maya-brow-r { transition: transform 0.35s ease; }
        .maya-thinking .maya-brow-l {
          transform-box: fill-box;
          transform-origin: right center;
          transform: translate(-2px, -4px) rotate(-8deg);
        }
        .maya-thinking .maya-brow-r {
          transform-box: fill-box;
          transform-origin: left center;
          transform: translate(2px, -4px) rotate(8deg);
        }

        /* ── Listening pulse rings ── */
        .maya-ring { opacity: 0; }
        .maya-listening .maya-ring {
          animation: maya-pulse 1.6s ease-out infinite;
          transform-box: fill-box;
          transform-origin: 50% 50%;
          opacity: 1;
        }
        .maya-listening .maya-ring-2 { animation-delay: 0.52s; }
        .maya-listening .maya-ring-3 { animation-delay: 1.04s; }
        @keyframes maya-pulse {
          0%   { transform: scale(1);    opacity: 0.55; }
          100% { transform: scale(1.45); opacity: 0; }
        }
      `}</style>

      <svg
        viewBox="0 0 300 380"
        className={`dr-maya w-full h-full ${
          state === 'speaking'  ? `maya-speaking${mouthOpen ? ' maya-mouth-open' : ''}` :
          state === 'listening' ? 'maya-listening' :
          state === 'thinking'  ? 'maya-thinking'  : ''
        }`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="maya-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F9F5F1" />
            <stop offset="100%" stopColor="#EDE6DD" />
          </linearGradient>
          <radialGradient id="maya-face-g" cx="42%" cy="36%" r="64%">
            <stop offset="0%" stopColor="#F5CAA8" />
            <stop offset="100%" stopColor="#D2905A" />
          </radialGradient>
          <radialGradient id="maya-coat-g" cx="50%" cy="0%" r="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#EEE9E2" />
          </radialGradient>
          <filter id="maya-drop" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="11" floodColor="rgba(70,35,10,0.18)" />
          </filter>
        </defs>

        {/* Background */}
        <rect width="300" height="380" fill="url(#maya-bg)" />
        {/* Subtle brand dots */}
        <circle cx="28"  cy="28"  r="2" fill="#B76E79" opacity="0.07" />
        <circle cx="272" cy="28"  r="2" fill="#B76E79" opacity="0.07" />
        <circle cx="28"  cy="352" r="2" fill="#B76E79" opacity="0.07" />
        <circle cx="272" cy="352" r="2" fill="#B76E79" opacity="0.07" />
        <circle cx="150" cy="18"  r="1.5" fill="#B76E79" opacity="0.05" />

        {/* Listening rings */}
        <circle cx="150" cy="162" r="86"  fill="none" stroke="#B76E79" strokeWidth="2"   className="maya-ring" />
        <circle cx="150" cy="162" r="86"  fill="none" stroke="#B76E79" strokeWidth="1.5" className="maya-ring maya-ring-2" />
        <circle cx="150" cy="162" r="86"  fill="none" stroke="#B76E79" strokeWidth="1"   className="maya-ring maya-ring-3" />

        {/* ── Body / Lab coat ── */}
        <path d="M 0 380 L 22 296 Q 150 258 278 296 L 300 380 Z" fill="url(#maya-coat-g)" />
        <path d="M 22 296 Q 150 258 278 296" stroke="#DDD6CD" strokeWidth="1" fill="none" />
        {/* Left lapel */}
        <path d="M 144 261 L 115 292 L 104 342 L 88 380 L 146 380 Z" fill="#ECEAE5" />
        {/* Right lapel */}
        <path d="M 156 261 L 185 292 L 196 342 L 212 380 L 154 380 Z" fill="#ECEAE5" />
        {/* Inner top — teal scrubs */}
        <path d="M 144 261 L 130 286 L 130 380 L 170 380 L 170 286 L 156 261 Z" fill="#6DB5C2" />
        {/* Coat buttons */}
        <circle cx="142" cy="302" r="3.5" fill="#E0D8CE" stroke="#CBBFB4" strokeWidth="0.6" />
        <circle cx="142" cy="318" r="3.5" fill="#E0D8CE" stroke="#CBBFB4" strokeWidth="0.6" />
        <circle cx="142" cy="334" r="3.5" fill="#E0D8CE" stroke="#CBBFB4" strokeWidth="0.6" />

        {/* ── Neck ── */}
        <path d="M 131 252 Q 135 258 150 260 Q 165 258 169 252 L 167 296 Q 150 302 133 296 Z" fill="#D08A52" />
        <path d="M 131 252 Q 133 268 133 296" stroke="#B87040" strokeWidth="4.5" fill="none" opacity="0.35" strokeLinecap="round" />
        <path d="M 169 252 Q 167 268 167 296" stroke="#B87040" strokeWidth="4.5" fill="none" opacity="0.35" strokeLinecap="round" />

        {/* ── Head ── */}
        {/* Shadow underneath */}
        <ellipse cx="150" cy="174" rx="77" ry="91" fill="rgba(70,30,5,0.09)" />
        {/* Face */}
        <ellipse cx="150" cy="170" rx="75" ry="89" fill="url(#maya-face-g)" filter="url(#maya-drop)" />

        {/* ── Ears ── */}
        <ellipse cx="75"  cy="176" rx="12" ry="16" fill="#CC8848" />
        <ellipse cx="225" cy="176" rx="12" ry="16" fill="#CC8848" />
        <ellipse cx="75"  cy="176" rx="6.5" ry="10" fill="#B06830" opacity="0.42" />
        <ellipse cx="225" cy="176" rx="6.5" ry="10" fill="#B06830" opacity="0.42" />
        {/* Gold stud earrings */}
        <circle cx="75"  cy="188" r="4.5" fill="#D4B060" stroke="#B8944A" strokeWidth="0.6" />
        <circle cx="225" cy="188" r="4.5" fill="#D4B060" stroke="#B8944A" strokeWidth="0.6" />

        {/* ── Hair ── */}
        {/* Back mass */}
        <ellipse cx="150" cy="97"  rx="76" ry="64" fill="#1A0904" />
        {/* Side pieces */}
        <ellipse cx="82"  cy="155" rx="21" ry="55" fill="#1A0904" />
        <ellipse cx="218" cy="155" rx="21" ry="55" fill="#1A0904" />
        {/* Bun */}
        <circle cx="150" cy="66" r="30" fill="#220C04" />
        <circle cx="150" cy="66" r="22" fill="#1A0904" />
        {/* Bun shine */}
        <ellipse cx="143" cy="59" rx="10" ry="6.5" fill="#3A1A0A" opacity="0.7" />
        <ellipse cx="140" cy="57" rx="4.5" ry="2.5" fill="#5A2E14" opacity="0.55" />
        {/* Hairline */}
        <path d="M 91 100 Q 150 84 209 100" stroke="#1A0904" strokeWidth="14" fill="none" strokeLinecap="round" />
        {/* Front strands */}
        <path d="M 93 104 Q 96 118 90 145" stroke="#1A0904" strokeWidth="9"  fill="none" strokeLinecap="round" />
        <path d="M 207 104 Q 204 118 210 145" stroke="#1A0904" strokeWidth="9"  fill="none" strokeLinecap="round" />

        {/* ── Eyebrows ── */}
        <path d="M 106 131 Q 120 122 137 127" stroke="#220C04" strokeWidth="4"   fill="none" strokeLinecap="round" className="maya-brow-l" />
        <path d="M 163 127 Q 180 122 194 131" stroke="#220C04" strokeWidth="4"   fill="none" strokeLinecap="round" className="maya-brow-r" />

        {/* ── Eyes ── */}
        {/* Whites */}
        <ellipse cx="120" cy="154" rx="17" ry="11" fill="white" />
        <ellipse cx="180" cy="154" rx="17" ry="11" fill="white" />
        {/* Iris */}
        <circle cx="120" cy="155" r="9.5" fill="#3C1C08" />
        <circle cx="180" cy="155" r="9.5" fill="#3C1C08" />
        {/* Pupils */}
        <circle cx="120" cy="155" r="5.5" fill="#0C0402" />
        <circle cx="180" cy="155" r="5.5" fill="#0C0402" />
        {/* Highlights */}
        <circle cx="123" cy="151" r="3"   fill="white" />
        <circle cx="183" cy="151" r="3"   fill="white" />
        <circle cx="118" cy="158" r="1.5" fill="white" opacity="0.5" />
        <circle cx="178" cy="158" r="1.5" fill="white" opacity="0.5" />
        {/* Upper lashes */}
        <path d="M 103 147 Q 120 140 137 147" stroke="#1A0904" strokeWidth="2.8" fill="none" strokeLinecap="round" />
        <path d="M 163 147 Q 180 140 197 147" stroke="#1A0904" strokeWidth="2.8" fill="none" strokeLinecap="round" />
        {/* Lower lashes */}
        <path d="M 106 162 Q 120 167 134 162" stroke="#1A0904" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.45" />
        <path d="M 166 162 Q 180 167 194 162" stroke="#1A0904" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.45" />
        {/* Eyelids for blink */}
        <ellipse cx="120" cy="154" rx="17" ry="11" fill="#DFA876" className="maya-lid"     />
        <ellipse cx="180" cy="154" rx="17" ry="11" fill="#DFA876" className="maya-lid maya-lid-r" />

        {/* ── Nose ── */}
        <path d="M 150 174 C 147 180 144 186 142 191 Q 146 196 150 195 Q 154 196 158 191 C 156 186 153 180 150 174" fill="#C4804A" opacity="0.28" />
        <path d="M 150 174 C 148 180 145 186 143 191" stroke="#B86C38" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
        <path d="M 150 174 C 152 180 155 186 157 191" stroke="#B86C38" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
        <path d="M 141 191 Q 150 196 159 191"         stroke="#B86C38" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />

        {/* ── Cheek blush ── */}
        <ellipse cx="103" cy="181" rx="21" ry="13" fill="#E8806A" opacity="0.13" />
        <ellipse cx="197" cy="181" rx="21" ry="13" fill="#E8806A" opacity="0.13" />

        {/* ── Mouth ── */}
        {/* Upper lip */}
        <path d="M 133 208 Q 141 201 150 204 Q 159 201 167 208" stroke="#9A4E3A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M 133 208 Q 141 201 150 204 Q 159 201 167 208 Q 158 212 150 211 Q 142 212 133 208 Z" fill="#C47060" />
        {/* Lower lip */}
        <path d="M 133 208 Q 150 223 167 208" fill="#D48A78" />
        <path d="M 133 208 Q 150 223 167 208" stroke="#9A4E3A" strokeWidth="1" fill="none" strokeLinecap="round" />
        {/* Center line */}
        <path d="M 133 208 Q 150 210 167 208" stroke="#9A4E3A" strokeWidth="0.8" fill="none" strokeLinecap="round" />
        {/* Speaking gap (dark) */}
        <ellipse cx="150" cy="212" rx="13" ry="6" fill="#5C1C10" className="maya-gap" />
        {/* Teeth */}
        <ellipse cx="150" cy="210" rx="10" ry="4" fill="#F6F1EC" className="maya-gap" />
        {/* Dimples */}
        <circle cx="130" cy="212" r="2.5" fill="#B87040" opacity="0.22" />
        <circle cx="170" cy="212" r="2.5" fill="#B87040" opacity="0.22" />

        {/* ── Stethoscope ── */}
        <path d="M 130 257 Q 108 254 100 243 Q 92 230 94 216 Q 94 205 100 200" stroke="#8A9AA8" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <circle cx="100" cy="196" r="9"   fill="none" stroke="#8A9AA8" strokeWidth="3" />
        <circle cx="100" cy="196" r="4.5" fill="#8A9AA8" />
        <path d="M 170 257 Q 192 254 200 243 Q 208 230 206 216 Q 206 205 200 200" stroke="#8A9AA8" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M 130 257 Q 150 270 170 257" stroke="#8A9AA8" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <circle cx="150" cy="273" r="8"   fill="#9AAAB8" stroke="#7A8A98" strokeWidth="1" />
        <circle cx="150" cy="273" r="4"   fill="#B4C4CE" />

        {/* ── Name badge ── */}
        <rect x="60" y="300" width="74" height="35" rx="5" fill="white" stroke="#DDD8D0" strokeWidth="1" />
        <rect x="60" y="300" width="74" height="11" rx="5" fill="#B76E79" />
        <text x="97" y="309"  textAnchor="middle" fill="white" fontSize="6.5" fontFamily="system-ui,sans-serif" fontWeight="700" letterSpacing="0.5">DR. MAYA</text>
        <text x="97" y="321"  textAnchor="middle" fill="#555"   fontSize="5.5" fontFamily="system-ui,sans-serif">Beauty Specialist</text>
        <text x="97" y="330"  textAnchor="middle" fill="#B76E79" fontSize="5"  fontFamily="system-ui,sans-serif">CrazyGels</text>
      </svg>
    </div>
  );
}
