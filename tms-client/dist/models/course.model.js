"use strict";
// ============================================================================
// MODULE 2, EXERCISE 2: Course Domain Model
// ============================================================================
//
// File Organization: One file per domain concept (Angular best practice)
// This mirrors the C# backend Course class and enforces type safety on the
// frontend. Every response from GET /api/courses/{id} must match this shape.
//
// Key Concepts Demonstrated:
// 1. READONLY properties: readonly id cannot be reassigned after initialization
// 2. OPTIONAL properties: startDate? means the property may be undefined
// 3. BUSINESS RULES: Capacity limits enrollment; StartDate is optional for
//    courses not yet scheduled
//
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCourse = isCourse;
exports.parseCourse = parseCourse;
exports.describeCourse = describeCourse;
const polyfill_1 = require("@js-temporal/polyfill");
/**
 * HELPER METHOD: Calculate Days Until Course Start
 *
 * Purpose: Determine how many days until the course begins
 * Return Type: number
 * - Positive: Days until start (course is upcoming)
 * - Zero: Course starts today
 * - Negative: Days since start (course has begun)
 * - Special: -1 if course not yet scheduled (undefined startDate)
 *
 * Frontend Usage:
 * - Show "Starts in 15 days"
 * - Show "Started 3 days ago"
 * - Sort courses by start date
 * - Alert when course is starting soon (< 7 days)
 * - Color-code based on start status:
 *   - Green: Not yet scheduled (can prepare)
 *   - Yellow: Starting soon (< 7 days)
 *   - Blue: Currently running
 *   - Gray: Finished
 *
 * Note: This is a separate function, not a method on the interface.
 * TypeScript interfaces don't have methods (only type signatures).
 * To add this functionality, create a class or utility function.
 *
 * Example Usage (with implementation):
 * export function daysUntilStart(course: Course): number {
 *   if (!course.startDate) return -1; // Not scheduled
 *   const today = Temporal.Now.plainDateISO();
 *   return today.until(course.startDate).days;
 * }
 *
 * Usage:
 *   const days = daysUntilStart(course);
 *   if (days === -1) {
 *     console.log("Course not yet scheduled");
 *   } else if (days > 0) {
 *     console.log(`Course starts in ${days} days`);
 *   } else if (days === 0) {
 *     console.log("Course starts today");
 *   } else {
 *     console.log(`Course started ${Math.abs(days)} days ago`);
 *   }
 */
// ============================================================================
// EXERCISE 3: Type Guards for Course
// ============================================================================
/**
 * Type Guard for Course
 *
 * Purpose: Safely narrow unknown data to Course type
 * Return Type: value is Course (type predicate)
 * Returns: true if value has Course shape, false otherwise
 *
 * Validation Rules:
 * 1. Input must be an object (not null, not undefined, not primitive)
 * 2. Must have "id" property of type string
 * 3. Must have "title" property of type string
 * 4. Must have "capacity" property of type number (non-negative integer)
 * 5. startDate (if present) should be a valid date string
 *
 * Example Usage:
 *   const raw: unknown = await fetch("/api/courses/1").then(r => r.json());
 *   if (isCourse(raw)) {
 *     console.log(`Course: ${raw.title} (${raw.capacity} seats)`);
 *   } else {
 *     console.error("API returned invalid course data");
 *   }
 */
function isCourse(value) {
    // Step 1: Check if value is an object type
    if (typeof value !== "object" || value === null) {
        return false;
    }
    // Step 2: Cast to Record<string, unknown> for safe property access
    const obj = value;
    // Step 3: Validate id field (required string)
    if (typeof obj.id !== "string") {
        return false;
    }
    // Step 4: Validate title field (required string)
    if (typeof obj.title !== "string") {
        return false;
    }
    // Step 5: Validate capacity field (required number)
    if (typeof obj.capacity !== "number") {
        return false;
    }
    // Step 6: Validate capacity is a positive integer
    if (!Number.isInteger(obj.capacity) || obj.capacity <= 0) {
        return false;
    }
    // Step 7: Validate startDate if present (optional date string)
    if (obj.startDate !== undefined) {
        if (typeof obj.startDate !== "string") {
            return false;
        }
        // Optional: Could validate ISO date format here
        // if (!isValidISODate(obj.startDate)) return false;
    }
    // Step 8: All validations passed - value is Course
    return true;
}
/**
 * Parse Function for Course with Detailed Error Messages
 *
 * Purpose: Safely parse unknown data to Course type, throwing on failure
 * Return Type: Course (typed object, never null/undefined)
 * Throws: TypeError with descriptive message if validation fails
 *
 * Validation Rules (Same as isCourse):
 * 1. Input must be a non-null object
 * 2. id must be a string
 * 3. title must be a string
 * 4. capacity must be a positive integer
 * 5. startDate (if present) must be a valid date string
 *
 * Example Usage:
 *   try {
 *     const course = parseCourse(apiResponse);
 *     console.log(`Enrolled in: ${course.title}`);
 *   } catch (error) {
 *     console.error(`Invalid course data: ${error.message}`);
 *   }
 *
 * Error Examples:
 * parseCourse({ id: 123, title: "Data Structures", capacity: 50 })
 *   Throws: "Expected id to be a string, received number"
 *
 * parseCourse({ id: "CSE-001", title: "Data Structures", capacity: -50 })
 *   Throws: "Expected capacity to be a positive integer, received -50"
 */
function parseCourse(raw) {
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
    // Step 4: Validate title field
    if (typeof obj.title !== "string") {
        throw new TypeError(`Expected title to be a string, received ${typeof obj.title}`);
    }
    // Step 5: Validate capacity field
    if (typeof obj.capacity !== "number") {
        throw new TypeError(`Expected capacity to be a number, received ${typeof obj.capacity}`);
    }
    // Step 6: Validate capacity is a positive integer
    if (!Number.isInteger(obj.capacity)) {
        throw new TypeError(`Expected capacity to be an integer, received ${obj.capacity} (not an integer)`);
    }
    if (obj.capacity <= 0) {
        throw new TypeError(`Expected capacity to be a positive integer, received ${obj.capacity}`);
    }
    // Step 7: Validate startDate if present
    let startDate;
    if (obj.startDate !== undefined) {
        if (typeof obj.startDate !== "string") {
            throw new TypeError(`Expected startDate to be a string or undefined, received ${typeof obj.startDate}`);
        }
        try {
            startDate = polyfill_1.Temporal.PlainDate.from(obj.startDate);
        }
        catch (e) {
            throw new TypeError(`Expected startDate to be a valid ISO date string (YYYY-MM-DD), received "${obj.startDate}"`);
        }
    }
    // Step 8: All validations passed - return typed Course
    return {
        id: obj.id,
        title: obj.title,
        capacity: obj.capacity,
        startDate: startDate,
    };
}
/**
 * DESCRIBE COURSE - Exhaustive State Handler
 *
 * Purpose: Convert any course state into a human-readable description
 * Input: CourseStatus (one of 5 variants)
 * Output: string (description suitable for UI display)
 *
 * You write this function. Follow this structure:
 *
 * export function describeCourse(status: CourseStatus): string {
 *   switch (status.status) {
 *     case "DRAFT":
 *       // Handle DRAFT state
 *       // Return string describing draft status
 *
 *     case "PUBLISHED":
 *       // Handle PUBLISHED state
 *
 *     case "ACTIVE":
 *       // Handle ACTIVE state
 *
 *     case "ARCHIVED":
 *       // Handle ARCHIVED state
 *
 *     case "CANCELLED":
 *       // Handle CANCELLED state
 *
 *     default: {
 *       // NEVER CHECK: If any case is missing, error here
 *       const _check: never = status;
 *       throw new Error(`Unhandled course status: ${JSON.stringify(_check)}`);
 *     }
 *   }
 * }
 *
 * Hints:
 * - Each case should return a descriptive string
 * - Use the state-specific properties (createdBy, enrolledCount, etc.)
 * - Include timestamps when helpful
 * - Format: "Status description with relevant details"
 *
 * Example Outputs:
 * - "Draft course created by john.smith on Sept 1, 2026"
 * - "Published with 28 students enrolled since Sept 1"
 * - "Active course with 28 students started Sept 1, 2026"
 * - "Archived with 28 students final count"
 * - "Cancelled: Insufficient enrollment"
 *
 * Test it with:
 *   const active: CourseStatus = {
 *     status: "ACTIVE",
 *     enrolledCount: 28,
 *     startDate: Temporal.PlainDate.from("2026-09-01"),
 *   };
 *   console.log(describeCourse(active));
 *   // Expected: Something like "Active course with 28 students started Sept 1, 2026"
 */
function describeCourse(status) {
    switch (status.status) {
        case "DRAFT":
            return `Draft course created by ${status.createdBy} on ${status.createdAt}`;
        case "PUBLISHED":
            return `Published since ${status.publishedAt}`;
        case "ACTIVE":
            return `Active course with ${status.enrolledCount} students, started ${status.startDate}`;
        case "ARCHIVED":
            return `Archived with ${status.finalEnrollmentCount} students final enrollment`;
        case "CANCELLED":
            return `Cancelled: ${status.reason}`;
        // NEVER CHECK: If any case is missing, compiler error here
        default: {
            const _check = status;
            throw new Error(`Unhandled course status: ${JSON.stringify(_check)}`);
        }
    }
}
//# sourceMappingURL=course.model.js.map