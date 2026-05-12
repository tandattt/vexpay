using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VexPay.Migrations
{
    /// <inheritdoc />
    public partial class IsLockedColumnToUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // migrationBuilder.DropIndex(
            //     name: "IX_developer_requests_user_id_status",
            //     table: "developer_requests");

            migrationBuilder.AddColumn<bool>(
                name: "is_locked",
                table: "users",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_developer_requests_status",
                table: "developer_requests",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_developer_requests_user_id",
                table: "developer_requests",
                column: "user_id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_developer_requests_status",
                table: "developer_requests");

            migrationBuilder.DropIndex(
                name: "IX_developer_requests_user_id",
                table: "developer_requests");

            migrationBuilder.DropColumn(
                name: "is_locked",
                table: "users");

            migrationBuilder.CreateIndex(
                name: "IX_developer_requests_user_id_status",
                table: "developer_requests",
                columns: new[] { "user_id", "status" });
        }
    }
}
