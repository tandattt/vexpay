FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["VexPay.csproj", "./"]
RUN dotnet restore "VexPay.csproj"

COPY . .
RUN dotnet publish "VexPay.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

EXPOSE 5011
ENV ASPNETCORE_URLS=http://+:5011
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "VexPay.dll"]
