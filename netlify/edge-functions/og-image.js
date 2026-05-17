export default async (request, context) => {
  const url = new URL(request.url);
  const projeto = url.searchParams.get("p");

  // Obtém a resposta original (o seu index.html)
  const response = await context.next();
  
  // Apenas intercepta se a resposta for HTML
  if (response.headers.get("content-type")?.includes("text/html")) {
    let html = await response.text();

    // Dicionário com as URLs reais das imagens de cada projeto
    const imagens = {
      "12v-basico": "https://i.imgur.com/NwJhdB4.png",
      "24v-4kw": "https://i.imgur.com/NQLAc71.png",
      "24v-127v": "https://i.imgur.com/MvPZy7W.png",
      "48v-padrao": "https://i.imgur.com/Qta9pp1.png",
      "48v-alta-performance": "https://i.imgur.com/c8Vm80l.png"
    };

    // Se o link tiver um projeto válido, troca a miniatura no HTML
    if (projeto && imagens[projeto]) {
      const novaImagem = imagens[projeto];
      
      // Substitui a miniatura padrão (og-thumb) pela do projeto específico
      html = html.replace(
        /content="https:\/\/www\.penseoffgrid\.com\.br\/og-thumb\.png"/g,
        `content="${novaImagem}"`
      );
    }
    
    return new Response(html, response);
  }
  
  return response;
};