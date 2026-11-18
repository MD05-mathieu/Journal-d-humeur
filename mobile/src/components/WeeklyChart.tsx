/**
 * WeeklyChart — Composant graphique SVG pour le suivi d'humeur sur 7 jours.
 * - Rendu responsive adapté à toutes les largeurs d'écran (useWindowDimensions)
 * - Traitement timezone-safe des dates
 * - Couleurs et contrastes conformes WCAG AA
 * - Gradient d'ambiance et tracé vectoriel
 */
import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, {
  Line,
  Circle,
  Polyline,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
  G,
} from 'react-native-svg';
import { MoodEntryResponse } from '../types';
import { Colors, Spacing, BorderRadius } from '../theme';
import { getLocalDateString } from '../utils/date';

interface WeeklyChartProps {
  entries: MoodEntryResponse[];
  periodStart: string;
  periodEnd: string;
  averageScore: number;
}

const FRENCH_DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

const getScoreColor = (score: number): string => {
  if (score >= 4.2) return Colors.moods[5];
  if (score >= 3.5) return Colors.moods[4];
  if (score >= 2.5) return Colors.moods[3]; // Accessible ambre (> 4.5:1)
  if (score >= 1.8) return Colors.moods[2];
  return Colors.moods[1];
};

const WeeklyChart: React.FC<WeeklyChartProps> = ({
  entries,
  periodStart,
  averageScore,
}) => {
  const { width } = useWindowDimensions();

  // Largeur dynamique calculée selon l'écran (avec padding de conteneur de 20 de chaque côté + padding carte 18*2)
  const CHART_WIDTH = Math.max(280, Math.min(width - 76, 500));
  const CHART_HEIGHT = 180;
  const PADDING_LEFT = 35;
  const PADDING_RIGHT = 20;
  const PADDING_TOP = 20;
  const PADDING_BOTTOM = 35;

  const PLOT_WIDTH = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const PLOT_HEIGHT = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  // Construction des 7 jours de la période en date locale
  const days: { dateStr: string; label: string; score: number | null }[] = [];
  const start = new Date(periodStart);

  for (let i = 0; i < 7; i++) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    const dateStr = getLocalDateString(current);
    const dayLabel = FRENCH_DAYS[current.getDay()];

    const match = entries.find((e) => {
      const entryLocalDate = getLocalDateString(new Date(e.entryDateUtc));
      return entryLocalDate === dateStr;
    });

    days.push({
      dateStr,
      label: dayLabel,
      score: match ? match.score : null,
    });
  }

  // Calcul des coordonnées (X, Y)
  const coords = days.map((day, idx) => {
    const x = PADDING_LEFT + (idx / 6) * PLOT_WIDTH;
    if (day.score !== null) {
      // Score 1 en bas, Score 5 en haut
      const y = PADDING_TOP + PLOT_HEIGHT - ((day.score - 1) / 4) * PLOT_HEIGHT;
      return { x, y, score: day.score, hasData: true, label: day.label };
    }
    return {
      x,
      y: PADDING_TOP + PLOT_HEIGHT / 2,
      score: 0,
      hasData: false,
      label: day.label,
    };
  });

  const validPoints = coords.filter((c) => c.hasData);
  const polylineStr = validPoints.map((p) => `${p.x},${p.y}`).join(' ');

  // Surface en dégradé sous la courbe
  const areaPolylineStr =
    validPoints.length >= 2
      ? `${validPoints[0].x},${PADDING_TOP + PLOT_HEIGHT} ${polylineStr} ${
          validPoints[validPoints.length - 1].x
        },${PADDING_TOP + PLOT_HEIGHT}`
      : '';

  const themeColor = getScoreColor(averageScore);

  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={`Graphique hebdomadaire de suivi de l'humeur. Score moyen de ${averageScore.toFixed(1)} sur 5`}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Évolution sur 7 Jours</Text>
          <Text style={styles.subtitle}>Scores quotidiens de 1 à 5</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: themeColor + '20' }]}>
          <Text style={[styles.badgeText, { color: themeColor }]}>
            Moy. {averageScore.toFixed(1)}/5
          </Text>
        </View>
      </View>

      <View style={styles.svgWrapper}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
          <Defs>
            <LinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={Colors.primary} stopOpacity="0.35" />
              <Stop offset="1" stopColor={Colors.primary} stopOpacity="0.02" />
            </LinearGradient>
          </Defs>

          {/* Grille horizontale (scores 1 à 5) */}
          {[1, 2, 3, 4, 5].map((lvl) => {
            const y = PADDING_TOP + PLOT_HEIGHT - ((lvl - 1) / 4) * PLOT_HEIGHT;
            return (
              <G key={`grid-${lvl}`}>
                <Line
                  x1={PADDING_LEFT}
                  y1={y}
                  x2={CHART_WIDTH - PADDING_RIGHT}
                  y2={y}
                  stroke="#E8E9F5"
                  strokeWidth={1}
                  strokeDasharray="4,4"
                />
                <SvgText
                  x={PADDING_LEFT - 10}
                  y={y + 4}
                  fontSize={11}
                  fill={Colors.textSecondary}
                  textAnchor="end"
                  fontWeight="600"
                >
                  {lvl}
                </SvgText>
              </G>
            );
          })}

          {/* Surface en dégradé */}
          {validPoints.length >= 2 && (
            <Polyline points={areaPolylineStr} fill="url(#chartGradient)" stroke="none" />
          )}

          {/* Ligne principale du tracé */}
          {validPoints.length >= 2 && (
            <Polyline
              points={polylineStr}
              fill="none"
              stroke={Colors.primary}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Points de données et libellés des jours */}
          {coords.map((item, index) => (
            <G key={`pt-${index}`}>
              {/* Libellé du jour de la semaine */}
              <SvgText
                x={item.x}
                y={CHART_HEIGHT - 10}
                fontSize={11}
                fill={item.hasData ? Colors.textPrimary : Colors.textMuted}
                textAnchor="middle"
                fontWeight={item.hasData ? '700' : '500'}
              >
                {item.label}
              </SvgText>

              {/* Point de tracé */}
              {item.hasData ? (
                <>
                  <Circle
                    cx={item.x}
                    cy={item.y}
                    r={6}
                    fill={Colors.surface}
                    stroke={Colors.primary}
                    strokeWidth={2.5}
                  />
                  <Circle cx={item.x} cy={item.y} r={3} fill={Colors.primary} />
                </>
              ) : (
                <Circle
                  cx={item.x}
                  cy={item.y}
                  r={3.5}
                  fill="#E4E5F0"
                  stroke="#C5C7D8"
                  strokeWidth={1}
                  strokeDasharray="2,2"
                />
              )}
            </G>
          ))}
        </Svg>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  svgWrapper: {
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
});

export default WeeklyChart;
