//Importando pacotes que serão utilizados
const Twitter = require('twitter')
require('dotenv').config()
const request = require('request')

//Variável criada para guardar o último valor da cotação e utilizá-lo como referência para comparar e não ser realizado um novo post no Twitter, já que a plataforma não permite mais de um tweet com a mesma frase.
let auxiliar = 0.00
let apiKeyHG = process.env.API_KEY_HG

setInterval(() => {

  request(`https://api.hgbrasil.com/finance?key=${apiKeyHG}`, function Posts(error, res, body) {
    if (error) throw error;

    //Resultado da API guardada em uma variável e convertida para o formato JSON
    let api = JSON.parse(body);
    
    //Query criada para obter somente o dado necessário (o valor do Dolar) e guardada em uma variável
    let queryMensagem = api.results.currencies.USD.sell

    //Determinado para a variável apresentar até 2 casas após a vírgula.
    let mensagemTweet = queryMensagem.toFixed(2);

    //Instânciando a classe Twitter para o objeto BOT, adicionando minhas chaves e TOKEN como parâmetro (guardadas no arquivo .env)
    let Bot = new Twitter({
      consumer_key: process.env.API_KEY,
      consumer_secret: process.env.API_KEY_SECRET,
      access_token_key: process.env.ACCESS_TOKEN,
      access_token_secret: process.env.ACCESS_TOKEN_SECRET
    });

      //Criando a função para retornar uma busca por tweet igual ao que será postado (indicado na query q).
    Bot.get('search/tweets', { q: `O dolar está atualmente no valor de: R$${mensagemTweet}` }, function (error, tweet, res) {

      //Caso essa busca retorne um erro, significa que não há posts com a mesma frase que o programa irá postar, sendo assim, possível de posta-lá.
        if (error) {
          //Criando a função para realizar o post no Twitter com frase.
          Bot.post('statuses/update', { status: `O dolar está atualmente no valor de: R$${mensagemTweet}` }, function (error, tweet, res) {
            if (error) throw error;
            console.log(tweet);
          });
          auxiliar = 0.00;
        }
      });
      //Condição criada para postar somente os valores que forem diferentes, para não ter o erro na rede social
      if (auxiliar != mensagemTweet) {
        Bot.post('statuses/update', { status: `O dolar está atualmente no valor de: R$${mensagemTweet}` }, function (error, tweet, res) {
          //Caso a ação de postar algo retorne um erro, significa que há posts com a mesma frase que o programa irá postar, sendo assim, não será possível de posta-lá.
          console.log(tweet);
          if (error) {
            //Por isso, será feita uma outra busca para obter o ID deste post para posteriormente deletar o tweet e poder repostar sem problemas.
            Bot.get('search/tweets', { q: `O dolar está atualmente no valor de: R$${mensagemTweet}` }, function (error, tweet, res) {
              let queryBusca = tweet.statuses[0].id_str
              //Função que irá excluir o post da plataforma.
              Bot.post('statuses/destroy/' + queryBusca, function (error, tweet, res) {
                if (error) throw error;
                console.log(tweet);
              });
              auxiliar = 0.00;
            });
          }
  
          //A variável "auxiliar" receberá o valor antigo da cotação para que, ao ser atualizado um novo valor da cotação, ao voltar ao início do programa, realize uma comparação para verificar se o valor atualizado é o mesmo ou se é um novo valor.
          auxiliar = mensagemTweet;
        });
      }
  })
}, 6000);
