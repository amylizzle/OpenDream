using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Numerics;
using System.Runtime.CompilerServices;


namespace OpenDreamShared.EngineUtils;
public class SeededRandom(int seed) {
    private Random random = new Random(seed);

    /// <summary> Get random <see cref="float"/> value in range of <paramref name="minValue"/> (included) and <paramref name="maxValue"/> (excluded). </summary>
    /// <param name="minValue">Random value should be greater or equal to this value.</param>
    /// <param name="maxValue">Random value should be less then this value.</param>
    public float NextFloat(float minValue, float maxValue)
        => NextFloat() * (maxValue - minValue) + minValue;

    /// <summary> Get random <see cref="float"/> value in range of 0 (included) and <paramref name="maxValue"/> (excluded). </summary>
    /// <param name="maxValue">Random value should be less then this value.</param>
    public float NextFloat(float maxValue) => NextFloat() * maxValue;

    /// <summary> Get random <see cref="byte"/> value between 0 (included) and <see cref="byte.MaxValue"/> (excluded). </summary>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public byte NextByte()
        => NextByte(byte.MaxValue);

    /// <summary> Get random <see cref="byte"/> value in range of 0 (included) and <paramref name="maxValue"/> (excluded). </summary>
    /// <param name="maxValue">Random value should be less then this value.</param>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public byte NextByte(byte maxValue)
        => NextByte(0, maxValue);

    /// <summary> Get random <see cref="byte"/> value in range of <paramref name="minValue"/> (included) and <paramref name="maxValue"/> (excluded). </summary>
    /// <param name="minValue">Random value should be greater or equal to this value.</param>
    /// <param name="maxValue">Random value should be less then this value.</param>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public byte NextByte(byte minValue, byte maxValue)
        => (byte)Next(minValue, maxValue);

    /// <summary> Get random <see cref="double"/> value in range of 0 (included) and <paramref name="maxValue"/> (excluded). </summary>
    /// <param name="maxValue">Random value should be less then this value.</param>
    double Next(double maxValue)
        => NextDouble() * maxValue;

    /// <summary> Get random <see cref="double"/> value in range of <paramref name="minValue"/> (included) and <paramref name="maxValue"/> (excluded). </summary>
    /// <param name="minValue">Random value should be greater or equal to this value.</param>
    /// <param name="maxValue">Random value should be less then this value.</param>
    double NextDouble(double minValue, double maxValue)
        => NextDouble() * (maxValue - minValue) + minValue;

    /// <summary>
    ///     Random vector, created from a uniform distribution of magnitudes and angles.
    /// </summary>
    /// <param name="maxMagnitude">Max value for randomized vector magnitude (excluded).</param>
    public Vector2 NextVector2(float maxMagnitude = 1)
        => NextVector2(0, maxMagnitude);

    /// <summary>
    ///     Random vector, created from a uniform distribution of magnitudes and angles.
    /// </summary>
    /// <param name="minMagnitude">Min value for randomized vector magnitude (included).</param>
    /// <param name="maxMagnitude">Max value for randomized vector magnitude (excluded).</param>
    /// <remarks>
    ///     In general, NextVector2(1) will tend to result in vectors with smaller magnitudes than
    ///     NextVector2Box(1,1), even if you ignored any vectors with a magnitude larger than one.
    /// </remarks>
    public Vector2 NextVector2(float minMagnitude, float maxMagnitude)
        => (new Vector2(NextFloat(minMagnitude, maxMagnitude), 0)).Rotate(NextFloat(-180,180));

    /// <summary>
    ///     Random vector, created from a uniform distribution of x and y coordinates lying inside some box.
    /// </summary>
    public Vector2 NextVector2Box(float minX, float minY, float maxX, float maxY)
        => new Vector2(NextFloat(minX, maxX), NextFloat(minY, maxY));

    /// <summary>
    ///     Random vector, created from a uniform distribution of x and y coordinates lying inside some box.
    ///     Box will have coordinates starting at [-<paramref name="maxAbsX"/> , -<paramref name="maxAbsY"/>]
    ///     and ending in [<paramref name="maxAbsX"/> , <paramref name="maxAbsY"/>]
    /// </summary>
    public Vector2 NextVector2Box(float maxAbsX = 1, float maxAbsY = 1)
        => NextVector2Box(-maxAbsX, -maxAbsY, maxAbsX, maxAbsY);

    public float NextFloat()
    {
        // This is pretty much the CoreFX implementation.
        // So credits to that.
        // Except using float instead of double.
        return Next() * 4.6566128752458E-10f;
    }

    public int Next()
    {
        return random.Next();
    }

    public int Next(int minValue, int maxValue)
    {
        return random.Next(minValue, maxValue);
    }

    public TimeSpan Next(TimeSpan minTime, TimeSpan maxTime)
    {
        DebugTools.Assert(minTime <= maxTime);
        return minTime + (maxTime - minTime) * random.NextDouble();
    }

    public TimeSpan Next(TimeSpan maxTime)
    {
        return Next(TimeSpan.Zero, maxTime);
    }

    public int Next(int maxValue)
    {
        return random.Next(maxValue);
    }

    public double NextDouble()
    {
        return random.NextDouble();
    }

    public void NextBytes(byte[] buffer)
    {
        random.NextBytes(buffer);
    }
    public double NextGaussian(double μ = 0, double σ = 1)
    {
        // https://stackoverflow.com/a/218600
        var α = random.NextDouble();
        var β = random.NextDouble();

        var randStdNormal = Math.Sqrt(-2.0 * Math.Log(α)) * Math.Sin(2.0 * Math.PI * β);

        return μ + σ * randStdNormal;
    }

    /// <summary>Picks a random element from a collection.</summary>
    public T Pick<T>(IReadOnlyList<T> list)
    {
        var index = random.Next(list.Count);
        return list[index];
    }

    /// <summary>Picks a random element from a collection.</summary>
    /// <remarks>
    ///     This is O(n).
    /// </remarks>
    public T Pick<T>(IReadOnlyCollection<T> collection)
    {
        var index = random.Next(collection.Count);
        var i = 0;
        foreach (var t in collection)
        {
            if (i++ == index)
            {
                return t;
            }
        }

        throw new UnreachableException("This should be unreachable!");
    }

    /// <summary>
    /// Picks a random element from a list, removes it from list and returns it.
    /// This is O(n) as it preserves the order of other items in the list.
    /// </summary>
    public T PickAndTake<T>(IList<T> list)
    {
        var index = random.Next(list.Count);
        var element = list[index];
        list.RemoveAt(index);
        return element;
    }

    /// <summary>
    /// Picks a random element from a set and returns it.
    /// This is O(n) as it has to iterate the collection until the target index.
    /// </summary>
    [Obsolete("Always use RobustRandom/IRobustRandom, System.Random does not provide any extra functionality.")]
    public T Pick<T>(ICollection<T> collection)
    {
        var index = random.Next(collection.Count);
        var i = 0;
        foreach (var t in collection)
        {
            if (i++ == index)
            {
                return t;
            }
        }

        throw new UnreachableException("This should be unreachable!");
    }

    /// <summary>
    ///     Have a certain chance to return a boolean.
    /// </summary>
    /// <param name="random">The random instance to run on.</param>
    /// <param name="chance">The chance to pass, from 0 to 1.</param>
    public bool Prob(float chance)
    {
        DebugTools.Assert(chance <= 1 && chance >= 0, $"Chance must be in the range 0-1. It was {chance}.");

        return random.NextDouble() < chance;
    }

    /// <inheritdoc cref="GetItems{T}(Robust.Shared.Random.IRobustRandom,System.Collections.Generic.IList{T},int,bool)"/>
    public T[] GetItems<T>(T[] source, int count, bool allowDuplicates = true)
    {
        return GetItems(source.AsSpan(), count, allowDuplicates);
    }

    /// <inheritdoc cref="GetItems{T}(Robust.Shared.Random.IRobustRandom,System.Collections.Generic.IList{T},int,bool)"/>
    public T[] GetItems<T>(Span<T> source, int count, bool allowDuplicates = true)
    {
        if (source.Length == 0 || count <= 0)
            return Array.Empty<T>();

        if (allowDuplicates == false && count >= source.Length)
        {
            var arr = source.ToArray();
            // Explicit type cast to IList<T> to avoid calling the Span<T> overload.
            // We have some tests that rely on mocking of this call, and Moq doesn't support Span<T> atm.
            // https://github.com/space-wizards/RobustToolbox/issues/6329
            Shuffle((IList<T>)arr);
            return arr;
        }

        var sourceCount = source.Length;
        var result = new T[count];

        if (allowDuplicates)
        {
            // TODO RANDOM consider just using System.Random.GetItems()
            // However, the different implementations might mean that lists & arrays shuffled using the same seed
            // generate different results, which might be undesirable?
            for (var i = 0; i < count; i++)
            {
                result[i] = source[random.Next(sourceCount)];
            }

            return result;
        }

        var indices = sourceCount <= 1024 ? stackalloc int[sourceCount] : new int[sourceCount];
        for (var i = 0; i < sourceCount; i++)
        {
            indices[i] = i;
        }

        for (var i = 0; i < count; i++)
        {
            var j = random.Next(sourceCount - i);
            result[i] = source[indices[j]];
            indices[j] = indices[sourceCount - i - 1];
        }

        return result;
    }

    public void Shuffle<T>(IList<T> list)
    {
        var n = list.Count;
        while (n > 1)
        {
            n -= 1;
            var k = random.Next(n + 1);
            (list[k], list[n]) = (list[n], list[k]);
        }
    }
}
