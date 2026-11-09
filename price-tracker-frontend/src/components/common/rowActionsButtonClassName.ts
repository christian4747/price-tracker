// When a row's actions button shows fully, for a row marked with Tailwind's group/row. It's faint the rest of the time,
// so a list of rows looks calm but still shows each row has actions. It shows fully while the row is hovered, while
// anything in the row is open (such as a product row's accordion, or the actions menu itself, which both mark
// themselves aria-expanded), when Tab reaches it, and always on touch screens, which can't hover
export const rowActionsButtonClassName =
    'opacity-30 transition-opacity group-hover/row:opacity-100 group-has-[[aria-expanded=true]]/row:opacity-100 ' +
    'focus-visible:opacity-100 [@media(hover:none)]:opacity-100'
