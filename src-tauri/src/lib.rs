use serde_json::json;
use tauri::{AppHandle, Emitter};
use tauri_plugin_deep_link::DeepLinkExt;
use url::Url;

#[cfg(not(target_os = "ios"))]
use tauri_plugin_single_instance::init as single_instance_init;

fn handle_deep_link(app: AppHandle, deep_link: &str) {
    let url = Url::parse(deep_link).unwrap();
    match url.domain() {
        Some("oauth2") => match url.path() {
            "/callback/tidal" => {
                if let Some((_, code)) = url.query_pairs().find(|(key, _)| key == "code") {
                    println!("OAuth2 code: {}", code);
                    let _ = app.emit(
                        "tidal-auth-response",
                        json!({
                            "code": code
                        }),
                    );
                } else {
                    println!("No code found in OAuth2 callback");
                }
            }
            _ => {
                println!("Unknown OAuth2 deep link: {}", deep_link);
            }
        },
        _ => {
            println!("Unknown deep link: {}", deep_link);
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default().plugin(tauri_plugin_http::init());

    // Only add the single instance plugin for non-iOS targets.
    #[cfg(not(target_os = "ios"))]
    // let builder = builder.plugin(single_instance_init(|_app, argv, _cwd| {
    //     println!(
    //         "New instance opened with deep link arguments: {:?}",
    //         &argv[1]
    //     );
    //     handle_deep_link(_app.clone(), &argv[1]);
    // }));

    let builder = builder
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_os::init())
        .setup(|app| {
            #[cfg(any())]
            {
                app.deep_link().register_all()?;
            }

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            Ok(())
        });

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
