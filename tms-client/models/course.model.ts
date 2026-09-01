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

import { Temporal } from "@js-temporal/polyfill";

/**
 * COURSE INTERFACE
 *
 * Purpose: Represents a course that students can enroll in.
 * This interface defines the structure of Course data that flows from the
 * backend API to the TypeScript frontend.
 *
 * API Endpoint: GET /api/courses/{id}
 * Example Response:
 * {
 *   "id": "CSE-10001",
 *   "title": "Data Structures",
 *   "capacity": 50,
 *   "startDate": "2025-01-13"
 * }
 *
 * Database Mapping (C# Backend):
 * - Stored in [Courses] table with CourseId as primary key
 * - Capacity limits enrollment; prevents over-registration
 * - StartDate is optional for courses not yet scheduled
 *
 * TypeScript vs C# Comparison:
 * C# Course class has:
 *   - readonly string CourseId
 *   - string Title
 *   - int Capacity
 *   - DateTime? StartDate
 *
 * TypeScript Course interface has:
 *   - readonly id: string
 *   - title: string
 *   - capacity: number
 *   - startDate?: Temporal.PlainDate
 *
 * Usage:
 * - Course catalog: Display all available courses
 * - Enrollment: Show courses available for enrollment
 * - Schedule: Display course start dates
 * - Type guards: Validate unknown API data with isCourse()
 */
export interface Course {
  /**
   * PROPERTY: id (readonly)
   *
   * Purpose: Unique identifier for the course
   * Type: string (non-nullable)
   * Format: "CSE-XXXXX" or similar (e.g., "CSE-10001")
   * Constraint: readonly - never changes after creation
   *
   * Why readonly?
   * Course IDs are assigned by the backend and should never change.
   * Making it readonly prevents accidental reassignment:
   *   course.id = "CSE-20001"; // Error: Cannot assign to readonly property
   *
   * Used as:
   * - Primary key in database
   * - Foreign key in Enrollments table
   * - Course reference in API URLs
   *
   * Example: "CSE-20234" for "Data Structures" course
   */
  readonly id: string;

  /**
   * PROPERTY: title
   *
   * Purpose: Human-readable course name
   * Type: string (non-nullable)
   * Constraint: Can be updated before semester starts
   * Length: 3-200 characters
   *
   * Why not readonly?
   * Course titles may be updated during course development.
   * For example, a course title might be revised from "Intro to Data Structures"
   * to "Data Structures and Algorithms" before the semester starts.
   *
   * Frontend Usage:
   * - Display in course catalog
   * - Show in student's enrolled courses list
   * - Search queries ("Find course titled...")
   *
   * Examples:
   * - "Data Structures"
   * - "Web Development"
   * - "Algorithms and Complexity"
   * - "Advanced Database Systems"
   */
  title: string;

  /**
   * PROPERTY: capacity
   *
   * Purpose: Maximum number of students that can enroll
   * Type: number (integer, non-nullable)
   * Range: 1-1000 students (business rule)
   *
   * Business Rules:
   * - CurrentEnrollment must be <= Capacity
   * - When CurrentEnrollment reaches Capacity, new enrollments are rejected
   * - Can be used to show "X spots remaining" in UI
   *
   * Frontend Usage:
   * - Display course availability: "Seats: 45/50"
   * - Disable enrollment button when full
   * - Show warning when near capacity (95%+)
   * - Sort courses by availability
   *
   * Example:
   *   const isFull = currentEnrollment >= course.capacity;
   *   const spotsRemaining = course.capacity - currentEnrollment;
   */
  capacity: number;

  /**
   * PROPERTY: startDate (OPTIONAL)
   *
   * Purpose: When the course begins teaching
   * Type: Temporal.PlainDate | undefined (nullable - IMPORTANT)
   * Default: undefined (course exists before scheduling)
   * Format: ISO 8601 date only (e.g., "2025-01-13", not time)
   *
   * Why Temporal.PlainDate (not Temporal.Instant)?
   * - PlainDate represents a date without time or timezone
   * - Useful for schedules that aren't time-of-day sensitive
   * - "Spring 2025 starts on January 13" is what matters, not the exact hour
   * - Temporal.Instant would be used if we needed precise time: "11:00 AM UTC"
   *
   * Why optional (startDate?)?
   * Courses are created in the catalog before a semester is scheduled.
   * StartDate is set later when the registrar finalizes the semester.
   *
   * Business Rules:
   * - null = Not yet scheduled (under development)
   * - undefined = Scheduled to start never (archived or future)
   * - HasValue = Confirmed start date (e.g., 2025-01-13)
   * - Validation: Must be after current date when set
   *
   * Frontend Usage:
   * - Show "Not yet scheduled" when undefined
   * - Display "Starts: January 13, 2025" when defined
   * - Calculate "Days until start": daysUntilStart()
   * - Gray out course when in the past
   * - Prevent enrollment for future courses (optional business rule)
   *
   * Example Usage:
   *   if (course.startDate) {
   *     console.log(`Course starts on ${course.startDate.toLocaleString()}`);
   *   } else {
   *     console.log("Course not yet scheduled");
   *   }
   *
   * Safe Navigation:
   *   // FORBIDDEN: Assumes startDate exists
   *   const day = course.startDate.day; // Error: startDate might be undefined
   *
   *   // REQUIRED: Handle the undefined case
   *   const day = course.startDate?.day ?? "Not scheduled"; // OK
   */
  startDate?: Temporal.PlainDate;
}

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
export function isCourse(value: unknown): value is Course {
  // Step 1: Check if value is an object type
  if (typeof value !== "object" || value === null) {
    return false;
  }

  // Step 2: Cast to Record<string, unknown> for safe property access
  const obj = value as Record<string, unknown>;

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
export function parseCourse(raw: unknown): Course {
  // Step 1: Validate input is an object
  if (typeof raw !== "object" || raw === null) {
    throw new TypeError(
      `Expected an object, received ${raw === null ? "null" : typeof raw}`
    );
  }

  // Step 2: Cast to Record for safe property access
  const obj = raw as Record<string, unknown>;

  // Step 3: Validate id field
  if (typeof obj.id !== "string") {
    throw new TypeError(
      `Expected id to be a string, received ${typeof obj.id}`
    );
  }

  // Step 4: Validate title field
  if (typeof obj.title !== "string") {
    throw new TypeError(
      `Expected title to be a string, received ${typeof obj.title}`
    );
  }

  // Step 5: Validate capacity field
  if (typeof obj.capacity !== "number") {
    throw new TypeError(
      `Expected capacity to be a number, received ${typeof obj.capacity}`
    );
  }

  // Step 6: Validate capacity is a positive integer
  if (!Number.isInteger(obj.capacity)) {
    throw new TypeError(
      `Expected capacity to be an integer, received ${obj.capacity} (not an integer)`
    );
  }

  if (obj.capacity <= 0) {
    throw new TypeError(
      `Expected capacity to be a positive integer, received ${obj.capacity}`
    );
  }

  // Step 7: Validate startDate if present
  let startDate: Temporal.PlainDate | undefined;
  if (obj.startDate !== undefined) {
    if (typeof obj.startDate !== "string") {
      throw new TypeError(
        `Expected startDate to be a string or undefined, received ${typeof obj.startDate}`
      );
    }

    try {
      startDate = Temporal.PlainDate.from(obj.startDate);
    } catch (e) {
      throw new TypeError(
        `Expected startDate to be a valid ISO date string (YYYY-MM-DD), received "${obj.startDate}"`
      );
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

// ============================================================================
// DEMONSTRATION: What Happens with Invalid Data?
// ============================================================================
//
// Example 1: Valid data
//   parseCourse({ id: "CSE-001", title: "Data Structures", capacity: 50 })
//   Returns: Course { id: "CSE-001", title: "Data Structures", capacity: 50 }
//
// Example 2: Invalid id (number instead of string)
//   parseCourse({ id: 123, title: "Data Structures", capacity: 50 })
//   Throws: TypeError("Expected id to be a string, received number")
//
// Example 3: Invalid capacity (negative)
//   parseCourse({ id: "CSE-001", title: "Data Structures", capacity: -50 })
//   Throws: TypeError("Expected capacity to be a positive integer, received -50")
//
// Example 4: Missing field
//   parseCourse({ id: "CSE-001", title: "Data Structures" })
//   Throws: TypeError("Expected capacity to be a number, received undefined")
//
// Example 5: Invalid startDate format
//   parseCourse({ id: "CSE-001", title: "Data Structures", capacity: 50, startDate: "invalid" })
//   Throws: TypeError("Expected startDate to be a valid ISO date string (YYYY-MM-DD), received \"invalid\"")
// ============================================================================

// ============================================================================
// SESSION 2, EXERCISE 5 PART B: Course Lifecycle (State Machine Union)
// ============================================================================
//
// File Organization: Added to course.model.ts after basic Course interface
// Demonstrates discriminated unions for course state management.
//
// Key Concepts:
// 1. STATE MACHINE: 5 discrete lifecycle states for courses
// 2. STATE-SPECIFIC DATA: Each state carries only relevant information
// 3. IMPOSSIBLE STATES: Union makes invalid transitions unrepresentable
// 4. EXHAUSTIVE HANDLING: Compiler forces all states to be handled
//
// ============================================================================

/**
 * EXERCISE 5 PART B: Course Lifecycle - State Machine Union
 *
 * Situation: Courses have their own lifecycle. A course starts as a draft,
 * gets published for review, goes active when classes begin, and eventually
 * gets archived or cancelled.
 *
 * Course Lifecycle Stages:
 * 1. DRAFT: Being created, not ready for students yet
 * 2. PUBLISHED: Reviewed and ready, waiting for start date
 * 3. ACTIVE: Classes are happening now
 * 4. ARCHIVED: Course has finished, moved to records
 * 5. CANCELLED: Course will not run
 *
 * State Transitions (typical flow):
 * DRAFT → PUBLISHED → ACTIVE → ARCHIVED
 *   or ↘ CANCELLED (at any point before ACTIVE)
 *
 * This is the same discriminated union pattern used for EnrollmentStatus.
 * Implementing it requires:
 * 1. Define CourseStatus union type with 5 state variants
 * 2. Write describeCourse function with exhaustive switch
 * 3. Include never check in default case
 * 4. Test with all states
 */

/**
 * COURSE STATUS UNION TYPE
 *
 * Represents a course in one of 5 lifecycle states.
 * Each state is a variant with:
 * - Discriminant field: "status" (literal type: "DRAFT" | "PUBLISHED" | etc.)
 * - State-specific properties (only those meaningful for that state)
 *
 * Type Narrowing:
 *   if (course.status === "DRAFT") {
 *     // course is DRAFT variant here
 *     console.log(course.createdBy); // OK - exists on DRAFT
 *     console.log(course.enrolledCount); // ERROR - not on DRAFT
 *   }
 */
export type CourseStatus =
  | {
      /**
       * DRAFT STATE
       *
       * Course is being created and is not yet ready for students.
       * Instructor is still writing syllabus and setting up assignments.
       *
       * When used:
       * - Right after course creation
       * - Before publishing
       * - Shows in "My Drafts" for instructors
       *
       * Properties:
       * - status: "DRAFT"
       * - createdBy: Who created this course? (instructor ID)
       * - createdAt: When was it created?
       */
      status: "DRAFT";
      createdBy: string;
      createdAt: Temporal.Instant;
    }
  | {
      /**
       * PUBLISHED STATE
       *
       * Course has been reviewed and published, ready for students.
       * Waiting for start date, students can see and enroll.
       *
       * When used:
       * - After course review/approval
       * - Before course startDate
       * - Shows in course catalog
       *
       * Properties:
       * - status: "PUBLISHED"
       * - publishedAt: When was it published?
       * - syllabus: Course syllabus text/URL
       */
      status: "PUBLISHED";
      publishedAt: Temporal.Instant;
      syllabus: string;
    }
  | {
      /**
       * ACTIVE STATE
       *
       * Course is currently running.
       * Students are attending, assignments are being submitted.
       *
       * When used:
       * - Between startDate and endDate
       * - Students can submit work
       * - Shows in "Current Courses"
       *
       * Properties:
       * - status: "ACTIVE"
       * - enrolledCount: How many students are currently enrolled?
       * - startDate: When did this course begin?
       */
      status: "ACTIVE";
      enrolledCount: number;
      startDate: Temporal.PlainDate;
    }
  | {
      /**
       * ARCHIVED STATE
       *
       * Course has finished and is archived.
       * No longer accepting submissions, moved to records.
       *
       * When used:
       * - After course ends
       * - Historical/reference only
       * - Shows in "Past Courses"
       *
       * Properties:
       * - status: "ARCHIVED"
       * - archivedAt: When was it archived?
       * - finalEnrollmentCount: How many students completed it?
       */
      status: "ARCHIVED";
      archivedAt: Temporal.Instant;
      finalEnrollmentCount: number;
    }
  | {
      /**
       * CANCELLED STATE
       *
       * Course will not run.
       * Can be cancelled at any point (cancelled before it even started).
       *
       * When used:
       * - Instructor decides not to teach it
       * - Insufficient enrollment
       * - Administrative action
       *
       * Properties:
       * - status: "CANCELLED"
       * - reason: Why was it cancelled?
       * - cancelledAt: When was it cancelled?
       */
      status: "CANCELLED";
      reason: string;
      cancelledAt: Temporal.Instant;
    };

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
export function describeCourse(status: CourseStatus): string {
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
      const _check: never = status;
      throw new Error(`Unhandled course status: ${JSON.stringify(_check)}`);
    }
  }
}
