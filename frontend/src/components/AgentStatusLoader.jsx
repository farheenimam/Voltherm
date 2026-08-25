import { useEffect, useState } from 'react';

/**
 * AgentStatusLoader — walks through the agent pipeline steps while
 * lib/api.js#screenSite() is in flight. Since the current backend responds
 * in one shot (no SSE yet), this fakes an even step-through of `steps` over
 * `estimatedDurationMs` and holds on the current step until `isComplete`
 * flips true. Swap the interval-based progression for real progress events
 * once the backend streams them (see agents/manager.js's onProgress hook).
 */
const DEFAULT_STEPS = [
  { key: 'heat', label: 'Analyzing surface heat exposure', agent: 'Heat Agent' },
  { key: 'shade', label: 'Mapping shade & canopy coverage', agent: 'Shade Agent' },
  { key: 'financial', label: 'Modeling derating cost exposure', agent: 'Financial Agent' },
  { key: 'critique', label: 'Cross-checking results & scoring', agent: 'Critique Agent' },
];

export default function AgentStatusLoader({ steps = DEFAULT_STEPS, isComplete = false, estimatedDurationMs = 4200 }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (isComplete) {
      setActiveIndex(steps.length); // mark everything done
      return undefined;
    }

    const perStep = estimatedDurationMs / steps.length;
    const timers = steps.map((_, i) => setTimeout(() => setActiveIndex((prev) => Math.max(prev, i)), i * perStep));
    return () => timers.forEach(clearTimeout);
  }, [isComplete, steps, estimatedDurationMs]);

  return (
    <div className="panel" style={{ padding: 28, maxWidth: 440 }} role="status" aria-live="polite">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <Spinner />
        <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
          {isComplete ? 'Analysis complete' : 'Analyzing site…'}
        </span>
      </div>

      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {steps.map((step, i) => {
          const status = isComplete || i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'pending';
          return (
            <li key={step.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <StepIcon status={status} />
              <div>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 500,
                    color: status === 'pending' ? 'var(--muted-2)' : '#fff',
                  }}
                >
                  {step.label}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{step.agent}</div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StepIcon({ status }) {
  const size = 20;
  if (status === 'done') {
    return (
      <span
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'var(--green)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <path d="M2 6.5L4.8 9L10 3" stroke="#141416" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (status === 'active') {
    return (
      <span
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: '2px solid var(--cyan)',
          borderTopColor: 'transparent',
          animation: 'voltherm-spin 0.8s linear infinite',
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: '2px solid var(--line)',
        flexShrink: 0,
      }}
    />
  );
}

function Spinner() {
  return (
    <span
      style={{
        width: 16,
        height: 16,
        borderRadius: '50%',
        border: '2px solid var(--green)',
        borderTopColor: 'transparent',
        animation: 'voltherm-spin 0.8s linear infinite',
        display: 'inline-block',
      }}
    />
  );
}

// Injected once; harmless if this component mounts multiple times.
const styleId = 'voltherm-spin-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = '@keyframes voltherm-spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(style);
}
