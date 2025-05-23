import "server-only";
import fs from "fs/promises";
import path from "path";

/**
 * Test file access and paths used in the app
 * This is a debugging utility to verify file operations
 */
export async function testFileAccess() {
  try {
    // Get project root and data directory
    const projectRoot = process.cwd();
    const dataDir = path.join(projectRoot, "src", "data");

    // Test if data directory exists
    try {
      await fs.access(dataDir);
      console.log(`✅ Data directory exists: ${dataDir}`);
    } catch (error) {
      console.error(`❌ Data directory not found: ${dataDir}`);
      console.log("Creating data directory...");
      try {
        await fs.mkdir(dataDir, { recursive: true });
        console.log(`✅ Created data directory: ${dataDir}`);
      } catch (mkdirError) {
        console.error(`❌ Failed to create data directory: ${mkdirError}`);
      }
    }

    // List files in the data directory
    try {
      const files = await fs.readdir(dataDir);
      console.log(`Files in data directory (${files.length} items):`);
      files.forEach((file) => console.log(`- ${file}`));
    } catch (error) {
      console.error(`❌ Failed to list files: ${error}`);
    }

    // Return success info
    return {
      success: true,
      projectRoot,
      dataDir,
    };
  } catch (error) {
    console.error("Error testing file access:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
