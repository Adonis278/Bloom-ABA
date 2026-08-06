import { useEffect, useRef, useState } from 'react';

/* The one 450ms crossfade the motion budget allows (CLAUDE.md hard rule 11),
   and nothing else animates. Give it a `phase` key: whenever that key
   changes, the current children fade out then the new children fade in
   over `duration-step` (450ms, from tailwind.config.js).

   prefers-reduced-motion is handled globally in index.css — every
   transition duration is zeroed there, so this component needs no media
   query of its own; it just stops moving. */
export default function Crossfade({ phase, children }) {
  const [visible, setVisible] = useState(true);
  const prevPhase = useRef(phase);

  useEffect(() => {
    if (prevPhase.current === phase) return;
    prevPhase.current = phase;
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <div className={`transition-opacity duration-step ${visible ? 'opacity-100' : 'opacity-0'}`}>
      {children}
    </div>
  );
}
