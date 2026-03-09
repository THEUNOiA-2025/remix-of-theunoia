import React, { useRef, useEffect } from 'react';

const InteractiveDotGrid: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dots: { x: number; y: number; baseX: number; baseY: number; size: number; angle: number; speed: number; orbitRadius: number }[] = [];
    const spacing = 35; // Spacing between dots
    const interactionRadius = 220; // How far the mouse affects dots
    const repelForce = 30; // Maximum distance a dot can be pushed

    let mouse = { x: -1000, y: -1000 };

    const init = () => {
      width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.parentElement?.clientHeight || window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      dots = [];
      const cols = Math.floor(width / spacing);
      const rows = Math.floor(height / spacing);
      const offsetX = (width - cols * spacing) / 2;
      const offsetY = (height - rows * spacing) / 2;

      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const x = offsetX + i * spacing;
          const y = offsetY + j * spacing;
          
          const noiseX = (Math.random() - 0.5) * 15;
          const noiseY = (Math.random() - 0.5) * 15;
          
          dots.push({
            x: x + noiseX,
            y: y + noiseY,
            baseX: x + noiseX,
            baseY: y + noiseY,
            size: 1.5,
            angle: Math.random() * Math.PI * 2,
            speed: 0.01 + Math.random() * 0.015,
            orbitRadius: 1 + Math.random() * 3,
          });
        }
      }
    };

    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Update dot positions first
      for (const dot of dots) {
        dot.angle += dot.speed;
        const orbitX = dot.baseX + Math.cos(dot.angle) * dot.orbitRadius;
        const orbitY = dot.baseY + Math.sin(dot.angle) * dot.orbitRadius;

        const dx = mouse.x - orbitX;
        const dy = mouse.y - orbitY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        let targetX = orbitX;
        let targetY = orbitY;
        let targetSize = 1.2;

        if (distance < interactionRadius) {
          const force = (interactionRadius - distance) / interactionRadius;
          const pushX = (dx / distance) * force * repelForce * -1;
          const pushY = (dy / distance) * force * repelForce * -1;
          
          targetX = orbitX + pushX;
          targetY = orbitY + pushY;
          // Grow size towards center of mouse radius
          targetSize = 1.2 + force * 2.5; 
        }

        // smooth easing
        dot.x += (targetX - dot.x) * 0.1;
        dot.y += (targetY - dot.y) * 0.1;
        dot.size += (targetSize - dot.size) * 0.2;
      }

      // Draw constellation connections
      ctx.lineWidth = 1;
      for (let i = 0; i < dots.length; i++) {
        const dotA = dots[i];
        const distToMouseA = Math.sqrt(Math.pow(mouse.x - dotA.x, 2) + Math.pow(mouse.y - dotA.y, 2));

        // Only draw lines for dots somewhat near the mouse to save performance and create a flashlight effect
        if (distToMouseA < interactionRadius * 1.2) {
          for (let j = i + 1; j < dots.length; j++) {
            const dotB = dots[j];
            const dx = dotA.x - dotB.x;
            const dy = dotA.y - dotB.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < spacing * 1.8) {
              const alpha = 1 - (dist / (spacing * 1.8));
              const mouseAlpha = 1 - (distToMouseA / (interactionRadius * 1.2));
              const finalAlpha = Math.min(alpha, mouseAlpha) * 0.6; // Max opacity 0.6

              if (finalAlpha > 0) {
                // Purple connection lines
                ctx.strokeStyle = `rgba(112, 78, 134, ${finalAlpha})`; 
                ctx.beginPath();
                ctx.moveTo(dotA.x, dotA.y);
                ctx.lineTo(dotB.x, dotB.y);
                ctx.stroke();
              }
            }
          }
        }
      }

      // Draw dots
      for (const dot of dots) {
        const distToMouse = Math.sqrt(Math.pow(mouse.x - dot.x, 2) + Math.pow(mouse.y - dot.y, 2));
        
        if (distToMouse < interactionRadius) {
          const force = (interactionRadius - distToMouse) / interactionRadius;
          // Interpolate color from dark slate (15,23,42) to primary purple (112,78,134)
          const r = 15 + (112 - 15) * force;
          const g = 23 + (78 - 23) * force;
          const b = 42 + (134 - 42) * force;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.3 + 0.5 * force})`;
        } else {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.25)'; // Regular dots
        }

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate();

    const handleResize = () => {
      init();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // Set to none so the window listener handles it
        zIndex: 0,
      }}
    />
  );
};

export default InteractiveDotGrid;
