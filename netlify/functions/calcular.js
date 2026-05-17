// netlify/functions/calcular.js
// VERSÃO FINAL - ARCANJO SUPREMO + CAPTAÇÃO WHATSAPP VIP EM TODOS OS COMPONENTES

// --- 1. BASE DE DADOS DE PROJETOS (INVERSORES ATUALIZADOS) ---
const PROJECTS_DB = { 
    'p12v': { 
        id: 'p12v', title: 'Projeto Y&H 12V 1kW', tag: 'Motorhome e Barcos', name: 'Inversor Y&H 1kW 12V', 
        description: 'O ponto de partida para a autonomia móvel. Ideal para veículos, barcos e sistemas portáteis. Tecnologia 12V robusta e baixo custo de entrada.', 
        image: 'https://imgur.com/6xYhzci.png', link: 'https://s.shopee.com.br/5VQ3F2WfQR', 
        maxPower: 1000, voltageAC: 220, voltageDC: 12, batteryAh: 100 
    }, 
    'p24v_110': { 
        id: 'p24v_110', title: 'Projeto ANENJI 24V 3.0kW (110V)', tag: 'Residência Básica (110V)', name: 'Inversor ANENJI 3kW 24V (110V)', 
        description: 'A porta de entrada para residências 110V. Sistema 24V muito mais eficiente que 12V. Ideal para backup e cargas essenciais.', 
        image: 'https://imgur.com/Zy3eZOS.png', link: 'https://a.aliexpress.com/_mM0X2Dr',
        maxPower: 3000, voltageAC: 127, voltageDC: 24, batteryAh: 100 
    }, 
    'p24v_220': { 
        id: 'p24v_220', title: 'Projeto ANENJI 24V 4.0kW (220V)', tag: 'Residência Básica (220V)', name: 'Inversor ANENJI 4.0kW 24V (220V)', 
        description: 'O campeão de custo-benefício. Sistema 24V robusto para manter sua casa funcional (Luzes, TV, Geladeira) com segurança e eficiência.', 
        image: 'https://i.imgur.com/NQLAc71.png', link: 'https://s.click.aliexpress.com/e/_mOsgvNN',
        maxPower: 4000, voltageAC: 220, voltageDC: 24, batteryAh: 100 
    }, 
    'p48v': { 
        id: 'p48v', title: 'Projeto ANENJI 48V 6.2kW', tag: 'Casa Conforto', name: 'Inversor ANENJI 6.2kW 48V', 
        description: 'O padrão ouro do Off-Grid. Tecnologia 48V para máxima eficiência. Suporta picos de partida de motores e ar-condicionado sem esforço.', 
        image: 'https://i.imgur.com/Qta9pp1.png', link: 'https://a.aliexpress.com/_mMnFQVf',
        maxPower: 6200, voltageAC: 220, voltageDC: 48, batteryAh: 100 
    }, 
    'p48v_plus': { 
        id: 'p48v_plus', title: 'Projeto ANENJI 48V 11kW', tag: 'Casa Robusta / Oficina', name: 'Inversor Twin 11kW (Paralelo)', 
        description: 'Poder de fogo industrial. Configuração em paralelo para quem não aceita limites. Roda a casa inteira, oficina e múltiplos ares-condicionados.', 
        image: 'https://i.imgur.com/c8Vm80l.png', link: 'https://s.click.aliexpress.com/e/_mr3nQr3',
        maxPower: 11000, voltageAC: 220, voltageDC: 48, batteryAh: 100 
    } 
};

const PAINELS_DB = { 
    'p160': { name: 'Painel Resun 160W', potencia: 160, voc: 23.0, vmp: 19.0, isc: 9.0 }, 
    'p440': { name: 'Painel Canadian 440W', potencia: 440, voc: 49.0, vmp: 41.0, isc: 11.5 }, 
    'p550': { name: 'Painel Trina 550W', potencia: 550, voc: 49.0, vmp: 41.0, isc: 14.0 }, 
    'p560': { name: 'Painel Jinko 560W', potencia: 560, voc: 49.5, vmp: 41.5, isc: 14.2 }, 
    'p585': { name: 'Painel 585W', potencia: 585, voc: 51.0, vmp: 43.0, isc: 14.5 },
    'p600': { name: 'Painel 600W', potencia: 600, voc: 52.0, vmp: 44.0, isc: 15.0 },
    'p700': { name: 'Painel Risen 700W', potencia: 700, voc: 52.5, vmp: 43.5, isc: 19.5 } 
};

// --- ESTRATÉGIA WHATSAPP VIP (ABORDAGEM HÍBRIDA GLOBAL) ---
const WHATSAPP_CHANNEL = 'https://whatsapp.com/channel/0029Vb7DVdL1NCrPouPkf02y';

const MODAL_CONTENT_DB = {
    paineis: { 
        title: `<i class="fas fa-solar-panel mr-2 text-emerald-400"></i>Opções de Painéis Solares`, 
        content: `
        <div class="p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg mb-4 text-center">
            <p class="text-sm text-gray-300 mb-3"><i class="fas fa-info-circle text-emerald-500"></i> O preço dos painéis varia conforme o lote. Acompanhe o nosso Canal VIP para participar em compras coletivas e promoções exclusivas.</p>
            <a href="https://whatsapp.com/channel/0029Vb7DVdL1NCrPouPkf02y/275" target="_blank" class="inline-flex items-center justify-center w-full p-3 font-bold rounded-lg text-black bg-emerald-500 hover:bg-emerald-400 transition-colors shadow-lg">
                <i class="fab fa-whatsapp text-xl mr-2"></i> VER OFERTAS DE PAINÉIS NO CANAL
            </a>
        </div>
        <div class="text-center">
            <p class="text-xs text-gray-500 mb-2">Ou pesquise nos fornecedores oficiais (Sem garantia de desconto):</p>
            <ul class="space-y-2">
                <li><a href="https://soollar.com.br" target="_blank" class="text-xs text-gray-400 hover:text-white underline">Soollar (Atacado)</a></li>
                <li><a href="https://www.neosolar.com.br/loja/painel-solar.html" target="_blank" class="text-xs text-gray-400 hover:text-white underline">Neosolar (Varejo)</a></li>
            </ul>
        </div>
        <div class="mt-4 p-4 rounded-lg bg-yellow-900/20 border border-yellow-500/30">
            <h6 class="text-yellow-500 font-bold"><i class="fas fa-exclamation-triangle mr-2"></i>Atenção: Tensão Voc</h6>
            <p class="text-xs mt-2 text-gray-400">A etapa mais crítica é conectar os painéis em série. Respeite estritamente o limite de 450V ou 500V do seu inversor para não o queimar.</p>
        </div>` 
    },
    baterias_12: { 
        title: `<i class="fas fa-car-battery mr-2 text-blue-400"></i>Opções de Baterias (12V)`, 
        content: `
        <div class="p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg mb-4 text-center">
            <p class="text-sm text-gray-300 mb-3"><i class="fas fa-info-circle text-emerald-500"></i> As baterias LiFePO4 esgotam rápido e os preços mudam. Pegue a melhor oferta atualizada diretamente no nosso Canal VIP.</p>
            <a href="${WHATSAPP_CHANNEL}" target="_blank" class="inline-flex items-center justify-center w-full p-3 font-bold rounded-lg text-black bg-emerald-500 hover:bg-emerald-400 transition-colors shadow-lg">
                <i class="fab fa-whatsapp text-xl mr-2"></i> VER OFERTAS DE BATERIAS NO CANAL
            </a>
        </div>
        <div class="text-center">
            <p class="text-xs text-gray-500 mb-2">Ou tente os links diretos (Podem estar sem estoque):</p>
            <ul class="space-y-2">
                <li><a href="https://mercadolivre.com/sec/2uMB4LT" target="_blank" class="text-xs text-gray-400 hover:text-white underline">Bateria 12V 100Ah Lítio - ML</a></li>
            </ul>
        </div>` 
    },
    baterias_24: { 
        title: `<i class="fas fa-car-battery mr-2 text-blue-400"></i>Opções de Baterias (24V)`, 
        content: `
        <div class="p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg mb-4 text-center">
            <p class="text-sm text-gray-300 mb-3"><i class="fas fa-info-circle text-emerald-500"></i> As baterias LiFePO4 esgotam rápido. Pegue a oferta exata de 24V atualizada diretamente no nosso Canal VIP.</p>
            <a href="https://whatsapp.com/channel/0029Vb7DVdL1NCrPouPkf02y/273" target="_blank" class="inline-flex items-center justify-center w-full p-3 font-bold rounded-lg text-black bg-emerald-500 hover:bg-emerald-400 transition-colors shadow-lg">
                <i class="fab fa-whatsapp text-xl mr-2"></i> VER OFERTA BATERIA 24V NO CANAL
            </a>
        </div>
        <div class="text-center">
            <p class="text-xs text-gray-500 mb-2">Ou tente os links diretos (Podem estar sem estoque):</p>
            <ul class="space-y-2">
                <li><a href="https://mercadolivre.com/sec/2uMB4LT" target="_blank" class="text-xs text-gray-400 hover:text-white underline">Comprar 2x Baterias 12V (Série) - ML</a></li>
            </ul>
        </div>` 
    },
    baterias_48: { 
        title: `<i class="fas fa-car-battery mr-2 text-blue-400"></i>Opções de Baterias (48V)`, 
        content: `
        <div class="p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg mb-4 text-center">
            <p class="text-sm text-gray-300 mb-3"><i class="fas fa-info-circle text-emerald-500"></i> Para sistemas 48V recomendamos Baterias de Rack. Pegue a melhor oferta atualizada diretamente no nosso Canal VIP.</p>
            <a href="${WHATSAPP_CHANNEL}" target="_blank" class="inline-flex items-center justify-center w-full p-3 font-bold rounded-lg text-black bg-emerald-500 hover:bg-emerald-400 transition-colors shadow-lg">
                <i class="fab fa-whatsapp text-xl mr-2"></i> VER OFERTAS DE BATERIAS NO CANAL
            </a>
        </div>
        <div class="text-center">
            <p class="text-xs text-gray-500 mb-2">Ou tente os links diretos (Podem estar sem estoque):</p>
            <ul class="space-y-2">
                <li><a href="https://mercadolivre.com/sec/2EKdzmw" target="_blank" class="text-xs text-gray-400 hover:text-white underline">Bateria Rack 48V (ZTE/Moura) - ML</a></li>
            </ul>
        </div>` 
    },
    protecoes: { 
        title: `<i class="fas fa-shield-halved mr-2 text-red-400"></i>Proteções Essenciais`, 
        content: `
        <div class="p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg mb-4 text-center">
            <p class="text-sm text-gray-300 mb-3"><i class="fas fa-info-circle text-emerald-500"></i> Kits de cabos, disjuntores e ferramentas aparecem com frequência com cupons de desconto no Canal VIP. Não compre mais caro!</p>
            <a href="${WHATSAPP_CHANNEL}" target="_blank" class="inline-flex items-center justify-center w-full p-3 font-bold rounded-lg text-black bg-emerald-500 hover:bg-emerald-400 transition-colors shadow-lg">
                <i class="fab fa-whatsapp text-xl mr-2"></i> VER CUPONS DE ACESSÓRIOS NO CANAL
            </a>
        </div>
        <div class="text-center">
            <p class="text-xs text-gray-500 mb-2">Links diretos (Sem garantia de cupom ativo):</p>
            <ul class="space-y-2">
                <li><a href="https://s.shopee.com.br/2g4s7e1tGl" target="_blank" class="text-xs text-gray-400 hover:text-white underline">String Box Clamper Original</a></li>
                <li><a href="https://s.shopee.com.br/9KZ9PNZwH9" target="_blank" class="text-xs text-gray-400 hover:text-white underline">Kit de Ferramentas Solares</a></li>
            </ul>
        </div>` 
    },
    tabela_nbr: { 
        title: `<i class="fas fa-table mr-2 text-emerald-400"></i>Referência NBR 5410`, 
        content: `<p class="text-sm mb-3 text-gray-300">Capacidade de condução segura para Cabos Flexíveis de Cobre (Método B1):</p><div class="table-responsive text-sm border border-gray-700 rounded-lg overflow-hidden"><table class="w-full text-center"><thead><tr class="bg-gray-800 text-gray-300"><th class="p-2">Secção Nominal</th><th class="p-2">Ampéres Máx (A)</th></tr></thead><tbody class="text-gray-400"><tr class="border-t border-gray-800"><td class="py-2">2,5 mm²</td><td>21 A</td></tr><tr class="border-t border-gray-800"><td class="py-2">4,0 mm²</td><td class="font-bold text-white">28 A</td></tr><tr class="border-t border-gray-800"><td class="py-2">6,0 mm²</td><td>36 A</td></tr><tr class="border-t border-gray-800"><td class="py-2">10,0 mm²</td><td>50 A</td></tr><tr class="border-t border-gray-800"><td class="py-2">16,0 mm²</td><td>68 A</td></tr><tr class="border-t border-gray-800"><td class="py-2">25,0 mm²</td><td>89 A</td></tr><tr class="border-t border-gray-800"><td class="py-2 font-bold text-emerald-400">35,0 mm²</td><td class="font-bold text-emerald-400">111 A</td></tr><tr class="border-t border-gray-800"><td class="py-2 font-bold text-emerald-400">50,0 mm²</td><td class="font-bold text-emerald-400">134 A</td></tr></tbody></table></div>` 
    },
    
    // --- MODAIS HÍBRIDOS DE INVERSORES ---
    inversor_p12v: { 
        title: `Kit 12V Básico`, 
        content: `
        <div class="p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg mb-4 text-center">
            <p class="text-sm text-gray-300 mb-3"><i class="fas fa-info-circle text-emerald-500"></i> Os links das lojas chinesas expiram rápido. Aceda à postagem oficial no nosso Canal VIP para garantir o link ativo.</p>
            <a href="https://whatsapp.com/channel/0029Vb7DVdL1NCrPouPkf02y/263" target="_blank" class="inline-flex items-center justify-center w-full p-3 font-bold rounded-lg text-black bg-emerald-500 hover:bg-emerald-400 transition-colors shadow-lg">
                <i class="fab fa-whatsapp text-xl mr-2"></i> VER LINK ATUALIZADO NO CANAL
            </a>
        </div>
        <div class="text-center">
            <p class="text-xs text-gray-500 mb-2">Ou tente o link direto (Pode estar esgotado):</p>
            <a href="https://s.shopee.com.br/5VQ3F2WfQR" target="_blank" class="text-xs text-gray-400 hover:text-white underline">Inversor Y&H 1kW (AliExpress)</a>
        </div>` 
    },
    inversor_p24v_220: { 
        title: `Kit 24V Eficiente`, 
        content: `
        <div class="p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg mb-4 text-center">
            <p class="text-sm text-gray-300 mb-3"><i class="fas fa-info-circle text-emerald-500"></i> Os links das lojas chinesas expiram rápido. Aceda à postagem oficial no nosso Canal VIP para garantir o link ativo.</p>
            <a href="${WHATSAPP_CHANNEL}" target="_blank" class="inline-flex items-center justify-center w-full p-3 font-bold rounded-lg text-black bg-emerald-500 hover:bg-emerald-400 transition-colors shadow-lg">
                <i class="fab fa-whatsapp text-xl mr-2"></i> VER LINK ATUALIZADO NO CANAL
            </a>
        </div>
        <div class="text-center">
            <p class="text-xs text-gray-500 mb-2">Ou tente o link direto (Pode estar esgotado):</p>
            <a href="https://s.click.aliexpress.com/e/_mOsgvNN" target="_blank" class="text-xs text-gray-400 hover:text-white underline">Inversor ANENJI 4kW (AliExpress)</a>
        </div>` 
    },
    inversor_p24v_110: { 
        title: `Kit 24V (Rede 110V)`, 
        content: `
        <div class="p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg mb-4 text-center">
            <p class="text-sm text-gray-300 mb-3"><i class="fas fa-info-circle text-emerald-500"></i> Os links das lojas chinesas expiram rápido. Aceda à postagem oficial no nosso Canal VIP para garantir o link ativo.</p>
            <a href="https://whatsapp.com/channel/0029Vb7DVdL1NCrPouPkf02y/252" target="_blank" class="inline-flex items-center justify-center w-full p-3 font-bold rounded-lg text-black bg-emerald-500 hover:bg-emerald-400 transition-colors shadow-lg">
                <i class="fab fa-whatsapp text-xl mr-2"></i> VER LINK ATUALIZADO NO CANAL
            </a>
        </div>
        <div class="text-center">
            <p class="text-xs text-gray-500 mb-2">Ou tente o link direto (Pode estar esgotado):</p>
            <a href="https://a.aliexpress.com/_mM0X2Dr" target="_blank" class="text-xs text-gray-400 hover:text-white underline">Inversor 3kW 110V (AliExpress)</a>
        </div>` 
    },
    inversor_p48v: { 
        title: `O Padrão Brasileiro 48V`, 
        content: `
        <div class="p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg mb-4 text-center">
            <p class="text-sm text-gray-300 mb-3"><i class="fas fa-info-circle text-emerald-500"></i> Os links do AliExpress expiram frequentemente. Aceda à postagem oficial no nosso Canal VIP para garantir o link ativo e promoções.</p>
            <a href="https://whatsapp.com/channel/0029Vb7DVdL1NCrPouPkf02y/254" target="_blank" class="inline-flex items-center justify-center w-full p-3 font-bold rounded-lg text-black bg-emerald-500 hover:bg-emerald-400 transition-colors shadow-lg">
                <i class="fab fa-whatsapp text-xl mr-2"></i> VER LINK ATUALIZADO NO CANAL
            </a>
        </div>
        <div class="text-center">
            <p class="text-xs text-gray-500 mb-2">Links Diretos (Podem estar inativos):</p>
            <ul class="space-y-2">
                <li><a href="https://a.aliexpress.com/_mMnFQVf" target="_blank" class="text-xs text-gray-400 hover:text-white underline">Opção 1: ANENJI 6.2kW (AliExpress)</a></li>
                <li><a href="https://s.click.aliexpress.com/e/_mLuKPYz" target="_blank" class="text-xs text-gray-400 hover:text-white underline">Opção 2: Loja Secundária (AliExpress)</a></li>
            </ul>
        </div>` 
    },
    inversor_p48v_plus: { 
        title: `Extremo 48V (11.000W)`, 
        content: `
        <div class="p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg mb-4 text-center">
            <p class="text-sm text-gray-300 mb-3"><i class="fas fa-info-circle text-emerald-500"></i> Os links das lojas chinesas expiram rápido. Aceda à postagem oficial no nosso Canal VIP para garantir o link ativo.</p>
            <a href="${WHATSAPP_CHANNEL}" target="_blank" class="inline-flex items-center justify-center w-full p-3 font-bold rounded-lg text-black bg-emerald-500 hover:bg-emerald-400 transition-colors shadow-lg">
                <i class="fab fa-whatsapp text-xl mr-2"></i> VER LINK ATUALIZADO NO CANAL
            </a>
        </div>
        <div class="text-center">
            <p class="text-xs text-gray-500 mb-2">Ou tente o link direto (Pode estar esgotado):</p>
            <a href="https://s.click.aliexpress.com/e/_mr3nQr3" target="_blank" class="text-xs text-gray-400 hover:text-white underline">Inversor Twin 11kW 48V (AliExpress)</a>
        </div>` 
    }
};

// --- 4. HELPERS DE CÁLCULO ---
const calculationHelpers = {
    bitola: (potencia, tensao, minGauge = 0, isSolar = false) => {
        if (tensao <= 0) return 'N/A';
        const corrente = isSolar ? 20 : (potencia / tensao) / 0.9;
        
        const bitolas = [
            {g:2.5,a:21},{g:4,a:28},{g:6,a:36},{g:10,a:50},
            {g:16,a:68},{g:25,a:89},{g:35,a:110},{g:50,a:134},{g:70,a:171},{g:95,a:207}
        ];
        
        const rec = bitolas.find(bit => bit.a >= corrente);
        const final = rec ? rec.g : 95; 
        
        if(isSolar) return '6mm² (Padrão)';
        
        return `${Math.max(final, minGauge)} mm²`;
    },
    
    gerarConteudoModalCabo: (inv, isBattery) => {
        const powerSource = inv.maxPower;
        const voltageSource = isBattery ? inv.voltageDC : inv.voltageAC;
        
        if (isBattery) {
            const power70 = powerSource * 0.7;
            const current70 = (power70 / voltageSource) / 0.9;
            const current100 = (powerSource / voltageSource) / 0.9;

            const bitola70 = calculationHelpers.bitola(power70, voltageSource, 0, false);
            const bitola100 = calculationHelpers.bitola(powerSource, voltageSource, 0, false);

            return { 
                title: `Cálculo de Engenharia: Cabo da Bateria (DC)`, 
                content: `
                    <h4 class="text-emerald-400 font-bold mb-2">Dimensionamento Inteligente (Uso Cotidiano)</h4>
                    <p class="mb-4 text-sm text-gray-300">Para a maioria dos sistemas e utilizadores no <strong>uso cotidiano comum</strong>, o inversor raramente opera no seu limite máximo continuamente. Calculando para <strong>70% da capacidade (${power70.toFixed(0)}W)</strong>, a corrente exigida é de aproximadamente <strong>${current70.toFixed(1)}A</strong>.</p>
                    <p class="mb-4 text-sm text-gray-300">Para este cenário, a bitola recomendada é de <strong class="text-emerald-400">${bitola70}</strong>, que atende perfeitamente à maioria dos sistemas com segurança e economia.</p>

                    <h4 class="text-yellow-400 font-bold mb-2"><i class="fas fa-exclamation-triangle mr-2"></i>Atenção: Uso Extremo (100%)</h4>
                    <p class="mb-4 text-sm text-gray-300">Se pretende utilizar <strong>100% da capacidade do inversor (${powerSource}W) de forma contínua</strong> (tirando toda a energia simultaneamente da bateria), a corrente chegará a <strong>${current100.toFixed(1)}A</strong>. Neste caso rigoroso, a norma NBR 5410 exige uma bitola conservadora de <strong class="text-yellow-400">${bitola100}</strong> para evitar o sobreaquecimento e o risco de incêndios.</p>
                    
                    <h4 class="text-emerald-400 font-bold mb-2">Recomendação de Instalação:</h4>
                    <ul class="list-disc pl-5 text-sm space-y-2 mb-4 text-gray-400">
                        <li>Utilize cabos 100% Cobre, ultra flexíveis.</li>
                        <li>A distância entre a bateria e o inversor <b>NÃO DEVE</b> ultrapassar 1.5 a 2 metros.</li>
                        <li>Terminais tubulares (olhais) bem crimpados com alicate apropriado (hidráulico) são obrigatórios.</li>
                    </ul>
                ` 
            };
        } else {
            const current = powerSource / voltageSource;
            return { 
                title: `Cálculo de Engenharia: Cabo da Casa (AC)`, 
                content: `
                    <h4 class="text-emerald-400 font-bold mb-2">Porque o cabo precisa de ser assim?</h4>
                    <p class="mb-4 text-sm text-gray-300">Para o seu sistema entregar a potência de pico de <strong>${powerSource}W</strong> trabalhando a <strong>${voltageSource}V</strong>, os fios sofrem uma "pressão" (corrente) de impressionantes <strong>${current.toFixed(1)} Ampéres</strong> (Corrente Alternada).</p>
                    
                    <h4 class="text-emerald-400 font-bold mb-2">Recomendação do Canal:</h4>
                    <ul class="list-disc pl-5 text-sm space-y-2 mb-4 text-gray-400">
                        <li>Utilize cabos 100% Cobre, ultra flexíveis.</li>
                        <li>Se o quadro da casa estiver longe, use o dobro da bitola sugerida para evitar quedas de tensão.</li>
                    </ul>
                ` 
            };
        }
    }
};

// --- 5. FUNÇÃO PRINCIPAL (HANDLER) ---
exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    try {
        const inputConfig = JSON.parse(event.body);
        const equipamentos = inputConfig.equipamentos || [];
        const desiredVoltage = inputConfig.tensaoSaidaAC || 220;
        const userForcedInverter = inputConfig.forceInverter; 

        // --- A. LÓGICA DE CONSUMO E CÁLCULO DE PICO (SURGE) ---
        let totalWh = 0;
        let peakWatts = 0;

        equipamentos.forEach(eq => {
            totalWh += eq.pot * eq.hrs * eq.qtde;
            let isInductive = false;
            const n = eq.nome.toLowerCase();
            if (n.includes('geladeira') || n.includes('ar cond') || n.includes('bomba') || n.includes('motor') || n.includes('máquina') || n.includes('freezer')) {
                isInductive = true;
            }
            const surgeFactor = isInductive ? 3 : 1;
            peakWatts += (eq.pot * surgeFactor * eq.qtde);
        });

        // --- B. LÓGICA DE SELEÇÃO DE INVERSOR ---
        let selectedInverterKey = '';
        let suggestionMsg = null;

        if (userForcedInverter && userForcedInverter !== 'auto' && PROJECTS_DB[userForcedInverter]) {
            selectedInverterKey = userForcedInverter;
            suggestionMsg = "Inversor travado manualmente através dos Ajustes Avançados.";
        } else {
            if (peakWatts > 6200) {
                selectedInverterKey = 'p48v_plus'; 
                suggestionMsg = "Alta demanda indutiva identificada. Migração automática para o sistema Paralelo de 11kW.";
            } 
            else if (peakWatts > 3500 || totalWh > 6000) {
                selectedInverterKey = 'p48v';
            } 
            else if (desiredVoltage === 127) {
                selectedInverterKey = 'p24v_110';
            } 
            else if (peakWatts <= 1000 && totalWh <= 2000) {
                selectedInverterKey = 'p12v';
            } 
            else {
                selectedInverterKey = 'p24v_220';
            }
        }

        const inversorFinal = { ...PROJECTS_DB[selectedInverterKey] };

        // --- C. SELEÇÃO DE PAINEL ---
        let painelKey = (inversorFinal.voltageDC === 12) ? 'p160' : 'p560'; 
        
        if (inputConfig.panel && inputConfig.panel.id && PAINELS_DB[inputConfig.panel.id]) {
            painelKey = inputConfig.panel.id;
        }
        const painelFinal = { id: painelKey, ...PAINELS_DB[painelKey] };

        // --- D. DIMENSIONAMENTO FÍSICO ---
        const hsp = inputConfig.hsp || 4.9;
        const autonomia = inputConfig.diasAutonomia || 1;
        
        const dod = (inputConfig.batteryType === 'chumbo') ? 0.3 : 0.85;
        const bankWh = totalWh * autonomia;
        const bankAhRequired = bankWh / inversorFinal.voltageDC / dod;
        
        const calculatedBatteries = Math.max(1, Math.ceil(bankAhRequired / inversorFinal.batteryAh));

        const generationTarget = totalWh / 0.75;
        const wpTarget = generationTarget / hsp;
        const calculatedPanels = Math.max(1, Math.ceil(wpTarget / painelFinal.potencia));

        // --- E. CÁLCULO DE CABOS ---
        const bitolaCaboBateria70 = calculationHelpers.bitola(inversorFinal.maxPower * 0.7, inversorFinal.voltageDC, 0, false);
        const bitolaCaboBateria = `${bitolaCaboBateria70} (Cotidiano)`; 
        const bitolaCaboSolar = '6mm²'; 
        const bitolaCaboAC = calculationHelpers.bitola(inversorFinal.maxPower, inversorFinal.voltageAC, 0, false);
        const currentDC = inversorFinal.maxPower / inversorFinal.voltageDC;
        const breakerDC = Math.ceil(currentDC * 1.25);

        // --- F. MONTAGEM DA RESPOSTA ---
        const resultado = {
            calculatedPanels,
            calculatedBatteries,
            consumoTotalWh: totalWh,
            peakWatts,
            arranjoConfig: `${calculatedPanels}x Painéis (Arranjo depende do limite de tensão Voc do Inversor)`,
            bitolaCaboSolar,
            bitolaCaboBateria,
            bitolaCaboAC,
            avisoTransformador: (inversorFinal.voltageAC !== desiredVoltage) ? `<strong>Atenção:</strong> O inversor tem saída em ${inversorFinal.voltageAC}V mas a sua rede é ${desiredVoltage}V. É obrigatório autotransformador.` : null,
            inverter: inversorFinal,
            panel: painelFinal,
            protection: { breakerDC },
            suggestionMsg,
            modalContent: {
                inversor: MODAL_CONTENT_DB['inversor_' + selectedInverterKey] || MODAL_CONTENT_DB['inversor'],
                paineis: MODAL_CONTENT_DB.paineis,
                // AQUI OCORRE A MÁGICA DE SELECIONAR A BATERIA CORRETA (12V, 24V ou 48V)
                baterias: MODAL_CONTENT_DB['baterias_' + inversorFinal.voltageDC] || MODAL_CONTENT_DB.baterias_48,
                protecoes: MODAL_CONTENT_DB.protecoes,
                tabela_nbr: MODAL_CONTENT_DB.tabela_nbr,
                cabeamento_bateria: calculationHelpers.gerarConteudoModalCabo(inversorFinal, true),
                cabeamento_ac: calculationHelpers.gerarConteudoModalCabo(inversorFinal, false)
            }
        };

        // --- G. DADOS FINANCEIROS (ROI) ---
        const vDC = inversorFinal.voltageDC;
        let custoBat = vDC === 48 ? 5500 : (vDC === 24 ? 2800 : 1600);
        let custoInv = selectedInverterKey === 'p48v_plus' ? 4000 : (vDC === 48 ? 2200 : (vDC === 24 ? 1600 : 1200));

        const roiUpdates = {
             quantidadePaineis: calculatedPanels,
             quantidadeBaterias: calculatedBatteries,
             custoBateriaUnitario: custoBat,
             custoInversor: custoInv
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ resultado, roiUpdates })
        };

    } catch (error) {
        console.error("Erro no backend:", error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Erro interno no cálculo.', error: error.message }) };
    }
};