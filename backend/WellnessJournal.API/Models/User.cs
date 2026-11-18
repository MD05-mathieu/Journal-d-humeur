using System.ComponentModel.DataAnnotations;

namespace WellnessJournal.API.Models;

/// <summary>
/// Représente un utilisateur de l'application.
/// Le mot de passe est stocké sous forme de hash BCrypt.
/// </summary>
public class User
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Username { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public ICollection<MoodEntry> MoodEntries { get; set; } = new List<MoodEntry>();
}
