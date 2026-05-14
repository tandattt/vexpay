using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VexPay.Migrations
{
    /// <inheritdoc />
    public partial class ProjectWebhookFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "webhook_secret_enabled",
                table: "projects",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "webhook_secret_key",
                table: "projects",
                type: "varchar(512)",
                maxLength: 512,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "webhook_url",
                table: "projects",
                type: "varchar(2048)",
                maxLength: 2048,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "webhook_secret_enabled",
                table: "projects");

            migrationBuilder.DropColumn(
                name: "webhook_secret_key",
                table: "projects");

            migrationBuilder.DropColumn(
                name: "webhook_url",
                table: "projects");
        }
    }
}
