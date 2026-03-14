# pemula-ts

This is a starter template for a modern Node.js project using TypeScript. It is configured for a streamlined development experience with live-reloading and an optimized build process. The current implementation simply logs a confirmation message to the console upon startup.

## Features

- **Modern TypeScript**: Configured with strict type-checking and modern ECMAScript features (ES2022 target).
- **ESM Native**: The project is set up as an ES Module.
- **Live Reloading**: The development server automatically restarts on file changes using `nodemon` and `tsx`.
- **Optimized Builds**: Uses `tsup` to bundle the TypeScript source into efficient JavaScript for production.

## Requirements

- **Runtime**: Node.js `>=21` (as specified in `package.json`).
- **Tools**: A Node.js package manager like `npm` or `yarn`.

## Quick Install & Dev

1.  **Install dependencies:**
    ```sh
    npm install
    ```

2.  **Run the development server:**
    This command starts the application with live-reloading.
    ```sh
    npm run dev
    ```
    OR
    ```sh
    nodemon
    ```

## Build & Run

The following scripts are available in `package.json`:

- **Development (with live-reload)**:
    ```sh
    npm run dev
    ```
    OR
    ```sh
    nodemon
    ```

- **One-off Execution**:
    ```sh
    npm start
    ```

- **Production Build**:
    This command compiles and bundles the code into the `dist/` directory.
    ```sh
    npm run build
    ```

After building, you can run the production-ready code with Node: `node dist/index.js`.

## Deployment

To deploy this application:

1.  Build the project using `npm run build`.
2.  Copy the generated `dist/` directory and the `package.json` file to your server.
3.  Run `npm install --production` on the server to install only production dependencies.
4.  Start the application using `node dist/index.js`.

## License

This project is licensed under the **ISC License**.