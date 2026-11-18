using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WellnessJournal.API.Data;
using WellnessJournal.API.Models;
using WellnessJournal.API.Models.DTOs;

namespace WellnessJournal.API.Controllers;

/// <summary>
/// Contrôleur pour la gestion des entrées d'humeur.
/// Toutes les routes sont protégées par [Authorize] — un token JWT valide est requis.
/// Chaque utilisateur n'accède qu'à ses propres données (filtrage par UserId extrait du JWT).
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MoodsController : ControllerBase
{
    private readonly AppDbContext _context;

    public MoodsController(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Extrait le UserId depuis les claims du token JWT
    /// </summary>
    private int GetUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("Utilisateur non authentifié.");
        return int.Parse(userIdClaim);
    }

    /// <summary>
    /// POST /api/moods — Enregistrer ou mettre à jour l'humeur du jour.
    /// Si une entrée existe déjà pour la date donnée, elle est mise à jour (upsert).
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<MoodEntryResponse>> CreateOrUpdateMood([FromBody] MoodEntryRequest request)
    {
        var userId = GetUserId();
        var entryDate = (request.EntryDateUtc ?? DateTime.UtcNow).Date;

        // Nettoyage et normalisation des tags d'émotions
        var cleanTags = (request.EmotionTags ?? new List<string>())
            .Where(t => !string.IsNullOrWhiteSpace(t))
            .Select(t => t.Trim())
            .Distinct()
            .Take(10)
            .ToList();

        var serializedTags = JsonSerializer.Serialize(cleanTags);
        if (serializedTags.Length > 500)
        {
            return BadRequest(new { message = "La liste des émotions sélectionnées dépasse la taille autorisée." });
        }

        var cleanNote = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();

        // Chercher une entrée existante pour ce jour
        var existingEntry = await _context.MoodEntries
            .FirstOrDefaultAsync(m => m.UserId == userId && m.EntryDateUtc.Date == entryDate);

        if (existingEntry != null)
        {
            // Mise à jour de l'entrée existante
            existingEntry.Score = request.Score;
            existingEntry.EmotionTags = serializedTags;
            existingEntry.Note = cleanNote;
            existingEntry.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            // Création d'une nouvelle entrée
            existingEntry = new MoodEntry
            {
                Score = request.Score,
                EmotionTags = serializedTags,
                Note = cleanNote,
                EntryDateUtc = entryDate,
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.MoodEntries.Add(existingEntry);
        }

        await _context.SaveChangesAsync();

        var response = MapToResponse(existingEntry);
        return Ok(response);
    }

    /// <summary>
    /// GET /api/moods/weekly — Récupérer les entrées des 7 derniers jours glissants.
    /// Retourne les entrées triées chronologiquement, la moyenne, et les émotions les plus fréquentes.
    /// </summary>
    [HttpGet("weekly")]
    public async Task<ActionResult<WeeklySummaryResponse>> GetWeeklySummary()
    {
        var userId = GetUserId();
        var today = DateTime.UtcNow.Date;
        var weekAgo = today.AddDays(-6); // 7 jours glissants (aujourd'hui inclus)

        // Récupérer les entrées des 7 derniers jours, triées chronologiquement
        var entries = await _context.MoodEntries
            .Where(m => m.UserId == userId && m.EntryDateUtc.Date >= weekAgo && m.EntryDateUtc.Date <= today)
            .OrderBy(m => m.EntryDateUtc)
            .ToListAsync();

        var entryResponses = entries.Select(MapToResponse).ToList();

        // Calculer la moyenne des scores
        var averageScore = entries.Count > 0
            ? Math.Round(entries.Average(e => e.Score), 2)
            : 0;

        // Calculer les émotions les plus fréquentes
        var allEmotions = entries
            .SelectMany(e =>
            {
                try
                {
                    return JsonSerializer.Deserialize<List<string>>(e.EmotionTags) ?? new List<string>();
                }
                catch
                {
                    return new List<string>();
                }
            })
            .GroupBy(emotion => emotion)
            .Select(group => new EmotionFrequency
            {
                Emotion = group.Key,
                Count = group.Count()
            })
            .OrderByDescending(ef => ef.Count)
            .Take(5) // Top 5 émotions
            .ToList();

        return Ok(new WeeklySummaryResponse
        {
            Entries = entryResponses,
            AverageScore = averageScore,
            TopEmotions = allEmotions,
            TotalEntries = entries.Count,
            PeriodStart = weekAgo,
            PeriodEnd = today
        });
    }

    /// <summary>
    /// Mappe un MoodEntry vers un MoodEntryResponse (désérialise les tags JSON)
    /// </summary>
    private static MoodEntryResponse MapToResponse(MoodEntry entry)
    {
        List<string> tags;
        try
        {
            tags = JsonSerializer.Deserialize<List<string>>(entry.EmotionTags) ?? new List<string>();
        }
        catch
        {
            tags = new List<string>();
        }

        return new MoodEntryResponse
        {
            Id = entry.Id,
            Score = entry.Score,
            EmotionTags = tags,
            Note = entry.Note,
            EntryDateUtc = entry.EntryDateUtc,
            CreatedAt = entry.CreatedAt,
            UpdatedAt = entry.UpdatedAt
        };
    }
}
