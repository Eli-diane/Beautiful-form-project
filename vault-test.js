//Este arquivo mostra como o programa conversa com o Vault para pegar a "chave secreta".
//Age como um cofre digital muito seguro onde guarda senhas e chaves de API.

//Importa a ferramenta para fazer requisições HTTP - Permite enviar e receber informalções pela internet
//Age como a troca navegador x site, porém para programa.
const fetch = require("node-fetch");

//Cria uma função para buscar a chave secreta do Vault
async function getVaultSecret() {

  //Monta o "endereço" completo de onde a chave está no Vault.
  //(http://127.0...) é o endereço do Vault rodando no computador.
  //O restante do link mostra o "caminho" dentro do cofre para a chave.    
  const response = await fetch('http://127.0.0.1:8200/v1/secret/data/thedogapi', {
    headers: {

       //(X-Vault-Token) é como uma "chave de acesso" enviada ao Vault.
       //(process.env.VAULT_TOKEN) pega o token.
      'X-Vault-Token': process.env.VAULT_TOKEN
    }
  });

//Muda a resposta do Vault para uma forma que o programa entenda.
  const data = await response.json();

//Mostra a chave da API publica (TheDogApi) que foi lida do Vault.
//Ela fica dentro de (data.data.data.key) na resposta do Vault.
  console.log("Chave do TheDogAPI:", data.data.data.key);
}

// Inicia a função para começar a buscar a chave do Vault.
getVaultSecret();