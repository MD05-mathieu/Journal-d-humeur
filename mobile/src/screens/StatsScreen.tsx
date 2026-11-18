/**
 * Écran Statistiques (StatsScreen)
 * Vue hebdomadaire sur 7 jours :
 * - Intégration du composant WeeklyChart (react-native-svg)
 * - Indicateurs clés (Nombre d'entrées, score moyen, humeur dominante)
 * - Top des émotions les plus fréquentes (avec barres de progression)
 * - Historique chronologique des 7 derniers jours
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import apiClient from '../api/axios';
import WeeklyChart from '../components/WeeklyChart';
import { WeeklySummaryResponse } from '../types';

const MOOD_EMOJIS_BY_SCORE: Record<number, string> = {
  1: '😞',
  2: '🙁',
  3: '😐',
  4: '🙂',
  5: '✨',
};

const StatsScreen: React.FC = () => {
  const [weeklyData, setWeeklyData] = useState<WeeklySummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchWeeklySummary = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await apiClient.get<WeeklySummaryResponse>('/moods/weekly');
      setWeeklyData(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques hebdomadaires:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchWeeklySummary();
    }, [fetchWeeklySummary])
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Calcul des statistiques en cours...</Text>
      </View>
    );
  }

  if (!weeklyData || weeklyData.totalEntries === 0) {
    return (
      <ScrollView
        contentContainerStyle={styles.emptyContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchWeeklySummary(true)}
            colors={['#6C63FF']}
          />
        }
      >
        <Text style={styles.emptyEmoji}>📊</Text>
        <Text style={styles.emptyTitle}>Aucune donnée cette semaine</Text>
        <Text style={styles.emptySubtitle}>
          Enregistrez votre première humeur depuis l'onglet 'Humeur' pour débloquer votre courbe
          statistique et le bilan émotionnel.
        </Text>
      </ScrollView>
    );
  }

  const maxEmotionCount = weeklyData.topEmotions[0]?.count || 1;
  const roundedAverage = Math.round(weeklyData.averageScore);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => fetchWeeklySummary(true)}
          colors={['#6C63FF']}
        />
      }
    >
      {/* 1. Graphique d'évolution SVG sur 7 jours */}
      <WeeklyChart
        entries={weeklyData.entries}
        periodStart={weeklyData.periodStart}
        periodEnd={weeklyData.periodEnd}
        averageScore={weeklyData.averageScore}
      />

      {/* 2. Synthèse numérique en cartes */}
      <View style={styles.statsCardsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{weeklyData.totalEntries}</Text>
          <Text style={styles.statLabel}>Entrées (7j)</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>
            {MOOD_EMOJIS_BY_SCORE[roundedAverage] || '😐'}
          </Text>
          <Text style={styles.statLabel}>Tendance</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{weeklyData.averageScore.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Score moyen</Text>
        </View>
      </View>

      {/* 3. Top des émotions fréquentes */}
      {weeklyData.topEmotions.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🏷️ Émotions dominantes</Text>
          <Text style={styles.sectionSubtitle}>Fréquence d'apparition sur les 7 derniers jours</Text>

          {weeklyData.topEmotions.map((item, index) => {
            const barWidth = `${(item.count / maxEmotionCount) * 100}%`;
            return (
              <View key={item.emotion} style={styles.emotionRow}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>
                <Text style={styles.emotionName}>{item.emotion}</Text>
                <View style={styles.barBackground}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: barWidth as any,
                        backgroundColor:
                          index === 0 ? '#6C63FF' : index === 1 ? '#867EFF' : '#ABA5FF',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.countText}>{item.count} fois</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* 4. Historique détaillé chronologique inverse */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>📅 Détail des entrées</Text>
        {weeklyData.entries
          .slice()
          .reverse()
          .map((entry) => {
            const dateObj = new Date(entry.entryDateUtc);
            const formattedDate = dateObj.toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
            });

            return (
              <View key={entry.id} style={styles.historyItem}>
                <Text style={styles.historyEmoji}>
                  {MOOD_EMOJIS_BY_SCORE[entry.score] || '😐'}
                </Text>
                <View style={styles.historyBody}>
                  <Text style={styles.historyDate}>{formattedDate}</Text>
                  {entry.note ? (
                    <Text style={styles.historyNote} numberOfLines={2}>
                      « {entry.note} »
                    </Text>
                  ) : null}
                  {entry.emotionTags && entry.emotionTags.length > 0 ? (
                    <Text style={styles.historyTags}>{entry.emotionTags.join(' • ')}</Text>
                  ) : null}
                </View>
                <View style={styles.historyScoreBadge}>
                  <Text style={styles.historyScoreText}>{entry.score}/5</Text>
                </View>
              </View>
            );
          })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FC',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F8FC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#71718A',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#F7F8FC',
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2B2B43',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#71718A',
    textAlign: 'center',
    lineHeight: 22,
  },
  statsCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#4A3AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6C63FF',
  },
  statEmoji: {
    fontSize: 24,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71718A',
    marginTop: 6,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#4A3AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2B2B43',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#71718A',
    marginTop: 2,
    marginBottom: 16,
  },
  emotionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F0F2FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6C63FF',
  },
  emotionName: {
    width: 100,
    fontSize: 14,
    fontWeight: '600',
    color: '#2B2B43',
    marginLeft: 10,
  },
  barBackground: {
    flex: 1,
    height: 9,
    backgroundColor: '#F0F2FA',
    borderRadius: 5,
    overflow: 'hidden',
    marginRight: 10,
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#71718A',
    width: 48,
    textAlign: 'right',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F9',
  },
  historyEmoji: {
    fontSize: 26,
    marginRight: 12,
  },
  historyBody: {
    flex: 1,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2B2B43',
    textTransform: 'capitalize',
  },
  historyNote: {
    fontSize: 13,
    color: '#4B4B66',
    marginTop: 2,
    fontStyle: 'italic',
  },
  historyTags: {
    fontSize: 12,
    color: '#6C63FF',
    marginTop: 4,
    fontWeight: '600',
  },
  historyScoreBadge: {
    backgroundColor: '#EEECFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginLeft: 8,
  },
  historyScoreText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6C63FF',
  },
});

export default StatsScreen;
