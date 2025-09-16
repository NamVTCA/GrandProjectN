import React, { useMemo, useState, useEffect } from 'react';
import { Image, ImageProps, ImageSourcePropType } from 'react-native';

type SafeImgProps = ImageProps & {
  fallback: ImageSourcePropType;
  lockOnError?: boolean;
};

function isSuspiciousSrc(src: any): boolean {
  if (!src) return true;
  
  if (typeof src === 'string') {
    const s = src.trim();
    if (!s) return true;
    return /(undefined|null|^data:,$|^\s*$|\/uploads\/?$)/i.test(s);
  }
  
  // For require() or other image sources
  return false;
}

const SafeImg: React.FC<SafeImgProps> = ({
  source,
  fallback,
  onError,
  lockOnError = true,
  ...rest
}) => {
  const [broken, setBroken] = useState(false);
  const [lastSource, setLastSource] = useState<any>(null);

  const isBad = useMemo(() => isSuspiciousSrc(source), [source]);

  const resolvedSource = useMemo(() => {
    if (isBad) return fallback;
    if (lockOnError && broken) return fallback;
    return source;
  }, [source, fallback, broken, lockOnError, isBad]);

  useEffect(() => {
    if (source !== lastSource) {
      setBroken(false);
      setLastSource(source);
    }
  }, [source, lastSource]);

  const handleError = (error: any) => {
    setBroken(true);
    if (onError) {
      onError(error);
    }
  };

  return (
    <Image
      source={resolvedSource}
      onError={handleError}
      {...rest}
    />
  );
};

export default SafeImg;