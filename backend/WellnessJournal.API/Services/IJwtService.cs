using WellnessJournal.API.Models;

namespace WellnessJournal.API.Services;

/// <summary>
/// Interface du service de génération de tokens JWT
/// </summary>
public interface IJwtService
{
    string GenerateToken(User user);
}
