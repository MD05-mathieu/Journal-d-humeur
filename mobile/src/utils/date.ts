/**
 * Utilitaires de manipulation de date et fuseau horaire (Timezone-safe)
 */

/**
 * Retourne la date civile locale sous forme 'YYYY-MM-DD'
 * Évite le piège de toISOString() qui convertit en UTC et peut décaler le jour
 */
export const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Construit un ISO string centré à 12:00:00 UTC pour la date civile locale spécifiée.
 * Cela évite tout débordement sur la veille ou le lendemain lors de conversions UTC sur le serveur.
 */
export const getSafeUtcIsoString = (localDateStr?: string): string => {
  const targetDateStr = localDateStr || getLocalDateString();
  return `${targetDateStr}T12:00:00.000Z`;
};

/**
 * Formate une date ISO en chaîne lisible en français selon le fuseau local
 */
export const formatDisplayDate = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return isoString;
  }
};
