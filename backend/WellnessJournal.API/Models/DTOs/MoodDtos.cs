using System.ComponentModel.DataAnnotations;

namespace WellnessJournal.API.Models.DTOs;

/// <summary>
/// DTO pour créer ou mettre à jour une entrée d'humeur
/// </summary>
public class MoodEntryRequest
{
    [Required(ErrorMessage = "Le score est requis.")]
    [Range(1, 5, ErrorMessage = "Le score doit être entre 1 et 5.")]
    public int Score { get; set; }

    /// <summary>
    /// Liste d'émotions/tags (ex: ["Heureux", "Calme"])
    /// </summary>
    public List<string> EmotionTags { get; set; } = new();

    /// <summary>
    /// Note textuelle optionnelle
    /// </summary>
    [MaxLength(1000, ErrorMessage = "La note ne peut pas dépasser 1000 caractères.")]
    public string? Note { get; set; }

    /// <summary>
    /// Date de l'entrée en UTC. Si non fournie, utilise la date du jour.
    /// </summary>
    public DateTime? EntryDateUtc { get; set; }
}

/// <summary>
/// DTO pour la réponse d'une entrée d'humeur
/// </summary>
public class MoodEntryResponse
{
    public int Id { get; set; }
    public int Score { get; set; }
    public List<string> EmotionTags { get; set; } = new();
    public string? Note { get; set; }
    public DateTime EntryDateUtc { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// DTO pour la réponse du résumé hebdomadaire
/// </summary>
public class WeeklySummaryResponse
{
    public List<MoodEntryResponse> Entries { get; set; } = new();
    public double AverageScore { get; set; }
    public List<EmotionFrequency> TopEmotions { get; set; } = new();
    public int TotalEntries { get; set; }
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
}

/// <summary>
/// Fréquence d'une émotion sur la période
/// </summary>
public class EmotionFrequency
{
    public string Emotion { get; set; } = string.Empty;
    public int Count { get; set; }
}
