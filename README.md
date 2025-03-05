# Question Writing Web App

This web application is designed to help users create, manage, and organize questions for various purposes such as quizzes, surveys, and educational content. It provides an intuitive interface for writing questions, categorizing them, and exporting them in different formats. For detailed code statistics and metrics, see [STATISTICS.md](STATISTICS.md).

The Question Writing idea to enhance learner's performance is debated for decades; in particular in the field of medical (continuing) education, where MCQ (multiple choice questions) are still paramount in exams, several studies have been performed to measure the performance of students with and without question writing as a learning tool. A [review publication](https://mededpublish.org/articles/13-34) summarizes some studies on the subject. The results are mixed with a slight tendency suggesting a promise in the tool.

## Documentation

For detailed instructions on how to use the application:

- [Faculty Guide](docs/faculty_guide.md) - Comprehensive guide for instructors
- [Student Guide](docs/student_guide.md) - Guide for students using the system

## Prerequisites

Before deploying this application, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (version 18 or higher) - [Download and installation guide](https://nodejs.org/en/download/)
- [MongoDB](https://www.mongodb.com/) (version 4.4 or higher) - [Installation instructions](https://www.mongodb.com/docs/manual/installation/)
- [Docker](https://www.docker.com/) (optional, for containerized deployment) - [Get Docker](https://docs.docker.com/get-docker/)

## Development Setup

### Using Debug Scripts

For development and debugging, we provide convenient scripts in the `scripts` directory:

1. Start the development environment:

   ```bash
   ./scripts/start-debug.sh
   ```

   This script will:

   - Stop any existing debug processes
   - Start MongoDB in a Docker container
   - Start the backend with Node.js inspector enabled
   - Start the frontend development server

2. Stop the development environment:

   ```bash
   ./scripts/stop-debug.sh
   ```

   This script will:

   - Stop all running containers
   - Kill backend and frontend processes
   - Clean up any remaining development processes

After starting the debug environment, you can access:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Node.js Inspector: chrome://inspect (for backend debugging)

### Database Management Scripts

The application includes several scripts for managing the MongoDB database:

1. Backup Database:

   ```bash
   ./scripts/backup-db.sh
   ```

   Creates a backup of the entire MongoDB database in the `backups` directory. The backup is timestamped with the format `mcq-db_YYYYMMDD_HHMMSS`.

2. Restore Database:

   ```bash
   ./scripts/restore-db.sh <backup_directory_name>
   ```

   Restores the database from a specified backup. Running the script without arguments will show a list of available backups.

3. Clear Database:

   ```bash
   ./scripts/clear-db.sh [--keep-users]
   ```

   Clears the database. Options:

   - Without arguments: Clears all data including users
   - `--keep-users`: Clears all data except user accounts
   - `-h` or `--help`: Shows usage information

4. Create Demo Data:

   ```bash
   ./scripts/create-demo-data.py
   ```

   Generates a complete set of demo data to showcase the system's capabilities:

   - Creates faculty and student user accounts
   - Creates sample lectures
   - Generates multiple-choice questions
   - Assigns questions to lectures
   - Creates edit suggestions and reviews
   - Submits sample grades
   - Creates a backup of the demo data for easy restoration

   After running this script, you can log in with the following demo accounts:

   - Faculty: `smith@example.com` / Password: `faculty123`
   - Student: `alice@example.com` / Password: `student123`

5. Collect Code Statistics:

   ```bash
   ./scripts/collect-stats.sh
   ```

   Generates a comprehensive code statistics report in `STATISTICS.md`, including:

   - Number of source files by file type (.js, .jsx, .ts, .tsx, .css)
   - Lines of code by file type (excluding comments and empty lines)
   - Total number of files and lines across all types
     The script automatically excludes node_modules and handles different comment styles for various file types.

Note: All database management scripts require the MongoDB container to be running. Use `start-debug.sh` first if needed.

## Production Deployment Instructions

To deploy this application to a new machine, follow these steps:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/QuestionWritingWebApp.git
   cd QuestionWritingWebApp
   ```

2. **Environment Setup:**

   You have two options for running the application:

   ### Option A: Using Docker (Recommended)

   If you have Docker installed, simply run:

   ```bash
   docker-compose up --build
   ```

   This will set up everything automatically, including MongoDB.

   ### Option B: Manual Setup

   1. Start MongoDB:

      - For Ubuntu/Debian: `sudo systemctl start mongodb`
      - For macOS with Homebrew: `brew services start mongodb-community`
      - For Windows: Start MongoDB service from Services app

   2. Install dependencies:

      ```bash
      # Install backend dependencies
      npm install

      # Install frontend dependencies
      cd frontend
      npm install
      cd ..
      ```

3. **Configure Environment Variables:**

   Create a `.env` file in the root directory with the following variables:

   ```plaintext
   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/mcq-writing-app
   JWT_SECRET=your_secure_jwt_secret_here
   ```

   And create a `.env` file in the `frontend` directory:

   ```plaintext
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Start the Application:**

   If using manual setup:

   ```bash
   # Start backend (from root directory)
   npm run dev

   # Start frontend (in another terminal)
   cd frontend
   npm run dev
   ```

5. **Access the Application:**

   Open your web browser and navigate to:

   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000/api`

## Troubleshooting

### Development Environment Issues

- If the debug scripts fail to stop processes:
  - Manually stop Docker containers: `docker compose down`
  - Check for Node.js processes: `ps aux | grep node`
  - Check for running Vite servers: `ps aux | grep vite`

### Production Environment Issues

- **MongoDB Connection Issues:**

  - Ensure MongoDB is running: `mongosh` should connect to the database
  - Check MongoDB logs: `sudo journalctl -u mongodb` (Linux)
  - Verify MongoDB connection string in `.env`

- **Port Conflicts:**
  - If ports 3000 or 5000 are in use, modify them in the environment variables
  - For Docker: Modify the ports in `docker-compose.yml`

## Additional Resources

- [Node.js Documentation](https://nodejs.org/en/docs/)
- [MongoDB Manual](https://www.mongodb.com/docs/manual/)
- [Docker Documentation](https://docs.docker.com/)
- [Vite Documentation](https://vitejs.dev/guide/) (for frontend development)
- [Chrome DevTools Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started) (for Node.js debugging)
