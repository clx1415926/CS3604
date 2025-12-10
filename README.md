## Prerequisites
- Install Node.js 18+ and npm
- Windows environment (batch script .cmd )
- Ensure these ports are free: 8080 , 8082 , 3000 , 3001 , 8083 (frontend dev ports are chosen automatically by Vite)

## Start Everything
1. **First time setup**: Run installation script
   - `.\install-all.cmd`
2. **Daily start**: Run startup script
   - `.\start-all.cmd`
3. **Entry point**: http://localhost:8080/

## Services and Ports

- **Home_Page** backend and static site: http://localhost:8080/
  - Command: `node Home_Page\backend\src\server.js`
- **Login_Register_Page** backend and static pages: http://localhost:8082/
  - Command: `set PORT=8082 && npm start`
  - Terms pages: http://localhost:8082/terms.html , http://localhost:8082/privacy.html
- **Ticket_Selection** backend (train search): http://localhost:3000/
  - Command: `set PORT=3000 && npm start`
- **Ticket_Selection** frontend (Vite): http://localhost:5173/ (default)
  - Command: `npm run dev`
- **Ticket_Management** backend (orders): http://localhost:3001/
  - Command: `set PORT=3001 && npm start`
- **Ticket_Management** frontend (Vite): http://localhost:5174/ (approximate)
  - Command: `npm run dev`
- **User_Center** backend: http://localhost:8083/
  - Command: `set PORT=8083 && npm start`
- **User_Center** frontend (Vite): http://localhost:5176/ (approximate)
  - Command: `npm run dev`

## Performance Optimization & Streamlining

### Key Improvements
- **Optimized Startup**: Dependency installation is decoupled from startup (`install-all.cmd` vs `start-all.cmd`), significantly reducing daily wait times.
- **Resource Localization**: All external resources (CSS, Fonts, Images) are localized. The system runs with **zero external dependencies**, ensuring offline stability.
- **Project Cleanup**: Removed unused files, legacy artifacts, and scraped data (including `12306_homepage`, `backend` legacy, etc.).

### Version History (Optimization Log)
- **Latest Update**: Project Streamlining & Localization
  - Migrated shared assets to project-specific directories.
  - Deleted legacy directories (`12306_homepage`, etc.).
  - Localized all font and style resources.
- **Previous Updates**:
  - Split `install` and `start` logic.
  - Fixed broken `iconfont.css` links.
  - Removed HTTrack artifacts.

For detailed records, see [OPTIMIZATION_LOG.md](./OPTIMIZATION_LOG.md).
