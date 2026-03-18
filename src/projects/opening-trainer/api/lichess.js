import axios from 'axios';
import { movesToUci } from '../utils/chess';

const LICHESS_API = 'https://explorer.lichess.ovh/masters';

export async function getOpeningData(moves = []) {
  try {
    const uciMoves = movesToUci(moves);
    const response = await axios.get(LICHESS_API, {
      params: {
        play: uciMoves.join(','),
        speeds: ['rapid', 'classical'].join(','),
        ratings: [2200, 2500].join(',')
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching opening data:', error);
    return null;
  }
}

export async function getOpeningMoves(fen) {
  try {
    const response = await axios.get(LICHESS_API, {
      params: {
        fen,
        speeds: ['rapid', 'classical'].join(','),
        ratings: [2200, 2500].join(',')
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching moves:', error);
    return null;
  }
} 