using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using WellnessJournal.API.Data;
using WellnessJournal.API.Models;
using WellnessJournal.API.Models.DTOs;
using WellnessJournal.API.Services;

namespace WellnessJournal.API.Controllers;

/// <summary>
/// Contrôleur d'authentification : inscription et connexion.
/// Les mots de passe sont hachés avec BCrypt avant stockage.
/// Protégé par une politique de Rate Limiting anti-bruteforce et anti-DoS.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("AuthPolicy")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IJwtService _jwtService;

    public AuthController(AppDbContext context, IJwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }

    /// <summary>
    /// POST /api/auth/register — Inscription d'un nouvel utilisateur
    /// </summary>
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        // Vérifier si l'email existe déjà
        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
        {
            return Conflict(new { message = "Un compte avec cet email existe déjà." });
        }

        // Vérifier si le nom d'utilisateur existe déjà
        if (await _context.Users.AnyAsync(u => u.Username == request.Username))
        {
            return Conflict(new { message = "Ce nom d'utilisateur est déjà pris." });
        }

        // Créer l'utilisateur avec le mot de passe haché via BCrypt
        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, workFactor: 12),
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Générer le token JWT
        var token = _jwtService.GenerateToken(user);
        var expiration = DateTime.UtcNow.AddMinutes(1440);

        return Created("", new AuthResponse
        {
            Token = token,
            Username = user.Username,
            Expiration = expiration
        });
    }

    /// <summary>
    /// POST /api/auth/login — Connexion d'un utilisateur existant
    /// </summary>
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        // Rechercher l'utilisateur par email
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Email ou mot de passe incorrect." });
        }

        // Générer le token JWT
        var token = _jwtService.GenerateToken(user);
        var expiration = DateTime.UtcNow.AddMinutes(1440);

        return Ok(new AuthResponse
        {
            Token = token,
            Username = user.Username,
            Expiration = expiration
        });
    }
}
