/**
 * Écran d'Accueil (HomeScreen)
 * - Saisie de l'humeur quotidienne (Score 1 à 5)
 * - Sélection multi-tags d'émotions
 * - Saisie d'une note textuelle facultative
 * - Upsert vers POST /api/moods
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { MoodEntryResponse } from '../types';

interface MoodOption {
  score: number;
  emoji: string;
  label: string;
  color: string;
}

const MOOD_OPTIONS: MoodOption[] = [
  { score: 1, emoji: '😞', label: 'Très bas', color: '#FF6584' },
  { score: 2, emoji: '🙁', label: 'Difficile', color: '#FFA07A' },
  { score: 3, emoji: '😐', label: 'Neutre', color: '#FFD166' },
  { score: 4, emoji: '🙂', label: 'Bien', color: '#06D6A0' },
  { score: 5, emoji: '✨', label: 'Rayonnant', color: '#6C63FF' },
];

const SUGGESTED_EMOTIONS: string[] = [
  'Serein',
  'Énergique',
  'Reconnaissant',
  'Anxieux',
  'Fatigué',
  'Stressé',
  'Productif',
  'Inspiré',
  'Mélancolique',
  'Motivé',
  'Calme',
  'Enjoué',
];

const HomeScreen: React.FC = () => {
  const { username, logout } = useAuth();
  const [selectedScore, setSelectedScore] = useState<number>(3);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [note, setNote] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);
  const [todayEntryId, setTodayEntryId] = useState<number | null>(null);

  /**
   * Charger les données de la semaine pour vérifier si une entrée existe déjà aujourd'hui
   */
  const loadTodayEntry = useCallback(async () => {
    try {
      const response = await apiClient.get<{ entries: MoodEntryResponse[] }>('/moods/weekly');
      const todayDateStr = new Date().toISOString().split('T')[0];

      const foundToday = response.data.entries.find((entry) => {
        const entryDate = entry.entryDateUtc.split('T')[0];
        return entryDate === todayDateStr;
      });

      if (foundToday) {
        setTodayEntryId(foundToday.id);
        setSelectedScore(foundToday.score);
        setSelectedEmotions(foundToday.emotionTags || []);
        setNote(foundToday.note || '');
      }
    } catch (error) {
      console.warn('Impossible de charger l\'humeur du jour existante:', error);
    } finally {
      setIsLoadingInitial(false);
    }
  }, []);

  useEffect(() => {
    loadTodayEntry();
  }, [loadTodayEntry]);

  /**
   * Bascule l'état d'un tag émotionnel (ajouter / retirer)
   */
  const toggleEmotionTag = (emotion: string) => {
    if (selectedEmotions.includes(emotion)) {
      setSelectedEmotions(selectedEmotions.filter((e) => e !== emotion));
    } else {
      setSelectedEmotions([...selectedEmotions, emotion]);
    }
  };

  /**
   * Soumission du formulaire d'humeur
   */
  const handleSaveMood = async () => {
    setIsSaving(true);
    try {
      const payload = {
        score: selectedScore,
        emotionTags: selectedEmotions,
        note: note.trim() ? note.trim() : null,
        entryDateUtc: new Date().toISOString(),
      };

      const response = await apiClient.post<MoodEntryResponse>('/moods', payload);
      setTodayEntryId(response.data.id);

      Alert.alert(
        'Enregistré avec succès !',
        todayEntryId
          ? 'Votre humeur du jour a bien été mise à jour.'
          : 'Votre ressenti du jour a été enregistré dans votre journal.'
      );
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Une erreur est survenue lors de l\'enregistrement.';
      Alert.alert('Erreur', msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingInitial) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Préparation de votre journal...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Barre d'en-tête utilisateur */}
      <View style={styles.userBanner}>
        <View>
          <Text style={styles.welcomeText}>Bonjour,</Text>
          <Text style={styles.userHighlight}>{username} 👋</Text>
        </View>
        <TouchableOpacity style={styles.logoutPill} onPress={logout}>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.screenHeading}>Quelle est votre humeur générale aujourd'hui ?</Text>

      {/* Sélecteur de score de 1 à 5 */}
      <View style={styles.scoreRow}>
        {MOOD_OPTIONS.map((item) => {
          const isSelected = selectedScore === item.score;
          return (
            <TouchableOpacity
              key={item.score}
              activeOpacity={0.8}
              style={[
                styles.moodCard,
                isSelected && {
                  backgroundColor: item.color,
                  transform: [{ scale: 1.08 }],
                  borderColor: item.color,
                  shadowColor: item.color,
                  shadowOpacity: 0.35,
                  shadowRadius: 8,
                  elevation: 5,
                },
              ]}
              onPress={() => setSelectedScore(item.score)}
            >
              <Text style={styles.moodEmoji}>{item.emoji}</Text>
              <Text style={[styles.moodLabel, isSelected && styles.moodLabelActive]}>
                {item.label}
              </Text>
              <Text style={[styles.moodScoreNum, isSelected && styles.moodScoreNumActive]}>
                {item.score}/5
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tags d'émotions */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionLabel}>Émotions ressenties (multi-sélection)</Text>
        <View style={styles.tagsContainer}>
          {SUGGESTED_EMOTIONS.map((emotion) => {
            const active = selectedEmotions.includes(emotion);
            return (
              <TouchableOpacity
                key={emotion}
                style={[styles.tagPill, active && styles.tagPillActive]}
                onPress={() => toggleEmotionTag(emotion)}
              >
                <Text style={[styles.tagText, active && styles.tagTextActive]}>
                  {active ? `✓ ${emotion}` : emotion}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Note textuelle */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionLabel}>Notes personnelles (facultatif)</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Un événement marquant ? Vos pensées du moment..."
          placeholderTextColor="#9FA2B4"
          multiline
          numberOfLines={4}
          maxLength={1000}
          value={note}
          onChangeText={setNote}
        />
        <Text style={styles.counterText}>{note.length} / 1000 caractères</Text>
      </View>

      {/* Bouton de sauvegarde / mise à jour */}
      <TouchableOpacity
        style={[styles.saveButton, isSaving && styles.buttonDisabled]}
        onPress={handleSaveMood}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>
            {todayEntryId ? '🔄 Mettre à jour l\'humeur' : '💾 Enregistrer mon humeur'}
          </Text>
        )}
      </TouchableOpacity>
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
  userBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: '#71718A',
  },
  userHighlight: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2B2B43',
  },
  logoutPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  screenHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2B2B43',
    marginBottom: 16,
    lineHeight: 24,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  moodCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    marginHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#E8E9F3',
    elevation: 2,
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#71718A',
    textAlign: 'center',
  },
  moodLabelActive: {
    color: '#FFFFFF',
  },
  moodScoreNum: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2B2B43',
    marginTop: 4,
  },
  moodScoreNumActive: {
    color: '#FFFFFF',
  },
  sectionBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#4A3AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2B2B43',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    backgroundColor: '#F0F2FA',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E4F0',
  },
  tagPillActive: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  tagText: {
    fontSize: 13,
    color: '#4B4B66',
    fontWeight: '600',
  },
  tagTextActive: {
    color: '#FFFFFF',
  },
  textArea: {
    backgroundColor: '#F8F9FE',
    borderWidth: 1.5,
    borderColor: '#E8E9F3',
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: '#2B2B43',
    textAlignVertical: 'top',
    minHeight: 90,
  },
  counterText: {
    textAlign: 'right',
    fontSize: 12,
    color: '#A0A0B0',
    marginTop: 6,
  },
  saveButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 4,
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

export default HomeScreen;
