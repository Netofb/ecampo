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

    const features: any[] = [];

    quarteiroes.forEach(q => {
      // Adiciona polígono se existir
      if (q.poligono_geojson) {
        try {
          const geojson = typeof q.poligono_geojson === 'string' 
            ? JSON.parse(q.poligono_geojson) 
            : q.poligono_geojson;
          
          features.push({
            type: 'Feature',
            id: `polygon-${q.id_quadra}`,
            geometry: geojson.type ? geojson : geojson.geometry,
            properties: {
              id: q.id_quadra,
              nome: q.nome_quadra,
              numero: q.numero_quadra,
              color: q.cor_poligono || '#3388ff',
              type: 'polygon'
            }
          });
        } catch (e) {
          console.error('Error parsing polygon:', e);
        }
      }

      // Adiciona ponto central se existir
      if (q.latitude_quadra && q.longitude_quadra) {
        features.push({
          type: 'Feature',
          id: `point-${q.id_quadra}`,
          geometry: {
            type: 'Point',
            coordinates: [parseFloat(q.longitude_quadra), parseFloat(q.latitude_quadra)]
          },
          properties: {
            id: q.id_quadra,
            nome: q.nome_quadra,
            numero: q.numero_quadra,
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
        'tb_faces.linha_geojson',
        'tb_faces.cor_linha',
        'tb_quarteiroes.nome_quadra',
        'tb_quarteiroes.numero_quadra'
      );

    const features: any[] = [];

    faces.forEach(f => {
      // Adiciona linha se existir
      if (f.linha_geojson) {
        try {
          let geojson = f.linha_geojson;
          if (typeof geojson === 'string') {
            geojson = JSON.parse(geojson);
          }
          
          features.push({
            type: 'Feature',
            id: `line-${f.id_face}`,
            geometry: geojson.type ? geojson : (geojson.geometry || geojson),
            properties: {
              id: f.id_face,
              numero: f.numero_face,
              quarteirao: f.nome_quadra || 'Sem quarteirão',
              numeroQuarteirao: f.numero_quadra,
              color: f.cor_linha || '#FF9800',
              type: 'line'
            }
          });
        } catch (e) {
          console.error(`Error parsing line for face ${f.id_face}:`, e);
        }
      }

      // Adiciona ponto se existir
      if (f.latitude && f.longitude) {
        features.push({
          type: 'Feature',
          id: `point-${f.id_face}`,
          geometry: {
            type: 'Point',
            coordinates: [parseFloat(f.longitude), parseFloat(f.latitude)]
          },
          properties: {
            id: f.id_face,
            numero: f.numero_face,
            quarteirao: f.nome_quadra || 'Sem quarteirão',
            numeroQuarteirao: f.numero_quadra,
            color: f.cor_linha || '#FF9800',
            type: 'point'
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
