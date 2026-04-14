import React from 'react';

/** List of file objects available for FileRef insertion. Provided by TextEditor, empty outside it. */
export const ListingFilesContext = React.createContext([]);

/** True inside TextEditor (edit mode), false in RichContentView (view mode). */
export const EditorModeContext = React.createContext(false);
