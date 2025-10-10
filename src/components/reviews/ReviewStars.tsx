export function ReviewStars({ value }: { value: number }) {
  // value like 4.8
  const rounded = Math.round(value * 2) / 2; // halves
  return (
    <span aria-label={`${value.toFixed(1)} out of 5`}>
      {'★★★★★'.split('').map((s, i) => {
        const starIndex = i + 1;
        const full = rounded >= starIndex;
        const half = !full && rounded + 0.5 >= starIndex;
        return (
          <span key={i} className="text-yellow-500">
            {full ? '★' : half ? '⯪' : '☆'}
          </span>
        );
      })}
    </span>
  );
}
