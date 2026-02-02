if (window.BEAEPAGEJS === undefined) {
            window.BEAEPAGEJS = [];
          }
          let js_SN0CASCE = () => { let BeaeUseHooks = {};
      try {
        let argid = 'beae-ke10dbvysection-js',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-ke10dbvy',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-ke10dbvy');
        args.el = args.els[0];
        ((t) => { var o;if((o=t.el.querySelector(".beae-grid-system"))==null||o.addEventListener("scroll",a=>{var n,l;let s=a.target;if(!s.classList.contains("beae-grid-carousel"))return;let r=Math.round((s.scrollLeft+s.querySelector(".beae-grid-carousel__snaps").offsetLeft)/(s.offsetWidth*.8))+1;(n=t.el.querySelector(".beae-grid-carousel__pagination div.active"))==null||n.classList.remove("active"),(l=t.el.querySelector('.beae-grid-carousel__pagination div[data-index="'+r+'"]'))==null||l.classList.add("active")}),t.mode.value=="live"){const a=t.el.querySelector('.beae-section-background-video[data-device="desktop"]'),s=t.el.querySelector('.beae-section-background-video[data-device="mobile"]'),r=[];if(window.BEAEVIDEO&&window.BEAEVIDEO.convertBackgroundSection){if(window.innerWidth>=768){if(a){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideo,a);n&&(a.innerHTML=n.html,r.push("desktop"))}}else if(s){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideoMobile,s);n&&(s.innerHTML=n.html,r.push("mobile"))}}(a||s)&&window.addEventListener("resize",()=>{if(window.BEAEVIDEO&&window.BEAEVIDEO.convertBackgroundSection){if(!r.includes("desktop")&&window.innerWidth>=768&&a){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideo,a);n&&(a.innerHTML=n.html,r.push("desktop"))}if(!r.includes("mobile")&&window.innerWidth<768&&s){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideoMobile,s);n&&(s.innerHTML=n.html,r.push("mobile"))}}})} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-ke10dbvy: ', ex)
      };
    

      try {
        let argid = 'beae-ke10dbvysection-slide-show',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-ke10dbvy',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-ke10dbvy');
        args.el = args.els[0];
        ((l) => { window.BeaeSlider&&window.BeaeSlider(l) })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-ke10dbvy: ', ex)
      };
    

      try {
        let argid = 'beae-btjuqv58button-js',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-btjuqv58',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-btjuqv58');
        args.el = args.els[0];
        ((data) => { let buttonElm=data.el.querySelector("a.beae-button-js");buttonElm.addEventListener("click",e=>{let extOptions={};if(data.extendOptions)try{eval("extOptions = "+data.extendOptions)}catch(a){extOptions={},console.error(a)}if(data.mode.value==="builder")return e.preventDefault(),!1;let selector=e.currentTarget.getAttribute("href");if(selector.indexOf("#")===0&&selector!=="#"){let a=document.querySelector(selector+","+selector.replace("#","."));if(a)return a.scrollIntoView({behavior:"smooth",block:"center",inline:"center"}),e.preventDefault(),!1}if(data.type==="popup"){console.log(window.createLoading," window.createLoading");const a=window.createLoading(e.currentTarget);return window.BeaePopupLibrary.lightbox({id:data.id,url:((data==null?void 0:data.url)??"").replace("/popup/","/?view=beae-"),...extOptions}).then(()=>{a.remove()}),e.preventDefault(),!1}else if(data.type==="pages"&&data.lightbox)return window.BeaePopupLibrary.createPopup(data.pageContent.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'"),{id:data.id,...extOptions}),e.preventDefault(),!1}),data.type==="popup"&&data.lightbox&&new IntersectionObserver((o,t)=>{o.forEach(i=>{i.isIntersecting&&(t.unobserve(i.target),i.target.click())})}).observe(buttonElm) })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-btjuqv58: ', ex)
      };
    

      try {
        let argid = 'beae-8tftv4ufblock-image',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-8tftv4uf',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-8tftv4uf');
        args.el = args.els[0];
        ((S) => { if(S.el){let L,N=S.autoHover;var V=S.el.querySelector(".beae-img-ratio-control"),B=S.el.querySelector(".beae-image-secondary img");if(V&&B){let M=function(T){let E=0,I,j,q;P(),N?S.el.onmouseover=function(H){O(H)}:T.onmousedown=function(H){O(H)},S.el.onmouseup=function(){W()},T.ontouchstart=function(H){O(H)},S.el.ontouchend=function(){W()};function P(){new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),T.style.left&&(j=parseInt(T.style.left))}function O(H){check=!1,H.preventDefault(),H.clientX?I=H.clientX:I=H.touches[0].clientX,E=1,S.el.onmousemove=function(Y){ee(Y)},S.el.ontouchmove=function(Y){ee(Y)}}function W(){E=0,isNaN(q)||(j=q),check=!0}function ee(H){if(E==0||N&&!(H.target==B||H.target==S.el.querySelector(".beae-image-secondary")))return!1;q=D(H),q<0&&(q=0),q>100&&(q=100),R(q)}function D(H){H=H.changedTouches?H.changedTouches[0]:H;let Y;return N?Y=Math.round(H.offsetX*100/L):Y=Math.round(j-(I-H.pageX)*100/L),Y}function R(H){T.style.left=H+"%",B.style.clipPath=`polygon(${H}% 0%, ${H}% 100%, 100% 100%, 100% 0)`}};V&&B&&M(V),window.addEventListener("resize",function(){V&&B&&(new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),M(V))})}} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-8tftv4uf: ', ex)
      };
    

      try {
        let argid = 'beae-6unlyxh6block-image',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-6unlyxh6',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-6unlyxh6');
        args.el = args.els[0];
        ((S) => { if(S.el){let L,N=S.autoHover;var V=S.el.querySelector(".beae-img-ratio-control"),B=S.el.querySelector(".beae-image-secondary img");if(V&&B){let M=function(T){let E=0,I,j,q;P(),N?S.el.onmouseover=function(H){O(H)}:T.onmousedown=function(H){O(H)},S.el.onmouseup=function(){W()},T.ontouchstart=function(H){O(H)},S.el.ontouchend=function(){W()};function P(){new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),T.style.left&&(j=parseInt(T.style.left))}function O(H){check=!1,H.preventDefault(),H.clientX?I=H.clientX:I=H.touches[0].clientX,E=1,S.el.onmousemove=function(Y){ee(Y)},S.el.ontouchmove=function(Y){ee(Y)}}function W(){E=0,isNaN(q)||(j=q),check=!0}function ee(H){if(E==0||N&&!(H.target==B||H.target==S.el.querySelector(".beae-image-secondary")))return!1;q=D(H),q<0&&(q=0),q>100&&(q=100),R(q)}function D(H){H=H.changedTouches?H.changedTouches[0]:H;let Y;return N?Y=Math.round(H.offsetX*100/L):Y=Math.round(j-(I-H.pageX)*100/L),Y}function R(H){T.style.left=H+"%",B.style.clipPath=`polygon(${H}% 0%, ${H}% 100%, 100% 100%, 100% 0)`}};V&&B&&M(V),window.addEventListener("resize",function(){V&&B&&(new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),M(V))})}} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-6unlyxh6: ', ex)
      };
    

      try {
        let argid = 'beae-di2rsqwxgrid-container-js',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-di2rsqwx',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-di2rsqwx');
        args.el = args.els[0];
        (($) => { if($.mode.value=="live"){const S=$.el.querySelector('.beae-section-background-video[data-device="desktop"]'),V=$.el.querySelector('.beae-section-background-video[data-device="mobile"]'),B=[];if(window.BEAEVIDEO&&window.BEAEVIDEO.convertBackgroundSection){if(window.innerWidth>=768){if(S){const L=window.BEAEVIDEO.convertBackgroundSection($.optionsVideo,S);L&&(S.innerHTML=L.html,B.push("desktop"))}}else if(V){const L=window.BEAEVIDEO.convertBackgroundSection($.optionsVideoMobile,V);L&&(V.innerHTML=L.html,B.push("mobile"))}}(S||V)&&window.addEventListener("resize",()=>{if(window.BEAEVIDEO&&window.BEAEVIDEO.convertBackgroundSection){if(!B.includes("desktop")&&window.innerWidth>=768&&S){const L=window.BEAEVIDEO.convertBackgroundSection($.optionsVideo,S);L&&(S.innerHTML=L.html,B.push("desktop"))}if(!B.includes("mobile")&&window.innerWidth<768&&V){const L=window.BEAEVIDEO.convertBackgroundSection($.optionsVideoMobile,V);L&&(V.innerHTML=L.html,B.push("mobile"))}}})} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-di2rsqwx: ', ex)
      };
    

      try {
        let argid = 'beae-tsve3t39section-js',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-tsve3t39',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-tsve3t39');
        args.el = args.els[0];
        ((t) => { var o;if((o=t.el.querySelector(".beae-grid-system"))==null||o.addEventListener("scroll",a=>{var n,l;let s=a.target;if(!s.classList.contains("beae-grid-carousel"))return;let r=Math.round((s.scrollLeft+s.querySelector(".beae-grid-carousel__snaps").offsetLeft)/(s.offsetWidth*.8))+1;(n=t.el.querySelector(".beae-grid-carousel__pagination div.active"))==null||n.classList.remove("active"),(l=t.el.querySelector('.beae-grid-carousel__pagination div[data-index="'+r+'"]'))==null||l.classList.add("active")}),t.mode.value=="live"){const a=t.el.querySelector('.beae-section-background-video[data-device="desktop"]'),s=t.el.querySelector('.beae-section-background-video[data-device="mobile"]'),r=[];if(window.BEAEVIDEO&&window.BEAEVIDEO.convertBackgroundSection){if(window.innerWidth>=768){if(a){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideo,a);n&&(a.innerHTML=n.html,r.push("desktop"))}}else if(s){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideoMobile,s);n&&(s.innerHTML=n.html,r.push("mobile"))}}(a||s)&&window.addEventListener("resize",()=>{if(window.BEAEVIDEO&&window.BEAEVIDEO.convertBackgroundSection){if(!r.includes("desktop")&&window.innerWidth>=768&&a){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideo,a);n&&(a.innerHTML=n.html,r.push("desktop"))}if(!r.includes("mobile")&&window.innerWidth<768&&s){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideoMobile,s);n&&(s.innerHTML=n.html,r.push("mobile"))}}})} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-tsve3t39: ', ex)
      };
    

      try {
        let argid = 'beae-9hy3bdaqblock-image',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-9hy3bdaq',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-9hy3bdaq');
        args.el = args.els[0];
        ((S) => { if(S.el){let L,N=S.autoHover;var V=S.el.querySelector(".beae-img-ratio-control"),B=S.el.querySelector(".beae-image-secondary img");if(V&&B){let M=function(T){let E=0,I,j,q;P(),N?S.el.onmouseover=function(H){O(H)}:T.onmousedown=function(H){O(H)},S.el.onmouseup=function(){W()},T.ontouchstart=function(H){O(H)},S.el.ontouchend=function(){W()};function P(){new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),T.style.left&&(j=parseInt(T.style.left))}function O(H){check=!1,H.preventDefault(),H.clientX?I=H.clientX:I=H.touches[0].clientX,E=1,S.el.onmousemove=function(Y){ee(Y)},S.el.ontouchmove=function(Y){ee(Y)}}function W(){E=0,isNaN(q)||(j=q),check=!0}function ee(H){if(E==0||N&&!(H.target==B||H.target==S.el.querySelector(".beae-image-secondary")))return!1;q=D(H),q<0&&(q=0),q>100&&(q=100),R(q)}function D(H){H=H.changedTouches?H.changedTouches[0]:H;let Y;return N?Y=Math.round(H.offsetX*100/L):Y=Math.round(j-(I-H.pageX)*100/L),Y}function R(H){T.style.left=H+"%",B.style.clipPath=`polygon(${H}% 0%, ${H}% 100%, 100% 100%, 100% 0)`}};V&&B&&M(V),window.addEventListener("resize",function(){V&&B&&(new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),M(V))})}} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-9hy3bdaq: ', ex)
      };
    

      try {
        let argid = 'beae-h8a2nwqcblock-image',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-h8a2nwqc',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-h8a2nwqc');
        args.el = args.els[0];
        ((S) => { if(S.el){let L,N=S.autoHover;var V=S.el.querySelector(".beae-img-ratio-control"),B=S.el.querySelector(".beae-image-secondary img");if(V&&B){let M=function(T){let E=0,I,j,q;P(),N?S.el.onmouseover=function(H){O(H)}:T.onmousedown=function(H){O(H)},S.el.onmouseup=function(){W()},T.ontouchstart=function(H){O(H)},S.el.ontouchend=function(){W()};function P(){new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),T.style.left&&(j=parseInt(T.style.left))}function O(H){check=!1,H.preventDefault(),H.clientX?I=H.clientX:I=H.touches[0].clientX,E=1,S.el.onmousemove=function(Y){ee(Y)},S.el.ontouchmove=function(Y){ee(Y)}}function W(){E=0,isNaN(q)||(j=q),check=!0}function ee(H){if(E==0||N&&!(H.target==B||H.target==S.el.querySelector(".beae-image-secondary")))return!1;q=D(H),q<0&&(q=0),q>100&&(q=100),R(q)}function D(H){H=H.changedTouches?H.changedTouches[0]:H;let Y;return N?Y=Math.round(H.offsetX*100/L):Y=Math.round(j-(I-H.pageX)*100/L),Y}function R(H){T.style.left=H+"%",B.style.clipPath=`polygon(${H}% 0%, ${H}% 100%, 100% 100%, 100% 0)`}};V&&B&&M(V),window.addEventListener("resize",function(){V&&B&&(new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),M(V))})}} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-h8a2nwqc: ', ex)
      };
    

      try {
        let argid = 'beae-3ay5b1jkblock-image',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-3ay5b1jk',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-3ay5b1jk');
        args.el = args.els[0];
        ((S) => { if(S.el){let L,N=S.autoHover;var V=S.el.querySelector(".beae-img-ratio-control"),B=S.el.querySelector(".beae-image-secondary img");if(V&&B){let M=function(T){let E=0,I,j,q;P(),N?S.el.onmouseover=function(H){O(H)}:T.onmousedown=function(H){O(H)},S.el.onmouseup=function(){W()},T.ontouchstart=function(H){O(H)},S.el.ontouchend=function(){W()};function P(){new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),T.style.left&&(j=parseInt(T.style.left))}function O(H){check=!1,H.preventDefault(),H.clientX?I=H.clientX:I=H.touches[0].clientX,E=1,S.el.onmousemove=function(Y){ee(Y)},S.el.ontouchmove=function(Y){ee(Y)}}function W(){E=0,isNaN(q)||(j=q),check=!0}function ee(H){if(E==0||N&&!(H.target==B||H.target==S.el.querySelector(".beae-image-secondary")))return!1;q=D(H),q<0&&(q=0),q>100&&(q=100),R(q)}function D(H){H=H.changedTouches?H.changedTouches[0]:H;let Y;return N?Y=Math.round(H.offsetX*100/L):Y=Math.round(j-(I-H.pageX)*100/L),Y}function R(H){T.style.left=H+"%",B.style.clipPath=`polygon(${H}% 0%, ${H}% 100%, 100% 100%, 100% 0)`}};V&&B&&M(V),window.addEventListener("resize",function(){V&&B&&(new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),M(V))})}} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-3ay5b1jk: ', ex)
      };
    

      try {
        let argid = 'beae-cku3yqghblock-image',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-cku3yqgh',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-cku3yqgh');
        args.el = args.els[0];
        ((S) => { if(S.el){let L,N=S.autoHover;var V=S.el.querySelector(".beae-img-ratio-control"),B=S.el.querySelector(".beae-image-secondary img");if(V&&B){let M=function(T){let E=0,I,j,q;P(),N?S.el.onmouseover=function(H){O(H)}:T.onmousedown=function(H){O(H)},S.el.onmouseup=function(){W()},T.ontouchstart=function(H){O(H)},S.el.ontouchend=function(){W()};function P(){new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),T.style.left&&(j=parseInt(T.style.left))}function O(H){check=!1,H.preventDefault(),H.clientX?I=H.clientX:I=H.touches[0].clientX,E=1,S.el.onmousemove=function(Y){ee(Y)},S.el.ontouchmove=function(Y){ee(Y)}}function W(){E=0,isNaN(q)||(j=q),check=!0}function ee(H){if(E==0||N&&!(H.target==B||H.target==S.el.querySelector(".beae-image-secondary")))return!1;q=D(H),q<0&&(q=0),q>100&&(q=100),R(q)}function D(H){H=H.changedTouches?H.changedTouches[0]:H;let Y;return N?Y=Math.round(H.offsetX*100/L):Y=Math.round(j-(I-H.pageX)*100/L),Y}function R(H){T.style.left=H+"%",B.style.clipPath=`polygon(${H}% 0%, ${H}% 100%, 100% 100%, 100% 0)`}};V&&B&&M(V),window.addEventListener("resize",function(){V&&B&&(new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),M(V))})}} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-cku3yqgh: ', ex)
      };
    

      try {
        let argid = 'beae-r4dmpmoublock-image',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-r4dmpmou',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-r4dmpmou');
        args.el = args.els[0];
        ((S) => { if(S.el){let L,N=S.autoHover;var V=S.el.querySelector(".beae-img-ratio-control"),B=S.el.querySelector(".beae-image-secondary img");if(V&&B){let M=function(T){let E=0,I,j,q;P(),N?S.el.onmouseover=function(H){O(H)}:T.onmousedown=function(H){O(H)},S.el.onmouseup=function(){W()},T.ontouchstart=function(H){O(H)},S.el.ontouchend=function(){W()};function P(){new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),T.style.left&&(j=parseInt(T.style.left))}function O(H){check=!1,H.preventDefault(),H.clientX?I=H.clientX:I=H.touches[0].clientX,E=1,S.el.onmousemove=function(Y){ee(Y)},S.el.ontouchmove=function(Y){ee(Y)}}function W(){E=0,isNaN(q)||(j=q),check=!0}function ee(H){if(E==0||N&&!(H.target==B||H.target==S.el.querySelector(".beae-image-secondary")))return!1;q=D(H),q<0&&(q=0),q>100&&(q=100),R(q)}function D(H){H=H.changedTouches?H.changedTouches[0]:H;let Y;return N?Y=Math.round(H.offsetX*100/L):Y=Math.round(j-(I-H.pageX)*100/L),Y}function R(H){T.style.left=H+"%",B.style.clipPath=`polygon(${H}% 0%, ${H}% 100%, 100% 100%, 100% 0)`}};V&&B&&M(V),window.addEventListener("resize",function(){V&&B&&(new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),M(V))})}} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-r4dmpmou: ', ex)
      };
    

      try {
        let argid = 'beae-40e3rk8tsection-js',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-40e3rk8t',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-40e3rk8t');
        args.el = args.els[0];
        ((t) => { var o;if((o=t.el.querySelector(".beae-grid-system"))==null||o.addEventListener("scroll",a=>{var n,l;let s=a.target;if(!s.classList.contains("beae-grid-carousel"))return;let r=Math.round((s.scrollLeft+s.querySelector(".beae-grid-carousel__snaps").offsetLeft)/(s.offsetWidth*.8))+1;(n=t.el.querySelector(".beae-grid-carousel__pagination div.active"))==null||n.classList.remove("active"),(l=t.el.querySelector('.beae-grid-carousel__pagination div[data-index="'+r+'"]'))==null||l.classList.add("active")}),t.mode.value=="live"){const a=t.el.querySelector('.beae-section-background-video[data-device="desktop"]'),s=t.el.querySelector('.beae-section-background-video[data-device="mobile"]'),r=[];if(window.BEAEVIDEO&&window.BEAEVIDEO.convertBackgroundSection){if(window.innerWidth>=768){if(a){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideo,a);n&&(a.innerHTML=n.html,r.push("desktop"))}}else if(s){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideoMobile,s);n&&(s.innerHTML=n.html,r.push("mobile"))}}(a||s)&&window.addEventListener("resize",()=>{if(window.BEAEVIDEO&&window.BEAEVIDEO.convertBackgroundSection){if(!r.includes("desktop")&&window.innerWidth>=768&&a){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideo,a);n&&(a.innerHTML=n.html,r.push("desktop"))}if(!r.includes("mobile")&&window.innerWidth<768&&s){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideoMobile,s);n&&(s.innerHTML=n.html,r.push("mobile"))}}})} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-40e3rk8t: ', ex)
      };
    

      try {
        let argid = 'beae-g0rz86kublock-image',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-g0rz86ku',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-g0rz86ku');
        args.el = args.els[0];
        ((S) => { if(S.el){let L,N=S.autoHover;var V=S.el.querySelector(".beae-img-ratio-control"),B=S.el.querySelector(".beae-image-secondary img");if(V&&B){let M=function(T){let E=0,I,j,q;P(),N?S.el.onmouseover=function(H){O(H)}:T.onmousedown=function(H){O(H)},S.el.onmouseup=function(){W()},T.ontouchstart=function(H){O(H)},S.el.ontouchend=function(){W()};function P(){new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),T.style.left&&(j=parseInt(T.style.left))}function O(H){check=!1,H.preventDefault(),H.clientX?I=H.clientX:I=H.touches[0].clientX,E=1,S.el.onmousemove=function(Y){ee(Y)},S.el.ontouchmove=function(Y){ee(Y)}}function W(){E=0,isNaN(q)||(j=q),check=!0}function ee(H){if(E==0||N&&!(H.target==B||H.target==S.el.querySelector(".beae-image-secondary")))return!1;q=D(H),q<0&&(q=0),q>100&&(q=100),R(q)}function D(H){H=H.changedTouches?H.changedTouches[0]:H;let Y;return N?Y=Math.round(H.offsetX*100/L):Y=Math.round(j-(I-H.pageX)*100/L),Y}function R(H){T.style.left=H+"%",B.style.clipPath=`polygon(${H}% 0%, ${H}% 100%, 100% 100%, 100% 0)`}};V&&B&&M(V),window.addEventListener("resize",function(){V&&B&&(new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),M(V))})}} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-g0rz86ku: ', ex)
      };
    

      try {
        let argid = 'beae-fn3lwg84button-js',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-fn3lwg84',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-fn3lwg84');
        args.el = args.els[0];
        ((data) => { let buttonElm=data.el.querySelector("a.beae-button-js");buttonElm.addEventListener("click",e=>{let extOptions={};if(data.extendOptions)try{eval("extOptions = "+data.extendOptions)}catch(a){extOptions={},console.error(a)}if(data.mode.value==="builder")return e.preventDefault(),!1;let selector=e.currentTarget.getAttribute("href");if(selector.indexOf("#")===0&&selector!=="#"){let a=document.querySelector(selector+","+selector.replace("#","."));if(a)return a.scrollIntoView({behavior:"smooth",block:"center",inline:"center"}),e.preventDefault(),!1}if(data.type==="popup"){console.log(window.createLoading," window.createLoading");const a=window.createLoading(e.currentTarget);return window.BeaePopupLibrary.lightbox({id:data.id,url:((data==null?void 0:data.url)??"").replace("/popup/","/?view=beae-"),...extOptions}).then(()=>{a.remove()}),e.preventDefault(),!1}else if(data.type==="pages"&&data.lightbox)return window.BeaePopupLibrary.createPopup(data.pageContent.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'"),{id:data.id,...extOptions}),e.preventDefault(),!1}),data.type==="popup"&&data.lightbox&&new IntersectionObserver((o,t)=>{o.forEach(i=>{i.isIntersecting&&(t.unobserve(i.target),i.target.click())})}).observe(buttonElm) })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-fn3lwg84: ', ex)
      };
    

      try {
        let argid = 'beae-t2r8fpecblock-image',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-t2r8fpec',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-t2r8fpec');
        args.el = args.els[0];
        ((S) => { if(S.el){let L,N=S.autoHover;var V=S.el.querySelector(".beae-img-ratio-control"),B=S.el.querySelector(".beae-image-secondary img");if(V&&B){let M=function(T){let E=0,I,j,q;P(),N?S.el.onmouseover=function(H){O(H)}:T.onmousedown=function(H){O(H)},S.el.onmouseup=function(){W()},T.ontouchstart=function(H){O(H)},S.el.ontouchend=function(){W()};function P(){new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),T.style.left&&(j=parseInt(T.style.left))}function O(H){check=!1,H.preventDefault(),H.clientX?I=H.clientX:I=H.touches[0].clientX,E=1,S.el.onmousemove=function(Y){ee(Y)},S.el.ontouchmove=function(Y){ee(Y)}}function W(){E=0,isNaN(q)||(j=q),check=!0}function ee(H){if(E==0||N&&!(H.target==B||H.target==S.el.querySelector(".beae-image-secondary")))return!1;q=D(H),q<0&&(q=0),q>100&&(q=100),R(q)}function D(H){H=H.changedTouches?H.changedTouches[0]:H;let Y;return N?Y=Math.round(H.offsetX*100/L):Y=Math.round(j-(I-H.pageX)*100/L),Y}function R(H){T.style.left=H+"%",B.style.clipPath=`polygon(${H}% 0%, ${H}% 100%, 100% 100%, 100% 0)`}};V&&B&&M(V),window.addEventListener("resize",function(){V&&B&&(new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),M(V))})}} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-t2r8fpec: ', ex)
      };
    

      try {
        let argid = 'beae-v2wwg1vubutton-js',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-v2wwg1vu',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-v2wwg1vu');
        args.el = args.els[0];
        ((data) => { let buttonElm=data.el.querySelector("a.beae-button-js");buttonElm.addEventListener("click",e=>{let extOptions={};if(data.extendOptions)try{eval("extOptions = "+data.extendOptions)}catch(a){extOptions={},console.error(a)}if(data.mode.value==="builder")return e.preventDefault(),!1;let selector=e.currentTarget.getAttribute("href");if(selector.indexOf("#")===0&&selector!=="#"){let a=document.querySelector(selector+","+selector.replace("#","."));if(a)return a.scrollIntoView({behavior:"smooth",block:"center",inline:"center"}),e.preventDefault(),!1}if(data.type==="popup"){console.log(window.createLoading," window.createLoading");const a=window.createLoading(e.currentTarget);return window.BeaePopupLibrary.lightbox({id:data.id,url:((data==null?void 0:data.url)??"").replace("/popup/","/?view=beae-"),...extOptions}).then(()=>{a.remove()}),e.preventDefault(),!1}else if(data.type==="pages"&&data.lightbox)return window.BeaePopupLibrary.createPopup(data.pageContent.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'"),{id:data.id,...extOptions}),e.preventDefault(),!1}),data.type==="popup"&&data.lightbox&&new IntersectionObserver((o,t)=>{o.forEach(i=>{i.isIntersecting&&(t.unobserve(i.target),i.target.click())})}).observe(buttonElm) })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-v2wwg1vu: ', ex)
      };
    

      try {
        let argid = 'beae-kc9go70bblock-image',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-kc9go70b',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-kc9go70b');
        args.el = args.els[0];
        ((S) => { if(S.el){let L,N=S.autoHover;var V=S.el.querySelector(".beae-img-ratio-control"),B=S.el.querySelector(".beae-image-secondary img");if(V&&B){let M=function(T){let E=0,I,j,q;P(),N?S.el.onmouseover=function(H){O(H)}:T.onmousedown=function(H){O(H)},S.el.onmouseup=function(){W()},T.ontouchstart=function(H){O(H)},S.el.ontouchend=function(){W()};function P(){new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),T.style.left&&(j=parseInt(T.style.left))}function O(H){check=!1,H.preventDefault(),H.clientX?I=H.clientX:I=H.touches[0].clientX,E=1,S.el.onmousemove=function(Y){ee(Y)},S.el.ontouchmove=function(Y){ee(Y)}}function W(){E=0,isNaN(q)||(j=q),check=!0}function ee(H){if(E==0||N&&!(H.target==B||H.target==S.el.querySelector(".beae-image-secondary")))return!1;q=D(H),q<0&&(q=0),q>100&&(q=100),R(q)}function D(H){H=H.changedTouches?H.changedTouches[0]:H;let Y;return N?Y=Math.round(H.offsetX*100/L):Y=Math.round(j-(I-H.pageX)*100/L),Y}function R(H){T.style.left=H+"%",B.style.clipPath=`polygon(${H}% 0%, ${H}% 100%, 100% 100%, 100% 0)`}};V&&B&&M(V),window.addEventListener("resize",function(){V&&B&&(new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),M(V))})}} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-kc9go70b: ', ex)
      };
    

      try {
        let argid = 'beae-ad5ogi6xbutton-js',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-ad5ogi6x',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-ad5ogi6x');
        args.el = args.els[0];
        ((data) => { let buttonElm=data.el.querySelector("a.beae-button-js");buttonElm.addEventListener("click",e=>{let extOptions={};if(data.extendOptions)try{eval("extOptions = "+data.extendOptions)}catch(a){extOptions={},console.error(a)}if(data.mode.value==="builder")return e.preventDefault(),!1;let selector=e.currentTarget.getAttribute("href");if(selector.indexOf("#")===0&&selector!=="#"){let a=document.querySelector(selector+","+selector.replace("#","."));if(a)return a.scrollIntoView({behavior:"smooth",block:"center",inline:"center"}),e.preventDefault(),!1}if(data.type==="popup"){console.log(window.createLoading," window.createLoading");const a=window.createLoading(e.currentTarget);return window.BeaePopupLibrary.lightbox({id:data.id,url:((data==null?void 0:data.url)??"").replace("/popup/","/?view=beae-"),...extOptions}).then(()=>{a.remove()}),e.preventDefault(),!1}else if(data.type==="pages"&&data.lightbox)return window.BeaePopupLibrary.createPopup(data.pageContent.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'"),{id:data.id,...extOptions}),e.preventDefault(),!1}),data.type==="popup"&&data.lightbox&&new IntersectionObserver((o,t)=>{o.forEach(i=>{i.isIntersecting&&(t.unobserve(i.target),i.target.click())})}).observe(buttonElm) })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-ad5ogi6x: ', ex)
      };
    

      try {
        let argid = 'beae-71ab0p61block-image',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-71ab0p61',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-71ab0p61');
        args.el = args.els[0];
        ((S) => { if(S.el){let L,N=S.autoHover;var V=S.el.querySelector(".beae-img-ratio-control"),B=S.el.querySelector(".beae-image-secondary img");if(V&&B){let M=function(T){let E=0,I,j,q;P(),N?S.el.onmouseover=function(H){O(H)}:T.onmousedown=function(H){O(H)},S.el.onmouseup=function(){W()},T.ontouchstart=function(H){O(H)},S.el.ontouchend=function(){W()};function P(){new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),T.style.left&&(j=parseInt(T.style.left))}function O(H){check=!1,H.preventDefault(),H.clientX?I=H.clientX:I=H.touches[0].clientX,E=1,S.el.onmousemove=function(Y){ee(Y)},S.el.ontouchmove=function(Y){ee(Y)}}function W(){E=0,isNaN(q)||(j=q),check=!0}function ee(H){if(E==0||N&&!(H.target==B||H.target==S.el.querySelector(".beae-image-secondary")))return!1;q=D(H),q<0&&(q=0),q>100&&(q=100),R(q)}function D(H){H=H.changedTouches?H.changedTouches[0]:H;let Y;return N?Y=Math.round(H.offsetX*100/L):Y=Math.round(j-(I-H.pageX)*100/L),Y}function R(H){T.style.left=H+"%",B.style.clipPath=`polygon(${H}% 0%, ${H}% 100%, 100% 100%, 100% 0)`}};V&&B&&M(V),window.addEventListener("resize",function(){V&&B&&(new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),M(V))})}} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-71ab0p61: ', ex)
      };
    

      try {
        let argid = 'beae-6ipfqsq1button-js',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-6ipfqsq1',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-6ipfqsq1');
        args.el = args.els[0];
        ((data) => { let buttonElm=data.el.querySelector("a.beae-button-js");buttonElm.addEventListener("click",e=>{let extOptions={};if(data.extendOptions)try{eval("extOptions = "+data.extendOptions)}catch(a){extOptions={},console.error(a)}if(data.mode.value==="builder")return e.preventDefault(),!1;let selector=e.currentTarget.getAttribute("href");if(selector.indexOf("#")===0&&selector!=="#"){let a=document.querySelector(selector+","+selector.replace("#","."));if(a)return a.scrollIntoView({behavior:"smooth",block:"center",inline:"center"}),e.preventDefault(),!1}if(data.type==="popup"){console.log(window.createLoading," window.createLoading");const a=window.createLoading(e.currentTarget);return window.BeaePopupLibrary.lightbox({id:data.id,url:((data==null?void 0:data.url)??"").replace("/popup/","/?view=beae-"),...extOptions}).then(()=>{a.remove()}),e.preventDefault(),!1}else if(data.type==="pages"&&data.lightbox)return window.BeaePopupLibrary.createPopup(data.pageContent.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'"),{id:data.id,...extOptions}),e.preventDefault(),!1}),data.type==="popup"&&data.lightbox&&new IntersectionObserver((o,t)=>{o.forEach(i=>{i.isIntersecting&&(t.unobserve(i.target),i.target.click())})}).observe(buttonElm) })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-6ipfqsq1: ', ex)
      };
    

      try {
        let argid = 'beae-ofi7jcrusection-js',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-ofi7jcru',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-ofi7jcru');
        args.el = args.els[0];
        ((t) => { var o;if((o=t.el.querySelector(".beae-grid-system"))==null||o.addEventListener("scroll",a=>{var n,l;let s=a.target;if(!s.classList.contains("beae-grid-carousel"))return;let r=Math.round((s.scrollLeft+s.querySelector(".beae-grid-carousel__snaps").offsetLeft)/(s.offsetWidth*.8))+1;(n=t.el.querySelector(".beae-grid-carousel__pagination div.active"))==null||n.classList.remove("active"),(l=t.el.querySelector('.beae-grid-carousel__pagination div[data-index="'+r+'"]'))==null||l.classList.add("active")}),t.mode.value=="live"){const a=t.el.querySelector('.beae-section-background-video[data-device="desktop"]'),s=t.el.querySelector('.beae-section-background-video[data-device="mobile"]'),r=[];if(window.BEAEVIDEO&&window.BEAEVIDEO.convertBackgroundSection){if(window.innerWidth>=768){if(a){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideo,a);n&&(a.innerHTML=n.html,r.push("desktop"))}}else if(s){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideoMobile,s);n&&(s.innerHTML=n.html,r.push("mobile"))}}(a||s)&&window.addEventListener("resize",()=>{if(window.BEAEVIDEO&&window.BEAEVIDEO.convertBackgroundSection){if(!r.includes("desktop")&&window.innerWidth>=768&&a){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideo,a);n&&(a.innerHTML=n.html,r.push("desktop"))}if(!r.includes("mobile")&&window.innerWidth<768&&s){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideoMobile,s);n&&(s.innerHTML=n.html,r.push("mobile"))}}})} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-ofi7jcru: ', ex)
      };
    

      try {
        let argid = 'beae-ofi7jcrusection-featured-collection',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-ofi7jcru',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-ofi7jcru');
        args.el = args.els[0];
        ((a) => { window.BeaeMoneyFormat||(window.BeaeMoneyFormat=a.moneyFormat);let o=a.el.querySelectorAll(".beae-featuted-collection-nav");const t=a.el.querySelectorAll(".beae-feature-collection-tab-content"),i=a.el.querySelector(".beae-featuted-collection-nav.nav-active"),r=a.el.closest(".beae-body--preview");o.forEach((l,s)=>{a.mode.value=="live"&&!i&&(s===0?(l.classList.add("nav-active"),t[s]&&(t[s].style.display="block",t[s].setAttribute("data-active","true"))):(l.classList.remove("nav-active"),t[s]&&(t[s].style.display="none",t[s].setAttribute("data-active","false")))),r||l.addEventListener("click",()=>{o.forEach(m=>{m.classList.remove("nav-active")}),l.classList.add("nav-active");const d=l.getAttribute("data-handle"),c=a.el.querySelectorAll(".viewall-link");c&&c.forEach(m=>{m.setAttribute("href",`/collections/${d}`)});const u=a.el.querySelector(`.beae-feature-collection-tab-content[data-handle="${d}"]`),p=a.el.querySelector('.beae-feature-collection-tab-content[data-active="true"]');if(p){p.setAttribute("data-active","false");const m=n(p);setTimeout(()=>{p.style.display="none",u&&(u.style.display="block"),setTimeout(()=>{u&&u.setAttribute("data-active","true")},50)},m)}else u&&(u.style.display="block"),setTimeout(()=>{u&&u.setAttribute("data-active","true")},50)})});function n(l){const d=window.getComputedStyle(l).getPropertyValue("transition-duration");let c=parseFloat(d)*1e3;return d.includes("s")?c=parseFloat(d)*1e3:c=parseFloat(d),c||0}setTimeout(()=>{typeof window.handleSwatchForCardForm=="function"&&window.handleSwatchForCardForm(a)},100),(["builder"].includes(a.mode.value)||r)&&setTimeout(()=>{typeof window.handleEventFormProductCard=="function"&&window.handleEventFormProductCard()},100) })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-ofi7jcru: ', ex)
      };
    

      try {
        let argid = 'beae-ofi7jcrusection-slide-show',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-ofi7jcru',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-ofi7jcru');
        args.el = args.els[0];
        ((l) => { window.BeaeSlider&&window.BeaeSlider(l) })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-ofi7jcru: ', ex)
      };
    

      try {
        let argid = 'beae-zq9wvt6qblock-image',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-zq9wvt6q',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-zq9wvt6q');
        args.el = args.els[0];
        ((S) => { if(S.el){let L,N=S.autoHover;var V=S.el.querySelector(".beae-img-ratio-control"),B=S.el.querySelector(".beae-image-secondary img");if(V&&B){let M=function(T){let E=0,I,j,q;P(),N?S.el.onmouseover=function(H){O(H)}:T.onmousedown=function(H){O(H)},S.el.onmouseup=function(){W()},T.ontouchstart=function(H){O(H)},S.el.ontouchend=function(){W()};function P(){new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),T.style.left&&(j=parseInt(T.style.left))}function O(H){check=!1,H.preventDefault(),H.clientX?I=H.clientX:I=H.touches[0].clientX,E=1,S.el.onmousemove=function(Y){ee(Y)},S.el.ontouchmove=function(Y){ee(Y)}}function W(){E=0,isNaN(q)||(j=q),check=!0}function ee(H){if(E==0||N&&!(H.target==B||H.target==S.el.querySelector(".beae-image-secondary")))return!1;q=D(H),q<0&&(q=0),q>100&&(q=100),R(q)}function D(H){H=H.changedTouches?H.changedTouches[0]:H;let Y;return N?Y=Math.round(H.offsetX*100/L):Y=Math.round(j-(I-H.pageX)*100/L),Y}function R(H){T.style.left=H+"%",B.style.clipPath=`polygon(${H}% 0%, ${H}% 100%, 100% 100%, 100% 0)`}};V&&B&&M(V),window.addEventListener("resize",function(){V&&B&&(new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),M(V))})}} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-zq9wvt6q: ', ex)
      };
    

      try {
        let argid = 'beae-lkjvjypusection-js',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-lkjvjypu',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-lkjvjypu');
        args.el = args.els[0];
        ((t) => { var o;if((o=t.el.querySelector(".beae-grid-system"))==null||o.addEventListener("scroll",a=>{var n,l;let s=a.target;if(!s.classList.contains("beae-grid-carousel"))return;let r=Math.round((s.scrollLeft+s.querySelector(".beae-grid-carousel__snaps").offsetLeft)/(s.offsetWidth*.8))+1;(n=t.el.querySelector(".beae-grid-carousel__pagination div.active"))==null||n.classList.remove("active"),(l=t.el.querySelector('.beae-grid-carousel__pagination div[data-index="'+r+'"]'))==null||l.classList.add("active")}),t.mode.value=="live"){const a=t.el.querySelector('.beae-section-background-video[data-device="desktop"]'),s=t.el.querySelector('.beae-section-background-video[data-device="mobile"]'),r=[];if(window.BEAEVIDEO&&window.BEAEVIDEO.convertBackgroundSection){if(window.innerWidth>=768){if(a){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideo,a);n&&(a.innerHTML=n.html,r.push("desktop"))}}else if(s){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideoMobile,s);n&&(s.innerHTML=n.html,r.push("mobile"))}}(a||s)&&window.addEventListener("resize",()=>{if(window.BEAEVIDEO&&window.BEAEVIDEO.convertBackgroundSection){if(!r.includes("desktop")&&window.innerWidth>=768&&a){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideo,a);n&&(a.innerHTML=n.html,r.push("desktop"))}if(!r.includes("mobile")&&window.innerWidth<768&&s){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideoMobile,s);n&&(s.innerHTML=n.html,r.push("mobile"))}}})} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-lkjvjypu: ', ex)
      };
    

      try {
        let argid = 'beae-dbor15thbutton-js',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-dbor15th',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-dbor15th');
        args.el = args.els[0];
        ((data) => { let buttonElm=data.el.querySelector("a.beae-button-js");buttonElm.addEventListener("click",e=>{let extOptions={};if(data.extendOptions)try{eval("extOptions = "+data.extendOptions)}catch(a){extOptions={},console.error(a)}if(data.mode.value==="builder")return e.preventDefault(),!1;let selector=e.currentTarget.getAttribute("href");if(selector.indexOf("#")===0&&selector!=="#"){let a=document.querySelector(selector+","+selector.replace("#","."));if(a)return a.scrollIntoView({behavior:"smooth",block:"center",inline:"center"}),e.preventDefault(),!1}if(data.type==="popup"){console.log(window.createLoading," window.createLoading");const a=window.createLoading(e.currentTarget);return window.BeaePopupLibrary.lightbox({id:data.id,url:((data==null?void 0:data.url)??"").replace("/popup/","/?view=beae-"),...extOptions}).then(()=>{a.remove()}),e.preventDefault(),!1}else if(data.type==="pages"&&data.lightbox)return window.BeaePopupLibrary.createPopup(data.pageContent.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'"),{id:data.id,...extOptions}),e.preventDefault(),!1}),data.type==="popup"&&data.lightbox&&new IntersectionObserver((o,t)=>{o.forEach(i=>{i.isIntersecting&&(t.unobserve(i.target),i.target.click())})}).observe(buttonElm) })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-dbor15th: ', ex)
      };
    

      try {
        let argid = 'beae-0gks9vt0block-image',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-0gks9vt0',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-0gks9vt0');
        args.el = args.els[0];
        ((S) => { if(S.el){let L,N=S.autoHover;var V=S.el.querySelector(".beae-img-ratio-control"),B=S.el.querySelector(".beae-image-secondary img");if(V&&B){let M=function(T){let E=0,I,j,q;P(),N?S.el.onmouseover=function(H){O(H)}:T.onmousedown=function(H){O(H)},S.el.onmouseup=function(){W()},T.ontouchstart=function(H){O(H)},S.el.ontouchend=function(){W()};function P(){new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),T.style.left&&(j=parseInt(T.style.left))}function O(H){check=!1,H.preventDefault(),H.clientX?I=H.clientX:I=H.touches[0].clientX,E=1,S.el.onmousemove=function(Y){ee(Y)},S.el.ontouchmove=function(Y){ee(Y)}}function W(){E=0,isNaN(q)||(j=q),check=!0}function ee(H){if(E==0||N&&!(H.target==B||H.target==S.el.querySelector(".beae-image-secondary")))return!1;q=D(H),q<0&&(q=0),q>100&&(q=100),R(q)}function D(H){H=H.changedTouches?H.changedTouches[0]:H;let Y;return N?Y=Math.round(H.offsetX*100/L):Y=Math.round(j-(I-H.pageX)*100/L),Y}function R(H){T.style.left=H+"%",B.style.clipPath=`polygon(${H}% 0%, ${H}% 100%, 100% 100%, 100% 0)`}};V&&B&&M(V),window.addEventListener("resize",function(){V&&B&&(new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),M(V))})}} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-0gks9vt0: ', ex)
      };
    

      try {
        let argid = 'beae-gjqx1lnusection-js',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-gjqx1lnu',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-gjqx1lnu');
        args.el = args.els[0];
        ((t) => { var o;if((o=t.el.querySelector(".beae-grid-system"))==null||o.addEventListener("scroll",a=>{var n,l;let s=a.target;if(!s.classList.contains("beae-grid-carousel"))return;let r=Math.round((s.scrollLeft+s.querySelector(".beae-grid-carousel__snaps").offsetLeft)/(s.offsetWidth*.8))+1;(n=t.el.querySelector(".beae-grid-carousel__pagination div.active"))==null||n.classList.remove("active"),(l=t.el.querySelector('.beae-grid-carousel__pagination div[data-index="'+r+'"]'))==null||l.classList.add("active")}),t.mode.value=="live"){const a=t.el.querySelector('.beae-section-background-video[data-device="desktop"]'),s=t.el.querySelector('.beae-section-background-video[data-device="mobile"]'),r=[];if(window.BEAEVIDEO&&window.BEAEVIDEO.convertBackgroundSection){if(window.innerWidth>=768){if(a){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideo,a);n&&(a.innerHTML=n.html,r.push("desktop"))}}else if(s){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideoMobile,s);n&&(s.innerHTML=n.html,r.push("mobile"))}}(a||s)&&window.addEventListener("resize",()=>{if(window.BEAEVIDEO&&window.BEAEVIDEO.convertBackgroundSection){if(!r.includes("desktop")&&window.innerWidth>=768&&a){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideo,a);n&&(a.innerHTML=n.html,r.push("desktop"))}if(!r.includes("mobile")&&window.innerWidth<768&&s){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideoMobile,s);n&&(s.innerHTML=n.html,r.push("mobile"))}}})} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-gjqx1lnu: ', ex)
      };
    

      try {
        let argid = 'beae-7dgfksj3block-image',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-7dgfksj3',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-7dgfksj3');
        args.el = args.els[0];
        ((S) => { if(S.el){let L,N=S.autoHover;var V=S.el.querySelector(".beae-img-ratio-control"),B=S.el.querySelector(".beae-image-secondary img");if(V&&B){let M=function(T){let E=0,I,j,q;P(),N?S.el.onmouseover=function(H){O(H)}:T.onmousedown=function(H){O(H)},S.el.onmouseup=function(){W()},T.ontouchstart=function(H){O(H)},S.el.ontouchend=function(){W()};function P(){new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),T.style.left&&(j=parseInt(T.style.left))}function O(H){check=!1,H.preventDefault(),H.clientX?I=H.clientX:I=H.touches[0].clientX,E=1,S.el.onmousemove=function(Y){ee(Y)},S.el.ontouchmove=function(Y){ee(Y)}}function W(){E=0,isNaN(q)||(j=q),check=!0}function ee(H){if(E==0||N&&!(H.target==B||H.target==S.el.querySelector(".beae-image-secondary")))return!1;q=D(H),q<0&&(q=0),q>100&&(q=100),R(q)}function D(H){H=H.changedTouches?H.changedTouches[0]:H;let Y;return N?Y=Math.round(H.offsetX*100/L):Y=Math.round(j-(I-H.pageX)*100/L),Y}function R(H){T.style.left=H+"%",B.style.clipPath=`polygon(${H}% 0%, ${H}% 100%, 100% 100%, 100% 0)`}};V&&B&&M(V),window.addEventListener("resize",function(){V&&B&&(new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),M(V))})}} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-7dgfksj3: ', ex)
      };
    

      try {
        let argid = 'beae-5w8nr6zebutton-js',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-5w8nr6ze',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-5w8nr6ze');
        args.el = args.els[0];
        ((data) => { let buttonElm=data.el.querySelector("a.beae-button-js");buttonElm.addEventListener("click",e=>{let extOptions={};if(data.extendOptions)try{eval("extOptions = "+data.extendOptions)}catch(a){extOptions={},console.error(a)}if(data.mode.value==="builder")return e.preventDefault(),!1;let selector=e.currentTarget.getAttribute("href");if(selector.indexOf("#")===0&&selector!=="#"){let a=document.querySelector(selector+","+selector.replace("#","."));if(a)return a.scrollIntoView({behavior:"smooth",block:"center",inline:"center"}),e.preventDefault(),!1}if(data.type==="popup"){console.log(window.createLoading," window.createLoading");const a=window.createLoading(e.currentTarget);return window.BeaePopupLibrary.lightbox({id:data.id,url:((data==null?void 0:data.url)??"").replace("/popup/","/?view=beae-"),...extOptions}).then(()=>{a.remove()}),e.preventDefault(),!1}else if(data.type==="pages"&&data.lightbox)return window.BeaePopupLibrary.createPopup(data.pageContent.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'"),{id:data.id,...extOptions}),e.preventDefault(),!1}),data.type==="popup"&&data.lightbox&&new IntersectionObserver((o,t)=>{o.forEach(i=>{i.isIntersecting&&(t.unobserve(i.target),i.target.click())})}).observe(buttonElm) })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-5w8nr6ze: ', ex)
      };
    

      try {
        let argid = 'beae-i0t5btn3section-js',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-i0t5btn3',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-i0t5btn3');
        args.el = args.els[0];
        ((t) => { var o;if((o=t.el.querySelector(".beae-grid-system"))==null||o.addEventListener("scroll",a=>{var n,l;let s=a.target;if(!s.classList.contains("beae-grid-carousel"))return;let r=Math.round((s.scrollLeft+s.querySelector(".beae-grid-carousel__snaps").offsetLeft)/(s.offsetWidth*.8))+1;(n=t.el.querySelector(".beae-grid-carousel__pagination div.active"))==null||n.classList.remove("active"),(l=t.el.querySelector('.beae-grid-carousel__pagination div[data-index="'+r+'"]'))==null||l.classList.add("active")}),t.mode.value=="live"){const a=t.el.querySelector('.beae-section-background-video[data-device="desktop"]'),s=t.el.querySelector('.beae-section-background-video[data-device="mobile"]'),r=[];if(window.BEAEVIDEO&&window.BEAEVIDEO.convertBackgroundSection){if(window.innerWidth>=768){if(a){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideo,a);n&&(a.innerHTML=n.html,r.push("desktop"))}}else if(s){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideoMobile,s);n&&(s.innerHTML=n.html,r.push("mobile"))}}(a||s)&&window.addEventListener("resize",()=>{if(window.BEAEVIDEO&&window.BEAEVIDEO.convertBackgroundSection){if(!r.includes("desktop")&&window.innerWidth>=768&&a){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideo,a);n&&(a.innerHTML=n.html,r.push("desktop"))}if(!r.includes("mobile")&&window.innerWidth<768&&s){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideoMobile,s);n&&(s.innerHTML=n.html,r.push("mobile"))}}})} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-i0t5btn3: ', ex)
      };
    

      try {
        let argid = 'beae-i0t5btn3section-featured-collection',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-i0t5btn3',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-i0t5btn3');
        args.el = args.els[0];
        ((a) => { window.BeaeMoneyFormat||(window.BeaeMoneyFormat=a.moneyFormat);let o=a.el.querySelectorAll(".beae-featuted-collection-nav");const t=a.el.querySelectorAll(".beae-feature-collection-tab-content"),i=a.el.querySelector(".beae-featuted-collection-nav.nav-active"),r=a.el.closest(".beae-body--preview");o.forEach((l,s)=>{a.mode.value=="live"&&!i&&(s===0?(l.classList.add("nav-active"),t[s]&&(t[s].style.display="block",t[s].setAttribute("data-active","true"))):(l.classList.remove("nav-active"),t[s]&&(t[s].style.display="none",t[s].setAttribute("data-active","false")))),r||l.addEventListener("click",()=>{o.forEach(m=>{m.classList.remove("nav-active")}),l.classList.add("nav-active");const d=l.getAttribute("data-handle"),c=a.el.querySelectorAll(".viewall-link");c&&c.forEach(m=>{m.setAttribute("href",`/collections/${d}`)});const u=a.el.querySelector(`.beae-feature-collection-tab-content[data-handle="${d}"]`),p=a.el.querySelector('.beae-feature-collection-tab-content[data-active="true"]');if(p){p.setAttribute("data-active","false");const m=n(p);setTimeout(()=>{p.style.display="none",u&&(u.style.display="block"),setTimeout(()=>{u&&u.setAttribute("data-active","true")},50)},m)}else u&&(u.style.display="block"),setTimeout(()=>{u&&u.setAttribute("data-active","true")},50)})});function n(l){const d=window.getComputedStyle(l).getPropertyValue("transition-duration");let c=parseFloat(d)*1e3;return d.includes("s")?c=parseFloat(d)*1e3:c=parseFloat(d),c||0}setTimeout(()=>{typeof window.handleSwatchForCardForm=="function"&&window.handleSwatchForCardForm(a)},100),(["builder"].includes(a.mode.value)||r)&&setTimeout(()=>{typeof window.handleEventFormProductCard=="function"&&window.handleEventFormProductCard()},100) })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-i0t5btn3: ', ex)
      };
    

      try {
        let argid = 'beae-i0t5btn3section-slide-show',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-i0t5btn3',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-i0t5btn3');
        args.el = args.els[0];
        ((l) => { window.BeaeSlider&&window.BeaeSlider(l) })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-i0t5btn3: ', ex)
      };
    

      try {
        let argid = 'beae-w13uhbv1block-image',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-w13uhbv1',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-w13uhbv1');
        args.el = args.els[0];
        ((S) => { if(S.el){let L,N=S.autoHover;var V=S.el.querySelector(".beae-img-ratio-control"),B=S.el.querySelector(".beae-image-secondary img");if(V&&B){let M=function(T){let E=0,I,j,q;P(),N?S.el.onmouseover=function(H){O(H)}:T.onmousedown=function(H){O(H)},S.el.onmouseup=function(){W()},T.ontouchstart=function(H){O(H)},S.el.ontouchend=function(){W()};function P(){new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),T.style.left&&(j=parseInt(T.style.left))}function O(H){check=!1,H.preventDefault(),H.clientX?I=H.clientX:I=H.touches[0].clientX,E=1,S.el.onmousemove=function(Y){ee(Y)},S.el.ontouchmove=function(Y){ee(Y)}}function W(){E=0,isNaN(q)||(j=q),check=!0}function ee(H){if(E==0||N&&!(H.target==B||H.target==S.el.querySelector(".beae-image-secondary")))return!1;q=D(H),q<0&&(q=0),q>100&&(q=100),R(q)}function D(H){H=H.changedTouches?H.changedTouches[0]:H;let Y;return N?Y=Math.round(H.offsetX*100/L):Y=Math.round(j-(I-H.pageX)*100/L),Y}function R(H){T.style.left=H+"%",B.style.clipPath=`polygon(${H}% 0%, ${H}% 100%, 100% 100%, 100% 0)`}};V&&B&&M(V),window.addEventListener("resize",function(){V&&B&&(new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),M(V))})}} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-w13uhbv1: ', ex)
      };
    

      try {
        let argid = 'beae-xcva7waksection-js',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-xcva7wak',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-xcva7wak');
        args.el = args.els[0];
        ((t) => { var o;if((o=t.el.querySelector(".beae-grid-system"))==null||o.addEventListener("scroll",a=>{var n,l;let s=a.target;if(!s.classList.contains("beae-grid-carousel"))return;let r=Math.round((s.scrollLeft+s.querySelector(".beae-grid-carousel__snaps").offsetLeft)/(s.offsetWidth*.8))+1;(n=t.el.querySelector(".beae-grid-carousel__pagination div.active"))==null||n.classList.remove("active"),(l=t.el.querySelector('.beae-grid-carousel__pagination div[data-index="'+r+'"]'))==null||l.classList.add("active")}),t.mode.value=="live"){const a=t.el.querySelector('.beae-section-background-video[data-device="desktop"]'),s=t.el.querySelector('.beae-section-background-video[data-device="mobile"]'),r=[];if(window.BEAEVIDEO&&window.BEAEVIDEO.convertBackgroundSection){if(window.innerWidth>=768){if(a){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideo,a);n&&(a.innerHTML=n.html,r.push("desktop"))}}else if(s){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideoMobile,s);n&&(s.innerHTML=n.html,r.push("mobile"))}}(a||s)&&window.addEventListener("resize",()=>{if(window.BEAEVIDEO&&window.BEAEVIDEO.convertBackgroundSection){if(!r.includes("desktop")&&window.innerWidth>=768&&a){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideo,a);n&&(a.innerHTML=n.html,r.push("desktop"))}if(!r.includes("mobile")&&window.innerWidth<768&&s){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideoMobile,s);n&&(s.innerHTML=n.html,r.push("mobile"))}}})} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-xcva7wak: ', ex)
      };
    

      try {
        let argid = 'beae-bbqn5xs4block-image',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-bbqn5xs4',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-bbqn5xs4');
        args.el = args.els[0];
        ((S) => { if(S.el){let L,N=S.autoHover;var V=S.el.querySelector(".beae-img-ratio-control"),B=S.el.querySelector(".beae-image-secondary img");if(V&&B){let M=function(T){let E=0,I,j,q;P(),N?S.el.onmouseover=function(H){O(H)}:T.onmousedown=function(H){O(H)},S.el.onmouseup=function(){W()},T.ontouchstart=function(H){O(H)},S.el.ontouchend=function(){W()};function P(){new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),T.style.left&&(j=parseInt(T.style.left))}function O(H){check=!1,H.preventDefault(),H.clientX?I=H.clientX:I=H.touches[0].clientX,E=1,S.el.onmousemove=function(Y){ee(Y)},S.el.ontouchmove=function(Y){ee(Y)}}function W(){E=0,isNaN(q)||(j=q),check=!0}function ee(H){if(E==0||N&&!(H.target==B||H.target==S.el.querySelector(".beae-image-secondary")))return!1;q=D(H),q<0&&(q=0),q>100&&(q=100),R(q)}function D(H){H=H.changedTouches?H.changedTouches[0]:H;let Y;return N?Y=Math.round(H.offsetX*100/L):Y=Math.round(j-(I-H.pageX)*100/L),Y}function R(H){T.style.left=H+"%",B.style.clipPath=`polygon(${H}% 0%, ${H}% 100%, 100% 100%, 100% 0)`}};V&&B&&M(V),window.addEventListener("resize",function(){V&&B&&(new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),M(V))})}} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-bbqn5xs4: ', ex)
      };
    

      try {
        let argid = 'beae-d3upwvz2block-image',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-d3upwvz2',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-d3upwvz2');
        args.el = args.els[0];
        ((S) => { if(S.el){let L,N=S.autoHover;var V=S.el.querySelector(".beae-img-ratio-control"),B=S.el.querySelector(".beae-image-secondary img");if(V&&B){let M=function(T){let E=0,I,j,q;P(),N?S.el.onmouseover=function(H){O(H)}:T.onmousedown=function(H){O(H)},S.el.onmouseup=function(){W()},T.ontouchstart=function(H){O(H)},S.el.ontouchend=function(){W()};function P(){new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),T.style.left&&(j=parseInt(T.style.left))}function O(H){check=!1,H.preventDefault(),H.clientX?I=H.clientX:I=H.touches[0].clientX,E=1,S.el.onmousemove=function(Y){ee(Y)},S.el.ontouchmove=function(Y){ee(Y)}}function W(){E=0,isNaN(q)||(j=q),check=!0}function ee(H){if(E==0||N&&!(H.target==B||H.target==S.el.querySelector(".beae-image-secondary")))return!1;q=D(H),q<0&&(q=0),q>100&&(q=100),R(q)}function D(H){H=H.changedTouches?H.changedTouches[0]:H;let Y;return N?Y=Math.round(H.offsetX*100/L):Y=Math.round(j-(I-H.pageX)*100/L),Y}function R(H){T.style.left=H+"%",B.style.clipPath=`polygon(${H}% 0%, ${H}% 100%, 100% 100%, 100% 0)`}};V&&B&&M(V),window.addEventListener("resize",function(){V&&B&&(new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),M(V))})}} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-d3upwvz2: ', ex)
      };
    

      try {
        let argid = 'beae-9jw7789isection-js',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-9jw7789i',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-9jw7789i');
        args.el = args.els[0];
        ((t) => { var o;if((o=t.el.querySelector(".beae-grid-system"))==null||o.addEventListener("scroll",a=>{var n,l;let s=a.target;if(!s.classList.contains("beae-grid-carousel"))return;let r=Math.round((s.scrollLeft+s.querySelector(".beae-grid-carousel__snaps").offsetLeft)/(s.offsetWidth*.8))+1;(n=t.el.querySelector(".beae-grid-carousel__pagination div.active"))==null||n.classList.remove("active"),(l=t.el.querySelector('.beae-grid-carousel__pagination div[data-index="'+r+'"]'))==null||l.classList.add("active")}),t.mode.value=="live"){const a=t.el.querySelector('.beae-section-background-video[data-device="desktop"]'),s=t.el.querySelector('.beae-section-background-video[data-device="mobile"]'),r=[];if(window.BEAEVIDEO&&window.BEAEVIDEO.convertBackgroundSection){if(window.innerWidth>=768){if(a){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideo,a);n&&(a.innerHTML=n.html,r.push("desktop"))}}else if(s){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideoMobile,s);n&&(s.innerHTML=n.html,r.push("mobile"))}}(a||s)&&window.addEventListener("resize",()=>{if(window.BEAEVIDEO&&window.BEAEVIDEO.convertBackgroundSection){if(!r.includes("desktop")&&window.innerWidth>=768&&a){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideo,a);n&&(a.innerHTML=n.html,r.push("desktop"))}if(!r.includes("mobile")&&window.innerWidth<768&&s){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideoMobile,s);n&&(s.innerHTML=n.html,r.push("mobile"))}}})} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-9jw7789i: ', ex)
      };
    

      try {
        let argid = 'beae-9jw7789isection-featured-product',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-9jw7789i',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-9jw7789i');
        args.el = args.els[0];
        ((a) => { const o=a.el.querySelector("#product-json-"+a.id),t=JSON.parse(o!=null&&o.innerHTML?o==null?void 0:o.innerHTML:"{}");let i=t==null?void 0:t.selected_or_first_available_variant;window.BeaeMoneyFormat||(window.BeaeMoneyFormat=a.moneyFormat),a.mode.value==="builder"&&s(i);function r(y){const g=a.el.querySelector(".beae-product-single__price"),x=a.el.querySelector(".beae-product-single__price--regular");g&&(g.innerHTML=window.BeaeFormatMoney(y.price)),x&&(y.compare_at_price?(x.style.display="block",x.innerHTML=window.BeaeFormatMoney(y.compare_at_price)):x.style.display="none")}function n(y){const g=a.el.querySelector(".beae-product-single__price--badged");if(g){const x=g.getAttribute("type");let w="Sale";if(y.compare_at_price&&y.compare_at_price>y.price){switch(g.style.display="block",x){case"percent":const k=(y.compare_at_price-y.price)*100/y.compare_at_price;w=`Save ${Math.floor(k)}%`;break;case"dollar":w="Save "+window.BeaeFormatMoney(y.compare_at_price-y.price);break}g.innerHTML=w}else g.innerHTML="",g.style.display="none"}}function l(y){const g=a.el.querySelector(".beae-x-product-gallery .beae-slider");g&&t&&y.featured_media&&g.dispatchEvent(new CustomEvent("activeSlide",{detail:{id:y.featured_media.id},bubbles:!0,cancelable:!0,composed:!1}))}function s(y){const g=a.el.querySelector(".beae-x-inventory");if(!g||!y)return;const x=g.children[0],w=g.getAttribute("data-in-stock-text"),k=g.getAttribute("data-out-stock-text");g.getAttribute("data-inventory-text");const C=g.getAttribute("data-pre-order-text"),v=g.getAttribute("data-very-low-stock-text"),$=g.getAttribute("data-low-stock-text"),S=g.getAttribute("data-incoming-date-text"),V=g.getAttribute("data-low-number")??20,B=g.getAttribute("data-very-low-number")??5,L=g.getAttribute("data-show-next-incoming-date"),N=g.getAttribute("data-max-number")??60,M=g.querySelector(".beae-inventory-label"),T=g.querySelector(".beae-inventory-process-body");function E(I){return I?I.replace("{quantity}",y.inventory_quantity).replace("{next_incoming_date}",y.next_incoming_date):""}!x||!M||(y.available?y.inventory_policy==="continue"&&y.inventory_quantity<1?(M.innerHTML=E(C),x.classList="",x.classList.add("beae-inventory-pre-order")):y.inventory_quantity<=B?(M.innerHTML=E(v),x.classList="",x.classList.add("beae-inventory-very-low")):y.inventory_quantity<=V?(M.innerHTML=E($),x.classList="",x.classList.add("beae-inventory-low")):(M.innerHTML=E(w),x.classList="",x.classList.add("beae-inventory-in-stock")):y.next_incoming_date&&L?(M.innerHTML=E(S),x.classList="",x.classList.add("beae-incoming-transfer")):(M.innerHTML=E(k),x.classList="",x.classList.add("beae-inventory-out-stock")),T&&(y.inventory_quantity<=N?T.style.width=y.inventory_quantity/N*100+"%":T.style.width="100%"))}function d(y){const g=a.el.querySelector(".beae-add-to-cart--submit");if(g){const w=g.querySelector(".beae-add-to-cart-text-content");y.available?g&&(g.removeAttribute("disabled"),w&&(w.innerHTML=g.getAttribute("data-add-to-cart-text"))):g&&(g.setAttribute("disabled","disabled"),w&&(w.innerHTML=g.getAttribute("data-sold-out-text")))}const x=a.el.querySelector(".shopify-payment-button__button");x&&(y.inventory_quantity>0?x.removeAttribute("disabled"):x.setAttribute("disabled","disabled"))}function c(y){const g=a.el.querySelector(".beae-quantity-input"),x=a.el.querySelectorAll(".beae-quantity-btn");if(x&&x.forEach(w=>{y&&y.available?w.removeAttribute("disabled"):w.setAttribute("disabled","disabled")}),g){if(y)y.available?g.removeAttribute("disabled"):g.setAttribute("disabled","disabled");else{g.value=1,g.setAttribute("disabled","disabled");return}const w=y.inventory_quantity,k=y.inventory_policy;let C=9999;y.inventory_management&&k==="deny"&&(C=w),w<1&&k=="continue"&&(C=999999);let v=parseInt(g.value);v>C&&(v=C),v=isNaN(v)||!v?1:v,g.value=v,g.setAttribute("max",C)}}function u(y){if(y){let g=a.el.querySelector(".beae-pa-container");if(g&&a.mode.value=="live"){const x=g.getAttribute("data-section-id-template");g.innerHTML="",window.fetch((window.BEAE.routes.root_url?window.BEAE.routes.root_url:"/")+"variants/"+y.id+"/?section_id="+x,{method:"GET",headers:{"Content-Type":"text/html"}}).then(w=>w.text()).then(w=>{let k=w.match(/<Beae-custom-liquid-pickup>(|[\s\S]+?)<\/Beae-custom-liquid-pickup>/g);k&&k[0]&&(g.innerHTML=k[0]);let C=g.querySelector(".beae-pa--btn"),v=g.querySelector(".beae-pa--detail");if(C){const $=g.closest("section.beae-section");$&&$.getAttribute("data-sectionid"),C.addEventListener("click",()=>{window.BeaePopupLibrary.createPopup(v,{layout:g.getAttribute("data-layout"),layoutMobile:"bottom",width:g.getAttribute("data-width"),id:a.id})})}}).catch(w=>{console.warn(w.message)})}}}const p=a.el.querySelector(".beae-variant-size-guide");if(p){const y=p.querySelector(".beae-variant-size-guide-btn"),g=p.querySelector(".beae-variant-size-guide-content");if(y&&g){const x=a.el.getAttribute("data-sectionid");y.addEventListener("click",()=>{window!=null&&window.BeaePopupLibrary&&window.BeaePopupLibrary.createPopup(g,{layout:"center",layoutMobile:"bottom",width:"auto",sectionId:x})})}}const m=a.el.querySelectorAll(".beae-custom-select_wrp");m&&m.length&&a.mode.value=="live"&&m.forEach(y=>{const g=y.querySelector("button.beae-custom-select__btn"),x=y.closest("div.beae-block.beae-core");g.addEventListener("click",function(w){y.classList.toggle("active"),x.style.position="relative",x.style.zIndex="1"}),document.addEventListener("click",function(w){y.contains(w.target)||(y.classList.remove("active"),x.style={})})});function b(){const y=a.el.querySelector(".beae-custom-select_wrp.active");y&&y.classList.remove("active")}const _=a.el.querySelector(".beae-x-variant");let h=!1;if(_){let y=function(B,L){if(!B)return[];let N=B.options.filter((M,T)=>T!=L);return t.variants.filter(M=>N.every(T=>M.options.includes(T)))??[]},g=function(B,L,N){if(!B)return null;let M=B.options.filter((T,E)=>E!=L);return t.variants.find(T=>T.options.every(E=>[N,...M].includes(E)))},x=function(B){if(!B)return;const L=a.el.querySelector("form.beae-product-form-next"),N=L.querySelector('input[type="hidden"][name="id"]');N&&N.setAttribute("value",B.id),L&&L.getAttribute("data-variant-id",B.id),_.querySelectorAll(".beae-variant-label").forEach(M=>{const T=parseInt(M.getAttribute("data-option-position"))-1;M.innerHTML=B.options[T]}),$||_.querySelectorAll(".beae-product-images-list").forEach(M=>{const T=parseInt(M.getAttribute("data-option-position"))-1;let E=[];y(B,T).forEach(I=>{E.push(`
                  <span
                    class="beae-product-swatch-item-image"
                    variant-id=${I.id}
                  >
                    <img
                      src="${I.featured_image?I.featured_image.src:"//cdn.shopify.com/shopifycloud/shopify/assets/no-image-160-1cfae84eca4ba66892099dcd26e604f5801fdadb3693bc9977f476aa160931ac_120x120_crop_center.gif"}"
                      alt="${I.title}"
                      height="120"
                      width="120"
                      loading="lazy"
                    />
                  </span>
                `)}),M.querySelectorAll(".beae-product-variant-item-image").forEach((I,j)=>{I.innerHTML=E[j]})}),_.querySelectorAll(".beae-product-variant-item").forEach(M=>{const T=parseInt(M.getAttribute("data-option-position"))-1,E=M.getAttribute("data-value")??"",I=g(B,T,E);I&&(M.setAttribute("data-variant-id",I.id),I.inventory_management&&I.inventory_quantity<1?M.classList.add("variant-item-disable"):M.classList.remove("variant-item-disable"))})},w=function(B,L){C(B),B&&(i=B,s(B),c(B),d(B),!v&&(x(B),r(B),n(B),l(B),u(B)))},k=function(){const B=a.el.querySelector('.beae-product-option-cont[data-swatch-type="variant_image"]');if(!B)return;const L=B.getAttribute("data-option-position"),N="//cdn.shopify.com/shopifycloud/shopify/assets/no-image-160-1cfae84eca4ba66892099dcd26e604f5801fdadb3693bc9977f476aa160931ac_120x120_crop_center.gif",M=a.el.querySelectorAll('.beae-product-option-cont:not([data-swatch-type="variant_image"])'),T={};M&&M.length&&M.forEach(j=>{const q=j.querySelector(".beae-product-variant-item--selected");if(!q)return;const P=q.getAttribute("data-option-position"),O=q.getAttribute("data-value");T["option"+P]=O});const E=t.variants.filter(j=>Object.keys(T).every(q=>T[q]==j[q])),I=B.querySelectorAll(".beae-product-variant-item");I&&I.length&&I.forEach(j=>{const q=j.getAttribute("data-value"),P=E.find(O=>O["option"+L]==q);j.innerHTML=`
                        <span class="beae-product-swatch-item-image">
                        <img
                        src="${P&&P.featured_image?P.featured_image.src:N}"
                        alt="${P&&P.title}"
                        height="100"
                        width="100"
                        loading="lazy"
                        />
                    </span>
                        `})},C=function(B){let L=t.variants,N=B&&B.option1,M=B&&B.option2;if(!B){const I=a.el.querySelector('.beae-variant-option-list[data-option-position="1"] .beae-product-variant-item--selected');I&&(N=I.getAttribute("data-value"));const j=a.el.querySelector('.beae-variant-option-list[data-option-position="2"] .beae-product-variant-item--selected');j&&(M=j.getAttribute("data-value"))}let T=[],E=[];if(N&&(L=t.variants.filter(I=>I.option1==N),L.forEach(I=>{I.option2&&!(T!=null&&T.includes(I.option2))&&T.push(I.option2)}),L.forEach(I=>{I.option2==M&&I.option3&&!(E!=null&&E.includes(I.option3))&&E.push(I.option3)})),[2,3].forEach(I=>{const j=a.el.querySelectorAll('.beae-variant-option-list[data-option-position="'+I+'"] .beae-product-variant-item');if(j){let q=I==2?T:E;j.forEach(P=>{const O=P.getAttribute("data-value");q.includes(O)?P.setAttribute("data-unavailable",!1):P.setAttribute("data-unavailable",!0)})}}),!B){if(T&&T.length){const I=a.el.querySelector('.beae-variant-option-list[data-option-position="2"] .beae-product-variant-item--selected[data-unavailable="false"]'),j=a.el.querySelector('.beae-variant-option-list[data-option-position="2"] .beae-product-variant-item[data-unavailable="false"]');!I&&j&&j.click()}if(E&&E.length){a.el.querySelector('.beae-variant-option-list[data-option-position="3"] .beae-product-variant-item--selected[data-unavailable="false"]');const I=a.el.querySelector('.beae-variant-option-list[data-option-position="3"] .beae-product-variant-item[data-unavailable="false"]');I&&I.click()}}k()},v=!0,$=!1,S=_.querySelector('[name="id"]');const V=S&&S.getAttribute("id");if(S&&window.Shopify&&window.Shopify.OptionSelectors){let B=function(L){var I;v=!1;const N=parseInt(L.getAttribute("data-option-position"))-1,M=_.querySelector("select#"+V+"-option-"+N),T=L.getAttribute("data-value")??L.value;if(console.log(T,M,"ss"),M){const j=((I=L.parentElement)==null?void 0:I.children)??[];for(let q=0;q<j.length;q++)j[q].classList.remove("beae-product-variant-item--selected");L.classList.add("beae-product-variant-item--selected"),M.value=T,M.onchange()}const E=L.closest(".beae-custom-select_wrp");if(E){const j=L.getAttribute("data-color"),q=E.querySelector(".beae-selected-color");q&&(q.style="--beae-color-variant: "+j);const P=E.querySelector(".beae-text-selected");P&&(P.innerHTML=T)}};new window.Shopify.OptionSelectors(V,{product:t,onVariantSelected:w,enableHistoryState:a.mode.value=="live"}),_.querySelectorAll(".beae-product-variant-item").forEach(L=>{L.addEventListener("click",function(N){$=!1,B(L),b()})}),_.querySelectorAll(".beae-product-variant-item-image").forEach(L=>{L.addEventListener("click",function(N){$=!0,B(L)})})}}else h=!0;t.has_only_default_variant&&(h=!0),h&&f();function f(){i&&(s(i),c(i),d(i))} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-9jw7789i: ', ex)
      };
    

      try {
        let argid = 'beae-xoy8gdjlbutton-js',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-xoy8gdjl',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-xoy8gdjl');
        args.el = args.els[0];
        ((data) => { let buttonElm=data.el.querySelector("a.beae-button-js");buttonElm.addEventListener("click",e=>{let extOptions={};if(data.extendOptions)try{eval("extOptions = "+data.extendOptions)}catch(a){extOptions={},console.error(a)}if(data.mode.value==="builder")return e.preventDefault(),!1;let selector=e.currentTarget.getAttribute("href");if(selector.indexOf("#")===0&&selector!=="#"){let a=document.querySelector(selector+","+selector.replace("#","."));if(a)return a.scrollIntoView({behavior:"smooth",block:"center",inline:"center"}),e.preventDefault(),!1}if(data.type==="popup"){console.log(window.createLoading," window.createLoading");const a=window.createLoading(e.currentTarget);return window.BeaePopupLibrary.lightbox({id:data.id,url:((data==null?void 0:data.url)??"").replace("/popup/","/?view=beae-"),...extOptions}).then(()=>{a.remove()}),e.preventDefault(),!1}else if(data.type==="pages"&&data.lightbox)return window.BeaePopupLibrary.createPopup(data.pageContent.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'"),{id:data.id,...extOptions}),e.preventDefault(),!1}),data.type==="popup"&&data.lightbox&&new IntersectionObserver((o,t)=>{o.forEach(i=>{i.isIntersecting&&(t.unobserve(i.target),i.target.click())})}).observe(buttonElm) })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-xoy8gdjl: ', ex)
      };
    

      try {
        let argid = 'beae-7mdi4x9fblock-gallery',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-7mdi4x9f',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-7mdi4x9f');
        args.el = args.els[0];
        ((a) => { setTimeout(()=>{a.el.querySelector("button.beae-media-zoom")&&a.el.querySelectorAll("button.beae-media-zoom").forEach(o=>o.addEventListener("click",t=>{a.mode.value,o.closest(".beae-slider-items")&&(a.el.querySelectorAll(".beae-slider-items>*.active").forEach(h=>h.classList.remove("active")),o.parentNode.classList.add("active"));let i=document.createElement("div"),r=a.el.querySelectorAll("div.beae-slider-items > *"),n=a.el.querySelector("div.beae-slider-content").getBoundingClientRect();i.setAttribute("class","beae-sections beae-content-wrapper"),i.innerHTML=`
        <div class="${a.id}">
          <div class="beae-gallery-zoom">
            <div class="beae-gallery-zoom-content" style="transform-origin: ${n.left}px ${n.top+n.height/2}px;">
              <div class="beae-gallery-zoom-items">
                ${Array.from(r).map((h,f)=>`
                    <div class="beae-gallery-zoom-item${h.classList.contains("active")?" active":""}" style="${h.classList.contains("active")?"order: -1;":""}">
                      ${h.innerHTML}
                    </div>
                  `).join("")}
              </div>
            </div>
            <div class="beae-gallery-zoom-controls">
              <div class="beae-gallery-zoom-pagination">
                <button class="pagination_item prev">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
                  </svg>
                </button>
                <span class="pagination_item per">0 / 0</span>
                <button class="pagination_item next">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
                  </svg>
                </button>
              </div>
            </div>
            <button class="beae-gallery-zoom-close">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4149L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z"></path>
              </svg>
            </button>
          </div>
        </div>
      `,document.body.appendChild(i),document.body.style.overflow="hidden";let l=i.querySelector("button.beae-gallery-zoom-close"),s=i.querySelector(".beae-gallery-zoom"),d=i.querySelector(".beae-gallery-zoom-content"),c=i.querySelector(".beae-gallery-zoom-pagination .pagination_item.per"),u=i.querySelector(".pagination_item.prev"),p=i.querySelector(".pagination_item.next"),m=i.querySelectorAll(".beae-gallery-zoom-item"),b=()=>{let h=i.querySelector(".beae-gallery-zoom-item.active");c.textContent=`${Array.from(i.querySelectorAll(".beae-gallery-zoom-item")).indexOf(h)+1} / ${r.length}`};b(),l.addEventListener("click",h=>{s.classList.remove("opened")}),i.querySelectorAll(".beae-gallery-zoom-item img").forEach(h=>{h.addEventListener("mousemove",f=>{h.parentNode.classList.contains("beae-gallery-zoom-more")?h.parentNode.classList.contains("beae-gallery-zoom-more")&&(h.style.objectFit==="cover"?h.style.objectPosition=100*((f.clientX-h.offsetLeft)/h.offsetWidth)+"% "+100*((f.clientY-h.offsetTop)/h.offsetHeight)+"%":h.style.objectPosition&&(h.style.objectPosition="")):(h.parentNode.classList.add("beae-gallery-zoom-more"),h.style.cursor="zoom-in",h.addEventListener("click",y=>{h.style.objectFit==="cover"?(h.style.objectFit="contain",y.target.style.transition="",h.style.cursor="zoom-in",h.style.objectPosition=""):(h.style.objectFit="cover",h.style.cursor="zoom-out",h.style.objectPosition=100*((y.clientX-h.offsetLeft)/h.offsetWidth)+"% "+100*((y.clientY-h.offsetTop)/h.offsetHeight)+"%")}))})}),s.addEventListener("transitionend",h=>{h.propertyName==="opacity"&&(s.classList.contains("opened")?(l.style.opacity=1,i.querySelectorAll(".beae-gallery-zoom-item img").forEach(f=>{f.removeAttribute("srcset"),f.removeAttribute("sizes")}),i.querySelector(".beae-gallery-zoom-item.active").style.order="",d.scrollTo({left:i.querySelector(".beae-gallery-zoom-item.active").offsetLeft})):(i.remove(),document.body.style.overflow=""))});let _=0;d.addEventListener("scroll",h=>{clearTimeout(_),_=setTimeout(()=>{m.forEach(f=>{h.target.scrollLeft===f.offsetLeft?(f.classList.add("active"),b()):f.classList.remove("active")})},250)}),u.addEventListener("click",()=>{let h=i.querySelector(".beae-gallery-zoom-item.active");h.previousElementSibling?h.previousElementSibling.classList.add("active"):m[m.length-1].classList.add("active"),h.classList.remove("active"),d.scrollTo({behavior:"smooth",left:i.querySelector(".beae-gallery-zoom-item.active").offsetLeft}),b()}),p.addEventListener("click",()=>{let h=i.querySelector(".beae-gallery-zoom-item.active");h.nextElementSibling?h.nextElementSibling.classList.add("active"):m[0].classList.add("active"),h.classList.remove("active"),d.scrollTo({behavior:"smooth",left:i.querySelector(".beae-gallery-zoom-item.active").offsetLeft}),b()}),setTimeout(()=>{s.classList.add("opened")},10)}))},1e3) })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-7mdi4x9f: ', ex)
      };
    

      try {
        let argid = 'beae-7mdi4x9fsection-slide-show',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-7mdi4x9f',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-7mdi4x9f');
        args.el = args.els[0];
        ((l) => { window.BeaeSlider&&window.BeaeSlider(l) })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-7mdi4x9f: ', ex)
      };
    

      try {
        let argid = 'beae-htftbhqzsection-js',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-htftbhqz',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-htftbhqz');
        args.el = args.els[0];
        ((t) => { var o;if((o=t.el.querySelector(".beae-grid-system"))==null||o.addEventListener("scroll",a=>{var n,l;let s=a.target;if(!s.classList.contains("beae-grid-carousel"))return;let r=Math.round((s.scrollLeft+s.querySelector(".beae-grid-carousel__snaps").offsetLeft)/(s.offsetWidth*.8))+1;(n=t.el.querySelector(".beae-grid-carousel__pagination div.active"))==null||n.classList.remove("active"),(l=t.el.querySelector('.beae-grid-carousel__pagination div[data-index="'+r+'"]'))==null||l.classList.add("active")}),t.mode.value=="live"){const a=t.el.querySelector('.beae-section-background-video[data-device="desktop"]'),s=t.el.querySelector('.beae-section-background-video[data-device="mobile"]'),r=[];if(window.BEAEVIDEO&&window.BEAEVIDEO.convertBackgroundSection){if(window.innerWidth>=768){if(a){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideo,a);n&&(a.innerHTML=n.html,r.push("desktop"))}}else if(s){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideoMobile,s);n&&(s.innerHTML=n.html,r.push("mobile"))}}(a||s)&&window.addEventListener("resize",()=>{if(window.BEAEVIDEO&&window.BEAEVIDEO.convertBackgroundSection){if(!r.includes("desktop")&&window.innerWidth>=768&&a){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideo,a);n&&(a.innerHTML=n.html,r.push("desktop"))}if(!r.includes("mobile")&&window.innerWidth<768&&s){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideoMobile,s);n&&(s.innerHTML=n.html,r.push("mobile"))}}})} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-htftbhqz: ', ex)
      };
    

      try {
        let argid = 'beae-p58cz9nsblock-image',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-p58cz9ns',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-p58cz9ns');
        args.el = args.els[0];
        ((S) => { if(S.el){let L,N=S.autoHover;var V=S.el.querySelector(".beae-img-ratio-control"),B=S.el.querySelector(".beae-image-secondary img");if(V&&B){let M=function(T){let E=0,I,j,q;P(),N?S.el.onmouseover=function(H){O(H)}:T.onmousedown=function(H){O(H)},S.el.onmouseup=function(){W()},T.ontouchstart=function(H){O(H)},S.el.ontouchend=function(){W()};function P(){new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),T.style.left&&(j=parseInt(T.style.left))}function O(H){check=!1,H.preventDefault(),H.clientX?I=H.clientX:I=H.touches[0].clientX,E=1,S.el.onmousemove=function(Y){ee(Y)},S.el.ontouchmove=function(Y){ee(Y)}}function W(){E=0,isNaN(q)||(j=q),check=!0}function ee(H){if(E==0||N&&!(H.target==B||H.target==S.el.querySelector(".beae-image-secondary")))return!1;q=D(H),q<0&&(q=0),q>100&&(q=100),R(q)}function D(H){H=H.changedTouches?H.changedTouches[0]:H;let Y;return N?Y=Math.round(H.offsetX*100/L):Y=Math.round(j-(I-H.pageX)*100/L),Y}function R(H){T.style.left=H+"%",B.style.clipPath=`polygon(${H}% 0%, ${H}% 100%, 100% 100%, 100% 0)`}};V&&B&&M(V),window.addEventListener("resize",function(){V&&B&&(new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),M(V))})}} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-p58cz9ns: ', ex)
      };
    

      try {
        let argid = 'beae-11p3v16csection-js',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-11p3v16c',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-11p3v16c');
        args.el = args.els[0];
        ((t) => { var o;if((o=t.el.querySelector(".beae-grid-system"))==null||o.addEventListener("scroll",a=>{var n,l;let s=a.target;if(!s.classList.contains("beae-grid-carousel"))return;let r=Math.round((s.scrollLeft+s.querySelector(".beae-grid-carousel__snaps").offsetLeft)/(s.offsetWidth*.8))+1;(n=t.el.querySelector(".beae-grid-carousel__pagination div.active"))==null||n.classList.remove("active"),(l=t.el.querySelector('.beae-grid-carousel__pagination div[data-index="'+r+'"]'))==null||l.classList.add("active")}),t.mode.value=="live"){const a=t.el.querySelector('.beae-section-background-video[data-device="desktop"]'),s=t.el.querySelector('.beae-section-background-video[data-device="mobile"]'),r=[];if(window.BEAEVIDEO&&window.BEAEVIDEO.convertBackgroundSection){if(window.innerWidth>=768){if(a){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideo,a);n&&(a.innerHTML=n.html,r.push("desktop"))}}else if(s){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideoMobile,s);n&&(s.innerHTML=n.html,r.push("mobile"))}}(a||s)&&window.addEventListener("resize",()=>{if(window.BEAEVIDEO&&window.BEAEVIDEO.convertBackgroundSection){if(!r.includes("desktop")&&window.innerWidth>=768&&a){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideo,a);n&&(a.innerHTML=n.html,r.push("desktop"))}if(!r.includes("mobile")&&window.innerWidth<768&&s){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideoMobile,s);n&&(s.innerHTML=n.html,r.push("mobile"))}}})} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-11p3v16c: ', ex)
      };
    

      try {
        let argid = 'beae-b8qbj05jblock-image',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-b8qbj05j',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-b8qbj05j');
        args.el = args.els[0];
        ((S) => { if(S.el){let L,N=S.autoHover;var V=S.el.querySelector(".beae-img-ratio-control"),B=S.el.querySelector(".beae-image-secondary img");if(V&&B){let M=function(T){let E=0,I,j,q;P(),N?S.el.onmouseover=function(H){O(H)}:T.onmousedown=function(H){O(H)},S.el.onmouseup=function(){W()},T.ontouchstart=function(H){O(H)},S.el.ontouchend=function(){W()};function P(){new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),T.style.left&&(j=parseInt(T.style.left))}function O(H){check=!1,H.preventDefault(),H.clientX?I=H.clientX:I=H.touches[0].clientX,E=1,S.el.onmousemove=function(Y){ee(Y)},S.el.ontouchmove=function(Y){ee(Y)}}function W(){E=0,isNaN(q)||(j=q),check=!0}function ee(H){if(E==0||N&&!(H.target==B||H.target==S.el.querySelector(".beae-image-secondary")))return!1;q=D(H),q<0&&(q=0),q>100&&(q=100),R(q)}function D(H){H=H.changedTouches?H.changedTouches[0]:H;let Y;return N?Y=Math.round(H.offsetX*100/L):Y=Math.round(j-(I-H.pageX)*100/L),Y}function R(H){T.style.left=H+"%",B.style.clipPath=`polygon(${H}% 0%, ${H}% 100%, 100% 100%, 100% 0)`}};V&&B&&M(V),window.addEventListener("resize",function(){V&&B&&(new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),M(V))})}} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-b8qbj05j: ', ex)
      };
    

      try {
        let argid = 'beae-t91koamcblock-image',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-t91koamc',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-t91koamc');
        args.el = args.els[0];
        ((S) => { if(S.el){let L,N=S.autoHover;var V=S.el.querySelector(".beae-img-ratio-control"),B=S.el.querySelector(".beae-image-secondary img");if(V&&B){let M=function(T){let E=0,I,j,q;P(),N?S.el.onmouseover=function(H){O(H)}:T.onmousedown=function(H){O(H)},S.el.onmouseup=function(){W()},T.ontouchstart=function(H){O(H)},S.el.ontouchend=function(){W()};function P(){new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),T.style.left&&(j=parseInt(T.style.left))}function O(H){check=!1,H.preventDefault(),H.clientX?I=H.clientX:I=H.touches[0].clientX,E=1,S.el.onmousemove=function(Y){ee(Y)},S.el.ontouchmove=function(Y){ee(Y)}}function W(){E=0,isNaN(q)||(j=q),check=!0}function ee(H){if(E==0||N&&!(H.target==B||H.target==S.el.querySelector(".beae-image-secondary")))return!1;q=D(H),q<0&&(q=0),q>100&&(q=100),R(q)}function D(H){H=H.changedTouches?H.changedTouches[0]:H;let Y;return N?Y=Math.round(H.offsetX*100/L):Y=Math.round(j-(I-H.pageX)*100/L),Y}function R(H){T.style.left=H+"%",B.style.clipPath=`polygon(${H}% 0%, ${H}% 100%, 100% 100%, 100% 0)`}};V&&B&&M(V),window.addEventListener("resize",function(){V&&B&&(new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),M(V))})}} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-t91koamc: ', ex)
      };
    

      try {
        let argid = 'beae-g70xlzcdblock-image',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-g70xlzcd',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-g70xlzcd');
        args.el = args.els[0];
        ((S) => { if(S.el){let L,N=S.autoHover;var V=S.el.querySelector(".beae-img-ratio-control"),B=S.el.querySelector(".beae-image-secondary img");if(V&&B){let M=function(T){let E=0,I,j,q;P(),N?S.el.onmouseover=function(H){O(H)}:T.onmousedown=function(H){O(H)},S.el.onmouseup=function(){W()},T.ontouchstart=function(H){O(H)},S.el.ontouchend=function(){W()};function P(){new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),T.style.left&&(j=parseInt(T.style.left))}function O(H){check=!1,H.preventDefault(),H.clientX?I=H.clientX:I=H.touches[0].clientX,E=1,S.el.onmousemove=function(Y){ee(Y)},S.el.ontouchmove=function(Y){ee(Y)}}function W(){E=0,isNaN(q)||(j=q),check=!0}function ee(H){if(E==0||N&&!(H.target==B||H.target==S.el.querySelector(".beae-image-secondary")))return!1;q=D(H),q<0&&(q=0),q>100&&(q=100),R(q)}function D(H){H=H.changedTouches?H.changedTouches[0]:H;let Y;return N?Y=Math.round(H.offsetX*100/L):Y=Math.round(j-(I-H.pageX)*100/L),Y}function R(H){T.style.left=H+"%",B.style.clipPath=`polygon(${H}% 0%, ${H}% 100%, 100% 100%, 100% 0)`}};V&&B&&M(V),window.addEventListener("resize",function(){V&&B&&(new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),M(V))})}} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-g70xlzcd: ', ex)
      };
    

      try {
        let argid = 'beae-4whhvjhjblock-image',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-4whhvjhj',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-4whhvjhj');
        args.el = args.els[0];
        ((S) => { if(S.el){let L,N=S.autoHover;var V=S.el.querySelector(".beae-img-ratio-control"),B=S.el.querySelector(".beae-image-secondary img");if(V&&B){let M=function(T){let E=0,I,j,q;P(),N?S.el.onmouseover=function(H){O(H)}:T.onmousedown=function(H){O(H)},S.el.onmouseup=function(){W()},T.ontouchstart=function(H){O(H)},S.el.ontouchend=function(){W()};function P(){new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),T.style.left&&(j=parseInt(T.style.left))}function O(H){check=!1,H.preventDefault(),H.clientX?I=H.clientX:I=H.touches[0].clientX,E=1,S.el.onmousemove=function(Y){ee(Y)},S.el.ontouchmove=function(Y){ee(Y)}}function W(){E=0,isNaN(q)||(j=q),check=!0}function ee(H){if(E==0||N&&!(H.target==B||H.target==S.el.querySelector(".beae-image-secondary")))return!1;q=D(H),q<0&&(q=0),q>100&&(q=100),R(q)}function D(H){H=H.changedTouches?H.changedTouches[0]:H;let Y;return N?Y=Math.round(H.offsetX*100/L):Y=Math.round(j-(I-H.pageX)*100/L),Y}function R(H){T.style.left=H+"%",B.style.clipPath=`polygon(${H}% 0%, ${H}% 100%, 100% 100%, 100% 0)`}};V&&B&&M(V),window.addEventListener("resize",function(){V&&B&&(new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),M(V))})}} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-4whhvjhj: ', ex)
      };
    

      try {
        let argid = 'beae-y9rasypnsection-js',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-y9rasypn',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-y9rasypn');
        args.el = args.els[0];
        ((t) => { var o;if((o=t.el.querySelector(".beae-grid-system"))==null||o.addEventListener("scroll",a=>{var n,l;let s=a.target;if(!s.classList.contains("beae-grid-carousel"))return;let r=Math.round((s.scrollLeft+s.querySelector(".beae-grid-carousel__snaps").offsetLeft)/(s.offsetWidth*.8))+1;(n=t.el.querySelector(".beae-grid-carousel__pagination div.active"))==null||n.classList.remove("active"),(l=t.el.querySelector('.beae-grid-carousel__pagination div[data-index="'+r+'"]'))==null||l.classList.add("active")}),t.mode.value=="live"){const a=t.el.querySelector('.beae-section-background-video[data-device="desktop"]'),s=t.el.querySelector('.beae-section-background-video[data-device="mobile"]'),r=[];if(window.BEAEVIDEO&&window.BEAEVIDEO.convertBackgroundSection){if(window.innerWidth>=768){if(a){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideo,a);n&&(a.innerHTML=n.html,r.push("desktop"))}}else if(s){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideoMobile,s);n&&(s.innerHTML=n.html,r.push("mobile"))}}(a||s)&&window.addEventListener("resize",()=>{if(window.BEAEVIDEO&&window.BEAEVIDEO.convertBackgroundSection){if(!r.includes("desktop")&&window.innerWidth>=768&&a){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideo,a);n&&(a.innerHTML=n.html,r.push("desktop"))}if(!r.includes("mobile")&&window.innerWidth<768&&s){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideoMobile,s);n&&(s.innerHTML=n.html,r.push("mobile"))}}})} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-y9rasypn: ', ex)
      };
    

      try {
        let argid = 'beae-y9rasypnsection-slide-show',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-y9rasypn',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-y9rasypn');
        args.el = args.els[0];
        ((l) => { window.BeaeSlider&&window.BeaeSlider(l) })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-y9rasypn: ', ex)
      };
    

      try {
        let argid = 'beae-1ghzz7rdsection-js',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-1ghzz7rd',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-1ghzz7rd');
        args.el = args.els[0];
        ((t) => { var o;if((o=t.el.querySelector(".beae-grid-system"))==null||o.addEventListener("scroll",a=>{var n,l;let s=a.target;if(!s.classList.contains("beae-grid-carousel"))return;let r=Math.round((s.scrollLeft+s.querySelector(".beae-grid-carousel__snaps").offsetLeft)/(s.offsetWidth*.8))+1;(n=t.el.querySelector(".beae-grid-carousel__pagination div.active"))==null||n.classList.remove("active"),(l=t.el.querySelector('.beae-grid-carousel__pagination div[data-index="'+r+'"]'))==null||l.classList.add("active")}),t.mode.value=="live"){const a=t.el.querySelector('.beae-section-background-video[data-device="desktop"]'),s=t.el.querySelector('.beae-section-background-video[data-device="mobile"]'),r=[];if(window.BEAEVIDEO&&window.BEAEVIDEO.convertBackgroundSection){if(window.innerWidth>=768){if(a){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideo,a);n&&(a.innerHTML=n.html,r.push("desktop"))}}else if(s){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideoMobile,s);n&&(s.innerHTML=n.html,r.push("mobile"))}}(a||s)&&window.addEventListener("resize",()=>{if(window.BEAEVIDEO&&window.BEAEVIDEO.convertBackgroundSection){if(!r.includes("desktop")&&window.innerWidth>=768&&a){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideo,a);n&&(a.innerHTML=n.html,r.push("desktop"))}if(!r.includes("mobile")&&window.innerWidth<768&&s){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideoMobile,s);n&&(s.innerHTML=n.html,r.push("mobile"))}}})} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-1ghzz7rd: ', ex)
      };
    

      try {
        let argid = 'beae-1ghzz7rdsection-slide-show',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-1ghzz7rd',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-1ghzz7rd');
        args.el = args.els[0];
        ((l) => { window.BeaeSlider&&window.BeaeSlider(l) })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-1ghzz7rd: ', ex)
      };
    

      try {
        let argid = 'beae-zxryxmfxblock-image',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-zxryxmfx',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-zxryxmfx');
        args.el = args.els[0];
        ((S) => { if(S.el){let L,N=S.autoHover;var V=S.el.querySelector(".beae-img-ratio-control"),B=S.el.querySelector(".beae-image-secondary img");if(V&&B){let M=function(T){let E=0,I,j,q;P(),N?S.el.onmouseover=function(H){O(H)}:T.onmousedown=function(H){O(H)},S.el.onmouseup=function(){W()},T.ontouchstart=function(H){O(H)},S.el.ontouchend=function(){W()};function P(){new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),T.style.left&&(j=parseInt(T.style.left))}function O(H){check=!1,H.preventDefault(),H.clientX?I=H.clientX:I=H.touches[0].clientX,E=1,S.el.onmousemove=function(Y){ee(Y)},S.el.ontouchmove=function(Y){ee(Y)}}function W(){E=0,isNaN(q)||(j=q),check=!0}function ee(H){if(E==0||N&&!(H.target==B||H.target==S.el.querySelector(".beae-image-secondary")))return!1;q=D(H),q<0&&(q=0),q>100&&(q=100),R(q)}function D(H){H=H.changedTouches?H.changedTouches[0]:H;let Y;return N?Y=Math.round(H.offsetX*100/L):Y=Math.round(j-(I-H.pageX)*100/L),Y}function R(H){T.style.left=H+"%",B.style.clipPath=`polygon(${H}% 0%, ${H}% 100%, 100% 100%, 100% 0)`}};V&&B&&M(V),window.addEventListener("resize",function(){V&&B&&(new ResizeObserver(()=>{window.requestAnimationFrame(()=>{L=B.offsetWidth})}).observe(B),M(V))})}} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-zxryxmfx: ', ex)
      };
    

      try {
        let argid = 'beae-cnkd5raesection-js',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-cnkd5rae',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-cnkd5rae');
        args.el = args.els[0];
        ((t) => { var o;if((o=t.el.querySelector(".beae-grid-system"))==null||o.addEventListener("scroll",a=>{var n,l;let s=a.target;if(!s.classList.contains("beae-grid-carousel"))return;let r=Math.round((s.scrollLeft+s.querySelector(".beae-grid-carousel__snaps").offsetLeft)/(s.offsetWidth*.8))+1;(n=t.el.querySelector(".beae-grid-carousel__pagination div.active"))==null||n.classList.remove("active"),(l=t.el.querySelector('.beae-grid-carousel__pagination div[data-index="'+r+'"]'))==null||l.classList.add("active")}),t.mode.value=="live"){const a=t.el.querySelector('.beae-section-background-video[data-device="desktop"]'),s=t.el.querySelector('.beae-section-background-video[data-device="mobile"]'),r=[];if(window.BEAEVIDEO&&window.BEAEVIDEO.convertBackgroundSection){if(window.innerWidth>=768){if(a){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideo,a);n&&(a.innerHTML=n.html,r.push("desktop"))}}else if(s){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideoMobile,s);n&&(s.innerHTML=n.html,r.push("mobile"))}}(a||s)&&window.addEventListener("resize",()=>{if(window.BEAEVIDEO&&window.BEAEVIDEO.convertBackgroundSection){if(!r.includes("desktop")&&window.innerWidth>=768&&a){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideo,a);n&&(a.innerHTML=n.html,r.push("desktop"))}if(!r.includes("mobile")&&window.innerWidth<768&&s){const n=window.BEAEVIDEO.convertBackgroundSection(t.optionsVideoMobile,s);n&&(s.innerHTML=n.html,r.push("mobile"))}}})} })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-cnkd5rae: ', ex)
      };
    

      try {
        let argid = 'beae-p08baf3lsection-slide-show',
          args = window.BEAEARGS[argid];
        if (!args) {
          args = {
            id: 'beae-p08baf3l',
            mode: {value: 'live'}
          }
        };
        args.els = document.querySelectorAll('.beae-p08baf3l');
        args.el = args.els[0];
        ((l) => { window.BeaeSlider&&window.BeaeSlider(l) })(args);
      }  catch (ex) {
        console.error('BEAE JS ERROR ID beae-p08baf3l: ', ex)
      };
    }; if (window.BEAEBASE) {js_SN0CASCE()} else {window.BEAEPAGEJS.push(js_SN0CASCE)}window.addEventListener("load", () => {let brd = document.createElement("div"),id = Math.random().toString(36).substr(2, 5);brd.setAttribute(`data-${id}`, "");brd.setAttribute("style","position:fixed;bottom: 10px;left:14px;z-index:99999999999999;display:flex;align-items:center;gap:10px");brd.innerHTML = `<a href="https://apps.shopify.com/beae/?utm_source=customersite&utm_medium=page&utm_campaign=traffic" target="_blank" style="box-shadow:rgb(0 0 0 / 25%) 0px 54px 55px, rgb(0 0 0 / 12%) 0px -12px 30px, rgb(0 0 0 / 12%) 0px 4px 6px, rgb(0 0 0 / 17%) 0px 12px 13px, rgb(0 0 0 / 9%) 0px -3px 5px;background:#fafafa;border-radius: 6px;padding: 3px 8px;text-decoration: none;font-family: system-ui, arial;font-size: 12px;color: #292929;font-weight: 500;display: flex;align-items: center;letter-spacing: 0;white-space: nowrap;">Made in <img src="https://app.beae.com/dist/images/beae-next-logo-80.png" height="14" style="border-radius: 0px;margin-left:3px;height:14px !important" /></a> `;document.body.appendChild(brd);}); 