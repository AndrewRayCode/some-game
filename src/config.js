require('babel-polyfill');

const environment = {
  development: {
    isProduction: false
  },
  production: {
    isProduction: true
  }
}[process.env.NODE_ENV || 'development'];

module.exports = Object.assign({
  host: process.env.HOST || 'localhost',
  port: process.env.PORT,
  apiHost: process.env.APIHOST || 'localhost',
  apiPort: process.env.APIPORT,
  app: {
    title: 'Charisma The Chameleon',
    description: 'A browser based game where you play Charisma The (Space) Chameleon, who shrinks forever to solve a maze.',
    head: {
      meta: [
        {name: 'description', content: 'A browser based game where you play Charisma The (Space) Chameleon, who shrinks forever to solve a maze.'},
        {charset: 'utf-8'},
        {property: 'og:site_name', content: 'Charisma The Chameleon'},
        {property: 'og:image', content: 'https://react-redux.herokuapp.com/logo.jpg'},
        {property: 'og:locale', content: 'en_US'},
        {property: 'og:title', content: 'Charisma The Chameleon'},
        {property: 'og:description', content: 'A browser based game where you play Charisma The (Space) Chameleon, who shrinks forever to solve a maze.'},
        {property: 'og:card', content: 'summary'},
        {property: 'og:site', content: '@andrewray'},
        {property: 'og:creator', content: '@andrewray'},
        {property: 'og:image:width', content: '200'},
        {property: 'og:image:height', content: '200'}
      ]
    }
  },

}, environment);
