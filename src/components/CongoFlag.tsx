export function CongoFlag({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 3 2"
      className={className}
      aria-label="Drapeau du Congo Brazzaville"
    >
      <rect width="3" height="2" fill="#DC241F" />
      <polygon points="0,0 2,0 0,2" fill="#009543" />
      <polygon points="0,2 1,2 3,0 2,0" fill="#F1C400" />
    </svg>
  );
}
