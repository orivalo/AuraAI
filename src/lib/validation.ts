import { z } from "zod";

// Schema for chat API request
export const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        id: z.union([z.number(), z.string()]),
        text: z.string().min(1).max(10000), // Max 10k characters per message
        isUser: z.boolean(),
      })
    )
    .min(1)
    .max(100), // Max 100 messages in history
  chatId: z.string().uuid().nullable().optional(),
  language: z.enum(["en", "ru"]).default("en"),
});

// Schema for task generation API request
export const taskGenerationRequestSchema = z.object({
  language: z.enum(["en", "ru"]).default("en"),
});

// Schema for task update
export const taskUpdateSchema = z.object({
  taskId: z.string().uuid(),
  completed: z.boolean(),
});

// Helper function to sanitize error messages
export function sanitizeError(error: unknown): { message: string; code?: string } {
  if (error instanceof z.ZodError) {
    return {
      message: "Invalid request data",
      code: "VALIDATION_ERROR",
    };
  }

  if (error instanceof Error) {
    // Don't expose internal error messages
    const message = error.message.toLowerCase();
    
    // Whitelist safe error messages
    if (
      message.includes("authorization") ||
      message.includes("authentication") ||
      message.includes("not found") ||
      message.includes("invalid")
    ) {
      return {
        message: error.message,
        code: "CLIENT_ERROR",
      };
    }

    // Generic error for everything else
    return {
      message: "An error occurred while processing your request",
      code: "INTERNAL_ERROR",
    };
  }

  return {
    message: "An unexpected error occurred",
    code: "UNKNOWN_ERROR",
  };
}

