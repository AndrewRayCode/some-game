import knex from 'knex';

const env = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
const configFile = `db.${ env }.js`;

export default knex({
    client: 'postgres',
    debug: true,
    connection: require( `../config/${ configFile }` )
});
