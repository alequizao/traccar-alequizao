/*
 * Traccar Alequizão · Desenvolvido por Alequizao <alequizao.dev@gmail.com>
 * https://github.com/alequizao · © 2026 Alequizao. Todos os direitos reservados.
 */

const defaults = {
  SUPPORT_URL: 'https://wa.me/558288717072',
};

const parseEnv = (text) => {
  const result = {};
  if (text) {
    text.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!match) return;
      let value = match[2].trim();
      if (
        ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) &&
        value.length >= 2
      ) {
        value = value.slice(1, -1);
      }
      result[match[1]] = value;
    });
  }
  return result;
};

export const getEnv = (key) => window.__ENV?.[key] || defaults[key];

export const loadEnv = async () => {
  window.__ENV = { ...defaults };
  try {
    const response = await fetch('/.env', { cache: 'no-store' });
    if (response.ok) {
      window.__ENV = { ...defaults, ...parseEnv(await response.text()) };
    }
  } catch {
    // mantém os valores padrão
  }
};
