# -*- coding: utf-8 -*-
from pathlib import Path

D = "div"  # avoid autocomplete corrupting tag names

path = Path(__file__).parent / "index.html"
text = path.read_text(encoding="utf-8")

carousel = f"""      <section class="os-window os-window--preview reveal" aria-label="Projetos">
        <{D} class="os-window-chrome">
          <{D} class="os-window-controls" aria-hidden="true"><span class="os-win-close"></span><span class="os-win-min"></span><span class="os-win-max"></span></{D}>
          <span class="os-window-title">Projetos.app</span>
        </{D}>
        <{D} class="os-window-body">
          <{D} class="hero-visual w-full relative reveal">
            <{D} class="absolute -inset-4 bg-orange-500/15 rounded-[40px] blur-2xl"></{D}>
            <a href="/projetos/" class="relative glass border border-white/10 rounded-[32px] overflow-hidden aspect-[4/3] bg-[#0a0a0e]/90 flex items-center justify-center p-6 cursor-pointer hover:border-orange-500/50 transition-colors group os-preview-widget">
              <transition-group name="hero-fade" tag="{D}" class="w-full h-full relative">
                <{D} v-for="(img, i) in heroImages" :key="img" v-show="currentHeroImage === i" class="absolute inset-0 flex items-center justify-center">
                  <img :src="img" class="max-w-full max-h-full object-contain mix-blend-lighten group-hover:scale-105 transition-transform duration-500 floating" alt="Projeto Pense OffGrid">
                </{D}>
              </transition-group>
              <{D} class="project-carousel-callout">
                <{D} class="mini-kicker" id="homeCarouselKicker"><i class="pulse-dot"></i> Projetos prontos</{D}>
                <strong id="homeCarouselTitle">Diagramas, manuais e listas de materiais</strong>
                <span id="homeCarouselDescription">Toque no carrossel para abrir os projetos de referência.</span>
              </{D}>
            </a>
          </{D}>
        </{D}>
      </section>
"""

old_carousel = f"""          <{D} class="w-full sm:w-4/5 md:w-3/4 lg:w-2/5 relative mt-8 lg:mt-0 reveal">
            <{D} class="absolute -inset-4 bg-orange-500/15 rounded-[40px] blur-2xl"></{D}>
            <a href="/projetos/" class="relative glass border border-white/10 rounded-[32px] overflow-hidden aspect-[4/3] bg-[#0a0a0e]/90 flex items-center justify-center p-6 cursor-pointer hover:border-orange-500/50 transition-colors group">
              <transition-group name="hero-fade" tag="{D}" class="w-full h-full relative">
                <{D} v-for="(img, i) in heroImages" :key="img" v-show="currentHeroImage === i" class="absolute inset-0 flex items-center justify-center">
                  <img :src="img" class="max-w-full max-h-full object-contain mix-blend-lighten group-hover:scale-105 transition-transform duration-500 floating" alt="Projeto Pense OffGrid">
                </{D}>
              </transition-group>
              <{D} class="project-carousel-callout">
                <{D} class="mini-kicker" id="homeCarouselKicker"><i class="pulse-dot"></i> Projetos prontos</{D}>
                <strong id="homeCarouselTitle">Diagramas, manuais e listas de materiais</strong>
                <span id="homeCarouselDescription">Toque no carrossel para abrir os projetos de referência.</span>
              </{D}>
            </a>
          </{D}>
"""

if old_carousel not in text:
    raise SystemExit("carousel block not found")

text = text.replace(old_carousel, "", 1)
marker = "      </section>\n\n      <section id=\"ecossistema\""
text = text.replace(marker, "      </section>\n\n" + carousel + "\n      <section id=\"ecossistema\"", 1)

solano_old = f"""<section class="mt-16 md:mt-24 mb-8 reveal">
        <article class="glass p-8 md:p-12 rounded-[40px] max-w-5xl mx-auto border-yellow-500/20 flex flex-col md:flex-row items-center gap-8 md:gap-12 bg-gradient-to-br from-[#0a0a0c] to-[#1a1500]">
          <{D} class="w-full md:w-1/3 flex justify-center">
            <{D} class="relative text-8xl md:text-9xl drop-shadow-[0_0_18px_rgba(247,147,30,.5)]" id="homeFeatureIcon">🎮</{D}>
          </{D}>
          <{D} class="w-full md:w-2/3 text-center md:text-left">
            <{D} class="section-kicker mb-2" id="homeFeatureKicker">Prática sem risco</{D}>
            <h2 class="font-black text-3xl md:text-4xl text-white mb-4 uppercase" style="font-family:Montserrat,sans-serif" id="homeFeatureTitle">Jogo Solano</h2>
            <p class="text-gray-400 mb-6 text-sm" id="homeFeatureDescription">Aprenda conceitos de geração, baterias, inversores e consumo em uma experiência leve, visual e competitiva.</p>
            <{D} class="flex flex-col sm:flex-row gap-4"><a href="/jogos/solano/" class="cta cta-primary" id="homeFeaturePrimary">Jogar Solano</a><a href="/projetos/" class="cta cta-secondary" id="homeFeatureSecondary">Ver projetos</a></{D}>
          </{D}>
        </article>
      </section>"""

solano_new = f"""      <section class="os-widget-panel reveal below-fold">
        <article class="os-window">
          <{D} class="os-window-chrome">
            <{D} class="os-window-controls" aria-hidden="true"><span class="os-win-close"></span><span class="os-win-min"></span><span class="os-win-max"></span></{D}>
            <span class="os-window-title">Solano.app</span>
          </{D}>
          <{D} class="os-window-body">
            <{D} class="widget-icon" id="homeFeatureIcon">🎮</{D}>
            <{D} class="section-kicker mb-2" id="homeFeatureKicker">Prática sem risco</{D}>
            <h2 class="widget-title" id="homeFeatureTitle">Jogo Solano</h2>
            <p class="widget-desc" id="homeFeatureDescription">Aprenda conceitos de geração, baterias, inversores e consumo em uma experiência leve, visual e competitiva.</p>
            <{D} class="flex flex-col sm:flex-row gap-4">
              <a href="/jogos/solano/" class="cta cta-primary" id="homeFeaturePrimary">Jogar Solano</a>
              <a href="/projetos/" class="cta cta-secondary" id="homeFeatureSecondary">Ver projetos</a>
            </{D}>
          </{D}>
        </article>
      </section>"""

if solano_old in text:
    text = text.replace(solano_old, solano_new, 1)

needle = """          <a href="https://chat.whatsapp.com/LIL7ytXyakpE4JnGvCgMBq" class="quick-card glass text-left"><span class="os-app-icon">⚡</span><motion class="section-kicker mb-3">Comunidade</div><h3 class="font-black text-xl uppercase text-white mb-2">Grupo VIP</h3><p class="text-sm text-gray-400">Acompanhe ofertas, alertas e novidades.</p><span class="card-arrow">→</span></a>
        </div>
      </section>"""
needle = needle.replace("<motion class=\"section-kicker", "<div class=\"section-kicker").replace("</motion>", "")

needle = """          <a href="https://chat.whatsapp.com/LIL7ytXyakpE4JnGvCgMBq" class="quick-card glass text-left"><span class="os-app-icon">⚡</span><motion class="section-kicker mb-3">Comunidade</div>"""
# simpler close fix
close_apps = """        </div>
      </section>
<section class="""
close_apps_fixed = """        </div>
        </div>
      </section>

      <section class="""
if close_apps in text and "os-widget-panel" not in text.split("ecossistema")[1][:800]:
    text = text.replace(close_apps, close_apps_fixed, 1)

if "os-dock" not in text:
    text = text.replace(
        "    </div>\n  </main>\n\n  <footer class=\"py-16",
        "    </motion>\n  </main>\n\n    <nav class=\"os-dock\" aria-label=\"Dock\">\n      <a href=\"/projetos/\"><span class=\"os-dock-icon\">📐</span>Projetos</a>\n      <a href=\"/calculadora/\"><span class=\"os-dock-icon\">🧮</span>Calc</a>\n      <a href=\"/jogos/solano/\"><span class=\"os-dock-icon\">🎮</span>Solano</a>\n      <a href=\"#ecossistema\"><span class=\"os-dock-icon\">▦</span>Apps</a>\n    </nav>\n  </div>\n\n  <footer class=\"os-tray site-footer py-16",
        1,
    )
    text = text.replace("    </motion>\n  </main>", "    </div>\n  </main>", 1)

if "vue@2.6.14" not in text:
    text = text.replace("<script>\n\nconst PROJECTS", '<script src="https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.min.js"></script>\n<script>\n\nconst PROJECTS', 1)

quick_old = """  const quickCardHtml = (item = {}) => `
    <a href="${escapeHtml(item.url || item.linkUrl || '#')}" class="quick-card glass text-left">
      <div class="section-kicker mb-3">${escapeHtml(item.kicker || item.category || 'Pense Offgrid')}</div>
      <h3 class="font-black text-xl uppercase text-white mb-2">${escapeHtml(item.title || item.name || 'Área')}</h3>
      <p class="text-sm text-gray-400">${escapeHtml(item.description || item.subtitle || '')}</p>
      <span class="card-arrow">→</span>
    </a>
  `;"""

quick_new = """  const quickCardHtml = (item = {}) => `
    <a href="${escapeHtml(item.url || item.linkUrl || '#')}" class="quick-card glass text-left">
      <span class="os-app-icon">${escapeHtml(item.icon || '⚡')}</span>
      <div class="section-kicker mb-3">${escapeHtml(item.kicker || item.category || 'Pense Offgrid')}</div>
      <h3>${escapeHtml(item.title || item.name || 'Área')}</h3>
      <p>${escapeHtml(item.description || item.subtitle || '')}</p>
    </a>
  `;"""

if quick_old in text:
    text = text.replace(quick_old, quick_new, 1)

path.write_text(text, encoding="utf-8")
print("ok")
