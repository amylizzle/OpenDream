using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Dynamic;
using System.Reflection;
using JetBrains.Annotations;

public static class IoCManager {
    private static Dictionary<Type, object> singletonCache = new();

    public static void Register<TInterface, [MeansImplicitUse] TImplementation>(bool overwrite = false)
            where TImplementation : class, TInterface
            where TInterface : class
    {
            var objectType = typeof(TImplementation);
            var constructors =
                objectType.GetConstructors(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);

            if (constructors.Length != 1)
                throw new InvalidOperationException(
                    $"Dependency '{typeof(TImplementation).FullName}' requires exactly one constructor.");

            var chosenConstructor = constructors[0];
            var constructorParams = constructors[0].GetParameters();
            var parameters = new object[constructorParams.Length];

            for (var index = 0; index < constructorParams.Length; index++)
            {
                var param = constructorParams[index];

                if (TryResolveType(param.ParameterType, out var instance))
                {
                    parameters[index] = instance;
                }
                else
                {
                    throw new InvalidOperationException(
                        $"Dependency '{typeof(TImplementation).FullName}' ctor has unknown dependency {param.ParameterType.FullName}");
                }
            }

            singletonCache.Add(typeof(TInterface), (TImplementation)chosenConstructor.Invoke(parameters));
    }

    public static bool TryResolveType<T>([NotNullWhen(true)] out T? instance)
    {
        if (TryResolveType(typeof(T), out object? rawInstance))
        {
            if (rawInstance is T typedInstance)
            {
                instance = typedInstance;
                return true;
            }
        }

        instance = default;
        return false;
    }

    public static bool TryResolveType(Type objectType, [MaybeNullWhen(false)] out object instance)
    {
        if(!singletonCache.TryGetValue(objectType, out instance)) {
            instance = Activator.CreateInstance(objectType, []);
            return instance is not null;
        } else
            return true;
    }

    public static T Resolve<T>() {
        if(singletonCache.TryGetValue(typeof(T), out var instance)) {
            return (T)instance;
        } else {
            instance = (T)new Object();
            singletonCache.Add(typeof(T), instance);
            return (T)instance;
        }
    }
}
