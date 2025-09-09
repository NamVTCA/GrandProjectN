import React, { useMemo, useState, useEffect } from 'react';

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallback: string;
  /** Nếu true, khi đã lỗi 1 lần thì luôn khóa về fallback cho tới khi prop src đổi sang URL mới hợp lệ */
  lockOnError?: boolean;
};

function isSuspiciousSrc(src?: string | null) {
  if (!src) return true;
  const s = String(src).trim();
  if (!s) return true;
  // Những pattern hay gặp khi BE trả rỗng
  return /(undefined|null|^data:,$|^\s*$|\/uploads\/?$)/i.test(s);
}

const SafeImg: React.FC<Props> = ({
  src,
  fallback,
  onError,
  alt = '',
  lockOnError = true,
  ...rest
}) => {
  const [broken, setBroken] = useState(false);
  const [lastSrc, setLastSrc] = useState<string | null>(null);

  // Khi prop src thay đổi, nếu là URL "khả nghi" thì coi như broken luôn
  const isBad = isSuspiciousSrc(src);

  const resolvedSrc = useMemo(() => {
    if (isBad) return fallback;
    if (lockOnError && broken) return fallback;
    return String(src);
  }, [src, fallback, broken, lockOnError, isBad]);

  useEffect(() => {
    const s = isBad ? null : String(src);
    if (s !== lastSrc) {
      // Nguồn đã đổi → reset trạng thái broken để thử tải lại
      setBroken(false);
      setLastSrc(s);
    }
  }, [src, isBad, lastSrc]);

  return (
    <img
      alt={alt}
      src={resolvedSrc}
      onError={(e) => {
        // Khóa về fallback nếu lỗi, không cho loop giữa prop src cũ và fallback
        setBroken(true);
        const img = e.currentTarget;
        img.onerror = null;
        img.src = fallback;
        onError?.(e);
      }}
      width={rest.width ?? 40}
      height={rest.height ?? 40}
      decoding="async"
      loading="lazy"
      draggable={false}
      {...rest}
    />
  );
};

export default SafeImg;
