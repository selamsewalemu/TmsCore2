"use strict";
// ============================================================================
// MODULE 2, SESSION 2, EXERCISE 6: Reusable API Response (Generics)
// ============================================================================
//
// File Organization: One file for the generic ApiResponse wrapper
// Demonstrates TypeScript generics for code reuse.
//
// Key Concepts:
// 1. GENERIC TYPE: One wrapper that works with multiple data types
// 2. TYPE PARAMETER: T represents "any type" - filled in at use time
// 3. COMPILE-TIME SAFETY: Generics provide type checking without duplication
// 4. RUNTIME ERASURE: Generics vanish in compiled JavaScript
//
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderResponse = renderResponse;
exports.createLoading = createLoading;
exports.createSuccess = createSuccess;
exports.createError = createError;
/**
 * RENDER API RESPONSE - Generic Exhaustive Handler
 *
 * Purpose: Convert any ApiResponse<T> into a string for display
 * Input: ApiResponse<T> (one of 3 states)
 * Input: formatter (function to convert T to string)
 * Output: string (description suitable for UI display)
 *
 * Type Parameters:
 * - T: The type of data in the success variant
 * - Must match the ApiResponse<T> variant being passed
 *
 * The formatter Parameter:
 * - Type: (data: T) => string
 * - Function that knows how to convert T to a display string
 * - Different formatters for different data types:
 *   - Student formatter: `(s) => s.name + " GPA:" + s.gpa`
 *   - Course[] formatter: `(courses) => courses.map(c => c.title).join(", ")`
 * - Compiler verifies formatter's parameter type matches T
 *
 * Generic Function Pattern:
 *   export function renderResponse<T>(
 *     response: ApiResponse<T>,
 *     formatter: (data: T) => string,
 *   ): string {
 *     switch (response.status) {
 *       case "loading":
 *         return "Loading...";
 *       case "success":
 *         return formatter(response.data);
 *       case "error":
 *         return `Error ${response.statusCode}: ${response.message}`;
 *       default: {
 *         const _check: never = response;
 *         throw new Error(`Unhandled status: ${JSON.stringify(_check)}`);
 *       }
 *     }
 *   }
 *
 * Why is T in the function signature?
 * - TypeScript must know T to type-check the formatter
 * - When you call renderResponse<Student>(...), T = Student
 * - Compiler verifies formatter: (data: Student) => string
 *
 * How to Write It (you implement this in Exercise 6):
 *
 * export function renderResponse<T>(
 *   response: ApiResponse<T>,
 *   formatter: (data: T) => string,
 * ): string {
 *   // TODO: Handle all three states with a switch on response.status.
 *   // "loading" → return "Loading..."
 *   // "success" → call formatter with response.data
 *   // "error" → return error message with statusCode
 * }
 *
 * Hints:
 * - Follow the same pattern as describeEnrollment
 * - One case per status variant
 * - In the success case, call formatter(response.data)
 * - formatter returns the display string
 *
 * Example Usage:
 *
 *   const studentRes: ApiResponse<Student> = {
 *     status: "success",
 *     data: { id: "STU-001", name: "Dawit", gpa: 3.4, ... },
 *     fetchedAt: Temporal.Now.instant()
 *   };
 *
 *   const result = renderResponse(studentRes, (s) => `${s.name} GPA: ${s.gpa}`);
 *   // result = "Dawit GPA: 3.4"
 *
 *   const courseListRes: ApiResponse<Course[]> = {
 *     status: "success",
 *     data: [{ title: "Web Dev", ... }, { title: "Databases", ... }],
 *     fetchedAt: Temporal.Now.instant()
 *   };
 *
 *   const result2 = renderResponse(courseListRes, (courses) =>
 *     courses.map(c => c.title).join(", ")
 *   );
 *   // result2 = "Web Dev, Databases"
 *
 *   const errorRes: ApiResponse<Student> = {
 *     status: "error",
 *     message: "Student not found",
 *     statusCode: 404
 *   };
 *
 *   const result3 = renderResponse(errorRes, (s) => s.name);
 *   // result3 = "Error 404: Student not found"
 *
 * Why This Pattern Works:
 * - Same function handles ApiResponse<Student> and ApiResponse<Course[]>
 * - formatter adapts to each data type
 * - Compiler verifies formatter matches the actual data type
 * - This is the power of generics + callbacks
 *
 * Generic Erasure at Runtime:
 * Compiled JavaScript:
 *   function renderResponse(response, formatter) {
 *     switch (response.status) {
 *       // ... (no trace of <T>)
 *     }
 *   }
 * The <T> is completely gone at runtime. Compiler used it to type-check,
 * then threw it away. This is fine for frontend code where data flows
 * from API and we know its type from the context.
 */
function renderResponse(response, formatter) {
    switch (response.status) {
        case "loading":
            return "Loading...";
        case "success":
            // Inside this block: TypeScript knows response.data is type T
            // Call the formatter with the data
            return formatter(response.data);
        case "error":
            // Inside this block: TypeScript knows response is error variant
            return `Error ${response.statusCode}: ${response.message}`;
        // NEVER CHECK: If any state is missing, compiler error here
        default: {
            const _check = response;
            throw new Error(`Unhandled response status: ${JSON.stringify(_check)}`);
        }
    }
}
/**
 * HELPER FUNCTION: Creating an ApiResponse<T>
 *
 * Useful factory functions for common patterns:
 */
/**
 * Create a loading response (no data yet)
 *
 * Usage:
 *   const loading = createLoading<Student>();
 */
function createLoading() {
    return { status: "loading" };
}
/**
 * Create a success response with data
 *
 * Usage:
 *   const success = createSuccess(student, Temporal.Now.instant());
 */
function createSuccess(data, fetchedAt) {
    return { status: "success", data, fetchedAt };
}
/**
 * Create an error response
 *
 * Usage:
 *   const error = createError<Student>(
 *     "Student not found",
 *     404
 *   );
 */
function createError(message, statusCode) {
    return { status: "error", message, statusCode };
}
//# sourceMappingURL=api-response.model.js.map