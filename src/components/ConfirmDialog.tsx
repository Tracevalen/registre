import { useEffect, type ReactNode } from "react";

interface Props {
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** Action irréversible : bouton rouge. */
  danger?: boolean;
  /** Icône dans l'hexagone du haut. */
  icon?: ReactNode;
  onConfirm?: () => void;
  onCancel: () => void;
}

/** Fenêtre de confirmation aux couleurs du jeu, à la place de la boîte grise du navigateur. */
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  cancelLabel = "Annuler",
  danger = false,
  icon,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="sheet" onClick={onCancel} role="alertdialog" aria-modal aria-label={title}>
      <div className={`confirm panel ${danger ? "is-danger" : ""}`} onClick={(e) => e.stopPropagation()}>
        {icon && (
          <span className="confirm-icon" aria-hidden>
            <span>{icon}</span>
          </span>
        )}
        <h2 className="title-serif">{title}</h2>
        {children && <div className="confirm-body">{children}</div>}
        <div className="confirm-actions">
          <button className="btn-game btn-outline" onClick={onCancel}>
            {cancelLabel}
          </button>
          {onConfirm && (
            <button
              className={`btn-game ${danger ? "btn-danger" : "btn-gold"}`}
              onClick={() => {
                onConfirm();
                onCancel();
              }}
              autoFocus
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
