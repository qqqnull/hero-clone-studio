import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

export interface CaptchaHandle {
  refresh: () => void;
  validate: (input: string) => boolean;
  getCode: () => string;
}

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(len = 4) {
  let s = '';
  for (let i = 0; i < len; i++) s += CHARS[Math.floor(Math.random() * CHARS.length)];
  return s;
}

export const Captcha = forwardRef<CaptchaHandle>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const codeRef = useRef<string>(randomCode());

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // background
    ctx.fillStyle = '#f3f0ff';
    ctx.fillRect(0, 0, w, h);

    const code = codeRef.current;
    const colors = ['#735AE7', '#4F46E5', '#9333EA', '#7C3AED', '#6366F1'];

    // characters
    for (let i = 0; i < code.length; i++) {
      ctx.save();
      const x = 14 + i * 22;
      const y = h / 2 + (Math.random() * 6 - 3);
      const angle = (Math.random() * 40 - 20) * (Math.PI / 180);
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.textBaseline = 'middle';
      ctx.fillText(code[i], 0, 0);
      ctx.restore();
    }

    // interference lines
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = colors[Math.floor(Math.random() * colors.length)] + '80';
      ctx.beginPath();
      ctx.moveTo(Math.random() * w, Math.random() * h);
      ctx.lineTo(Math.random() * w, Math.random() * h);
      ctx.stroke();
    }

    // dots
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)] + '60';
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  const refresh = useCallback(() => {
    codeRef.current = randomCode();
    draw();
  }, [draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  useImperativeHandle(ref, () => ({
    refresh,
    validate: (input: string) => input.trim().toUpperCase() === codeRef.current,
    getCode: () => codeRef.current,
  }));

  return (
    <button
      type="button"
      onClick={refresh}
      title="点击刷新验证码"
      className="relative inline-flex items-center justify-center rounded-md overflow-hidden border border-input hover:opacity-90 transition group"
    >
      <canvas ref={canvasRef} width={120} height={40} className="block" />
      <RefreshCw className="absolute right-1 bottom-1 w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition" />
    </button>
  );
});

Captcha.displayName = 'Captcha';
