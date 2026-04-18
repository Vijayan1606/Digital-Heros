'use client';
import { useState } from 'react';

export default function AdminQuickActions() {
  const [loading, setLoading] = useState(false);

  const runDraw = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/draws/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draw_month: new Date().toISOString(),
          draw_type: 'random',
          is_publish: false
        })
      });
      const data = await res.json();
      if(data.success) alert('Success! Draw Simulated. Check the Draws page!');
      else alert('Error: ' + data.error);
    } catch(e) {
      alert('Error running draw.');
    } finally {
      setLoading(false);
    }
  };

  const calculatePrizes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/draws/calculate-prizes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draw_id: 'latest' })
      });
      const data = await res.json();
      if(data.success) alert('Success! Prizes calculated for the latest draw.');
      else alert('Error: ' + data.error);
    } catch(e) {
      alert('Error calculating prizes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-4">
      <button onClick={runDraw} disabled={loading} className="bg-primary hover:bg-primary/90 text-white font-medium py-3 px-6 rounded-lg transition-colors border border-primary/50 disabled:opacity-50">
        {loading ? 'Processing...' : 'Run Draw Simulation (Current Month)'}
      </button>
      <button onClick={calculatePrizes} disabled={loading} className="bg-secondary hover:bg-white/10 text-white font-medium py-3 px-6 rounded-lg transition-colors border border-border hover:border-white/20 disabled:opacity-50">
        {loading ? 'Processing...' : 'Calculate Latest Prize Pool'}
      </button>
    </div>
  );
}
