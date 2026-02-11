import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('quarteiroes').del();
  await knex('users').del();

  // Inserts seed entries
  const userId = await knex('users').insert({
    cpf: '12345678900',
    password: '$2a$10$...', // In real app, use hashed password
    created_at: new Date(),
  });

  await knex('quarteiroes').insert([
    {
      user_id: userId[0],
      numero: 1,
      nome: 'Quarteirão Sul A',
      localidade: 'Fazenda Sul',
      zona: 'Zona Sul',
      area: 10.5,
      status: 'Ativo',
      descricao: 'Primeira área de produção',
      data_cadastro: new Date(),
    },
  ]);
}
