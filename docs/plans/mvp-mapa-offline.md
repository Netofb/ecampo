# MVP — Mapa Offline de Campo

## Objetivo

Permitir que o usuário baixe antecipadamente a área de trabalho e, no campo e sem conexão, visualize o mapa, use o GPS e desenhe ou edite quarteirões. As alterações devem ser sincronizadas com a API quando a conexão retornar.

## Escopo da primeira versão

- Selecionar localidade ou zona e baixar uma área limitada do mapa, com níveis de zoom definidos.
- Guardar localmente os tiles do mapa e os dados do usuário necessários para a área escolhida.
- Desenhar, editar e excluir polígonos de quarteirões offline.
- Calcular área e centroide no aparelho.
- Criar pontos de referência por GPS ou toque no mapa.
- Registrar alterações no banco SQLite e na fila de sincronização existente.
- Mostrar alterações pendentes, última sincronização e conflitos.
- Sincronizar manualmente ou ao reconectar, conforme preferência do usuário.

## Integração atual

- A API de produção é hospedada no Render e é usada como URL padrão pelo app.
- A ausência de rede não pode impedir o cadastro: o aplicativo deve gravar localmente e aguardar a reconexão com a API do Render.
- A sincronização atual de quarteirões, com outbox e controle de versão, deve ser a base da funcionalidade.

## Decisões técnicas a validar

- Definir um provedor ou formato de tiles que permita cache offline. Não usar download em volume do serviço público do OpenStreetMap sem autorização compatível.
- Lianmitar área e zoom para controlar consumo de armazenamento.
- Persistir geometrias completas em GeoJSON, além de área e centroide.
- Na primeira versão, interromper e apresentar conflitos para decisão do usuário entre dados locais e do servidor.
- Avaliar limpeza dos mapas e dados baixados no logout conforme a necessidade de segurança operacional.

## Ordem recomendada

1. Download, armazenamento e exibição offline de uma área pequena.
2. Desenho e edição de quarteirões offline usando a fila atual.
3. Sincronização e interface de pendências/conflitos.
4. Pontos de referência, fotos e camadas adicionais.
