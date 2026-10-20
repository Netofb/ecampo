import { Request, Response } from 'express';
import db from '../database';

function parseGeometry(value: unknown): any | null {
  if (!value) return null;

  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    const geometry = (parsed as any)?.type === 'Feature' ? (parsed as any).geometry : parsed;
    if (!geometry || typeof geometry.type !== 'string' || !Array.isArray(geometry.coordinates)) {
      return null;
    }
    return geometry;
  } catch {
    return null;
  }
}

function finiteCoordinate(value: unknown): number | null {
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
}

export const getQuarteiroesMap = async (req: any, res: Response) => {
  try {
    const userId = req.userId;

    const quarteiroes = await db('tb_quarteiroes as q')
      .leftJoin('tb_zonas as z', 'q.id_zona', 'z.id_zona')
      .leftJoin('tb_localidades as l', 'q.id_localidade', 'l.id_localidade')
      .where('q.id_usuario', userId)
      .select(
        'q.id_quadra',
        'q.nome_quadra',
        'q.numero_quadra',
        'q.latitude_quadra',
        'q.longitude_quadra',
        'q.cor_poligono',
        'q.poligono_geojson',
        'z.nome_zona',
        'l.nome_localidade'
      );

    const features: any[] = [];

    quarteiroes.forEach(q => {
      const geometry = parseGeometry(q.poligono_geojson);
      if (geometry) {
        try {
          features.push({
            type: 'Feature',
            id: `polygon-${q.id_quadra}`,
            geometry,
            properties: {
              id: q.id_quadra,
              nome: q.nome_quadra,
              numero: q.numero_quadra,
              zona: q.nome_zona || 'Sem zona',
              localidade: q.nome_localidade || 'Sem localidade',
              color: q.cor_poligono || '#3388ff',
              type: 'polygon'
            }
          });
        } catch (error) {
          console.error(`Error building polygon for quarteirão ${q.id_quadra}:`, error);
        }
      }

      // Adiciona ponto central se existir
      const latitude = finiteCoordinate(q.latitude_quadra);
      const longitude = finiteCoordinate(q.longitude_quadra);
      if (latitude !== null && longitude !== null) {
        features.push({
          type: 'Feature',
          id: `point-${q.id_quadra}`,
          geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          properties: {
            id: q.id_quadra,
            nome: q.nome_quadra,
            numero: q.numero_quadra,
            zona: q.nome_zona || 'Sem zona',
            localidade: q.nome_localidade || 'Sem localidade',
            color: q.cor_poligono || '#3388ff',
            type: 'point'
          }
        });
      }
    });

    res.json({
      type: 'FeatureCollection',
      features
    });
  } catch (error) {
    console.error('Error fetching quarteiroes map:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getFacesMap = async (req: any, res: Response) => {
  try {
    const userId = req.userId;

    const faces = await db('tb_faces')
      .leftJoin('tb_quarteiroes', 'tb_faces.id_quarteirao', 'tb_quarteiroes.id_quadra')
      .where('tb_faces.id_usuario', userId)
      .select(
        'tb_faces.id_face',
        'tb_faces.numero_face',
        'tb_faces.latitude',
        'tb_faces.longitude',
        'tb_faces.nome_linha',
        'tb_faces.linha_geojson',
        'tb_faces.cor_linha',
        'tb_quarteiroes.nome_quadra',
        'tb_quarteiroes.numero_quadra',
        'tb_quarteiroes.latitude_quadra',
        'tb_quarteiroes.longitude_quadra'
      );

    const features: any[] = [];

    faces.forEach(f => {
      const geometry = parseGeometry(f.linha_geojson);
      if (geometry) {
        try {
          features.push({
            type: 'Feature',
            id: `line-${f.id_face}`,
            geometry,
            properties: {
              id: f.id_face,
              numero: f.numero_face,
              quarteirao: f.nome_quadra || 'Sem quarteirão',
              numeroQuarteirao: f.numero_quadra,
              title: `Face #${f.numero_face}`,
              subtitle: f.nome_quadra || 'Sem quarteirão',
              color: f.cor_linha || '#FF9800',
              type: 'line',
            },
          });
        } catch (error) {
          console.error(`Error building line for face ${f.id_face}:`, error);
        }
      }

      const latitude = finiteCoordinate(f.latitude);
      const longitude = finiteCoordinate(f.longitude);
      if (latitude !== null && longitude !== null) {
        features.push({
          type: 'Feature',
          id: `point-${f.id_face}`,
          geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          properties: {
            id: f.id_face,
            numero: f.numero_face,
            quarteirao: f.nome_quadra || 'Sem quarteirão',
            numeroQuarteirao: f.numero_quadra,
            nomeLinha: f.nome_linha || '',
            title: `Face #${f.numero_face}`,
            subtitle: f.nome_quadra || 'Sem quarteirão',
            color: '#FF9800',
            type: 'point',
          }
        });
      }
    });

    res.json({
      type: 'FeatureCollection',
      features
    });
  } catch (error: any) {
    console.error('Error fetching faces map:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};
