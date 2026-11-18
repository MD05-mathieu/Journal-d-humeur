using System.ComponentModel.DataAnnotations;

namespace WellnessJournal.API.Models.DTOs;

/// <summary>
/// DTO pour créer ou mettre à jour une entrée d'humeur
/// </summary>
public class MoodEntryRequest : IValidatableObject
{
    [Required(ErrorMessage = "Le score est requis.")]
    [Range(1, 5, ErrorMessage = "Le score doit être entre 1 et 5.")]
    public int Score { get; set; }

    /// <summary>
    /// Liste d'émotions/tags (ex: ["Heureux", "Calme"]). Maximum 10 tags de 30 caractères max chacun.
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

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (EmotionTags != null)
        {
            if (EmotionTags.Count > 10)
            {
                yield return new ValidationResult(
                    "Le nombre d'émotions sélectionnées ne peut pas dépasser 10.",
                    new[] { nameof(EmotionTags) });
            }

            foreach (var tag in EmotionTags)
            {
                if (string.IsNullOrWhiteSpace(tag))
                {
                    yield return new ValidationResult(
                        "Un tag d'émotion ne peut pas être vide.",
                        new[] { nameof(EmotionTags) });
                }
                else if (tag.Length > 30)
                {
                    var truncated = tag.Length > 10 ? tag.Substring(0, 10) + "..." : tag;
                    yield return new ValidationResult(
                        $"Le tag '{truncated}' dépasse la longueur maximale autorisée de 30 caractères.",
                        new[] { nameof(EmotionTags) });
                }
            }
        }

        if (EntryDateUtc.HasValue)
        {
            var now = DateTime.UtcNow;
            if (EntryDateUtc.Value > now.AddDays(1))
            {
                yield return new ValidationResult(
                    "La date de l'entrée ne peut pas être située dans le futur.",
                    new[] { nameof(EntryDateUtc) });
            }
            else if (EntryDateUtc.Value < now.AddYears(-1))
            {
                yield return new ValidationResult(
                    "La date de l'entrée ne peut pas être antérieure à un an.",
                    new[] { nameof(EntryDateUtc) });
            }
        }
    }
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
