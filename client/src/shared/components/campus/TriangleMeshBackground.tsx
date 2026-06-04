/** Malha de triângulos irregulares — decoração de fundo com blur suave */
export const TriangleMeshBackground = () => (
  <div className="campus-triangle-mesh" aria-hidden>
    <svg
      className="campus-triangle-mesh__svg"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <filter id="campus-mesh-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
        </filter>
      </defs>
      <g filter="url(#campus-mesh-blur)">
        <g fill="rgba(245, 197, 24, 0.03)" stroke="none">
          <path d="M0 0 L380 120 L120 320 Z" />
          <path d="M120 320 L380 120 L520 380 Z" />
          <path d="M380 120 L720 40 L520 380 Z" />
          <path d="M720 40 L1080 160 L520 380 Z" />
          <path d="M1080 160 L1440 0 L900 280 Z" />
          <path d="M520 380 L900 280 L680 560 Z" />
          <path d="M900 280 L1440 0 L1240 420 Z" />
          <path d="M680 560 L1240 420 L1080 720 Z" />
          <path d="M1080 720 L1440 900 L420 780 Z" />
          <path d="M420 780 L0 900 L0 520 Z" />
          <path d="M120 320 L420 780 L0 520 Z" />
          <path d="M240 640 L520 380 L680 560 Z" />
          <path d="M960 480 L1080 160 L1240 420 Z" />
        </g>
        <g
          fill="none"
          stroke="rgba(245, 197, 24, 0.35)"
          strokeWidth="1.25"
          strokeLinejoin="round"
        >
          <path d="M0 0 L380 120 L120 320 Z" />
          <path d="M380 120 L720 40 L520 380 Z" />
          <path d="M720 40 L1080 160 L520 380 Z" />
          <path d="M1080 160 L1440 0 L900 280 Z" />
          <path d="M520 380 L900 280 L680 560 Z" />
          <path d="M900 280 L1240 420 L1080 720 Z" />
          <path d="M680 560 L1080 720 L420 780 Z" />
          <path d="M420 780 L0 900 L0 520 Z" />
          <path d="M120 320 L240 640 L520 380 Z" />
          <path d="M0 0 L720 40 M380 120 L1440 0 M120 320 L1080 720 M520 380 L1440 520" />
        </g>
        <g
          fill="none"
          stroke="rgba(184, 184, 184, 0.3)"
          strokeWidth="1"
          strokeLinejoin="round"
        >
          <path d="M120 320 L420 780 L680 560 Z" />
          <path d="M960 480 L680 560 L520 380 Z" />
          <path d="M1240 420 L1440 0 L1440 520 Z" />
          <path d="M240 640 L0 520 L120 320 Z" />
        </g>
      </g>
    </svg>
  </div>
);
