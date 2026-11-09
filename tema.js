/* Modo claro / escuro — partilhado por todas as páginas do portal.
   - O modo claro é o padrão; a escolha fica guardada em localStorage ("isa-tema").
   - Cada página tem no <head> um pequeno script inline que aplica o tema antes de desenhar
     (para não piscar); este ficheiro acrescenta o botão de troca ao <header class="top">.
   - Se a página tiver uma barra fixa no topo, marcar o elemento onde o botão deve ficar com o atributo
     data-tema-barra: aparece lá um segundo botão quando o do cabeçalho deixa de se ver (ao fazer scroll).
   - Para uma página nova: copiar o script inline do <head> e incluir <script src="/tema.js" defer></script>. */
(function(){
  var KEY = "isa-tema", root = document.documentElement;
  function saved(){ try{ return localStorage.getItem(KEY); }catch(e){ return null; } }
  function current(){ return root.getAttribute("data-theme") === "dark" ? "dark" : "light"; }

  function syncMeta(){
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    var meta = metas[0];
    for(var i = 1; i < metas.length; i++) metas[i].remove();
    if(!meta){ meta = document.createElement("meta"); meta.name = "theme-color"; document.head.appendChild(meta); }
    meta.removeAttribute("media");
    var bg = getComputedStyle(document.body || root).backgroundColor;
    meta.content = bg || (current() === "dark" ? "#10141B" : "#F0F2F5");
  }

  var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>';

  var btns = [];
  function paint(){
    var dark = current() === "dark";
    var label = dark ? "Mudar para modo claro" : "Mudar para modo escuro";
    btns.forEach(function(btn){
      btn.innerHTML = dark ? SUN : MOON;
      btn.setAttribute("aria-label", label); btn.title = label;
      btn.setAttribute("aria-pressed", dark ? "true" : "false");
    });
  }
  function makeBtn(cls){
    var b = document.createElement("button");
    b.type = "button"; b.className = cls;
    b.addEventListener("click", function(){ set(current() === "dark" ? "light" : "dark", true); });
    btns.push(b); return b;
  }
  function set(t, store){
    root.setAttribute("data-theme", t);
    if(store){ try{ localStorage.setItem(KEY, t); }catch(e){} }
    paint(); syncMeta();
  }

  root.setAttribute("data-theme", saved() === "dark" ? "dark" : "light");

  function init(){
    var css = document.createElement("style");
    css.textContent =
      "header.top{position:relative}" +
      ".theme-toggle{position:absolute;top:0;right:0;z-index:2;width:40px;height:40px;border-radius:999px;display:grid;place-items:center;" +
      "border:1px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer;padding:0;transition:border-color .15s,color .15s}" +
      ".theme-toggle:hover{border-color:var(--accent);color:var(--accent)}" +
      ".theme-toggle:focus-visible{outline:2px solid var(--accent);outline-offset:2px}" +
      ".theme-toggle svg{width:20px;height:20px}" +
      ".theme-toggle.in-bar{position:static;flex:none;width:34px;height:34px}" +
      ".theme-toggle.in-bar svg{width:18px;height:18px}" +
      "header.top>:first-child:not(.theme-toggle){margin-right:52px}";
    document.head.appendChild(css);

    var header = document.querySelector("header.top");
    var btn = makeBtn("theme-toggle");
    if(header){ header.appendChild(btn); }
    else { btn.style.cssText = "position:fixed;top:12px;right:12px"; document.body.appendChild(btn); }

    // Segundo botão na barra fixa, só visível quando o do cabeçalho sai do ecrã
    var bar = document.querySelector("[data-tema-barra]");
    if(bar && header){
      var inBar = makeBtn("theme-toggle in-bar");
      inBar.hidden = true;
      bar.appendChild(inBar);
      // A barra "colou" ao topo e o botão do cabeçalho já ficou por baixo dela (ou fora do ecrã)?
      var sticky = bar;
      while(sticky && sticky !== document.body && getComputedStyle(sticky).position !== "sticky") sticky = sticky.parentElement;
      if(!sticky || sticky === document.body) sticky = bar;
      var queued = false;
      var update = function(){
        queued = false;
        var sb = sticky.getBoundingClientRect(), hb = btn.getBoundingClientRect();
        var stuckAt = parseFloat(getComputedStyle(sticky).top) || 0;
        var stuck = sb.top <= stuckAt + 1;
        var show = stuck && hb.bottom <= sb.bottom;
        if(inBar.hidden === show) inBar.hidden = !show;
      };
      var schedule = function(){ if(!queued){ queued = true; requestAnimationFrame(update); } };
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule);
      update();
    }
    paint(); syncMeta();
  }

  // Mudança feita noutro separador
  window.addEventListener("storage", function(e){ if(e.key === KEY) set(e.newValue === "dark" ? "dark" : "light", false); });

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
