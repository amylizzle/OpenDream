using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization.Metadata;
using OpenDreamShared.EngineUtils;

namespace OpenDreamShared.EngineUtils;

public static class SerializationManager {

    public static object Read(Dictionary<string, object> valuePairs) {
        if (valuePairs.TryGetValue("type", out object? typeString) && (string)typeString != string.Empty) {
            Type? targetType = Type.GetType((string)typeString);
            if (targetType is null)
                throw new ArgumentException($"Invalid type {(string)typeString}");
            object? result = Activator.CreateInstance(targetType);
            if (result is null)
                throw new ArgumentException($"Unable to create new instance of {targetType}, does it not have a 0 arg constructor?");
            PopulateFromDictionary(result, valuePairs);
            return result;
        } else {
            throw new ArgumentException("key/value pairs passed to SerializationManager.Read *MUST* contain a valid type string");
        }
    }

    public static T Read<T>(Dictionary<string, object> valuePairs) {
        valuePairs["type"] = typeof(T).AssemblyQualifiedName!;
        return (T)Read(valuePairs);
    }

    public static object Read(Type type, Dictionary<string, object> valuePairs) {
        valuePairs["type"] = type.AssemblyQualifiedName!;
        return Read(valuePairs);
    }

    public static Dictionary<string, object> ToKeyValueMap(object serializableObject) {
        Dictionary<string, object> result = new();
        Type type = serializableObject.GetType();
        result.Add("type", type.AssemblyQualifiedName!);
        FieldInfo[] fields = type.GetFields(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);

        foreach (FieldInfo field in fields) {
            var attribute = field.GetCustomAttribute<DataField>();

            if (attribute != null) {
                result[attribute.ParsingName] = field.GetValue(serializableObject)!;
            }

        }
        return result;
    }

    public static Dictionary<string, object> ToKeyValueMap(Type type, object serializableObject) {
        Dictionary<string, object> result = new();
        FieldInfo[] fields = type.GetFields(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);

        foreach (FieldInfo field in fields) {
            var attribute = field.GetCustomAttribute<DataField>();

            if (attribute != null) {
                result[attribute.ParsingName] = field.GetValue(serializableObject)!;
            }

        }
        return result;
    }

    public static void Serialize(MemoryStream memoryStream, object target) {
        var kvDict = ToKeyValueMap(target);
        string serilaized = JsonSerializer.Serialize(kvDict);
        BinaryWriter writer = new(memoryStream);
        writer.Write(serilaized);
    }

    public static T Deserialize<T>(MemoryStream memoryStream) {
        BinaryReader reader = new(memoryStream);
        string jsonString = reader.ReadString();
        var kvJson = (Dictionary<string, object>) JsonSerializer.Deserialize(jsonString, JsonTypeInfo.CreateJsonTypeInfo(typeof(Dictionary<string,object>), new()))!;
        return Read<T>(kvJson);
    }

    public static T CreateCopy<T>(T copiedObject) {
        if (copiedObject is null)
            throw new ArgumentNullException();

        var kvMap = ToKeyValueMap(copiedObject);
        return Read<T>(kvMap);
    }

    private static void PopulateFromDictionary(object target, Dictionary<string, object> mapValues) {
        if (target == null) return;

        Type type = target.GetType();
        FieldInfo[] fields = type.GetFields(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);

        foreach (FieldInfo field in fields) {
            var attribute = field.GetCustomAttribute<DataField>();

            if (attribute != null) {
                if (mapValues.TryGetValue(attribute.ParsingName, out object? value)) {
                    try {
                        object convertedValue = Convert.ChangeType(value, field.FieldType);
                        field.SetValue(target, convertedValue);
                    } catch (Exception ex) {
                        Console.WriteLine($"Could not set field {field.Name}: {ex.Message}");
                    }
                }
            }
        }
    }
}
