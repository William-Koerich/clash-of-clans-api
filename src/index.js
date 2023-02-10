import request from 'request-promise';
import config from '../config';
import { merge } from 'lodash';

const env = process.env;

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.substr(1);
}

/**
 * ClashApi - Fornece uma maneira fácil de começar a usar a API do Clash of Clans.
 *
 * Todas as buscas retornam uma promessa
 *
 * @example
 * let client = clashApi({
 *    token: seu api token // Opicional, caso esteja usando a variavel de ambiente COC_API_TOKEN
 * });
 */
class ClashApi {


  constructor({uri, token, request} = {}) {
    /**
     * Token pessoal da API do Clash of Clans.
     */
    this.token = token || env.COC_API_TOKEN;
    this.uri = uri || config.uri;
    this._requestDefaults = request || {};
    if (!this.token) {
      throw new Error('Deve definir uma opção de token ou variável de ambiente COC_API_TOKEN');
    }
  }

  requestOptions(opts) {
    return merge({
      headers: {
        Accept: 'application/json',
        authorization: `Bearer ${this.token}`
      },
      json: true
    }, opts, this._requestDefaults);
  }

  /**
   * Obtenha informações sobre um único clã por tag de clã. As tags do clã podem ser encontradas usando a operação de pesquisa do clã.
   *
   * @example
   * client
   *    .clanByTag('#UPC2UQ')
   *    .then(response => console.log(response))
   *    .catch(err => console.log(err));
   *
   * @param {string} tag - Tag do clã para pesquisa.
   */
  clanByTag(tag) {
    return request(this.requestOptions({
      uri: `${this.uri}/clans/${encodeURIComponent(tag)}`,
    }))
  }

  /**
   * Listar membros do clã.
   *
   * @example
   * client
   *    .clanMembersByTag('#UPC2UQ')
   *    .then(response => console.log(response))
   *    .catch(err => console.log(err));
   *
   * @param {string} tag - Tag do clã cujos para pesquisa.
   */
  clanMembersByTag(tag) {
    return request(this.requestOptions({
      uri: `${this.uri}/clans/${encodeURIComponent(tag)}/members`,
    }))
  }

  /**
   * Recupere o registro de guerra do clã do clã.
   *
   * @example
   * client
   *    .clanWarlogByTag('#UPC2UQ')
   *    .then(response => console.log(response))
   *    .catch(err => console.log(err));
   *
   * @param {string} tag - Marca do clã cujo registro de guerra deve ser recuperado.
   */
  clanWarlogByTag(tag) {
    return request(this.requestOptions({
      uri: `${this.uri}/clans/${encodeURIComponent(tag)}/warlog`,
    }))
  }

  /**
   * Recupere informações sobre a atual guerra de clãs do clã.
   *
   * @example
   * client
   *    .clanCurrentWarByTag(`#UPC2UQ`)
   *    .then(response => console.log(response))
   *    .catch(err => console.log(err));
   *
   * @param {string} tag - Marca do clã cujas informações atuais da guerra do clã devem ser recuperadas.
   */
  clanCurrentWarByTag(tag) {
    return request(this.requestOptions({
      uri: `${this.uri}/clans/${encodeURIComponent(tag)}/currentwar`,
    }))
  }

  /**
   * Recupere informações sobre o atual grupo da liga de guerra do clã.
   *
   * @param {string} tag - Marca do clã cujo grupo atual da liga de guerra do clã deve ser recuperado.
   */
  clanLeague(tag) {
    return request(this.requestOptions({
      uri: `${this.uri}/clans/${encodeURIComponent(tag)}/currentwar/leaguegroup`,
    }))
  }

  clanLeagueWars(tag) {
        return request(this.requestOptions({
            uri: `${this.uri}/clanwarleagues/wars/${encodeURIComponent(tag)}`,
        }))
  }
  
  /**
   * Pesquise todos os clãs por nome e/ou filtre os resultados usando vários critérios.
   * Pelo menos um critério de filtragem deve ser definido e se o nome for usado como parte da pesquisa,
   * é necessário ter pelo menos três caracteres.
   *
   * Não é possível especificar a ordem dos resultados, portanto, os clientes não devem confiar em nenhum
   * ordenação específica, pois isso pode mudar nas versões futuras da API.
   *
   * @example
   * client
   *    .clans()
   *    .withWarFrequency('always')
   *    .withMinMembers(25)
   *    .fetch()
   *    .then(response => console.log(response))
   *    .catch(err => console.log(err))
   *
   * @see https://developer.clashofclans.com/api-docs/index.html#!/clans/searchClans
   */
  clans() {
    var qs = {};

    const dsl = [
      'name',
      'warFrequency',
      'locationId',
      'minMembers',
      'maxMembers',
      'minClanPoints',
      'minClanLevel',
      'limit',
      'after',
      'before'
    ].reduce((builder, field) => {
      builder[`with${capitalizeFirstLetter(field) }`] = (input) => {
        qs[field] = input;
        return builder;
      };
      return builder;
    }, {
      fetch: function () {
        return request(this.requestOptions({
          qs: qs,
          uri: `${this.uri}/clans`,
        }));
      }.bind(this)
    });

    return dsl;
  }

  /**
   * Listar todos os locais disponíveis.
   *
   * @example
   * client
   *    .locations()
   *    .withId(locationId)
   *    .byPlayer()
   *    .fetch()
   *    .then(response => console.log(response))
   *    .catch(err => console.log(err));
   */
  locations() {
    const dsl = {
      fetch: function () {
        return request(this.requestOptions({
          uri: `${this.uri}/locations`,
        }));
      }.bind(this),
      withId: function (locId) {
        let rankId;

        const rankingDslMembers = {
          byClan: function () {
            rankId = 'clans';
            return rankingDsl;
          },
          byPlayer: function () {
            rankId = 'players';
            return rankingDsl;
          }
        };

        const rankingDsl = assign({
          fetch: function () {
            return request(this.requestOptions({
              uri: `${this.uri}/locations/${encodeURIComponent(locId)}/rankings/${rankId}`,
            }));
          }.bind(this)
        }, rankingDslMembers);

        const locDsl = assign({
          fetch: function () {
            return request(this.requestOptions({
              uri: `${this.uri}/locations/${encodeURIComponent(locId)}`,
            }));
          }
        }, rankingDslMembers);

        return locDsl;
      }.bind(this)
    }
    return dsl;
  }

  /**
   * Obter lista de ligas.
   */
  leagues() {
    return request(this.requestOptions({
      uri: `${this.uri}/leagues`,
    }));
  }

  /**
   * Obtenha informações sobre um único jogador por tag de jogador. As tags de jogador podem ser encontradas no jogo ou nas listas de membros do clã.   */
  playerByTag(tag) {
    return request(this.requestOptions({
      uri: `${this.uri}/players/${encodeURIComponent(tag)}`,
    }))
  }
}

class factory {
  constructor(config) {
    return new ClashApi(config);
  }
}

factory.ClashApi = ClashApi;

module.exports = factory;
