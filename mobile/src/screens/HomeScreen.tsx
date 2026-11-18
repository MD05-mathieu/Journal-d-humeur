/**
 * Écran d'Accueil (HomeScreen)
 * - Saisie de l'humeur quotidienne (Score 1 à 5) avec accessibilité WCAG AA
 * - Sélection multi-tags d'émotions + ajout de ressenti personnalisé
 * - Gestion timezone-safe de la date locale de l'utilisateur
 * - Clavier adaptatif (KeyboardAvoidingView) et feedback visuel in-app
 * - Upsert vers POST /api/moods
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { MoodEntryResponse } from '../types';
import { Colors, Spacing, BorderRadius } from '../theme';
import { getLocalDateString, getSafeUtcIsoString } from '../utils/date';

interface MoodOption {
  score: number;
  emoji: string;
  label: string;
  color: string;
}

const MOOD_OPTIONS: MoodOption[] = [
  { score: 1, emoji: '😞', label: 'Très bas', color: Colors.moods[1] },
  { score: 2, emoji: '🙁', label: 'Difficile', color: Colors.moods[2] },
  { score: 3, emoji: '😐', label: 'Neutre', color: Colors.moods[3] },
  { score: 4, emoji: '🙂', label: 'Bien', color: Colors.moods[4] },
  { score: 5, emoji: '✨', label: 'Rayonnant', color: Colors.moods[5] },
];

const DEFAULT_SUGGESTED_EMOTIONS: string[] = [
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

interface FeedbackBanner {
  type: 'success' | 'error';
  message: string;
}

const HomeScreen: React.FC = () => {
  const { username, logout } = useAuth();
  const [selectedScore, setSelectedScore] = useState<number>(3);
  const [availableEmotions, setAvailableEmotions] = useState<string[]>(DEFAULT_SUGGESTED_EMOTIONS);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [customEmotionInput, setCustomEmotionInput] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);
  const [todayEntryId, setTodayEntryId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<FeedbackBanner | null>(null);

  const bannerAnim = useRef(new Animated.Value(0)).current;

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    Animated.timing(bannerAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(bannerAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setFeedback(null));
    }, 4000);
  };

  /**
   * Charger les données pour vérifier si une entrée existe déjà pour la date locale d'aujourd'hui
   */
  const loadTodayEntry = useCallback(async () => {
    try {
      const response = await apiClient.get<{ entries: MoodEntryResponse[] }>('/moods/weekly');
      const localTodayStr = getLocalDateString();

      const foundToday = response.data.entries.find((entry) => {
        const entryLocalDate = getLocalDateString(new Date(entry.entryDateUtc));
        return entryLocalDate === localTodayStr;
      });

      if (foundToday) {
        setTodayEntryId(foundToday.id);
        setSelectedScore(foundToday.score);
        setSelectedEmotions(foundToday.emotionTags || []);
        setNote(foundToday.note || '');

        // Fusionner les tags existants avec les suggestions pour que les tags customs restent affichés
        if (foundToday.emotionTags && foundToday.emotionTags.length > 0) {
          setAvailableEmotions((prev) => {
            const set = new Set([...prev, ...foundToday.emotionTags]);
            return Array.from(set);
          });
        }
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
   * Bascule l'état d'un tag émotionnel (ajouter / retirer) avec limite max de 10
   */
  const toggleEmotionTag = (emotion: string) => {
    if (selectedEmotions.includes(emotion)) {
      setSelectedEmotions(selectedEmotions.filter((e) => e !== emotion));
    } else {
      if (selectedEmotions.length >= 10) {
        showFeedback('error', 'Vous ne pouvez pas sélectionner plus de 10 émotions.');
        return;
      }
      setSelectedEmotions([...selectedEmotions, emotion]);
    }
  };

  /**
   * Ajout d'une émotion personnalisée
   */
  const handleAddCustomEmotion = () => {
    const trimmed = customEmotionInput.trim();
    if (!trimmed) return;

    if (trimmed.length > 30) {
      showFeedback('error', 'Un tag ne peut pas dépasser 30 caractères.');
      return;
    }

    if (selectedEmotions.length >= 10 && !selectedEmotions.includes(trimmed)) {
      showFeedback('error', 'Limite maximale de 10 émotions atteinte.');
      return;
    }

    if (!availableEmotions.includes(trimmed)) {
      setAvailableEmotions([trimmed, ...availableEmotions]);
    }

    if (!selectedEmotions.includes(trimmed)) {
      setSelectedEmotions([...selectedEmotions, trimmed]);
    }

    setCustomEmotionInput('');
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
        entryDateUtc: getSafeUtcIsoString(),
      };

      const response = await apiClient.post<MoodEntryResponse>('/moods', payload);
      setTodayEntryId(response.data.id);

      showFeedback(
        'success',
        todayEntryId
          ? 'Votre humeur du jour a été mise à jour !'
          : 'Votre humeur du jour est bien enregistrée !'
      );
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        (error.response?.data?.errors
          ? Object.values(error.response.data.errors).flat().join(' ')
          : 'Une erreur est survenue lors de l\'enregistrement.');
      showFeedback('error', msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingInitial) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Préparation de votre journal...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Bannière de feedback in-app animée */}
        {feedback && (
          <Animated.View
            style={[
              styles.feedbackBanner,
              feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError,
              {
                opacity: bannerAnim,
                transform: [
                  {
                    translateY: bannerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-10, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.feedbackEmoji}>{feedback.type === 'success' ? '✅' : '⚠️'}</Text>
            <Text style={styles.feedbackText}>{feedback.message}</Text>
          </Animated.View>
        )}

        {/* Barre d'en-tête utilisateur */}
        <View style={styles.userBanner}>
          <View>
            <Text style={styles.welcomeText}>Bonjour,</Text>
            <Text style={styles.userHighlight}>{username} 👋</Text>
          </View>
          <TouchableOpacity
            style={styles.logoutPill}
            onPress={logout}
            accessibilityRole="button"
            accessibilityLabel="Se déconnecter"
          >
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.screenHeading}>Quelle est votre humeur générale aujourd'hui ?</Text>

        {/* Sélecteur de score de 1 à 5 accessible */}
        <View style={styles.scoreRow} accessibilityRole="radiogroup">
          {MOOD_OPTIONS.map((item) => {
            const isSelected = selectedScore === item.score;
            return (
              <TouchableOpacity
                key={item.score}
                activeOpacity={0.8}
                accessibilityRole="radio"
                accessibilityLabel={`Humeur ${item.label}, note de ${item.score} sur 5`}
                accessibilityState={{ selected: isSelected }}
                style={[
                  styles.moodCard,
                  isSelected && {
                    backgroundColor: item.color,
                    transform: [{ scale: 1.05 }],
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

        {/* Tags d'émotions avec saisie personnalisée */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>Émotions ressenties</Text>
            <Text style={styles.tagCountLabel}>{selectedEmotions.length}/10</Text>
          </View>

          {/* Champ d'ajout rapide d'un tag personnalisé */}
          <View style={styles.addTagRow}>
            <TextInput
              style={styles.addTagInput}
              placeholder="Ajouter une émotion sur-mesure..."
              placeholderTextColor={Colors.textMuted}
              maxLength={30}
              value={customEmotionInput}
              onChangeText={setCustomEmotionInput}
              onSubmitEditing={handleAddCustomEmotion}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[
                styles.addTagButton,
                !customEmotionInput.trim() && styles.addTagButtonDisabled,
              ]}
              onPress={handleAddCustomEmotion}
              disabled={!customEmotionInput.trim()}
              accessibilityRole="button"
              accessibilityLabel="Ajouter ce tag"
            >
              <Text style={styles.addTagButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tagsContainer}>
            {availableEmotions.map((emotion) => {
              const active = selectedEmotions.includes(emotion);
              return (
                <TouchableOpacity
                  key={emotion}
                  accessibilityRole="button"
                  accessibilityLabel={`Émotion ${emotion}`}
                  accessibilityState={{ selected: active }}
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
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
            maxLength={1000}
            value={note}
            onChangeText={setNote}
            accessibilityLabel="Notes personnelles"
          />
          <Text style={styles.counterText}>{note.length} / 1000 caractères</Text>
        </View>

        {/* Bouton de sauvegarde / mise à jour */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.buttonDisabled]}
          onPress={handleSaveMood}
          disabled={isSaving}
          accessibilityRole="button"
          accessibilityLabel={
            todayEntryId ? 'Mettre à jour mon humeur du jour' : 'Enregistrer mon humeur du jour'
          }
        >
          {isSaving ? (
            <ActivityIndicator color={Colors.surface} />
          ) : (
            <Text style={styles.saveButtonText}>
              {todayEntryId ? '🔄 Mettre à jour l\'humeur' : '💾 Enregistrer mon humeur'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 15,
    color: Colors.textSecondary,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  feedbackSuccess: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success,
  },
  feedbackError: {
    backgroundColor: Colors.dangerLight,
    borderColor: Colors.danger,
  },
  feedbackEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  feedbackText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  userBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingTop: Spacing.xs,
  },
  welcomeText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  userHighlight: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  logoutPill: {
    backgroundColor: Colors.dangerLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  logoutText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  screenHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    lineHeight: 24,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  moodCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: 2,
    alignItems: 'center',
    marginHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.border,
    elevation: 2,
  },
  moodEmoji: {
    fontSize: 26,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  moodLabelActive: {
    color: Colors.surface,
    fontWeight: '700',
  },
  moodScoreNum: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  moodScoreNumActive: {
    color: Colors.surface,
  },
  sectionBlock: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  tagCountLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  addTagRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  addTagInput: {
    flex: 1,
    backgroundColor: '#F8F9FE',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  addTagButton: {
    backgroundColor: Colors.primary,
    marginLeft: 8,
    width: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTagButtonDisabled: {
    backgroundColor: Colors.border,
  },
  addTagButtonText: {
    color: Colors.surface,
    fontSize: 20,
    fontWeight: '700',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    backgroundColor: '#F0F2FA',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#E2E4F0',
  },
  tagPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tagText: {
    fontSize: 13,
    color: '#4B4B66',
    fontWeight: '600',
  },
  tagTextActive: {
    color: Colors.surface,
  },
  textArea: {
    backgroundColor: '#F8F9FE',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 15,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
    minHeight: 90,
  },
  counterText: {
    textAlign: 'right',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 6,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 4,
    marginTop: Spacing.xs,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

export default HomeScreen;
