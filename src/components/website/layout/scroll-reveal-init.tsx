import Script from 'next/script';

const SCROLL_REVEAL_SCRIPT = `
(function(){
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var io = new IntersectionObserver(function(entries){
    for(var i=0;i<entries.length;i++){
      if(entries[i].isIntersecting){
        entries[i].target.classList.add('is-visible');
        io.unobserve(entries[i].target);
      }
    }
  },{threshold:0.08,rootMargin:'0px 0px -40px 0px'});
  function observe(){
    var els=document.querySelectorAll('.vt-section-reveal:not(.is-visible)');
    for(var i=0;i<els.length;i++) io.observe(els[i]);
  }
  observe();
  new MutationObserver(observe).observe(document.body,{childList:true,subtree:true});
})();
`;

export function ScrollRevealInit() {
  return (
    <Script
      id="scroll-reveal"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: SCROLL_REVEAL_SCRIPT }}
    />
  );
}
