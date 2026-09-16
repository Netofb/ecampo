# Roadmap de Funcionalidades e Evoluções

## Funcionalidades prioritárias

1. **Mapa offline e trabalho de campo**
   - Baixar áreas para uso offline.
   - Desenhar e editar polígonos sem conexão.
   - Registrar GPS e pontos de referência.
   - Sincronizar alterações quando a conexão retornar.

2. **Produção vinculada ao quarteirão**
   - Registrar cultura, safra, área plantada, insumos, mão de obra, colheita e resultado financeiro por quarteirão.

3. **Fotos e evidências georreferenciadas**
   - Vincular fotos a imóveis, faces ou quarteirões, com data, usuário e coordenadas.

4. **Dashboard operacional**
   - Indicadores por localidade e zona: quantidade de quarteirões, área, imóveis, produção, pendências de sincronização e atividades recentes.

5. **Filtros e camadas no mapa**
   - Exibir ou ocultar quarteirões, faces, imóveis e pontos.
   - Filtrar por status, zona, localidade, cultura e usuário.

6. **Histórico e auditoria**
   - Registrar autor, data e valores anteriores em criações, edições e exclusões.

7. **Importação e exportação profissional**
   - Exportar CSV, Excel, GeoJSON/KML e relatórios PDF.
   - Importar limites existentes em GeoJSON/KML.

8. **Perfis e permissões**
   - Criar perfis de administrador, técnico de campo e visualizador.

9. **Organização como entidade principal**
   - Modelar empresa, propriedade ou equipe.
   - Permitir dados compartilhados de forma controlada entre os membros de uma organização.

10. **Qualidade de dados no cadastro**
    - Validar polígonos inválidos e sobreposições.
    - Alertar para área fora do esperado e GPS com baixa precisão.
    - Definir campos essenciais obrigatórios.

## Evoluções técnicas necessárias

- Avaliar substituição gradual do mapa Leaflet em WebView por MapLibre nativo, visando desempenho e offline.
- Adotar PostGIS no PostgreSQL quando análises espaciais e consultas geográficas avançadas forem necessárias.
- Criar migrações versionadas para o banco de dados.
- Adicionar testes para autenticação, sincronização e isolamento de dados por usuário.
- Centralizar monitoramento de erros e métricas do aplicativo e backend.
- Estender a sincronização offline para faces, imóveis, fotos e produção, além dos quarteirões.

## Ordem recomendada

1. Mapa offline.
2. Organização e permissões.
3. Produção vinculada ao quarteirão.
4. Fotos georreferenciadas.
5. Histórico e auditoria.
6. Importação e exportação.
