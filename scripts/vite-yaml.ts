// Plugin Vite : importe un fichier .yaml comme un module JSON.
import type { Plugin } from 'vite';
import { parse } from 'yaml';

export function yamlPlugin(): Plugin {
  return {
    name: 'arche-yaml',
    transform(code, id) {
      if (!id.endsWith('.yaml')) return null;
      return { code: `export default ${JSON.stringify(parse(code))};`, map: null };
    }
  };
}
