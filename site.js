(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const targets = document.querySelectorAll('.section-intro h2, .section-intro p, .project-info > *, .project-visual, .play-copy h2, .play-copy > p, .instructions li, .about h2, .about-content > p, .contact-top > *, .contact-email');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const picture = entry.target.classList.contains('project-visual');
      entry.target.animate(picture ? [{opacity:.75, transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}] : [{opacity:.7, transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}], {duration:picture?850:600,easing:'cubic-bezier(.22,1,.36,1)'});
      observer.unobserve(entry.target);
    });
  }, {threshold:.12});
  targets.forEach(target => observer.observe(target));
})();
