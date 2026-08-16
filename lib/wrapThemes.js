/**
 * Paper themes for the bouquet wrap (ported from the reference design):
 * each theme swaps the paper colors + optional surface texture.
 */
export const WRAP_THEMES = {
  kraft: {
    id: 'kraft',
    label: 'Kraft',
    base: '#c9a97c',
    shadow: '#7a5a38',
    highlight: '#fbeecb',
    twine: '#6b4a2f',
    texture: 'none',
  },
  newsprint: {
    id: 'newsprint',
    label: 'Newsprint',
    base: '#efe6d1',
    shadow: '#b9ab8c',
    highlight: '#fdf9ee',
    twine: '#5b4632',
    texture: 'newsprint',
  },
  blush: {
    id: 'blush',
    label: 'Blush',
    base: '#f3d7dc',
    shadow: '#d9a8b2',
    highlight: '#fff3f5',
    twine: '#a8636f',
    texture: 'none',
  },
  sage: {
    id: 'sage',
    label: 'Sage',
    base: '#aab99d',
    shadow: '#75886a',
    highlight: '#dbe3d0',
    twine: '#4c5a3f',
    texture: 'pleats',
  },
};
