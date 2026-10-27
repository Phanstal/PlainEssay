use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::{AppHandle, Emitter, Runtime};

pub fn install<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    let new_essay = MenuItem::with_id(app, "new-essay", "New Essay", true, Some("CmdOrCtrl+N"))?;
    let save = MenuItem::with_id(app, "save", "Save", true, Some("CmdOrCtrl+S"))?;
    let export_markdown = MenuItem::with_id(
        app,
        "export-markdown",
        "Export Markdown…",
        true,
        Some("CmdOrCtrl+Shift+M"),
    )?;
    let export_docx = MenuItem::with_id(
        app,
        "export-docx",
        "Export Word Document…",
        true,
        Some("CmdOrCtrl+Shift+D"),
    )?;
    let close_window = PredefinedMenuItem::close_window(app, Some("Close Window"))?;
    let file_separator_one = PredefinedMenuItem::separator(app)?;
    let file_separator_two = PredefinedMenuItem::separator(app)?;

    let file = Submenu::with_items(
        app,
        "File",
        true,
        &[
            &new_essay,
            &save,
            &file_separator_one,
            &export_markdown,
            &export_docx,
            &file_separator_two,
            &close_window,
        ],
    )?;

    let undo = PredefinedMenuItem::undo(app, Some("Undo"))?;
    let redo = PredefinedMenuItem::redo(app, Some("Redo"))?;
    let cut = PredefinedMenuItem::cut(app, Some("Cut"))?;
    let copy = PredefinedMenuItem::copy(app, Some("Copy"))?;
    let paste = PredefinedMenuItem::paste(app, Some("Paste"))?;
    let select_all = PredefinedMenuItem::select_all(app, Some("Select All"))?;
    let edit_separator_one = PredefinedMenuItem::separator(app)?;
    let edit_separator_two = PredefinedMenuItem::separator(app)?;

    let edit = Submenu::with_items(
        app,
        "Edit",
        true,
        &[
            &undo,
            &redo,
            &edit_separator_one,
            &cut,
            &copy,
            &paste,
            &edit_separator_two,
            &select_all,
        ],
    )?;

    let bold = MenuItem::with_id(app, "bold", "Bold", true, Some("CmdOrCtrl+B"))?;
    let italic = MenuItem::with_id(app, "italic", "Italic", true, Some("CmdOrCtrl+I"))?;
    let underline = MenuItem::with_id(app, "underline", "Underline", true, Some("CmdOrCtrl+U"))?;
    let format = Submenu::with_items(app, "Format", true, &[&bold, &italic, &underline])?;

    let fullscreen = PredefinedMenuItem::fullscreen(app, Some("Toggle Full Screen"))?;
    let view = Submenu::with_items(app, "View", true, &[&fullscreen])?;

    let minimize = PredefinedMenuItem::minimize(app, Some("Minimize"))?;
    let window = Submenu::with_items(app, "Window", true, &[&minimize])?;

    #[cfg(target_os = "macos")]
    let app_menu = {
        let about = PredefinedMenuItem::about(app, Some("About PlainEssay"), None)?;
        let services = PredefinedMenuItem::services(app, Some("Services"))?;
        let hide = PredefinedMenuItem::hide(app, Some("Hide PlainEssay"))?;
        let hide_others = PredefinedMenuItem::hide_others(app, Some("Hide Others"))?;
        let show_all = PredefinedMenuItem::show_all(app, Some("Show All"))?;
        let quit = PredefinedMenuItem::quit(app, Some("Quit PlainEssay"))?;
        let app_separator_one = PredefinedMenuItem::separator(app)?;
        let app_separator_two = PredefinedMenuItem::separator(app)?;
        let app_separator_three = PredefinedMenuItem::separator(app)?;
        Submenu::with_items(
            app,
            "PlainEssay",
            true,
            &[
                &about,
                &app_separator_one,
                &services,
                &app_separator_two,
                &hide,
                &hide_others,
                &show_all,
                &app_separator_three,
                &quit,
            ],
        )?
    };

    #[cfg(target_os = "macos")]
    let menu = Menu::with_items(app, &[&app_menu, &file, &edit, &format, &view, &window])?;

    #[cfg(not(target_os = "macos"))]
    let menu = Menu::with_items(app, &[&file, &edit, &format, &view, &window])?;

    app.set_menu(menu)?;
    app.on_menu_event(|app, event| {
        let command = match event.id().as_ref() {
            "new-essay" => Some("new-essay"),
            "save" => Some("save"),
            "export-markdown" => Some("export-markdown"),
            "export-docx" => Some("export-docx"),
            "bold" => Some("bold"),
            "italic" => Some("italic"),
            "underline" => Some("underline"),
            _ => None,
        };

        if let Some(command) = command {
            let _ = app.emit("plainessay://command", command);
        }
    });

    Ok(())
}
