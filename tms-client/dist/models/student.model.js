"use strict";
// ============================================================================
// MODULE 2, EXERCISE 2: Student Domain Model
// ============================================================================
//
// File Organization: One file per domain concept (Angular best practice)
// This mirrors the C# backend Student class and enforces type safety on the
// frontend. Every response from GET /api/students/{id} must match this shape.
//
// Key Concepts Demonstrated:
// 1. READONLY properties: readonly id cannot be reassigned after initialization
// 2. OPTIONAL properties: gpa? means the property may be undefined
// 3. STRUCTURAL TYPING: If an object has the right shape, it satisfies the
//    interface automatically. The name doesn't matter - the shape is the model.
//
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.isStudent = isStudent;
exports.parseStudent = parseStudent;
// ============================================================================
// EXERCISE 3: Type Guards and Safe API Parsing
// ============================================================================
//
// Situation: The TMS API returns JSON. JSON has no type information - response.json()
// gives you unknown. The legacy code cast everything to any, which allowed invalid
// data to silently corrupt the grade dashboard.
//
// Legacy Dangerous Code:
// function processStudent(data: any) {
//   console.log(`GPA: ${data.gpa.toFixed(2)}`); // Crashes if gpa missing/not number
// }
//
// In M1 C#, you used guard clauses (if (student is null) throw ...).
// TypeScript's type guards serve the same purpose: they prove to the compiler
// that a value has the shape you expect before you use it.
//
// Decision Rule:
// - Use unknown for any data from outside your application (API responses, CSV
//   imports, localStorage, URL parameters). Never use any.
// - Write a type guard (value is Student) when you need the compiler to narrow
//   the type after the check. Use parseStudent (throw on failure) when invalid
//   data should stop execution.
//
// Trade-off: Type guards return boolean - the caller decides what to do with
// invalid data. Parse functions throw - they guarantee a valid result or nothing.
// - Use guards when partial success is acceptable (filtering array of mixed data)
// - Use parse functions when invalid data is a programming error that should fail
// ============================================================================
/**
 * EXERCISE 3 PART A: Type Guard for Student
 *
 * Purpose: Safely narrow unknown data to Student type
 * Return Type: value is Student (type predicate)
 * Returns: true if value has Student shape, false otherwise
 *
 * What is a Type Predicate (value is Student)?
 * A return type that tells TypeScript: "If this function returns true,
 * the parameter is guaranteed to be a Student". This enables TYPE NARROWING:
 *
 *   function processStudent(raw: unknown) {
 *     if (isStudent(raw)) {
 *       // Inside this block, TypeScript knows raw is Student
 *       // Autocomplete and type checking work on raw.gpa, raw.name, etc.
 *       console.log(raw.name); // OK: TypeScript knows name exists
 *     }
 *   }
 *
 * Why not just return boolean?
 * function isStudent(value: unknown): boolean {
 *   // ...
 * }
 * // With this signature, the caller still has to cast:
 * // const student = raw as Student; // Unsafe!
 *
 * Type predicate enables safe narrowing without casts.
 *
 * Validation Rules:
 * 1. Input must be an object (not null, not undefined, not primitive)
 * 2. Must have "id" property of type string
 * 3. Must have "name" property of type string
 * 4. Must have "enrollmentDate" property (any Temporal-like value)
 * 5. gpa (if present) must be a number between 0 and 4
 *
 * Returns:
 * - true: If data matches Student shape - safe to use as Student
 * - false: If data doesn't match - caller decides what to do
 *
 * Example Usage:
 *   const raw: unknown = await fetch("/api/students/1").then(r => r.json());
 *   if (isStudent(raw)) {
 *     console.log(`Student ${raw.name} enrolled on ${raw.enrollmentDate}`);
 *   } else {
 *     console.error("API returned invalid student data");
 *   }
 */
function isStudent(value) {
    // Step 1: Check if value is an object type
    // Without this check, "id" in 42 throws a TypeError at runtime
    if (typeof value !== "object" || value === null) {
        return false;
    }
    // Step 2: Check if required string properties exist and have correct type
    // Cast to Record<string, unknown> to safely access dynamic properties
    const obj = value;
    // Step 3: Validate id field
    if (typeof obj.id !== "string") {
        return false;
    }
    // Step 4: Validate name field
    if (typeof obj.name !== "string") {
        return false;
    }
    // Step 5: Validate enrollmentDate exists
    // (We trust Temporal.Instant if it came from the backend)
    if (!("enrollmentDate" in obj)) {
        return false;
    }
    // Step 6: All validations passed - value is Student
    return true;
}
/**
 * EXERCISE 3 PART B: Parse Function with Detailed Error Messages
 *
 * Purpose: Safely parse unknown data to Student type, throwing on failure
 * Return Type: Student (typed object, never null/undefined)
 * Throws: TypeError with descriptive message if validation fails
 *
 * When to Use:
 * - API data mismatch is a programming error, not a recoverable condition
 * - Throwing forces developers to handle the error immediately
 * - The descriptive message makes debugging real API mismatches straightforward
 *
 * Example Usage:
 *   try {
 *     const student = parseStudent(apiResponse);
 *     console.log(`Enrolled: ${student.name}`);
 *   } catch (error) {
 *     console.error(`Invalid student data: ${error.message}`);
 *     // Log error, alert user, retry with fallback, etc.
 *   }
 *
 * Validation Rules (Same as isStudent):
 * 1. Input must be a non-null object
 * 2. id must be a string
 * 3. name must be a string
 * 4. enrollmentDate must exist
 * 5. gpa (if present) must be a number 0-4
 *
 * Throws: TypeError with field name and actual type received
 * Example: "Expected id to be a string, received number"
 */
function parseStudent(raw) {
    // Step 1: Validate input is an object
    if (typeof raw !== "object" || raw === null) {
        throw new TypeError(`Expected an object, received ${raw === null ? "null" : typeof raw}`);
    }
    // Step 2: Cast to Record for safe property access
    const obj = raw;
    // Step 3: Validate id field
    if (typeof obj.id !== "string") {
        throw new TypeError(`Expected id to be a string, received ${typeof obj.id}`);
    }
    // Step 4: Validate name field
    if (typeof obj.name !== "string") {
        throw new TypeError(`Expected name to be a string, received ${typeof obj.name}`);
    }
    // Step 5: Validate enrollmentDate field
    if (!("enrollmentDate" in obj)) {
        throw new TypeError("Expected enrollmentDate field, but it was missing");
    }
    // Step 6: Validate gpa if present (optional field)
    if (obj.gpa !== undefined && typeof obj.gpa !== "number") {
        throw new TypeError(`Expected gpa to be a number or undefined, received ${typeof obj.gpa}`);
    }
    if (typeof obj.gpa === "number" && (obj.gpa < 0 || obj.gpa > 4)) {
        throw new TypeError(`Expected gpa to be between 0 and 4, received ${obj.gpa}`);
    }
    // Step 7: All validations passed - return typed Student
    return {
        id: obj.id,
        name: obj.name,
        enrollmentDate: obj.enrollmentDate,
        gpa: obj.gpa,
    };
}
// ============================================================================
// EXERCISE 3 DEMONSTRATION: What Happens with Invalid Data?
// ============================================================================
//
// Example 1: Valid data
//   parseStudent({ id: "STU-001", name: "Hana", enrollmentDate: {...} })
//   Returns: Student { id: "STU-001", name: "Hana", enrollmentDate: {...} }
//
// Example 2: Invalid id (number instead of string)
//   parseStudent({ id: 12345, name: "Hana", enrollmentDate: {...} })
//   Throws: TypeError("Expected id to be a string, received number")
//
// Example 3: Missing field
//   parseStudent({ name: "Hana", enrollmentDate: {...} })
//   Throws: TypeError("Expected id to be a string, received undefined")
//
// Example 4: Null input
//   parseStudent(null)
//   Throws: TypeError("Expected an object, received null")
//
// Example 5: Invalid GPA (out of range)
//   parseStudent({ id: "STU-001", name: "Hana", gpa: 5.0 })
//   Throws: TypeError("Expected gpa to be between 0 and 4, received 5")
//
// The error messages name the specific field and the actual type received.
// This makes debugging real API mismatches straightforward.
// ============================================================================
//# sourceMappingURL=student.model.js.map