import { useEffect, useRef } from "react";

// From Dan Abramov's blog: https://overreacted.io/making-setinterval-declarative-with-react-hooks/

export default function useInterval(
  callback: () => void,
  delay: number | null,
  endAfter: number | null
) {
  const savedCallback = useRef<() => void>(callback);

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    const tick = () => {
      savedCallback.current();
      console.log("tick");
    };

    if (delay !== null) {
      let id = setInterval(tick, delay);
      if (endAfter) {
        setTimeout(() => {
          clearInterval(id);
        }, 2000);
      }
      return () => clearInterval(id);
    }
  }, [delay]);
}
