"use client";

import { fabric } from "fabric";
import Live from "@/components/Live";
import Navbar from "@/components/Navbar";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import {
  handleCanvasMouseDown,
  handleCanvasMouseUp,
  handleCanvasObjectModified,
  handleCanvasSelectionCreated,
  handleCanvaseMouseMove,
  handleResize,
  initializeFabric,
  renderCanvas
} from "@/lib/canvas";
import { ActiveElement } from "@/types/type";
import { useMutation, useRedo, useStorage, useUndo } from "@/liveblocks.config";
import { defaultNavElement } from "@/constants";
import { handleDelete, handleKeyDown } from "@/lib/key-events";
import { handleImageUpload } from "@/lib/shapes";

export default function Page() {
  const undo = useUndo();
  const redo = useRedo();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const isDrawing = useRef(false);
  const shapeRef = useRef<fabric.Object>(null);
  const selectedShapeRef = useRef<string>();
  const [activeElement, setActiveElement] =
    useState<ActiveElement>(defaultNavElement);
  // const [activeElement, setActiveElement] = useState<ActiveElement>({
  //   name: "",
  //   value: "",
  //   icon: ""
  // });
  const activeObjectRef = useRef<fabric.Object>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const isEditingRef = useRef(false);

  const canvasObjects = useStorage((root) => root.canvasObjects);
  const syncShapeInStorage = useMutation(({ storage }, object) => {
    if (!object) return;

    const { objectId } = object;

    const shapeData = object.toJSON();
    shapeData.objectId = objectId;

    const canvasObjects = storage.get("canvasObjects");

    canvasObjects?.set(objectId, shapeData);
  }, []);

  const deleteAllShapes = useMutation(({ storage }) => {
    const canvasObjects = storage.get("canvasObjects");

    if (!canvasObjects || canvasObjects.size === 0) return;

    // @ts-ignore
    for (const [key, value] of canvasObjects.entries()) {
      canvasObjects.delete(key);
    }

    return canvasObjects.size === 0;
  }, []);

  const deleteShapeFromStorage = useMutation(({ storage }, objectId) => {
    const canvasObjects = storage.get("canvasObjects");

    canvasObjects.delete(objectId);
  }, []);

  const handleActiveElement = (elem: ActiveElement) => {
    setActiveElement(elem);

    switch (elem?.value) {
      case "reset":
        deleteAllShapes();
        fabricRef.current?.clear();
        // setActiveElement(defaultNavElement);
        break;

      case "delete":
        handleDelete(
          fabricRef.current as fabric.Canvas,
          deleteShapeFromStorage
        );
        // setActiveElement(defaultNavElement);
        break;

      case "image":
        imageInputRef.current?.click();
        isDrawing.current = false;
        if (fabricRef.current) {
          fabricRef.current.isDrawingMode = false;
        }
        break;

      default:
        break;
    }

    if (elem?.value) {
      const selectedShape = elem?.value as string;
      selectedShapeRef.current = selectedShape;
    }
  };

  useEffect(() => {
    const canvas = initializeFabric({ canvasRef, fabricRef });

    console.log("canvas: ", canvas);

    canvas.on("mouse:down", (options) => {
      console.log("in mouse down: ");
      handleCanvasMouseDown({
        options,
        canvas,
        isDrawing,
        shapeRef,
        selectedShapeRef
      });
      console.log("done in mouse down: ");
    });

    canvas.on("mouse:up", (options) => {
      console.log("in mouse up: ");
      handleCanvasMouseUp({
        canvas,
        isDrawing,
        shapeRef,
        activeObjectRef,
        selectedShapeRef,
        syncShapeInStorage,
        setActiveElement
      });
      console.log("done in mouse up: ");
    });

    canvas.on("mouse:move", (options) => {
      console.log("in mouse move: ");
      handleCanvaseMouseMove({
        options,
        canvas,
        isDrawing,
        shapeRef,
        selectedShapeRef,
        syncShapeInStorage
      });
      console.log("done in mouse m: ");
    });

    canvas.on("object:modified", (options) => {
      console.log("in mouse modified: ");
      handleCanvasObjectModified({
        options,
        syncShapeInStorage
      });
      console.log("done in mouse modified: ");
    });

    canvas.on("selection:created", (options) => {
      handleCanvasSelectionCreated({
        options,
        isEditingRef,
        setElementAttributes
      });
    });

    window.addEventListener("resize", () => {
      handleResize({ canvas });
    });

    window.addEventListener("keydown", (e) => {
      handleKeyDown({
        e,
        canvas,
        undo,
        redo,
        syncShapeInStorage,
        deleteShapeFromStorage
      });
    });

    return () => {
      canvas.dispose();
      window.removeEventListener("resize", () => {
        handleResize({ canvas });
      });

      window.removeEventListener("keydown", (e) => {
        handleKeyDown({
          e,
          canvas,
          undo,
          redo,
          syncShapeInStorage,
          deleteShapeFromStorage
        });
      });
    };
  }, []);

  useEffect(() => {
    renderCanvas({
      fabricRef,
      canvasObjects,
      activeObjectRef
    });
  }, [canvasObjects]);

  return (
    <main className="h-screen overflow-hidden">
      <Navbar
        activeElement={activeElement}
        handleActiveElement={handleActiveElement}
        imageInputRef={imageInputRef}
        handleImageUpload={(e) => {
          e.stopPropagation();

          if (e.target?.files?.length) {
            handleImageUpload({
              file: e.target.files[0],
              canvas: fabricRef as any,
              shapeRef,
              syncShapeInStorage
            });
          }
        }}
      />

      <section className="flex h-full flex-row">
        <LeftSidebar allShapes={Array.from(canvasObjects)} />
        <Live canvasRef={canvasRef} />
        <RightSidebar />
      </section>
    </main>
  );
}
