# Optimization Log

## Structural Modifications

### 1. Installation Process Optimization
- **Created `install-all.cmd`**: A dedicated script to handle `npm install` for all microservices. This decouples dependency installation from the startup process.
- **Updated `start-all.cmd`**: Removed `npm install` commands from the startup script. This significantly reduces startup time for daily development.

### 2. Resource Consolidation & Cleanup
- **Removed Redundant Directories**: 
  - Deleted `12306_login`, `12306_register`, and `12306_ticket_selection` directories. These were legacy scraped artifacts not used by the active React/Node application.
  - Deleted `Homepage_target.html`, `www.shike.org.cn`, `js.users.51.la`, `libs.baidu.com`, `tucowsdomains.com` from `12306_homepage` and root. These were scraped artifacts containing unused code and tracking scripts.
- **Cleaned `12306_homepage`**:
  - Removed HTTrack artifacts: `hts-cache`, `backblue.gif`, `fade.gif`, `cookies.txt`, `hts-log.txt`.
  - Removed the HTTrack-generated `index.html`.

### 3. External Link Remediation
- **Fixed `iconfont.css`**: Removed a broken external link to `https://www.12306.cn/mormhweb/logFiles/error.html` in `12306_homepage/www.12306.cn/index/fonts/iconfont.css`. The font now relies solely on local files (`woff`, `ttf`).
- **Configured Static Asset Serving**: Updated `Login_Register_Page/backend/src/server.js` to serve shared `12306_homepage` assets, ensuring font consistency across projects without external dependencies.
- **Verified Frontend Links**: Scanned all `src` directories. Confirmed that remaining external links are valid content hyperlinks (e.g., to ICP filing or main 12306 site) and not resource dependencies.

### 4. Project Streamlining & Localization (Latest)
- **Asset Migration**:
  - Migrated shared CSS (`index_y_v50003.css`) and Fonts (`iconfont`) from `12306_homepage` to project-specific `assets` directories in `Home_Page`, `Login_Register_Page`, and `Ticket_Selection`.
  - Updated all source code references (`index.html`, `index.css`, `iconfont.css`) to point to these local assets.
- **Dependency Cleanup**:
  - Removed `12306_homepage` directory entirely after asset migration.
  - Removed unused root directories: `backend` (legacy), `frontend` (legacy), `Final Requirements`, `ReviseAdvice`, `中国铁路12306网站_files`.
  - Removed build artifacts (`dist` folders) to reduce project size (can be regenerated via build).
- **Resource Localization**:
  - Verified and localized external resource links.
  - Projects now run with zero external resource dependencies (except strictly necessary API calls or localhost).

## File Structure Overview (Final)

- **`install-all.cmd`**: Script to install dependencies for all active microservices.
- **`start-all.cmd`**: Script to start all microservices.
- **`Home_Page/`**: Main homepage application (Self-contained).
- **`Login_Register_Page/`**: Login/Register application (Self-contained).
- **`Ticket_Selection/`**: Ticket query application (Self-contained).
- **`Ticket_Management/`**: Order management application.
- **`User_Center/`**: User profile application.
- **`.artifacts/`**: Stored artifacts.
- **`.webtestpilot/`**: Test pilot configuration.
- **`img/`**: Shared image resources.

## Cleanup Summary
- **Files Deleted**: `12306_homepage`, `Ticket_selection_files`, `Final Requirements`, `ReviseAdvice`, `backend`, `frontend`, `dist` folders, scraped html/js artifacts.
- **Status**: Streamlined project with no external resource dependencies.
