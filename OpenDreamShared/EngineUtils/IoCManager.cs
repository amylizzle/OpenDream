using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Reflection;

public static class IoCManager {
    private static Dictionary<Type, Object> singletonCache = new();

    public static void Register<T>() {

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

    public static void InjectDependencies(Object instance) {
    }
}
