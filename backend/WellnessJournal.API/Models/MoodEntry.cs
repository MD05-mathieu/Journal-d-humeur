using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WellnessJournal.API.Models;

/// <summary>
/// Représente une entrée d'humeur quotidienne.
/// Score de 1 (très mauvais) à 5 (excellent).
/// Les tags d'émotions sont stockés en JSON dans la colonne EmotionTags.
/// </summary>
public class MoodEntry
{
    [Key]
    public int Id { get; set; }

    [Required]
    [Range(1, 5)]
    public int Score { get; set; }

    /// <summary>
    /// Liste d'émotions/tags sérialisée en JSON (ex: ["Heureux","Calme","Énergique"])
    /// </summary>
    [MaxLength(500)]
    public string EmotionTags { get; set; } = "[]";

    /// <summary>
    /// Note textuelle optionnelle de l'utilisateur
    /// </summary>
    [MaxLength(1000)]
    public string? Note { get; set; }

    /// <summary>
    /// Date de l'entrée en UTC (une seule entrée par jour par utilisateur)
    /// </summary>
    [Required]
    public DateTime EntryDateUtc { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Foreign key
    [Required]
    public int UserId { get; set; }

    [ForeignKey("UserId")]
    public User? User { get; set; }
}
