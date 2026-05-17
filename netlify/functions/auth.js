// netlify/functions/auth.js (v1.1 com logs de depuração)

exports.handler = async function(event, context) {
    // 1. Validação básica: permite apenas o método POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { password } = JSON.parse(event.body);
        const SECRET_KEY = process.env.ACCESS_PASSWORD;

        // --- INÍCIO DO LOG DE DEPURAÇÃO ---
        console.log("Tentativa de autenticação recebida.");
        console.log("Senha recebida do formulário:", `"${password}"`);
        console.log("Senha secreta esperada (do Netlify):", `"${SECRET_KEY ? SECRET_KEY.substring(0, 3) + '...' : 'NÃO DEFINIDA'}"`);
        // --- FIM DO LOG DE DEPURAÇÃO ---

        if (!SECRET_KEY) {
            console.error("ERRO CRÍTICO: A variável de ambiente ACCESS_PASSWORD não está configurada na Netlify!");
            return { statusCode: 500, body: JSON.stringify({ message: 'Erro de configuração do servidor.' }) };
        }

        if (password && password === SECRET_KEY) {
            console.log("Resultado: SUCESSO. Senha corresponde.");
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Authentication successful', token: 'pro-access-granted' }),
            };
        } else {
            console.warn("Resultado: FALHA. Senha não corresponde.");
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Authentication failed' }),
            };
        }
    } catch (error) {
        console.error('Erro inesperado na função:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    }
};

