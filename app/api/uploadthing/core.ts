import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@clerk/nextjs/server"; // Clerk's auth function

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 10 },
  
  })
    // Set permissions and file types for this FileRoute
    .middleware(async () => {
      // This code runs on your server before upload
      const { userId } = await auth(); // Use Clerk's auth function to get user info

      // If no userId, user is not authenticated
      
      if (!userId) throw new UploadThingError("Unauthorized");

      // Return userId as metadata, accessible in onUploadComplete
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.ufsUrl);

      // Return metadata to client-side callback
      return { uploadedBy: metadata.userId };
    }),
    
 
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;