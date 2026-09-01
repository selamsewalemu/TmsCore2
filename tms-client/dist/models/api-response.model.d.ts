import { Temporal } from "@js-temporal/polyfill";
/**
 * EXERCISE 6: Reusable API Response (Generics)
 *
 * Situation: Every TMS page fetches data from the API. Each fetch has the
 * same lifecycle: loading, then either success with data or error.
 *
 * WITHOUT Generics (repetitive - violates DRY):
 *   type StudentResponse =
 *     | { status: "loading" }
 *     | { status: "success"; data: Student; fetchedAt: Temporal.Instant }
 *     | { status: "error"; message: string; statusCode: number };
 *
 *   type CourseListResponse =
 *     | { status: "loading" }
 *     | { status: "success"; data: Course[]; fetchedAt: Temporal.Instant }
 *     | { status: "error"; message: string; statusCode: number };
 *
 * The structure is identical. Only the data type changes.
 * This violates DRY (Don't Repeat Yourself).
 *
 * WITH Generics (reusable):
 *   type ApiResponse<T> =
 *     | { status: "loading" }
 *     | { status: "success"; data: T; fetchedAt: Temporal.Instant }
 *     | { status: "error"; message: string; statusCode: number };
 *
 *   // Use with different types:
 *   type StudentResponse = ApiResponse<Student>;
 *   type CourseListResponse = ApiResponse<Course[]>;
 *
 * Decision Rule (from module):
 * - Use generics when you have a reusable wrapper that works with multiple
 *   data types (API responses, paginated lists, cache entries).
 * - Do NOT use generics when a function only ever works with one type.
 *   sortStudentsByGpa(students: Student[]) is clearer than sort<T>(items: T[])
 *   when T is always Student.
 *
 * Trade-off: C# generics survive to runtime (CLR knows the type, can use
 * typeof(T)). TypeScript generics are ERASED at compile time. The JavaScript
 * output has NO concept of T. If you need runtime type checking, combine
 * generics with a type guard (generic provides compile-time safety, guard
 * provides runtime validation).
 *
 * C# vs TypeScript Comparison:
 *
 * C#:
 *   public class ApiResponse<T> {
 *     // Generic survives to runtime - CLR knows T
 *     public T GetOrDefault() => typeof(T) == typeof(int) ? 0 : null;
 *   }
 *
 * TypeScript:
 *   export type ApiResponse<T> =
 *     | { status: "success"; data: T }
 *   // Compile-time: T is Student for ApiResponse<Student>
 *   // Runtime: T is gone - just plain JavaScript objects
 *   // Cannot do: if (data instanceof T) { } → ERROR: T not defined at runtime
 */
/**
 * API RESPONSE GENERIC TYPE
 *
 * A discriminated union that represents the lifecycle of an API fetch.
 * Generic type parameter T is the type of successful data.
 *
 * Three Variants:
 * 1. Loading: Fetch is in progress, show spinner
 * 2. Success: Fetch completed, data is ready
 * 3. Error: Fetch failed, show error message
 *
 * Type Parameter T:
 * - T stands for any type you want to fetch
 * - When you write ApiResponse<Student>, T becomes Student
 * - When you write ApiResponse<Course[]>, T becomes Course[]
 * - Compiler verifies data matches T in the success variant
 *
 * Example Usage:
 *
 * // Fetch a single student
 * const studentRes: ApiResponse<Student> = {
 *   status: "success",
 *   data: { id: "STU-001", name: "Hana", ... },
 *   fetchedAt: Temporal.Now.instant()
 * };
 *
 * // Fetch a list of courses
 * const courseListRes: ApiResponse<Course[]> = {
 *   status: "success",
 *   data: [{ id: "CSE-001", title: "...", ... }],
 *   fetchedAt: Temporal.Now.instant()
 * };
 *
 * // Fetch with error
 * const errorRes: ApiResponse<Student> = {
 *   status: "error",
 *   message: "404 Student not found",
 *   statusCode: 404
 * };
 *
 * How Generics Work at Compile Time vs Runtime:
 *
 * TypeScript (compile time):
 *   const res: ApiResponse<Student> = fetchStudent();
 *   if (res.status === "success") {
 *     console.log(res.data.name); // ✓ TypeScript knows data is Student
 *   }
 *
 * JavaScript (runtime - after compilation):
 *   const res = fetchStudent(); // Generic <Student> is GONE
 *   if (res.status === "success") {
 *     console.log(res.data.name); // ✓ Works (no type checking at runtime)
 *   }
 *
 * This is why you can't do:
 *   if (res.data instanceof Student) {} // ✗ ERROR: Student not defined
 *   // Solution: Use a type guard instead
 */
export type ApiResponse<T> = {
    /**
     * LOADING STATE
     *
     * API fetch is in progress.
     * Show a loading spinner or skeleton in the UI.
     *
     * Discriminant: status: "loading"
     * No additional properties.
     *
     * Example:
     * { status: "loading" }
     *
     * UI Behavior:
     * - Show spinner
     * - Show "Loading..." message
     * - Disable UI interactions
     * - Prevent showing stale data
     */
    status: "loading";
} | {
    /**
     * SUCCESS STATE
     *
     * API fetch completed successfully and returned data.
     *
     * Discriminant: status: "success"
     * Additional properties:
     * - data: T (the fetched data of type T)
     * - fetchedAt: Temporal.Instant (when was this data fetched?)
     *
     * Type Parameter T:
     * - T is the type of data being fetched
     * - When used as ApiResponse<Student>, data: Student
     * - When used as ApiResponse<Course[]>, data: Course[]
     * - Compiler checks data matches T
     *
     * fetchedAt Timestamp:
     * - Records exactly when data was fetched
     * - Used to calculate "stale" data (e.g., > 5 minutes old)
     * - Useful for cache invalidation
     * - Can show user: "Last updated 2 minutes ago"
     *
     * Example:
     * {
     *   status: "success",
     *   data: { id: "STU-001", name: "Hana", ... },
     *   fetchedAt: Temporal.Now.instant()
     * }
     *
     * UI Behavior:
     * - Hide spinner
     * - Display data using the content
     * - Show "Data fetched at 10:30 AM"
     * - Enable UI interactions
     */
    status: "success";
    data: T;
    fetchedAt: Temporal.Instant;
} | {
    /**
     * ERROR STATE
     *
     * API fetch failed.
     *
     * Discriminant: status: "error"
     * Additional properties:
     * - message: string (error description for user)
     * - statusCode: number (HTTP status code)
     *
     * statusCode Examples:
     * - 400: Bad Request (client sent invalid data)
     * - 401: Unauthorized (not logged in)
     * - 403: Forbidden (don't have permission)
     * - 404: Not Found (resource doesn't exist)
     * - 500: Internal Server Error (backend crashed)
     * - 503: Service Unavailable (maintenance)
     *
     * message Examples:
     * - "Student not found"
     * - "Permission denied: Cannot access this course"
     * - "Server error: Database connection failed"
     *
     * Example:
     * {
     *   status: "error",
     *   message: "404 Student with ID STU-999 not found",
     *   statusCode: 404
     * }
     *
     * UI Behavior:
     * - Hide spinner
     * - Show error message to user
     * - Show "Retry" button
     * - Log error for debugging
     * - Different styling based on statusCode (4xx = user error, 5xx = server)
     */
    status: "error";
    message: string;
    statusCode: number;
};
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
export declare function renderResponse<T>(response: ApiResponse<T>, formatter: (data: T) => string): string;
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
export declare function createLoading<T>(): ApiResponse<T>;
/**
 * Create a success response with data
 *
 * Usage:
 *   const success = createSuccess(student, Temporal.Now.instant());
 */
export declare function createSuccess<T>(data: T, fetchedAt: Temporal.Instant): ApiResponse<T>;
/**
 * Create an error response
 *
 * Usage:
 *   const error = createError<Student>(
 *     "Student not found",
 *     404
 *   );
 */
export declare function createError<T>(message: string, statusCode: number): ApiResponse<T>;
//# sourceMappingURL=api-response.model.d.ts.map