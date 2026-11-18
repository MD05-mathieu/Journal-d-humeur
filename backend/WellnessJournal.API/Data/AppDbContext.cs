using Microsoft.EntityFrameworkCore;
using WellnessJournal.API.Models;

namespace WellnessJournal.API.Data;

/// <summary>
/// Contexte Entity Framework Core pour l'application Wellness Journal.
/// Configure les entités User et MoodEntry avec leurs contraintes.
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<MoodEntry> MoodEntries => Set<MoodEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Contrainte d'unicité sur l'email de l'utilisateur
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // Contrainte d'unicité sur le nom d'utilisateur
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();

        // Contrainte : une seule entrée d'humeur par utilisateur par jour
        modelBuilder.Entity<MoodEntry>()
            .HasIndex(m => new { m.UserId, m.EntryDateUtc })
            .IsUnique();

        // Relation User -> MoodEntries avec suppression en cascade
        modelBuilder.Entity<MoodEntry>()
            .HasOne(m => m.User)
            .WithMany(u => u.MoodEntries)
            .HasForeignKey(m => m.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
