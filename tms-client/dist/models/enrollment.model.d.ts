import { Temporal } from "@js-temporal/polyfill";
/**
 * ENROLLMENT RECORD INTERFACE
 *
 * Purpose: Represents a student's enrollment in a specific course.
 * Tracks the relationship between students and courses.
 * This interface defines the structure of EnrollmentRecord data that flows
 * from the backend API to the TypeScript frontend.
 *
 * API Endpoint: GET /api/enrollments
 * Example Response:
 * {
 *   "studentId": "STU-001",
 *   "courseCode": "CSE-10001",
 *   "enrolledAt": "2024-09-01T10:30:00Z"
 * }
 *
 * Database Mapping (C# Backend):
 * - Stored in [Enrollments] table
 * - Composite key: (StudentId, CourseId)
 * - Foreign key StudentId references Students(StudentId)
 * - Foreign key CourseCode references Courses(CourseId)
 * - EnrolledAt timestamp used for "first enrolled" queries
 * - No end date (students remain enrolled until semester ends)
 *
 * TypeScript vs C# Comparison:
 * C# EnrollmentRecord class has:
 *   - readonly string StudentId
 *   - readonly string CourseCode
 *   - DateTime EnrolledAt (non-nullable)
 *
 * TypeScript EnrollmentRecord interface has:
 *   - readonly studentId: string
 *   - readonly courseCode: string
 *   - enrolledAt: Temporal.Instant
 *
 * Usage:
 * - Enrollment list: Show all students in a course
 * - Student dashboard: Show which courses a student is enrolled in
 * - Enrollment history: Track when students enrolled
 * - Type guards: Validate unknown API data with isEnrollmentRecord()
 *
 * Relationships:
 * - Every EnrollmentRecord references exactly one Student
 * - Every EnrollmentRecord references exactly one Course
 * - A Student can have multiple EnrollmentRecords (one per course)
 * - A Course can have multiple EnrollmentRecords (one per student)
 */
export interface EnrollmentRecord {
    /**
     * PROPERTY: studentId (readonly)
     *
     * Purpose: Unique identifier of the enrolled student
     * Type: string (non-nullable)
     * Constraint: readonly - part of composite key
     * Format: "STU-XXXXX" (e.g., "STU-00123")
     * Relationship: Foreign key -> Students(StudentId)
     *
     * Why readonly?
     * The studentId is part of the composite key (studentId, courseCode).
     * Once created, this enrollment record refers to a specific student.
     * Changing studentId would create a different enrollment record entirely.
     * Making it readonly prevents accidental reassignment:
     *   enrollment.studentId = "STU-999"; // Error: Cannot assign to readonly
     *
     * Validation:
     * - Must match an existing Student.StudentId
     * - Must be unique within this enrollment (can't enroll twice in same course)
     *
     * Frontend Usage:
     * - Display student name by looking up Student with this ID
     * - Filter enrollments by student
     * - Load student's complete profile for grading
     *
     * Example: "STU-00123" for Hana Tadesse
     */
    readonly studentId: string;
    /**
     * PROPERTY: courseCode (readonly)
     *
     * Purpose: Unique identifier of the enrolled course
     * Type: string (non-nullable)
     * Constraint: readonly - part of composite key
     * Format: Must match an existing Course.CourseId
     * Relationship: Foreign key -> Courses(CourseId)
     *
     * Why readonly?
     * The courseCode is part of the composite key (studentId, courseCode).
     * Once created, this enrollment record refers to a specific course.
     * Changing courseCode would be a different enrollment entirely.
     * Making it readonly prevents accidental reassignment:
     *   enrollment.courseCode = "CSE-20001"; // Error: Cannot assign to readonly
     *
     * Validation:
     * - Must match an existing Course.CourseId
     * - Must be unique within this enrollment (can't enroll twice in same course)
     * - Backend should reject duplicate enrollments (same student, same course)
     *
     * Frontend Usage:
     * - Display course title by looking up Course with this code
     * - Filter enrollments by course
     * - Load course details for viewing prerequisites
     *
     * Example: "CSE-10001" for "Data Structures"
     */
    readonly courseCode: string;
    /**
     * PROPERTY: enrolledAt
     *
     * Purpose: When the student enrolled in this course
     * Type: Temporal.Instant (non-nullable, timezone-aware, UTC)
     * Constraint: Set once during enrollment, never changes
     * Format: ISO 8601 (e.g., "2024-09-01T10:30:00Z")
     *
     * Why Temporal.Instant (not Temporal.PlainDate)?
     * - Instant includes both date and time with timezone precision
     * - We want to know exactly when: September 1, 2024 at 10:30 AM UTC
     * - Useful for audit trails ("Student enrolled at exactly this moment")
     * - PlainDate would lose the time information (not useful for auditing)
     *
     * Audit Trail:
     * - First enrollment time shows when student registered for course
     * - Can track "early enrollers" vs "late registrations"
     * - Can calculate time-to-enrollment from course start date
     * - Useful for policy enforcement ("Must enroll within 2 weeks of start")
     *
     * Frontend Usage:
     * - Show "Enrolled on September 1, 2024"
     * - Show "Enrolled X days before course start"
     * - Calculate time from enrollment to first assignment submission
     * - Sort enrollments chronologically
     * - Display in enrollment history/audit log
     *
     * Business Rules:
     * - Cannot be changed after enrollment (audit integrity)
     * - Used to determine enrollment "wave" (early, normal, late)
     * - May affect grading policy (late enrollers get reduced time)
     *
     * Example Usage:
     *   const enrolledDate = enrollment.enrolledAt.toLocaleString("en-US", {
     *     year: "numeric",
     *     month: "long",
     *     day: "numeric",
     *     hour: "2-digit",
     *     minute: "2-digit",
     *   });
     *   // "September 1, 2024, 10:30 AM"
     *
     * Comparison with Student.enrollmentDate:
     * - Student.enrollmentDate: When did this student join TMS? (account creation)
     * - EnrollmentRecord.enrolledAt: When did this student enroll in this course?
     * - A student can have one enrollmentDate but many enrolledAt times (one per course)
     */
    enrolledAt: Temporal.Instant;
}
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
export declare function isEnrollmentRecord(value: unknown): value is EnrollmentRecord;
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
export declare function parseEnrollmentRecord(raw: unknown): EnrollmentRecord;
/**
 * EXERCISE 5: Enrollment Lifecycle - State Machine Union
 *
 * Situation: The TMS tracks enrollment through 5 states. The previous developer
 * used 5 boolean flags, creating 32 possible combinations, of which 27 were
 * impossible states.
 *
 * Legacy Bad Approach:
 * interface EnrollmentBad {
 *   isPending: boolean;
 *   isApproved: boolean;
 *   isActive: boolean;
 *   isCompleted: boolean;
 *   isDropped: boolean;
 * }
 *
 * Problem: Can isPending: true and isDropped: true both be true at the same time?
 * What would the UI show? 27 impossible states are representable.
 *
 * Solution: Discriminated Union (State Machine Pattern)
 * - One type that represents "enrollment in a specific state"
 * - Each state is a variant with different properties
 * - Only valid combinations are possible (impossible states unrepresentable)
 * - Compiler forces you to handle every state
 *
 * 5 Enrollment States:
 * 1. PENDING: Awaiting approval (has requestedAt, studentId, courseId)
 * 2. APPROVED: Approved by instructor (has approvedBy, approvedAt)
 * 3. ACTIVE: Currently taking the course (has startDate, optional currentGrade)
 * 4. COMPLETED: Finished the course (has finalGrade, completedAt)
 * 5. DROPPED: Withdrew from course (has reason, droppedAt)
 *
 * State Transitions (typical flow):
 * PENDING → APPROVED → ACTIVE → COMPLETED
 *   or → DROPPED (at any point)
 *
 * Decision Rule (from module):
 * - Use a discriminated union whenever an entity moves through discrete states
 *   with different data per state.
 * - Each state variant should carry only the data meaningful for that state.
 * - This eliminates an entire class of "impossible state" bugs.
 *
 * Trade-off: More code up front than boolean flags, but eliminates bugs entirely.
 */
/**
 * ENROLLMENT STATUS UNION TYPE
 *
 * Represents an enrollment in one of 5 lifecycle states.
 * Each state is a variant with:
 * - Discriminant field: "status" (literal type: "PENDING" | "APPROVED" | etc.)
 * - State-specific properties (only those meaningful for that state)
 *
 * Type Narrowing:
 *   if (enrollment.status === "PENDING") {
 *     // enrollment is PENDING variant here
 *     console.log(enrollment.studentId); // OK - exists on PENDING
 *     console.log(enrollment.finalGrade); // ERROR - not on PENDING
 *   }
 */
export type EnrollmentStatus = {
    /**
     * PENDING STATE
     *
     * Represents an enrollment request awaiting approval.
     * Student has asked to enroll but instructor hasn't approved yet.
     *
     * When used:
     * - Right after student clicks "Enroll"
     * - Before instructor approves/denies
     * - Shows in "Pending Approvals" admin queue
     *
     * Properties:
     * - status: "PENDING" (literal discriminant)
     * - requestedAt: ISO 8601 instant (when did student request?)
     * - studentId: Who is requesting to enroll?
     * - courseId: Which course are they requesting?
     *
     * Transition:
     * - → APPROVED (instructor approves)
     * - → DROPPED (student or instructor rejects)
     */
    status: "PENDING";
    requestedAt: Temporal.Instant;
    studentId: string;
    courseId: string;
} | {
    /**
     * APPROVED STATE
     *
     * Represents an enrollment that has been approved by the instructor.
     * Ready to begin but course hasn't started yet.
     *
     * When used:
     * - After instructor clicks "Approve"
     * - Before course startDate
     * - Shows in "Approved Enrollments" list
     *
     * Properties:
     * - status: "APPROVED" (literal discriminant)
     * - approvedBy: Who approved this? (instructor ID or name)
     * - approvedAt: When was it approved?
     *
     * Transition:
     * - → ACTIVE (when course startDate is reached)
     * - → DROPPED (student withdraws before course starts)
     */
    status: "APPROVED";
    approvedBy: string;
    approvedAt: Temporal.Instant;
} | {
    /**
     * ACTIVE STATE
     *
     * Represents an enrollment currently in progress.
     * Course has started, student is taking it now.
     *
     * When used:
     * - Course startDate has passed
     * - Student can submit assignments
     * - Shows in "My Courses" dashboard
     *
     * Properties:
     * - status: "ACTIVE" (literal discriminant)
     * - startDate: When did the course start? (PlainDate, no time)
     * - currentGrade: Optional current grade as course progresses
     *
     * Note on currentGrade:
     * - Optional (?) because student may not have grades yet
     * - Gets populated as assignments/quizzes are graded
     * - Updated as more work is submitted
     *
     * Transition:
     * - → COMPLETED (course ends, final grade calculated)
     * - → DROPPED (student withdraws mid-course)
     */
    status: "ACTIVE";
    startDate: Temporal.PlainDate;
    currentGrade?: number;
} | {
    /**
     * COMPLETED STATE
     *
     * Represents an enrollment that has finished.
     * Student completed the course and received a final grade.
     *
     * When used:
     * - Course ended
     * - Final grade calculated
     * - Shows in transcript/grade history
     *
     * Properties:
     * - status: "COMPLETED" (literal discriminant)
     * - finalGrade: The final grade for the course (0-100 or GPA)
     * - completedAt: When did the course end?
     *
     * Transition:
     * - No further transitions (course is finished)
     * - Archived after retention period
     */
    status: "COMPLETED";
    finalGrade: number;
    completedAt: Temporal.Instant;
} | {
    /**
     * DROPPED STATE
     *
     * Represents an enrollment that was dropped/withdrawn.
     * Student is no longer taking the course.
     *
     * When used:
     * - At any point: before approval, mid-course, etc.
     * - Shows in "Drop History" or "Inactive Enrollments"
     * - Affects academic standing calculations
     *
     * Properties:
     * - status: "DROPPED" (literal discriminant)
     * - reason: Why did the student drop?
     *   Examples: "Personal reasons", "Schedule conflict",
     *             "Medical leave", "Failing grade"
     * - droppedAt: When did they drop?
     *
     * Transition:
     * - No further transitions (can re-enroll separately)
     */
    status: "DROPPED";
    reason: string;
    droppedAt: Temporal.Instant;
};
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
export declare function describeEnrollment(enrollment: EnrollmentStatus): string;
//# sourceMappingURL=enrollment.model.d.ts.map