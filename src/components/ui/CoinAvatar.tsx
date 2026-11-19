import Image from 'next/image';

interface CoinAvatarProps {
  src?: string;
  name: string;
  size?: number;
}

/** Coin logos are remote SVG/PNG files of unknown dimensions, so they are rendered unoptimised. */
export function CoinAvatar({ src, name, size = 32 }: CoinAvatarProps) {
  if (!src) {
    return (
      <div
        aria-hidden="true"
        className="flex items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-slate-300"
        style={{ width: size, height: size }}
      >
        {name.slice(0, 1).toUpperCase()}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      unoptimized
      className="rounded-full"
      style={{ width: size, height: size }}
    />
  );
}
