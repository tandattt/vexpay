using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VexPay.Migrations
{
    /// <inheritdoc />
    public partial class ProjectWebhookSecretHints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "webhook_secret_last4",
                table: "projects",
                type: "varchar(4)",
                maxLength: 4,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "webhook_secret_prefix",
                table: "projects",
                type: "varchar(8)",
                maxLength: 8,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "webhook_secret_last4",
                table: "projects");

            migrationBuilder.DropColumn(
                name: "webhook_secret_prefix",
                table: "projects");
        }
    }
}
