using Hangfire;
using Hangfire.MySql;
using System.Transactions;
using VexPay.Base.Seeders;
using VexPay.Config;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSwaggerConfig();
builder.Services.AddMySqlConfig(builder.Configuration);
builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddCorsConfig(builder.Configuration, builder.Environment);
builder.Services.AddAppServices(builder.Configuration);
builder.Services.AddRateLimitingConfig();

var hangfireConnection = builder.Configuration.GetConnectionString("HangfireConnection")
    ?? throw new InvalidOperationException("Missing connection string 'HangfireConnection'.");

builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_170)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseStorage(new MySqlStorage(hangfireConnection, new MySqlStorageOptions
    {
        TransactionIsolationLevel = IsolationLevel.ReadCommitted,
        QueuePollInterval = TimeSpan.FromSeconds(15),
        JobExpirationCheckInterval = TimeSpan.FromHours(1),
        CountersAggregateInterval = TimeSpan.FromMinutes(5),
        PrepareSchemaIfNecessary = true,
        DashboardJobListLimit = 50000,
        TransactionTimeout = TimeSpan.FromMinutes(1),
        TablesPrefix = "hangfire_",
    })));
builder.Services.AddHangfireServer();

var app = builder.Build();

app.UseHttpsRedirection();
app.UseCorsConfig();

app.UseOpenApiDocuments();
if (app.Environment.IsDevelopment())
{
    app.UseSwaggerUiInDevelopment();
}

app.UseStaticFiles();
if (app.Environment.IsDevelopment())
{
    app.UseHangfireDashboard("/hangfire");
}

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimitingConfig();

app.MapControllers();

await DatabaseSeeder.SeedAsync(app.Services);

app.Run();
