using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Text;
using System.Text;
using System.Linq;

//genuinely can't believe this is what you have to do to get the equivalent of a fucking macro
//stupid fucking language
//fuck

[Generator]
public class NetworkPropertyGenerator : IIncrementalGenerator
{
    public void Initialize(IncrementalGeneratorInitializationContext context)
    {
        // 1. Filter for properties with our attribute and the 'partial' keyword
        var provider = context.SyntaxProvider
            .CreateSyntaxProvider(
                predicate: (s, _) => s is PropertyDeclarationSyntax p && p.AttributeLists.Count > 0,
                transform: (ctx, _) => GetSemanticTarget(ctx))
            .Where(t => t is not null);

        // 2. Generate the code
        context.RegisterSourceOutput(provider, (spc, target) => Execute(spc, target!));
    }

    private static PropertyDeclarationSyntax? GetSemanticTarget(GeneratorSyntaxContext ctx)
    {
        var property = (PropertyDeclarationSyntax)ctx.Node;
        foreach (var attrList in property.AttributeLists)
        {
            foreach (var attr in attrList.Attributes)
            {
                if (ctx.SemanticModel.GetSymbolInfo(attr).Symbol is IMethodSymbol attrSymbol &&
                    attrSymbol.ContainingType.Name == "AutoNetworkedFieldAttribute")
                {
                    return property;
                }
            }
        }
        return null;
    }

    public static string GetClassUsings(ClassDeclarationSyntax classDeclaration)
{
        // 1. Find the CompilationUnit (the root of the file)
        var root = classDeclaration.SyntaxTree.GetRoot();

        // 2. Extract all using directives
        var usings = root.DescendantNodes()
                        .OfType<UsingDirectiveSyntax>()
                        .Select(u => u.ToString());

        // 3. Join them into a single string with newlines
        return string.Join("\n", usings);
    }

    private void Execute(SourceProductionContext context, PropertyDeclarationSyntax property)
    {
        var classDecl = property.Parent as ClassDeclarationSyntax;
        if (classDecl == null) return;

        // Ensure the namespace is dynamically pulled from the class
        var namespaceName = "Unknown";
        if (classDecl.Parent is NamespaceDeclarationSyntax ns) {
            namespaceName = ns.Name.ToString();
        } else if (classDecl.Parent is FileScopedNamespaceDeclarationSyntax fns) {
            namespaceName = fns.Name.ToString();
        }
        var className = classDecl.Identifier.Text;
        var propertyName = property.Identifier.Text;
        var propertyType = property.Type.ToString();
        var fieldName = $"_{propertyName.ToLower()}";

        var usings = GetClassUsings(classDecl);
        // The C# 13 magic: We provide the implementation for the 'partial' property
        var source = $@"
{usings}
namespace {namespaceName}
{{
    partial class {className}
    {{
        private {propertyType} {fieldName};

        public partial {propertyType} {propertyName}
        {{
            get => {fieldName};
            set
            {{
                if (!Equals({fieldName}, value))
                {{
                    {fieldName} = value;
                    NetworkManager.MarkDirty(this, ""{propertyName}"");
                }}
            }}
        }}
    }}
}}";
        context.AddSource($"{className}_{propertyName}.g.cs", SourceText.From(source, Encoding.UTF8));
    }
}
