exports.up = function(knex) {
  return knex.schema.alterTable('tb_quarteiroes', table => {
    table.integer('version').notNullable().defaultTo(0);
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('tb_quarteiroes', table => {
    table.dropColumn('version');
    table.dropColumn('updated_at');
  });
};
