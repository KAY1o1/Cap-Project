// smilar to notemenu for extension
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type NoteMenuProps = {
    onEdit: () => void;
    onDelete: () => void;
    // scroll locked when the menu is open
    scrollContainerSelector?: string;
};

export default function NoteMenu({
    onEdit,
    onDelete,
    scrollContainerSelector = '.notes-card-grid',
}: NoteMenuProps) {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const toggleMenu = () => {
        if (!buttonRef.current) return;

        const rect = buttonRef.current.getBoundingClientRect();
        setPosition({
            top: rect.bottom + 8,
            left: rect.right - 80, // menu width
        });

        setOpen((prev) => !prev);
    };

    // lock scroll
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

        const scrollContainer = document.querySelector<HTMLElement>(scrollContainerSelector);

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'hidden';
            if (scrollContainer) {
                scrollContainer.style.overflowX = 'hidden';
            }
        } else {
            document.body.style.overflow = '';
            if (scrollContainer) {
                scrollContainer.style.overflowX = 'auto';
            }
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = '';
            if (scrollContainer) {
                scrollContainer.style.overflowX = 'auto';
            }
        };
    }, [open, scrollContainerSelector]);

    return (
        <>
            <button
                ref={buttonRef}
                className="note-card-menu-button"
                onClick={toggleMenu}
                aria-label="Note options"
            >
                <svg width="16" height="4" viewBox="0 0 16 4" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="2" cy="2" r="2" fill="currentColor" />
                    <circle cx="8" cy="2" r="2" fill="currentColor" />
                    <circle cx="14" cy="2" r="2" fill="currentColor" />
                </svg>
            </button>

            {open &&
                createPortal(
                    <div
                        ref={menuRef}
                        className="note-card-menu-popup"
                        style={{
                            position: 'fixed',
                            top: position.top,
                            left: position.left,
                            zIndex: 9999,
                        }}
                    >
                        <button
                            onClick={() => {
                                onEdit();
                                setOpen(false);
                            }}
                        >
                            Edit
                        </button>

                        <button
                            onClick={() => {
                                onDelete();
                                setOpen(false);
                            }}
                        >
                            Delete
                        </button>
                    </div>,
                    document.body
                )}
        </>
    );
}