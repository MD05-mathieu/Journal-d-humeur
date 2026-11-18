using System.ComponentModel.DataAnnotations;

namespace WellnessJournal.API.Models.DTOs;

/// <summary>
/// DTO pour la requête d'inscription
/// </summary>
public class RegisterRequest
{
    [Required(ErrorMessage = "Le nom d'utilisateur est requis.")]
    [MinLength(3, ErrorMessage = "Le nom d'utilisateur doit contenir au moins 3 caractères.")]
    [MaxLength(100)]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "L'email est requis.")]
    [EmailAddress(ErrorMessage = "L'email n'est pas valide.")]
    [MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Le mot de passe est requis.")]
    [MinLength(8, ErrorMessage = "Le mot de passe doit contenir au moins 8 caractères.")]
    public string Password { get; set; } = string.Empty;
}

/// <summary>
/// DTO pour la requête de connexion
/// </summary>
public class LoginRequest
{
    [Required(ErrorMessage = "L'email est requis.")]
    [EmailAddress(ErrorMessage = "L'email n'est pas valide.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Le mot de passe est requis.")]
    public string Password { get; set; } = string.Empty;
}

/// <summary>
/// DTO pour la réponse d'authentification contenant le token JWT
/// </summary>
public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public DateTime Expiration { get; set; }
}
