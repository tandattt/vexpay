using Hangfire;
using Hangfire.MemoryStorage;
using VexPay.Base.Seeders;
using VexPay.Config;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSwaggerConfig();
builder.Services.AddMySqlConfig(builder.Configuration);
builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddCorsConfig(builder.Configuration);
builder.Services.AddAppServices(builder.Configuration);
builder.Services.AddHangfire(config => config.UseMemoryStorage());
builder.Services.AddHangfireServer();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwaggerConfig();
}

app.UseHttpsRedirection();
app.UseCorsConfig();
app.UseStaticFiles();
if (app.Environment.IsDevelopment())
{
    app.UseHangfireDashboard("/hangfire");
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

await DatabaseSeeder.SeedAsync(app.Services);

app.Run();
