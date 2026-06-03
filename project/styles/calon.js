/* CALON V2, shared interactions */
(function(){
  /* ---- nav scroll state ---- */
  var nav=document.querySelector('.nav');
  function onScroll(){ if(nav){ nav.classList.toggle('scrolled', window.scrollY>12); } }
  window.addEventListener('scroll',onScroll,{passive:true}); onScroll();

  /* ---- mobile menu ---- */
  var burger=document.querySelector('.burger');
  var mobile=document.querySelector('.nav-mobile');
  if(burger&&mobile){
    burger.addEventListener('click',function(){
      var open=mobile.classList.toggle('open');
      burger.setAttribute('aria-expanded',open);
    });
    mobile.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click',function(){mobile.classList.remove('open');});
    });
  }

  var motionOK=!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(motionOK){ document.querySelectorAll('.ovf').forEach(function(el){el.classList.add('anim');}); }

  /* ---- the single reveal routine (idempotent) ---- */
  function reveal(el){
    if(el.classList.contains('in')&&!el.hasAttribute('data-count')) return;
    el.classList.add('in');
    if(el.hasAttribute('data-count')&&!el.__counted){ el.__counted=true; countUp(el); }
    if(el.classList.contains('ovf')&&!el.__built){ el.__built=true; buildFramework(el); }
  }

  /* ---- observer (nice staggered entrance when actually visible) ---- */
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if(e.isIntersecting){ reveal(e.target); io.unobserve(e.target); } });
  },{threshold:.12,rootMargin:'0px 0px -6% 0px'});
  var watched=document.querySelectorAll('.reveal,[data-count],.ovf');
  watched.forEach(function(el){io.observe(el);});

  /* ---- fail-safe #1: reveal anything already in (or near) the viewport on load ---- */
  function revealInView(){
    var h=window.innerHeight||800;
    watched.forEach(function(el){
      var r=el.getBoundingClientRect();
      if(r.top < h*1.05 && r.bottom > -40){ reveal(el); }
    });
  }
  revealInView();
  window.addEventListener('load',revealInView);

  /* ---- fail-safe #2: never let content stay hidden ---- */
  setTimeout(function(){ watched.forEach(reveal); }, 1600);

  /* ---- count up numbers ---- */
  function countUp(el){
    var raw=el.getAttribute('data-count');
    var target=parseFloat(raw);
    var prefix=el.getAttribute('data-prefix')||'';
    var suffix=el.getAttribute('data-suffix')||'';
    var dur=900, t0=null;
    function step(ts){
      if(!t0)t0=ts; var p=Math.min((ts-t0)/dur,1);
      var eased=1-Math.pow(1-p,3);
      var val=target*eased;
      var out=(raw.indexOf('.')>-1)? val.toFixed(1) : Math.round(val).toLocaleString('en-GB');
      el.textContent=prefix+out+suffix;
      if(p<1)requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---- framework cascade build-in ---- */
  function buildFramework(el){
    var stages=el.querySelectorAll('.ovf-stage');
    stages.forEach(function(s,i){ setTimeout(function(){ s.classList.add('lit'); }, 110*i); });
  }

  /* ---- case-study carousel: infinite right-to-left marquee + hover-pause + drag ---- */
  document.querySelectorAll('.csrail-wrap').forEach(function(wrap){
    var rail=wrap.querySelector('.csrail');
    if(!rail || rail.children.length===0) return;

    /* marquee mode: no snap, instant scroll, hide manual chrome */
    rail.style.scrollSnapType='none';
    rail.style.scrollBehavior='auto';
    wrap.querySelectorAll('.csrail-nav,.csrail-hint').forEach(function(e){ e.style.display='none'; });

    var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var paused=false, down=false, startX=0, startLeft=0, moved=0;
    var speed=0.6; /* px per frame, content drifts leftward */

    function gap(){ return parseInt(getComputedStyle(rail).columnGap||getComputedStyle(rail).gap||'20',10)||20; }
    function recycleForward(){
      var first=rail.firstElementChild;
      if(!first) return;
      var fw=first.getBoundingClientRect().width+gap();
      var guard=0;
      while(rail.scrollLeft>=fw && guard++<20){
        rail.appendChild(first);
        rail.scrollLeft-=fw;
        first=rail.firstElementChild;
        fw=first.getBoundingClientRect().width+gap();
      }
    }
    function recycleBackward(){
      var guard=0;
      while(rail.scrollLeft<=0 && guard++<20){
        var last=rail.lastElementChild;
        var lw=last.getBoundingClientRect().width+gap();
        rail.insertBefore(last, rail.firstElementChild);
        rail.scrollLeft+=lw;
      }
    }
    function tick(){
      if(!paused && !down && !reduce){
        rail.scrollLeft+=speed;
        recycleForward();
      }
      requestAnimationFrame(tick);
    }

    rail.addEventListener('mouseenter',function(){ paused=true; });
    rail.addEventListener('mouseleave',function(){ paused=false; });

    rail.addEventListener('pointerdown',function(e){
      if(e.button!==undefined&&e.button!==0) return;
      down=true;moved=0;startX=e.clientX;startLeft=rail.scrollLeft;
      rail.setPointerCapture&&rail.setPointerCapture(e.pointerId);
    });
    rail.addEventListener('pointermove',function(e){
      if(!down) return;
      var dx=e.clientX-startX;
      if(Math.abs(dx)>4){ rail.classList.add('dragging'); moved=Math.abs(dx); }
      rail.scrollLeft=startLeft-dx;
      if(dx>0) recycleBackward(); else recycleForward();
    });
    function end(){ if(!down) return; down=false; setTimeout(function(){rail.classList.remove('dragging');},0); }
    rail.addEventListener('pointerup',end);
    rail.addEventListener('pointercancel',end);
    rail.addEventListener('pointerleave',end);
    rail.addEventListener('click',function(e){ if(moved>6){ e.preventDefault(); e.stopPropagation(); } },true);

    requestAnimationFrame(tick);
  });
})();
