import { Request, Response } from 'express';
import db from '../database';

export const getQuarteiroesMap = async (req: any, res: Response) => {
  try {
    const userId = req.userId;

    const quarteiroes = await db('tb_quarteiroes')
      .where('id_usuario', userId)
      .select(
        'id_quadra',
        'nome_quadra',
        'numero_quadra',
        'latitude_quadra',
        'longitude_quadra',
        'cor_poligono',
        'poligono_geojson'
      );

    const features = quarteiroes
      .filter(q => q.latitude_quadra && q.longitude_quadra)
      .map(q => ({
        type: 'Feature',
        id: q.id_quadra,
        geometry: {
          type: 'Point',
          coordinates: [parseFloat(q.longitude_quadra), parseFloat(q.latitude_quadra)]
        },
        properties: {
          id: q.id_quadra,
          nome: q.nome_quadra,
          numero: q.numero_quadra,
          color: q.cor_poligono || '#3388ff'
        }
      }));

    res.json({
      type: 'FeatureCollection',
      features
    });
  } catch (error) {
    console.error('Error fetching quarteiroes map:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
