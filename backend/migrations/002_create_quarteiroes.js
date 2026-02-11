exports.up = function(knex) {
  return knex.schema.createTable('quarteiroes', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('usuarios').onDelete('CASCADE');
    table.integer('numero').notNullable();
    table.string('nome').notNullable();
    table.string('localidade');
    table.string('zona');
    table.decimal('area', 10, 2);
    table.string('status').defaultTo('Ativo');
    table.text('descricao');
    table.timestamp('data_cadastro').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.unique(['user_id', 'numero']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('quarteiroes');
};
