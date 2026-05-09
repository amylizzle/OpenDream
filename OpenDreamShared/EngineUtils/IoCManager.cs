using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Reflection;
using JetBrains.Annotations;

namespace OpenDreamShared.EngineUtils;

public static class IoCManager {
    private static Dictionary<Type, object> singletonCache = new();
    private static Dictionary<Type, Type> typeRegister = new();

    private static RegisteredType InternalResolve<RegisteredType>() {
        if (singletonCache.TryGetValue(typeof(RegisteredType), out var instance)) {
            return (RegisteredType)instance;
        } else if (typeRegister.TryGetValue(typeof(RegisteredType), out var objectType)) {
            var constructors =
                objectType.GetConstructors(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);

            if (constructors.Length != 1)
                throw new InvalidOperationException(
                    $"Dependency '{typeof(RegisteredType).FullName}' requires exactly one constructor.");

            var chosenConstructor = constructors[0];
            var constructorParams = constructors[0].GetParameters();
            var parameters = new object[constructorParams.Length];

            for (var index = 0; index < constructorParams.Length; index++) {
                var param = constructorParams[index];

                if (TryResolveType(param.ParameterType, out var paraminstance)) {
                    parameters[index] = paraminstance;
                } else {
                    throw new InvalidOperationException(
                        $"Dependency '{typeof(RegisteredType).FullName}' ctor has unknown dependency {param.ParameterType.FullName}");
                }
            }
            singletonCache.Add(typeof(RegisteredType), chosenConstructor);
            instance = chosenConstructor.Invoke(parameters);
            singletonCache[typeof(RegisteredType)]= instance;
            return (RegisteredType)instance;
        } else {
            throw new Exception($"Unregistered type: {typeof(RegisteredType).FullName}");
        }
    }
    public static void Register<[MeansImplicitUse] TImplementation>(bool overwrite = false) {
        typeRegister.Add(typeof(TImplementation), typeof(TImplementation));
    }

    public static void Register<TInterface, [MeansImplicitUse] TImplementation>(bool overwrite = false)
            where TImplementation : class, TInterface
            where TInterface : class {
        typeRegister.Add(typeof(TInterface), typeof(TImplementation));
    }

    public static bool TryResolveType<T>([NotNullWhen(true)] out T? instance) {
        if (TryResolveType(typeof(T), out object? rawInstance)) {
            if (rawInstance is T typedInstance) {
                instance = typedInstance;
                return true;
            }
        }

        instance = default;
        return false;
    }

    public static bool TryResolveType(Type objectType, [MaybeNullWhen(false)] out object instance) {
        if (!singletonCache.TryGetValue(objectType, out instance)) {
            instance = Activator.CreateInstance(objectType, []);
            return instance is not null;
        } else
            return true;
    }

    public static T Resolve<T>() {
        return InternalResolve<T>();
    }
}
