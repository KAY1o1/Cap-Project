import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./notes.module.css";

type NoteMenuProps = {
  onEdit: () => void;
  onDelete: () => void;
};

export default function NoteMenu({ onEdit, onDelete }: NoteMenuProps) {
  // check menu visibilty
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // DOM
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    if (!buttonRef.current) return;
    console.log(styles.carousel);
    console.log(document.querySelector(`.${styles.carousel}`));

    // BUTTON BOUNDS
    const rect = buttonRef.current.getBoundingClientRect();
    console.log(rect);

    setPosition({
      top: rect.bottom + 8,
      left: rect.right - 80, // MENU WIDTH
    });

    setOpen((prev) => !prev);
  };

  // CLOSE WHEN CLICK OUTSIDE
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }

    // FIND CAROUSEL BASED ON CLASS
    const carousel = document.querySelector<HTMLElement>(`.${styles.carousel}`);

    // PREVENT SCROLLING
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
      if (carousel) {
        carousel.style.overflowX = "hidden";
      }
    } else {
      document.body.style.overflow = "";
      if (carousel) {
        carousel.style.overflowX = "auto";
      }
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
      if (carousel) {
        carousel.style.overflowX = "auto";
      }
    };
  }, [open]);

  return (
    <>
      {/* 3DOT MENU SVG */}
      <button
        ref={buttonRef}
        className={styles["menu-button"]}
        onClick={toggleMenu}
      >
        <svg
          width="16"
          height="4"
          viewBox="0 0 16 4"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="2" cy="2" r="2" fill="currentColor" />
          <circle cx="8" cy="2" r="2" fill="currentColor" />
          <circle cx="14" cy="2" r="2" fill="currentColor" />
        </svg>
      </button>

      {/* render portal */}
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className={styles["menu-popup"]}
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              zIndex: 9999,
            }}>
            <button
              onClick={() => {
                onEdit();
                setOpen(false);
              }}>
              Edit
            </button>

            <button
              onClick={() => {
                onDelete();
                setOpen(false);
              }}>
              Delete
            </button>
          </div>,
          document.body
        )}
    </>
  );
}