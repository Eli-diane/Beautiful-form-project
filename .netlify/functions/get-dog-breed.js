const fetch = require('node-fetch'); // Importa a função fetch para fazer requisição HTTP

exports.handler = async function(event, context) {
    // Analisa se a requisição é um POST e se tem um corpo (body)
    if (event.httpMethod !== 'POST' || !event.body) {
        return {
            statusCode: 405, // Método não permitido - Famoso ERRO 405 
            body: JSON.stringify({ message: 'Método não permitido ou corpo da requisição ausente.' })
        };
    }

    try {
        // Analisa o corpo da requisição JSON para obter a raça
        const { breed } = JSON.parse(event.body);

        if (!breed) {
            return {
                statusCode: 400, // Requisição inválida
                body: JSON.stringify({ message: 'Parâmetro "breed" ausente.' })
            };
        }

        // A CHAVE DA API SERÁ OBTIDA AQUI DE FORMA SEGURA!
        // process.env.THEDOGAPI_KEY acessa a variável de ambiente configurada no Netlify
        const apiKey = process.env.THEDOGAPI_KEY;

        if (!apiKey) {
            console.error("API Key do TheDogAPI não configurada nas variáveis de ambiente do Netlify.");
            return {
                statusCode: 500, // Erro interno do servidor
                body: JSON.stringify({ message: 'Erro de configuração da API: chave não encontrada.' })
            };
        }

        // Faz a primeira requisição para a TheDogAPI para buscar a raça
        const response = await fetch(`https://api.thedogapi.com/v1/breeds/search?q=${encodeURIComponent(breed)}`, {
            headers: {
                'x-api-key': apiKey // Envia a API Key no cabeçalho da requisição
            }
        });

        if (!response.ok) {
            // Loga o erro da API para depuração no Netlify Functions logs
            const errorText = await response.text();
            console.error(`Erro da TheDogAPI ao buscar raça: ${response.status} - ${errorText}`);
            
            if (response.status === 401 || response.status === 403) {
                // Não expõe diretamente o erro de autenticação da API externa ao cliente.
                return {
                    statusCode: 500, 
                    body: JSON.stringify({ message: 'Erro de autenticação com a API externa. Por favor, contate o suporte.' }),
                };
            }
            if (response.status === 404) { // Se a API retorna 404 para a busca da raça
                return {
                    statusCode: 404, // Raça não encontrada
                    body: JSON.stringify({ message: 'Nenhuma raça correspondente encontrada.' })
                };
            }
            // Para outros erros da API, retorne um erro genérico
            throw new Error(`Erro ao buscar dados na TheDogAPI: Status ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();

        if (data.length > 0) {
            const firstBreed = data[0]; // Pega o primeiro resultado

            let imageUrl = '';
            // Se a raça tem um ID de imagem de referência, faz outra requisição para obter a URL da imagem
            if (firstBreed.reference_image_id) {
                const imageResponse = await fetch(`https://api.thedogapi.com/v1/images/${firstBreed.reference_image_id}`, {
                    headers: {
                        'x-api-key': apiKey,
                    },
                });

                if (imageResponse.ok) {
                    const imageData = await imageResponse.json();
                    imageUrl = imageData.url; // Pega a URL da imagem
                } else {
                    console.warn(`Não foi possível obter a imagem para o ID: ${firstBreed.reference_image_id}, Status: ${imageResponse.status}`);
                    // Continua mesmo sem a imagem se a busca da imagem falhar
                }
            }

            return {
                statusCode: 200,
                body: JSON.stringify({
                    breedName: firstBreed.name,
                    temperament: firstBreed.temperament || 'Não informado', 
                    origin: firstBreed.origin || 'Não informado', 
                    imageUrl: imageUrl
                })
            };
        } else {
            // Nenhuma raça encontrada após a busca
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'Nenhuma raça correspondente encontrada.' })
            };
        }
    } catch (error) {
        console.error('Erro geral na função Netlify:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Erro interno do servidor ao processar a requisição.', error: error.message })
        };
    }
};
