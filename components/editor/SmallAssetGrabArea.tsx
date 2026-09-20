'use client';
import * as React from 'react';
import { createPortal } from 'react-dom';
import { smallAssetGrabPadding } from '../../lib/smallAssetGrabArea';
import { fitAssetInk, loadedAssetInk } from '../../lib/assetInkBounds';

/** Invisible editor-only target. Pointer events bubble to the owner's existing drag handler. */
export function SmallAssetGrabArea({ label, touch = false, separator = false, geometryKey, onNudge }: {
  label: string; touch?: boolean; separator?: boolean; geometryKey: string;
  onNudge: (dx: number, dy: number) => void;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const grabId = React.useId();
  const [box, setBox] = React.useState<React.CSSProperties | null>(null);
  const [overlay, setOverlay] = React.useState<{ root: HTMLElement; style: React.CSSProperties } | null>(null);
  React.useLayoutEffect(() => {
    const element = ref.current, owner = element?.parentElement;
    if (!element || !owner) return;
    const root = owner.closest('#export-root') as HTMLElement | null;
    const source = owner.querySelector<HTMLElement>('[data-hit-bounds="true"]') ?? owner;
    const measure = () => {
      if (Number(getComputedStyle(source).opacity) < .01 || Number(getComputedStyle(owner).opacity) < .01) {
        setBox(null); return;
      }
      const zoom = root && root.offsetWidth ? root.getBoundingClientRect().width / root.offsetWidth : 1;
      const ownerStyle = getComputedStyle(owner);
      const cssTransform = ownerStyle.transform;
      const transform = new DOMMatrixReadOnly(cssTransform === 'none' ? undefined : cssTransform);
      const scaleX = zoom * Math.hypot(transform.a, transform.b);
      const scaleY = zoom * Math.hypot(transform.c, transform.d);
      if (!scaleX || !scaleY) return;
      const rect = source.getBoundingClientRect(), parent = owner.getBoundingClientRect();
      // offsetHeight rounds subpixel rules to zero; keep their fractional size.
      const ownerWidth = parseFloat(ownerStyle.width) || owner.offsetWidth;
      const ownerHeight = parseFloat(ownerStyle.height) || owner.offsetHeight;
      let width = source === owner ? ownerWidth * scaleX : rect.width;
      let height = source === owner ? ownerHeight * scaleY : rect.height;
      let left = source === owner ? 0 : (rect.left - parent.left) / scaleX;
      let top = source === owner ? 0 : (rect.top - parent.top) / scaleY;
      const img = owner.querySelector<HTMLImageElement>('img[data-hit-source="true"]');
      if (img) {
        const ink = loadedAssetInk(img);
        if (ink === null) { setBox(null); return; }
        if (ink) {
          const imgBox = img.getBoundingClientRect(), style = getComputedStyle(img);
          // Compiled sources share their owner's transform; native sources
          // carry their own scale, which is reflected in their rendered box.
          const iw = source === owner ? ownerWidth * scaleX : imgBox.width;
          const ih = source === owner ? ownerHeight * scaleY : imgBox.height;
          const fit = fitAssetInk(ink, img.naturalWidth, img.naturalHeight, iw, ih, style.objectFit, style.objectPosition);
          left += fit.x / scaleX; top += fit.y / scaleY;
          width = fit.width; height = fit.height;
        }
      }
      const padding = smallAssetGrabPadding(width, height, touch, separator);
      const next = padding ? {
        left: left - padding.x / scaleX,
        top: top - padding.y / scaleY,
        width: (width + padding.x * 2) / scaleX, height: (height + padding.y * 2) / scaleY,
      } : null;
      setBox(old => JSON.stringify(old) === JSON.stringify(next) ? old : next);
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(owner); if (source !== owner) resize.observe(source); if (root) resize.observe(root);
    const mutation = new MutationObserver(measure);
    if (root) mutation.observe(root, { attributes: true, attributeFilter: ['style'] });
    mutation.observe(owner, { subtree: true, attributes: true, attributeFilter: ['src'] });
    owner.addEventListener('load', measure, true);
    window.addEventListener('resize', measure);
    return () => { resize.disconnect(); mutation.disconnect(); owner.removeEventListener('load', measure, true); window.removeEventListener('resize', measure); };
  }, [geometryKey, separator, touch]);

  React.useLayoutEffect(() => {
    const anchor = ref.current, owner = anchor?.parentElement;
    const root = owner?.closest<HTMLElement>('#export-root');
    if (!anchor || !owner || !root || !box) { setOverlay(null); return; }
    // Three geometry probes carry the complete ancestor transform, including
    // rotation, skew and zoom. The portal stays above artwork without changing
    // either the artwork's stacking order or the shape of its grab target.
    const measure = () => {
      const points = [...anchor.children].map(el => el.getBoundingClientRect());
      if (points.length !== 3) return;
      const r = root.getBoundingClientRect(), zoom = r.width / root.offsetWidth;
      const style = getComputedStyle(anchor), w = parseFloat(style.width), h = parseFloat(style.height);
      if (!zoom || !w || !h) return;
      const [a, b, c] = points;
      const matrix = [(b.x-a.x)/w/zoom,(b.y-a.y)/w/zoom,(c.x-a.x)/h/zoom,(c.y-a.y)/h/zoom,(a.x-r.x)/zoom,(a.y-r.y)/zoom];
      const next = { width: w, height: h, left: 0, top: 0, transformOrigin: '0 0', transform: `matrix(${matrix.join(',')})` };
      setOverlay(old => old?.root === root && JSON.stringify(old.style) === JSON.stringify(next) ? old : { root, style: next });
    };
    measure();
    const resize = new ResizeObserver(measure); resize.observe(anchor); resize.observe(root);
    const mutation = new MutationObserver(measure);
    for (let el: HTMLElement | null = owner; el; el = el.parentElement) {
      mutation.observe(el, { attributes: true, attributeFilter: ['style', 'class'] });
      if (el === root) break;
    }
    window.addEventListener('resize', measure);
    return () => { resize.disconnect(); mutation.disconnect(); window.removeEventListener('resize', measure); };
  }, [box, geometryKey]);

  return <>
  <span ref={ref} data-small-grab-anchor="true" data-grab-target={grabId} data-nonexport="true" aria-hidden="true"
    style={{ ...box, position: 'absolute', display: box ? 'block' : 'none', pointerEvents: 'none', visibility: 'hidden' }}>
    <i style={{ position:'absolute', left:0, top:0, width:0, height:0 }} />
    <i style={{ position:'absolute', left:'100%', top:0, width:0, height:0 }} />
    <i style={{ position:'absolute', left:0, top:'100%', width:0, height:0 }} />
  </span>
  {overlay && createPortal(<span id={grabId} data-small-asset-grab="true" data-nonexport="true"
    role="button" tabIndex={box ? 0 : -1} aria-label={`Move ${label}`}
    title={`Drag ${label} to move. Alt/Option + drag: select underneath. Arrow keys: fine move. Shift + arrows: larger move.`}
    className="absolute cursor-grab rounded-sm hover:outline hover:outline-1 hover:outline-cyan-200/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200 active:cursor-grabbing"
    style={{ ...overlay.style, position:'absolute', zIndex:2147483000, pointerEvents: 'auto', touchAction: 'none', background: 'transparent' }}
    onPointerDown={event => {
      if (event.altKey) {
        const targets = document.elementsFromPoint(event.clientX, event.clientY).filter(el => el.matches('[data-small-asset-grab="true"]'));
        const active = targets.indexOf(document.activeElement as Element);
        const next = targets[(Math.max(0, active) + 1) % targets.length];
        if (next && next !== event.currentTarget) {
          event.preventDefault(); event.stopPropagation();
          next.dispatchEvent(new PointerEvent('pointerdown', {
            bubbles:true, cancelable:true, composed:true, pointerId:event.pointerId,
            pointerType:event.pointerType, isPrimary:event.isPrimary,
            clientX:event.clientX, clientY:event.clientY, button:event.button, buttons:event.buttons,
            pressure:event.pressure, shiftKey:event.shiftKey, ctrlKey:event.ctrlKey, metaKey:event.metaKey,
          }));
          return;
        }
      }
      event.currentTarget.focus({ preventScroll: true });
    }}
    onKeyDown={event => {
      const dx = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
      const dy = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
      if (!dx && !dy) return;
      event.preventDefault(); event.stopPropagation();
      const step = event.shiftKey ? 10 : 1;
      onNudge(dx * step, dy * step);
    }} />, overlay.root)}
  </>;
}
