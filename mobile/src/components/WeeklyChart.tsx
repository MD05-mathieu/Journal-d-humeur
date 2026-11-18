/**
 * WeeklyChart — Composant graphique SVG pour le suivi d'humeur sur 7 jours.
 * Utilise 'react-native-svg' pour dessiner une courbe douce avec remplissage en gradient.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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

interface WeeklyChartProps {
  entries: MoodEntryResponse[];
  periodStart: string;
  periodEnd: string;
  averageScore: number;
}

const FRENCH_DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

const getScoreColor = (score: number): string => {
  if (score >= 4.2) return '#6C63FF';
  if (score >= 3.5) return '#06D6A0';
  if (score >= 2.5) return '#FFD166';
  if (score >= 1.8) return '#FFA07A';
  return '#FF6584';
};

const WeeklyChart: React.FC<WeeklyChartProps> = ({
  entries,
  periodStart,
  periodEnd,
  averageScore,
}) => {
  const CHART_WIDTH = 320;
  const CHART_HEIGHT = 180;
  const PADDING_LEFT = 35;
  const PADDING_RIGHT = 20;
  const PADDING_TOP = 20;
  const PADDING_BOTTOM = 35;

  const PLOT_WIDTH = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const PLOT_HEIGHT = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  // Construction des 7 jours de la période
  const days: { dateStr: string; label: string; score: number | null }[] = [];
  const start = new Date(periodStart);

  for (let i = 0; i < 7; i++) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    const dateStr = current.toISOString().split('T')[0];
    const dayLabel = FRENCH_DAYS[current.getDay()];

    const match = entries.find((e) => e.entryDateUtc.split('T')[0] === dateStr);
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
      // Score 1 en bas (y = PADDING_TOP + PLOT_HEIGHT), Score 5 en haut (y = PADDING_TOP)
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

  // Polygone fermé pour le dégradé de fond
  const areaPolylineStr =
    validPoints.length >= 2
      ? `${validPoints[0].x},${PADDING_TOP + PLOT_HEIGHT} ${polylineStr} ${
          validPoints[validPoints.length - 1].x
        },${PADDING_TOP + PLOT_HEIGHT}`
      : '';

  const themeColor = getScoreColor(averageScore);

  return (
    <View style={styles.card}>
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
              <Stop offset="0" stopColor="#6C63FF" stopOpacity="0.35" />
              <Stop offset="1" stopColor="#6C63FF" stopOpacity="0.02" />
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
                  fill="#9DA0B8"
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
              stroke="#6C63FF"
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
                fill={item.hasData ? '#2B2B43' : '#B8B9C9'}
                textAnchor="middle"
                fontWeight={item.hasData ? '700' : '500'}
              >
                {item.label}
              </SvgText>

              {/* Point de tracé */}
              {item.hasData ? (
                <>
                  <Circle cx={item.x} cy={item.y} r={6} fill="#FFFFFF" stroke="#6C63FF" strokeWidth={2.5} />
                  <Circle cx={item.x} cy={item.y} r={3} fill="#6C63FF" />
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
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#4A3AFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2B2B43',
  },
  subtitle: {
    fontSize: 12,
    color: '#71718A',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  svgWrapper: {
    alignItems: 'center',
    marginTop: 4,
  },
});

export default WeeklyChart;
