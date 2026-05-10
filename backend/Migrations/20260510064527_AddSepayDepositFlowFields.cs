using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VexPay.Migrations
{
    /// <inheritdoc />
    public partial class AddSepayDepositFlowFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "paid_at",
                table: "deposit_histories",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "qr_image_path",
                table: "deposit_histories",
                type: "varchar(255)",
                maxLength: 255,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<long>(
                name: "sepay_transaction_id",
                table: "deposit_histories",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_deposit_histories_sepay_transaction_id",
                table: "deposit_histories",
                column: "sepay_transaction_id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_deposit_histories_sepay_transaction_id",
                table: "deposit_histories");

            migrationBuilder.DropColumn(
                name: "paid_at",
                table: "deposit_histories");

            migrationBuilder.DropColumn(
                name: "qr_image_path",
                table: "deposit_histories");

            migrationBuilder.DropColumn(
                name: "sepay_transaction_id",
                table: "deposit_histories");
        }
    }
}
