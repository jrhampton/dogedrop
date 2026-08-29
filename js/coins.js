/**
 * DogeDrop: Crypto Merge — coin tier data + canvas artwork.
 *
 * Tiers are ordered by real CoinMarketCap rank (stablecoins excluded),
 * ascending from the smallest-cap coin (tier 0) up to Bitcoin (tier 9),
 * captured 2026-08-29. Artwork is code-drawn on <canvas> — original vector
 * shapes evoking each project's real brand color + iconic mark — rather
 * than bundled third-party logo files.
 */

const COIN_TIERS = [
  { symbol: 'LEO',  name: 'UNUS SED LEO', radius: 18, color: '#F4A932', color2: '#8A5A0A', glow: '#FFC65C', value: 2 },
  { symbol: 'ZEC',  name: 'Zcash',        radius: 24, color: '#F4B728', color2: '#8A6A10', glow: '#FFD65C', value: 4 },
  { symbol: 'DOGE', name: 'Dogecoin',     radius: 31, color: '#C2A633', color2: '#7A6A1A', glow: '#E8CE6A', value: 8 },
  { symbol: 'HYPE', name: 'Hyperliquid',  radius: 39, color: '#4FE3C1', color2: '#0B3B36', glow: '#8FFCE4', value: 16 },
  { symbol: 'TRX',  name: 'TRON',         radius: 48, color: '#EF0027', color2: '#6E0012', glow: '#FF5C77', value: 32 },
  { symbol: 'SOL',  name: 'Solana',       radius: 58, color: '#9945FF', color2: '#12285C', glow: '#14F195', value: 64 },
  { symbol: 'XRP',  name: 'XRP',          radius: 69, color: '#25A1E8', color2: '#0C1B2E', glow: '#8FD4FF', value: 128 },
  { symbol: 'BNB',  name: 'BNB',          radius: 81, color: '#F0B90A', color2: '#5C4400', glow: '#FFE066', value: 256 },
  { symbol: 'ETH',  name: 'Ethereum',     radius: 94, color: '#627EEA', color2: '#1B2560', glow: '#B4C2FF', value: 512 },
  { symbol: 'BTC',  name: 'Bitcoin',      radius: 108, color: '#F7931A', color2: '#7A3E00', glow: '#FFC876', value: 1024 },
];

const MAX_TIER = COIN_TIERS.length - 1;
const MAX_DROP_TIER = 4; // only LEO..TRX (tiers 0-4) are droppable

function lighten(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (n >> 16) + amt);
  const g = Math.min(255, ((n >> 8) & 0xff) + amt);
  const b = Math.min(255, (n & 0xff) + amt);
  return `rgb(${r},${g},${b})`;
}

/** Draws one coin tier centered at (x,y) with the given render radius. */
function drawCoin(ctx, tierIndex, x, y, r, opts = {}) {
  const tier = COIN_TIERS[tierIndex];
  const wobble = opts.squash || 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, wobble);

  // Outer glow
  ctx.save();
  ctx.shadowColor = tier.glow;
  ctx.shadowBlur = r * 0.6;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.98, 0, Math.PI * 2);
  ctx.fillStyle = tier.color;
  ctx.fill();
  ctx.restore();

  // Base metallic gradient body
  const grad = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
  grad.addColorStop(0, lighten(tier.color, 60));
  grad.addColorStop(0.55, tier.color);
  grad.addColorStop(1, tier.color2);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Bevel rim
  ctx.lineWidth = Math.max(1.5, r * 0.06);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r - ctx.lineWidth, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = Math.max(1, r * 0.03);
  ctx.stroke();

  // Symbol
  ctx.save();
  ctx.globalAlpha = 0.96;
  drawSymbol(ctx, tier.symbol, r);
  ctx.restore();

  // Specular highlight
  const shine = ctx.createRadialGradient(-r * 0.4, -r * 0.5, 0, -r * 0.4, -r * 0.5, r * 0.7);
  shine.addColorStop(0, 'rgba(255,255,255,0.55)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = shine;
  ctx.fill();

  ctx.restore();
}

function drawSymbol(ctx, symbol, r) {
  ctx.fillStyle = 'rgba(20,14,4,0.88)';
  ctx.strokeStyle = 'rgba(20,14,4,0.88)';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (symbol) {
    case 'LEO': {
      // Lion-mane sunburst around a small core
      const spikes = 9;
      ctx.beginPath();
      for (let i = 0; i < spikes; i++) {
        const a0 = (i / spikes) * Math.PI * 2;
        const a1 = a0 + (Math.PI * 2) / spikes / 2;
        const outer = r * 0.62;
        const inner = r * 0.3;
        ctx.moveTo(Math.cos(a0) * inner, Math.sin(a0) * inner);
        ctx.lineTo(Math.cos(a1) * outer, Math.sin(a1) * outer);
        const a2 = a0 + (Math.PI * 2) / spikes;
        ctx.lineTo(Math.cos(a2) * inner, Math.sin(a2) * inner);
      }
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.26, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'ZEC': {
      // Bracket + bolt
      const w = r * 0.5, h = r * 0.62, lw = Math.max(2, r * 0.12);
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(-w, -h); ctx.lineTo(-w * 1.3, -h); ctx.lineTo(-w * 1.3, h); ctx.lineTo(-w, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w, -h); ctx.lineTo(w * 1.3, -h); ctx.lineTo(w * 1.3, h); ctx.lineTo(w, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-w * 0.55, -h * 0.7);
      ctx.lineTo(w * 0.55, -h * 0.7);
      ctx.lineTo(-w * 0.4, h * 0.15);
      ctx.lineTo(w * 0.55, h * 0.15);
      ctx.lineTo(-w * 0.55, h * 0.7);
      ctx.lineWidth = lw * 0.85;
      ctx.stroke();
      break;
    }
    case 'DOGE': {
      // Shiba Inu face
      const R = r * 0.62;
      ctx.beginPath(); ctx.arc(0, r * 0.02, R, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-R * 0.75, -R * 0.55); ctx.lineTo(-R * 1.15, -R * 1.5); ctx.lineTo(-R * 0.15, -R * 0.85);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(R * 0.75, -R * 0.55); ctx.lineTo(R * 1.15, -R * 1.5); ctx.lineTo(R * 0.15, -R * 0.85);
      ctx.closePath(); ctx.fill();
      // snout
      ctx.fillStyle = 'rgba(250,244,224,0.92)';
      ctx.beginPath(); ctx.ellipse(0, R * 0.35, R * 0.55, R * 0.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(20,14,4,0.88)';
      // eyes
      ctx.beginPath(); ctx.arc(-R * 0.32, -R * 0.05, R * 0.11, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(R * 0.32, -R * 0.05, R * 0.11, 0, Math.PI * 2); ctx.fill();
      // nose + mouth
      ctx.beginPath(); ctx.arc(0, R * 0.28, R * 0.09, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = Math.max(1.5, r * 0.05);
      ctx.beginPath(); ctx.moveTo(0, R * 0.36); ctx.lineTo(0, R * 0.5);
      ctx.moveTo(0, R * 0.5); ctx.quadraticCurveTo(-R * 0.25, R * 0.62, -R * 0.4, R * 0.48);
      ctx.moveTo(0, R * 0.5); ctx.quadraticCurveTo(R * 0.25, R * 0.62, R * 0.4, R * 0.48);
      ctx.stroke();
      break;
    }
    case 'HYPE': {
      // Liquid droplet
      const R = r * 0.55;
      ctx.beginPath();
      ctx.moveTo(0, -R * 1.3);
      ctx.bezierCurveTo(R * 1.1, -R * 0.2, R * 0.9, R * 1.2, 0, R * 1.2);
      ctx.bezierCurveTo(-R * 0.9, R * 1.2, -R * 1.1, -R * 0.2, 0, -R * 1.3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.ellipse(-R * 0.25, R * 0.1, R * 0.18, R * 0.35, -0.4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'TRX': {
      // Angular converging bars
      const w = r * 0.62;
      ctx.beginPath();
      ctx.moveTo(-w, -w * 0.75); ctx.lineTo(w, -w * 0.75); ctx.lineTo(w * 0.15, -w * 0.15); ctx.lineTo(-w * 0.75, -w * 0.15);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-w * 0.55, -w * 0.05); ctx.lineTo(w * 0.05, -w * 0.05); ctx.lineTo(w * 0.3, w * 0.85); ctx.lineTo(-w * 0.05, w * 0.85);
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'SOL': {
      // Three slanted bars
      const w = r * 0.75, h = r * 0.16, gap = r * 0.28, skew = r * 0.14;
      for (let i = -1; i <= 1; i++) {
        const cy = i * gap;
        ctx.beginPath();
        ctx.moveTo(-w + skew, cy - h); ctx.lineTo(w, cy - h);
        ctx.lineTo(w - skew, cy + h); ctx.lineTo(-w, cy + h);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case 'XRP': {
      // Crossing wave bands forming an X
      const w = r * 0.65, lw = Math.max(3, r * 0.18);
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(-w, -w); ctx.quadraticCurveTo(0, 0, -w, w);
      ctx.moveTo(-w, -w); ctx.quadraticCurveTo(0, -w * 0.15, w, -w);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w, -w); ctx.quadraticCurveTo(0, 0, w, w);
      ctx.moveTo(-w, w); ctx.quadraticCurveTo(0, w * 0.15, w, w);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, lw * 0.55, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'BNB': {
      // Connected diamonds
      const d = r * 0.22, gap = r * 0.4;
      const diamond = (cx, cy, s) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy - s); ctx.lineTo(cx + s, cy); ctx.lineTo(cx, cy + s); ctx.lineTo(cx - s, cy);
        ctx.closePath(); ctx.fill();
      };
      diamond(0, 0, d);
      diamond(-gap, 0, d * 0.7); diamond(gap, 0, d * 0.7);
      diamond(0, -gap, d * 0.7); diamond(0, gap, d * 0.7);
      break;
    }
    case 'ETH': {
      // Faceted diamond
      const w = r * 0.42, topY = -r * 0.62, midY = r * 0.02, botY = r * 0.62;
      ctx.beginPath();
      ctx.moveTo(0, topY); ctx.lineTo(w, midY); ctx.lineTo(0, midY + r * 0.18); ctx.lineTo(-w, midY);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(20,14,4,0.55)';
      ctx.beginPath();
      ctx.moveTo(0, topY); ctx.lineTo(w, midY); ctx.lineTo(0, midY + r * 0.18);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(20,14,4,0.88)';
      ctx.beginPath();
      ctx.moveTo(0, midY + r * 0.32); ctx.lineTo(w, midY + r * 0.08); ctx.lineTo(0, botY); ctx.lineTo(-w, midY + r * 0.08);
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'BTC': {
      // Currency glyph (generic Unicode symbol, not a trademarked wordmark)
      ctx.font = `900 ${r * 1.25}px system-ui, -apple-system, "Segoe UI", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('₿', 0, r * 0.05);
      break;
    }
    default:
      ctx.font = `700 ${r * 0.5}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(symbol, 0, 0);
  }
}
