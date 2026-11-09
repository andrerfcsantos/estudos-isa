/* Portal de estudo da Isa — comportamento partilhado:
   - guarda a última página de estudo aberta (para "Continuar onde ficaste");
   - filtros por tema nas páginas de disciplina;
   - regista o service worker para as páginas funcionarem sem rede (comboio). */
(function(){
  var LAST = "isa-ultima-pagina";
  function read(){ try{ return JSON.parse(localStorage.getItem(LAST) || "null"); }catch(e){ return null; } }
  function save(v){ try{ localStorage.setItem(LAST, JSON.stringify(v)); }catch(e){} }

  // Guardar a página aberta
  document.addEventListener("click", function(ev){
    var a = ev.target.closest && ev.target.closest("a[data-study]");
    if(!a) return;
    save({ href: new URL(a.href, location.href).pathname, title: a.dataset.study, subject: a.dataset.subject || "", cls: a.dataset.cls || "", at: Date.now() });
  });

  // Mostrar "Continuar onde ficaste"
  var box = document.getElementById("resume");
  if(box){
    var last = read();
    if(last && last.href){
      box.href = last.href;
      box.querySelector("b").textContent = last.title;
      box.querySelector(".s").textContent = last.subject;
      if(last.cls) box.classList.add(last.cls);
      box.hidden = false;
    }
  }

  // Filtros por tema
  var filters = document.querySelector(".filters");
  if(filters){
    var items = document.querySelectorAll(".pages > li");
    var temas = [];
    items.forEach(function(li){
      (li.dataset.temas || "").split("|").forEach(function(t){ t = t.trim(); if(t && temas.indexOf(t) < 0) temas.push(t); });
    });
    if(temas.length > 1){
      ["Todos"].concat(temas).forEach(function(t, i){
        var b = document.createElement("button");
        b.className = "chip"; b.type = "button"; b.textContent = t;
        b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
        b.addEventListener("click", function(){
          filters.querySelectorAll(".chip").forEach(function(c){ c.setAttribute("aria-pressed", c === b ? "true" : "false"); });
          items.forEach(function(li){
            li.hidden = i !== 0 && (li.dataset.temas || "").split("|").map(function(s){return s.trim();}).indexOf(t) < 0;
          });
        });
        filters.appendChild(b);
      });
      filters.hidden = false;
    }
  }

  // Estado offline
  var net = document.getElementById("net");
  function upd(){ if(!net) return; var on = navigator.onLine;
    net.innerHTML = '<span class="dot' + (on ? ' on' : '') + '"></span>' + (on ? "Online" : "Sem rede — a mostrar páginas guardadas"); }
  window.addEventListener("online", upd); window.addEventListener("offline", upd); upd();

  if("serviceWorker" in navigator){
    window.addEventListener("load", function(){ navigator.serviceWorker.register("/sw.js").catch(function(){}); });
  }
})();
