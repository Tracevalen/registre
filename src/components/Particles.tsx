import { useEffect, useRef } from "react";

interface Props {
  /** Couleur des étincelles (couleur de la classe). */
  color: string;
  /** Change cette valeur pour déclencher une explosion d'étincelles. */
  burst: number;
  /** Intensité des braises qui montent en continu (0 à 1). */
  ambient?: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
}

/** Étincelles sur canvas : braises qui montent, et explosion au moment de la révélation. */
export function Particles({ color, burst, ambient = 0.5 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const sparks = useRef<Spark[]>([]);
  const settings = useRef({ color, ambient });
  settings.current = { color, ambient };

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let raf = 0;
    const resize = () => {
      canvas.width = canvas.clientWidth * devicePixelRatio;
      canvas.height = canvas.clientHeight * devicePixelRatio;
    };
    resize();
    window.addEventListener("resize", resize);

    const tick = () => {
      const { color: c, ambient: a } = settings.current;
      const w = canvas.width;
      const h = canvas.height;
      const s = devicePixelRatio;
      // Braises qui montent du bas de l'écran
      if (Math.random() < a) {
        sparks.current.push({
          x: Math.random() * w,
          y: h + 10,
          vx: (Math.random() - 0.5) * 0.6 * s,
          vy: -(1 + Math.random() * 2.2) * s,
          life: 0,
          max: 120 + Math.random() * 120,
          size: (1 + Math.random() * 2.2) * s,
        });
      }
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      sparks.current = sparks.current.filter((p) => p.life < p.max);
      for (const p of sparks.current) {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02 * s;
        p.vx *= 0.99;
        const alpha = 1 - p.life / p.max;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = c;
        ctx.shadowColor = c;
        ctx.shadowBlur = 12 * s;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Explosion depuis le centre
  useEffect(() => {
    if (!burst) return;
    const canvas = ref.current;
    if (!canvas) return;
    const s = devicePixelRatio;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    for (let i = 0; i < 160; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (3 + Math.random() * 9) * s;
      sparks.current.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2 * s,
        life: 0,
        max: 60 + Math.random() * 70,
        size: (1.5 + Math.random() * 3) * s,
      });
    }
  }, [burst]);

  return <canvas ref={ref} className="particles" aria-hidden />;
}
