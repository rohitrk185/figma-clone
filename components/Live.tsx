import {
  useBroadcastEvent,
  useEventListener,
  useMyPresence
} from "@/liveblocks.config";
import LiveCursors from "./cursor/LiveCursors";
import React, { useCallback, useEffect, useState } from "react";
import CursorChat from "./cursor/CursorChat";
import { CursorMode, CursorState, Reaction } from "@/types/type";
import ReactionSelector from "./reaction/ReactionButton";
import FlyingReaction from "./reaction/FlyingReaction";
import useInterval from "@/hooks/useInterval";
import { Comments } from "./comments/Comments";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from "@/components/ui/context-menu";
import { shortcuts } from "@/constants";

type TLiveProps = {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  undo: () => void;
  redo: () => void;
};

const Live = ({ canvasRef, undo, redo }: TLiveProps) => {
  const [{ cursor }, updateMyPresence] = useMyPresence();
  const broadcast = useBroadcastEvent();

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

  const setReactions = useCallback((reaction: string) => {
    setCursorState({
      mode: CursorMode.Reaction,
      reaction,
      isPressed: false
    });
  }, []);

  const handleContextMenuClick = useCallback((key: string) => {
    switch (key) {
      case "Chat":
        setCursorState({
          mode: CursorMode.Chat,
          previousMessage: null,
          message: ""
        });
        break;

      case "Undo":
        undo();
        break;

      case "Redo":
        break;
    }
  }, []);

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

  useInterval(
    () => {
      setReaction((prev) => {
        return prev.filter((p) => p.timestamp < Date.now() - 4000);
      });
    },
    reaction.length ? 1000 : null,
    reaction.length ? 5000 : null
  );

  useInterval(
    () => {
      if (!cursor) return;

      if (cursorState.mode === CursorMode.Reaction && cursorState.isPressed) {
        setReaction((prev) => {
          return prev.concat([
            {
              point: {
                x: cursor.x,
                y: cursor.y
              },
              value: cursorState.reaction,
              timestamp: Date.now()
            }
          ]);
        });

        broadcast({
          x: cursor.x,
          y: cursor.y,
          value: cursorState.reaction
        });
        console.log("broadcasted event");
      }
    },
    cursorState.mode === CursorMode.Reaction && cursorState.isPressed
      ? 120
      : null,
    2000
  );

  useEventListener((eventData) => {
    console.log("in useEventListener: ", eventData.event);
    const event = eventData.event;

    setReaction((prev) => {
      return prev.concat([
        {
          point: {
            x: event.x,
            y: event.y
          },
          value: event.value,
          timestamp: Date.now()
        }
      ]);
    });
  });

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          id="canvas"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          className="relative h-full flex flex-1 w-full justify-center items-center"
        >
          {/* <h1 className="text-2xl text-white">Liveblocks Figma Clone</h1> */}
          <canvas ref={canvasRef} />

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

          <LiveCursors />

          <Comments />
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="right-menu-content">
        {shortcuts.map((shortcut) => (
          <ContextMenuItem
            key={shortcut.key}
            onClick={() => handleContextMenuClick(shortcut.name)}
            className="right-menu-item"
          >
            <p>{shortcut.name}</p>
            <p className="text-xs text-primary-grey-300">{shortcut.shortcut}</p>
          </ContextMenuItem>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default Live;
