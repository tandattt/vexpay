using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using VexPay.Entities;
using VexPay.Settings;

namespace VexPay.Services.Auth
{
    public class JwtTokenService : IJwtTokenService
    {
        private readonly JwtSettings _jwt;

        public JwtTokenService(IOptions<JwtSettings> options)
        {
            _jwt = options.Value;
        }

        public (string Token, long ExpiresInSeconds) GenerateAccessToken(User user, IEnumerable<string> roles)
        {
            var roleList = roles.ToList();

            var claims = new List<Claim>
            {
                new(JwtRegisteredClaimNames.Sub, user.Id),
                new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new("username", user.Username),
                new("email", user.Email),
                new("fullName", user.FullName),
                new("tokenType", "access"),
            };

            foreach (var role in roleList)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var authorities = string.Join(' ', roleList);
            if (!string.IsNullOrWhiteSpace(authorities))
            {
                claims.Add(new Claim("authorities", authorities));
            }

            var lifetime = TimeSpan.FromMinutes(_jwt.AccessTokenExpiryMinutes);
            return CreateToken(claims, lifetime);
        }

        public (string Token, long ExpiresInSeconds) GenerateRefreshToken(User user)
        {
            var claims = new List<Claim>
            {
                new(JwtRegisteredClaimNames.Sub, user.Id),
                new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new("username", user.Username),
                new("tokenType", "refresh"),
            };

            var lifetime = TimeSpan.FromDays(_jwt.RefreshTokenExpiryDays);
            return CreateToken(claims, lifetime);
        }

        public ClaimsPrincipal ValidateToken(string token, bool validateLifetime = true)
        {
            var keyBytes = Encoding.UTF8.GetBytes(_jwt.SecretKey.Trim());
            var parameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
                ValidateIssuer = !string.IsNullOrWhiteSpace(_jwt.Issuer),
                ValidIssuer = _jwt.Issuer,
                ValidateAudience = !string.IsNullOrWhiteSpace(_jwt.Audience),
                ValidAudience = _jwt.Audience,
                ValidateLifetime = validateLifetime,
                ClockSkew = TimeSpan.FromMinutes(1),
                NameClaimType = "sub",
                RoleClaimType = ClaimTypes.Role,
            };

            return new JwtSecurityTokenHandler().ValidateToken(token, parameters, out _);
        }

        private (string Token, long ExpiresInSeconds) CreateToken(IEnumerable<Claim> claims, TimeSpan lifetime)
        {
            var keyBytes = Encoding.UTF8.GetBytes(_jwt.SecretKey.Trim());
            var credentials = new SigningCredentials(new SymmetricSecurityKey(keyBytes), SecurityAlgorithms.HmacSha256);

            var now = DateTime.UtcNow;
            var expires = now.Add(lifetime);

            var token = new JwtSecurityToken(
                issuer: string.IsNullOrWhiteSpace(_jwt.Issuer) ? null : _jwt.Issuer,
                audience: string.IsNullOrWhiteSpace(_jwt.Audience) ? null : _jwt.Audience,
                claims: claims,
                notBefore: now,
                expires: expires,
                signingCredentials: credentials
            );

            var serialized = new JwtSecurityTokenHandler().WriteToken(token);
            var expiresIn = (long)lifetime.TotalSeconds;
            return (serialized, expiresIn);
        }
    }
}
