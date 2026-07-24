import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
<<<<<<< HEAD
import styles from "./notes.module.css";
=======
>>>>>>> b7a9142ba4a1d64af5c5d1e20ca81933e16684cb

type NoteMenuProps = {
  onEdit: () => void;
  onDelete: () => void;
};

<<<<<<< HEAD
export default function NoteMenu({ onEdit, onDelete }: NoteMenuProps) {
=======
export default function NoteMenu({
  onEdit,
  onDelete,
}: NoteMenuProps) {
>>>>>>> b7a9142ba4a1d64af5c5d1e20ca81933e16684cb
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    if (!buttonRef.current) return;
<<<<<<< HEAD
    console.log(styles.carousel);
    console.log(document.querySelector(`.${styles.carousel}`));

    const rect = buttonRef.current.getBoundingClientRect();
    console.log(rect);
=======

    const rect = buttonRef.current.getBoundingClientRect();
>>>>>>> b7a9142ba4a1d64af5c5d1e20ca81933e16684cb

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

<<<<<<< HEAD
    // FIND CAROUSEL BASED ON CLASS
    const carousel = document.querySelector<HTMLElement>(`.${styles.carousel}`);
=======
    const carousel = document.getElementById("yn-carousel");
>>>>>>> b7a9142ba4a1d64af5c5d1e20ca81933e16684cb

    // PREVENT SCROLLING
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
<<<<<<< HEAD
      if (carousel) {
        carousel.style.overflowX = "hidden";
      }
    } else {
      document.body.style.overflow = "";
      if (carousel) {
        carousel.style.overflowX = "auto";
      }
=======
      if (carousel) { carousel.style.overflowX = "hidden"; }
    } else {
      document.body.style.overflow = "";
      if (carousel) { carousel.style.overflowX = "auto"; }
>>>>>>> b7a9142ba4a1d64af5c5d1e20ca81933e16684cb
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
<<<<<<< HEAD
      if (carousel) {
        carousel.style.overflowX = "auto";
      }
=======
      if (carousel) { carousel.style.overflowX = "auto"; }
>>>>>>> b7a9142ba4a1d64af5c5d1e20ca81933e16684cb
    };
  }, [open]);

  return (
    <>
      {/* 3DOT MENU SVG */}
      <button
        ref={buttonRef}
<<<<<<< HEAD
        className={styles["menu-button"]}
=======
        className="yn-menu-button"
>>>>>>> b7a9142ba4a1d64af5c5d1e20ca81933e16684cb
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

      {open &&
        createPortal(
          <div
            ref={menuRef}
<<<<<<< HEAD
            className={styles["menu-popup"]}
=======
            className="yn-menu-popup"
>>>>>>> b7a9142ba4a1d64af5c5d1e20ca81933e16684cb
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              zIndex: 9999,
            }}>
<<<<<<< HEAD
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
=======

            <button onClick={() => {
              onEdit();
              setOpen(false);
            }}>
              Edit
            </button>

            <button onClick={() => {
              onDelete();
              setOpen(false);
            }}>
>>>>>>> b7a9142ba4a1d64af5c5d1e20ca81933e16684cb
              Delete
            </button>
          </div>,
          document.body
        )}
    </>
  );
}