"use strict";
// ============================================================================
// MODULE 2, EXERCISE 2: EnrollmentRecord Domain Model
// ============================================================================
//
// File Organization: One file per domain concept (Angular best practice)
// This mirrors the C# backend EnrollmentRecord class and enforces type safety
// on the frontend. Every response from GET /api/enrollments must match this shape.
//
// Key Concepts Demonstrated:
// 1. COMPOSITE KEY: Both studentId and courseCode are readonly
// 2. FOREIGN KEYS: Both studentId and courseCode reference other entities
// 3. TIMESTAMP: enrolledAt tracks when the enrollment occurred
//
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEnrollmentRecord = isEnrollmentRecord;
exports.parseEnrollmentRecord = parseEnrollmentRecord;
exports.describeEnrollment = describeEnrollment;
const polyfill_1 = require("@js-temporal/polyfill");
// ============================================================================
// EXERCISE 3: Type Guards for EnrollmentRecord
// ============================================================================
/**
 * Type Guard for EnrollmentRecord
 *
 * Purpose: Safely narrow unknown data to EnrollmentRecord type
 * Return Type: value is EnrollmentRecord (type predicate)
 * Returns: true if value has EnrollmentRecord shape, false otherwise
 *
 * Validation Rules:
 * 1. Input must be an object (not null, not undefined, not primitive)
 * 2. Must have "studentId" property of type string
 * 3. Must have "courseCode" property of type string
 * 4. Must have "enrolledAt" property (Temporal.Instant or compatible)
 *
 * Example Usage:
 *   const raw: unknown = await fetch("/api/enrollments").then(r => r.json());
 *   if (isEnrollmentRecord(raw)) {
 *     console.log(`${raw.studentId} enrolled in ${raw.courseCode}`);
 *   } else {
 *     console.error("API returned invalid enrollment data");
 *   }
 *
 * Note: This guard doesn't validate that studentId and courseCode actually
 * exist in the database. That would require a database lookup. The guard only
 * validates the shape of the data.
 */
function isEnrollmentRecord(value) {
    // Step 1: Check if value is an object type
    if (typeof value !== "object" || value === null) {
        return false;
    }
    // Step 2: Cast to Record<string, unknown> for safe property access
    const obj = value;
    // Step 3: Validate studentId field (required string)
    if (typeof obj.studentId !== "string") {
        return false;
    }
    // Step 4: Validate courseCode field (required string)
    if (typeof obj.courseCode !== "string") {
        return false;
    }
    // Step 5: Validate enrolledAt field exists
    // (We trust Temporal.Instant if it came from the backend)
    if (!("enrolledAt" in obj)) {
        return false;
    }
    // Step 6: All validations passed - value is EnrollmentRecord
    return true;
}
/**
 * Parse Function for EnrollmentRecord with Detailed Error Messages
 *
 * Purpose: Safely parse unknown data to EnrollmentRecord type, throwing on failure
 * Return Type: EnrollmentRecord (typed object, never null/undefined)
 * Throws: TypeError with descriptive message if validation fails
 *
 * Validation Rules (Same as isEnrollmentRecord):
 * 1. Input must be a non-null object
 * 2. studentId must be a string
 * 3. courseCode must be a string
 * 4. enrolledAt must exist and be a valid datetime
 *
 * Example Usage:
 *   try {
 *     const enrollment = parseEnrollmentRecord(apiResponse);
 *     console.log(`${enrollment.studentId} -> ${enrollment.courseCode}`);
 *   } catch (error) {
 *     console.error(`Invalid enrollment data: ${error.message}`);
 *   }
 *
 * Error Examples:
 * parseEnrollmentRecord({ studentId: 123, courseCode: "CSE-001", enrolledAt: "..." })
 *   Throws: "Expected studentId to be a string, received number"
 *
 * parseEnrollmentRecord({ studentId: "STU-001", courseCode: 123, enrolledAt: "..." })
 *   Throws: "Expected courseCode to be a string, received number"
 *
 * parseEnrollmentRecord({ studentId: "STU-001", courseCode: "CSE-001" })
 *   Throws: "Expected enrolledAt field, but it was missing"
 */
function parseEnrollmentRecord(raw) {
    // Step 1: Validate input is an object
    if (typeof raw !== "object" || raw === null) {
        throw new TypeError(`Expected an object, received ${raw === null ? "null" : typeof raw}`);
    }
    // Step 2: Cast to Record for safe property access
    const obj = raw;
    // Step 3: Validate studentId field
    if (typeof obj.studentId !== "string") {
        throw new TypeError(`Expected studentId to be a string, received ${typeof obj.studentId}`);
    }
    // Step 4: Validate courseCode field
    if (typeof obj.courseCode !== "string") {
        throw new TypeError(`Expected courseCode to be a string, received ${typeof obj.courseCode}`);
    }
    // Step 5: Validate enrolledAt field exists
    if (!("enrolledAt" in obj)) {
        throw new TypeError("Expected enrolledAt field, but it was missing");
    }
    // Step 6: Validate enrolledAt is a valid timestamp
    if (typeof obj.enrolledAt !== "string") {
        throw new TypeError(`Expected enrolledAt to be a string (ISO 8601), received ${typeof obj.enrolledAt}`);
    }
    let enrolledAt;
    try {
        enrolledAt = polyfill_1.Temporal.Instant.from(obj.enrolledAt);
    }
    catch (e) {
        throw new TypeError(`Expected enrolledAt to be a valid ISO 8601 instant, received "${obj.enrolledAt}"`);
    }
    // Step 7: All validations passed - return typed EnrollmentRecord
    return {
        studentId: obj.studentId,
        courseCode: obj.courseCode,
        enrolledAt: enrolledAt,
    };
}
/**
 * DESCRIBE ENROLLMENT - Exhaustive State Handler
 *
 * Purpose: Convert any enrollment state into a human-readable description
 * Input: EnrollmentStatus (one of 5 variants)
 * Output: string (description suitable for UI display)
 *
 * Demonstrates:
 * 1. EXHAUSTIVE SWITCH: Must handle all 5 cases
 * 2. TYPE NARROWING: Inside each case, TypeScript knows the exact state
 * 3. NEVER CHECK: If a case is missing, compiler error on default line
 *
 * The Never Check Pattern:
 *   default: {
 *     const _check: never = enrollment;
 *     throw new Error(`Unhandled status: ${JSON.stringify(_check)}`);
 *   }
 *
 * Why does this work?
 * - If all cases are handled, enrollment can never reach default
 * - TypeScript narrows type to never (impossible value)
 * - Assignment to never succeeds only if no cases are missed
 * - Miss a case? Compile error: "Type 'DROPPED' is not assignable to 'never'"
 *
 * Example Usage:
 *   const pending: EnrollmentStatus = {
 *     status: "PENDING",
 *     requestedAt: Temporal.Now.instant(),
 *     studentId: "STU-001",
 *     courseId: "CRS-101"
 *   };
 *   console.log(describeEnrollment(pending));
 *   // Output: "Awaiting approval since 2026-09-01T..."
 *
 * Test the Never Check:
 * Try commenting out the DROPPED case and saving. The compiler will
 * immediately error on the default line: "Type 'DROPPED' not assignable to 'never'"
 */
function describeEnrollment(enrollment) {
    switch (enrollment.status) {
        case "PENDING":
            // Inside this block: TypeScript knows enrollment.status === "PENDING"
            // enrollment has type { status: "PENDING", requestedAt, studentId, courseId }
            return `Awaiting approval since ${enrollment.requestedAt}`;
        case "APPROVED":
            // Inside this block: TypeScript knows enrollment.status === "APPROVED"
            // enrollment has type { status: "APPROVED", approvedBy, approvedAt }
            return `Approved by ${enrollment.approvedBy}`;
        case "ACTIVE":
            // Inside this block: TypeScript knows enrollment.status === "ACTIVE"
            // enrollment has type { status: "ACTIVE", startDate, currentGrade? }
            return enrollment.currentGrade !== undefined
                ? `In progress, grade so far: ${enrollment.currentGrade}`
                : `In progress, not yet graded`;
        case "COMPLETED":
            // Inside this block: TypeScript knows enrollment.status === "COMPLETED"
            // enrollment has type { status: "COMPLETED", finalGrade, completedAt }
            return `Finished with grade ${enrollment.finalGrade}`;
        case "DROPPED":
            // Inside this block: TypeScript knows enrollment.status === "DROPPED"
            // enrollment has type { status: "DROPPED", reason, droppedAt }
            return `Dropped: ${enrollment.reason}`;
        // NEVER CHECK: If any case is missing, compiler error appears here
        default: {
            // This line is only reachable if a status variant wasn't handled
            // If we handled all cases, enrollment has type never (impossible)
            const _check = enrollment;
            throw new Error(`Unhandled enrollment status: ${JSON.stringify(_check)}`);
        }
    }
}
//# sourceMappingURL=enrollment.model.js.map