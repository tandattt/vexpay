using System.ComponentModel;
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace VexPay.OpenApi
{
    /// <summary>
    /// Gắn tên và mô tả enum vào OpenAPI để FE docs hiển thị rõ (không chỉ 0 | 1).
    /// </summary>
    public sealed class EnumSchemaFilter : ISchemaFilter
    {
        public void Apply(IOpenApiSchema schema, SchemaFilterContext context)
        {
            if (!context.Type.IsEnum)
            {
                return;
            }

            var names = Enum.GetNames(context.Type);
            var values = Enum.GetValues(context.Type).Cast<object>().ToArray();
            var descriptions = new List<string>();
            var lines = new List<string>();

            for (var i = 0; i < names.Length; i++)
            {
                var numeric = Convert.ToInt64(values[i]);
                var member = context.Type.GetMember(names[i]).FirstOrDefault();
                var summary = member?.GetCustomAttribute<DescriptionAttribute>()?.Description;
                descriptions.Add(summary ?? names[i]);
                lines.Add(summary is null
                    ? $"{numeric} = {names[i]}"
                    : $"{numeric} = {names[i]} — {summary}");
            }

            schema.Description = string.Join("\n", lines);

            if (schema.Extensions is null)
            {
                return;
            }

            var varnamesNode = JsonSerializer.SerializeToNode(names);
            var descriptionsNode = JsonSerializer.SerializeToNode(descriptions);
            if (varnamesNode is not null)
            {
                schema.Extensions["x-enum-varnames"] = new JsonNodeExtension(varnamesNode);
            }

            if (descriptionsNode is not null)
            {
                schema.Extensions["x-enum-descriptions"] = new JsonNodeExtension(descriptionsNode);
            }
        }
    }
}
