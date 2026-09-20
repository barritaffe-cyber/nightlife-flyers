'use client';
import { motion, useReducedMotion } from 'framer-motion';
export default function CocoOrb({ busy = false, compact = false }: { busy?: boolean; compact?: boolean }) {
  const reduced = useReducedMotion();
  return <motion.div aria-hidden="true" className={`coco-conversation-orb ${compact ? 'is-compact' : ''} ${busy ? 'is-busy' : ''}`}
    animate={reduced ? undefined : { y: [0, -6, 0], x: [0, 2, 0], scale: busy ? [1, 1.035, 1] : [1, 1.01, 1] }}
    transition={{ duration: busy ? 4 : 10, repeat: Infinity, ease: 'easeInOut' }}>
    <span className="coco-conversation-aura"/>
    <motion.img src="/branding/coco-orb.png?v=3" alt="" draggable={false}
      animate={reduced ? undefined : { rotate: [0, 360] }}
      transition={{ duration: busy ? 26 : 48, repeat: Infinity, ease: 'linear' }}/>
  </motion.div>;
}
