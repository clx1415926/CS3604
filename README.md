Prerequisites
- Install Node.js 18+ and npm
- Windows environment (batch script .cmd )
- Ensure these ports are free: 8080 , 8082 , 3000 , 3001 (frontend dev ports are chosen automatically by Vite)

Start Everything
- .\start-all.cmd
- Entry point: http://localhost:8080/

Services and Ports

- Home_Page backend and static site: http://localhost:8080/
  - Command: node Home_Page\backend\src\server.js
- Login_Register_Page backend and static pages: http://localhost:8082/
  - Command: set PORT=8082 && npm start
  - Terms pages: http://localhost:8082/terms.html , http://localhost:8082/privacy.html
- Ticket_Selection backend (train search): http://localhost:3000/
  - Command: set PORT=3000 && npm start
- Ticket_Selection frontend (Vite): address shown in the terminal (defaults to http://localhost:5173/ , auto-increments if busy)
  - Command: npm run dev
- Ticket_Management backend (orders): http://localhost:3001/
  - Command: set PORT=3001 && npm start
- Ticket_Management frontend (Vite): address shown in the terminal (defaults to 5173+ , auto-increments)
  - Command: npm run dev

6666