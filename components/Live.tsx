import { useMyPresence, useOthers } from "@/liveblocks.config";
import LiveCursors from "./cursor/LiveCursors";
import React, { useCallback, useEffect, useState } from "react";
import CursorChat from "./cursor/CursorChat";
import { CursorMode, CursorState, Reaction } from "@/types/type";
import ReactionSelector from "./reaction/ReactionButton";
import FlyingReaction from "./reaction/FlyingReaction";

const Live = () => {
  const others = useOthers();
  const [{ cursor }, updateMyPresence] = useMyPresence() as any;

  const [cursorState, setCursorState] = useState<CursorState>({
    mode: CursorMode.Hidden
  });
  const [reaction, setReaction] = useState<Reaction[]>([] as Reaction[]);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      event.preventDefault();

      if (cursor == null || cursorState.mode !== CursorMode.ReactionSelector) {
        const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
        const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

        updateMyPresence({ cursor: { x, y } });
      }
    },
    [cursor, cursorState.mode, updateMyPresence]
  );

  const handlePointerLeave = useCallback(
    (event: React.PointerEvent) => {
      event.preventDefault();

      setCursorState({ mode: CursorMode.Hidden });

      updateMyPresence({ cursor: null, message: null });
    },
    [updateMyPresence]
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      event.preventDefault();

      const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
      const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

      updateMyPresence({ cursor: { x, y } });

      setCursorState((prev: CursorState) =>
        cursorState.mode === CursorMode.Reaction
          ? {
              ...prev,
              isPressed: true
            }
          : prev
      );
    },
    [cursorState.mode, updateMyPresence]
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent) => {
      setCursorState((prev: CursorState) =>
        cursorState.mode === CursorMode.Reaction
          ? {
              ...prev,
              isPressed: true
            }
          : prev
      );
    },
    [cursorState.mode]
  );

  useEffect(() => {
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "/") {
        e.preventDefault();

        setCursorState({
          mode: CursorMode.Chat,
          previousMessage: null,
          message: ""
        });
      } else if (e.key === "Escape") {
        e.preventDefault();

        updateMyPresence({ message: "" });
        setCursorState((prev) => {
          return {
            ...prev,
            mode: CursorMode.Hidden
          };
        });
      } else if (["e", "E"].includes(e.key)) {
        setCursorState({
          mode: CursorMode.ReactionSelector
        });
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/") {
        e.preventDefault();
      }
    };

    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [updateMyPresence]);

  const setReactions = useCallback((reaction: string) => {
    setCursorState({
      mode: CursorMode.Reaction,
      reaction,
      isPressed: false
    });
  }, []);

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className="h-[100vh] w-full flex justify-center items-center text-center"
    >
      <h1 className="text-2xl text-white">Liveblocks Figma Clone</h1>

      {reaction.map((r) => (
        <FlyingReaction
          key={r.timestamp.toString()}
          x={r.point.x}
          y={r.point.y}
          timestamp={r.timestamp}
          value={r.value}
        />
      ))}

      {cursor ? (
        <CursorChat
          cursor={cursor}
          cursorState={cursorState}
          setCursorState={setCursorState}
          updateMyPresence={updateMyPresence}
        />
      ) : null}

      {cursorState.mode === CursorMode.ReactionSelector ? (
        <ReactionSelector setReaction={setReactions} />
      ) : null}

      <LiveCursors others={others} />
    </div>
  );
};

export default Live;
