(function(){
  var root=document.documentElement, top=document.querySelector('.top');
  // шапка з тінню після прокрутки
  function onScroll(){ if(top) top.classList.toggle('is-scrolled', window.scrollY>8); }
  onScroll(); window.addEventListener('scroll', onScroll, {passive:true});

  // мобільне меню
  var burger=document.querySelector('.burger');
  if(burger){
    burger.addEventListener('click', function(){
      var open=document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open);
    });
    document.querySelectorAll('.nav a').forEach(function(a){
      a.addEventListener('click', function(){ document.body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', false); });
    });
  }

  // поява елементів при прокрутці
  var targets=document.querySelectorAll('.rv-up, .section-accent, .hero, .reveal-group');
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, {threshold:.15, rootMargin:'0px 0px -40px 0px'});
    targets.forEach(function(t){ io.observe(t); });
  } else { targets.forEach(function(t){ t.classList.add('is-in'); }); }

  // Порівняння: зберігаємо пропорції фото, змінюємо лише область видимості.
  document.querySelectorAll('[data-compare]').forEach(function(frame){
    var range=frame.querySelector('input'), active=null;
    function update(){
      frame.style.setProperty('--split', range.value+'%');
      range.setAttribute('aria-valuetext', 'До: '+range.value+'%, після: '+(100-range.value)+'%');
    }
    function move(e){
      var rect=frame.getBoundingClientRect();
      range.value=Math.round(Math.max(0,Math.min(100,(e.clientX-rect.left)/rect.width*100)));
      update();
    }
    range.addEventListener('input',update);
    range.addEventListener('pointerdown',function(e){
      if(!e.isPrimary || e.button!==0) return;
      e.preventDefault();
      active=e.pointerId; range.focus({preventScroll:true});
      range.setPointerCapture(active); move(e);
    });
    range.addEventListener('pointermove',function(e){if(e.pointerId===active) move(e);});
    function finish(e){if(e.pointerId===active) active=null;}
    range.addEventListener('pointerup',finish);
    range.addEventListener('pointercancel',finish);
    range.addEventListener('lostpointercapture',finish);
    update();
  });

  // сьогоднішній день у графіку
  var kp=new Intl.DateTimeFormat('en-US',{timeZone:'Europe/Kyiv',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()); var kv=function(k){return kp.find(function(p){return p.type===k;}).value;}; var d=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(kv('weekday')); // 0 — неділя
  document.querySelectorAll('.hours tr[data-d="'+d+'"]').forEach(function(r){ r.classList.add('today'); });
  var open=document.querySelector('[data-open-now]');
  if(open){
    var m=Number(kv('hour'))*60+Number(kv('minute'));
    var isOpen=d!==0 && m>=510 && m<1200;
    open.textContent=isOpen?'Зараз відчинено — до 20:00':(d===6&&m>=1200||d===0?'Зараз зачинено — відчиняємось у понеділок о 08:30':'Зараз зачинено — відчиняємось о 08:30');
  }

  // фото напрямків змінюється під наведенням
  var dp=document.querySelector('.dirs__photo img');
  if(dp){
    document.querySelectorAll('.dir a[data-img]').forEach(function(a){
      a.addEventListener('mouseenter', function(){
        var src=a.getAttribute('data-img'); if(dp.getAttribute('src')===src) return;
        dp.style.opacity=0; setTimeout(function(){ dp.src=src; dp.alt=a.getAttribute('data-alt')||''; dp.style.opacity=1; },220);
      });
    });
  }

  // активний пункт у підменю послуг
  var sub=document.querySelectorAll('.subnav .chip[href^="#"]');
  if(sub.length && 'IntersectionObserver' in window){
    var so=new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){
        sub.forEach(function(c){ var on=c.getAttribute('href')==='#'+e.target.id; c.setAttribute('aria-pressed', on); if(on) c.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'}); });
      }});
    }, {rootMargin:'-45% 0px -50% 0px'});
    sub.forEach(function(c){ var s=document.querySelector(c.getAttribute('href')); if(s) so.observe(s); });
  }

  // пошук у прайсі
  var input=document.getElementById('q');
  if(input){
    var box=input.closest('.search'), clear=box.querySelector('button');
    var rows=[].slice.call(document.querySelectorAll('.ptable tbody tr'));
    rows.forEach(function(r){ var c=r.querySelector('td'); c.setAttribute('data-raw', c.innerHTML); });
    var groups=[].slice.call(document.querySelectorAll('.pgroup'));
    var chips=[].slice.call(document.querySelectorAll('.pfind .chip'));
    var empty=document.querySelector('.empty'), cat='all';
    function norm(s){ return s.toLowerCase().replace(/ʼ|’|'/g,'').replace(/ё/g,'е'); }
    function esc(s){ return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
    function run(){
      var q=norm(input.value.trim()), shown=0;
      box.classList.toggle('has-q', q.length>0);
      groups.forEach(function(g){
        var inCat=cat==='all'||g.getAttribute('data-cat')===cat, any=false;
        g.querySelectorAll('tbody tr').forEach(function(r){
          var c=r.querySelector('td'), raw=c.getAttribute('data-raw');
          var hay=norm(r.textContent+' '+(r.getAttribute('data-k')||''));
          var ok=inCat && (!q || q.split(/\s+/).every(function(w){ return hay.indexOf(w)>-1; }));
          r.hidden=!ok; if(ok){ any=true; shown++; }
          c.innerHTML=raw;
          if(ok && q.length>1){
            var tmp=document.createElement('div'); tmp.innerHTML=raw;
            var walker=document.createTreeWalker(tmp, NodeFilter.SHOW_TEXT), n, list=[];
            while((n=walker.nextNode())) list.push(n);
            list.forEach(function(t){
              var re=new RegExp('('+esc(input.value.trim())+')','ig');
              if(re.test(t.nodeValue)){ var span=document.createElement('span'); span.innerHTML=t.nodeValue.replace(/[&<>]/g,function(x){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[x];}).replace(re,'<mark>$1</mark>'); t.parentNode.replaceChild(span,t); }
            });
            c.innerHTML=tmp.innerHTML;
          }
        });
        g.hidden=!any;
      });
      empty.classList.toggle('show', shown===0);
    }
    input.addEventListener('input', run);
    clear.addEventListener('click', function(){ input.value=''; run(); input.focus(); });
    chips.forEach(function(c){
      c.addEventListener('click', function(){
        cat=c.getAttribute('data-cat');
        chips.forEach(function(x){ x.setAttribute('aria-pressed', x===c); });
        run();
      });
    });
    var hint=new URLSearchParams(location.search).get('q');
    if(hint){ input.value=hint; run(); }
  }
})();
