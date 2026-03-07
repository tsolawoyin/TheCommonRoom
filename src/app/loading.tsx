export default function Loading() {
  const letters = "TheCommonRoom".split("");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf9f6]">
      <div className="flex font-(family-name:--font-playfair) text-3xl font-bold tracking-tight">
        {letters.map((letter, i) => (
          <span
            key={i}
            className="inline-block animate-bounce text-[#0a2463]"
            style={{
              animationDelay: `${i * 0.08}s`,
              animationDuration: "0.8s",
            }}
          >
            {letter}
          </span>
        ))}
      </div>
    </div>
  );
}
