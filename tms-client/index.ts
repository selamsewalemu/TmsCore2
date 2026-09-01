// ============================================================================
// MODULE 2: Type Safety and Domain Models - Index Test File
// ============================================================================
//
// File: index.ts (root of project)
// Purpose: Test file for all three exercises in Module 2 Session 1
//
// This file demonstrates:
// 1. EXERCISE 1: TypeScript strict mode compilation
// 2. EXERCISE 2: Domain models (Student, Course, EnrollmentRecord)
// 3. EXERCISE 3: Type guards and safe API parsing
//
// To run this file:
//   npx tsc                 # Compile to JavaScript
//   npx tsc --showConfig    # Verify strict mode settings
//   npx tsc --outDir dist   # Transpile to ./dist directory
//   node dist/index.js      # Run compiled JavaScript
//
// Expected Output:
// - No compile errors with strict: true enabled
// - All type guard tests pass
// - All parse function tests execute without crashing
// - Type narrowing works correctly inside if blocks
//
// ============================================================================

import { Temporal } from "@js-temporal/polyfill";
import {
  Student,
  isStudent,
  parseStudent,
} from "./models/student.model";
import {
  Course,
  isCourse,
  parseCourse,
} from "./models/course.model";
import {
  EnrollmentRecord,
  isEnrollmentRecord,
  parseEnrollmentRecord,
} from "./models/enrollment.model";
import {
  AssessmentItem,
  Quiz,
  LabAssignment,
  calculateGrade,
} from "./models/assessment.model";
import {
  EnrollmentStatus,
  describeEnrollment,
} from "./models/enrollment.model";
import {
  CourseStatus,
  describeCourse,
} from "./models/course.model";
import {
  ApiResponse,
  renderResponse,
} from "./models/api-response.model";

// ============================================================================
// EXERCISE 1: Verify Strict Mode is Enabled
// ============================================================================
//
// Before running any tests, verify that strict mode is actually enabled.
// Run this command:
//   npx tsc --showConfig
//
// You should see:
//   "strict": true,
//   "noImplicitAny": true,
//   "strictNullChecks": true,
//   "noUncheckedIndexedAccess": true,
//
// If you see "strict": false or any of the sub-flags as false, strict mode
// is not enabled. Fix tsconfig.json before proceeding with these tests.
//
// What happens without strict mode:
// - The error on line ~50 (student.id = "STU-999") would NOT appear
// - The error on line ~53 (student.gpa.toFixed(2)) would NOT appear
// - Type mismatches would silently become bugs in production
//
// ============================================================================

console.log("========================================");
console.log("MODULE 2: Type Safety and Domain Models");
console.log("Session 1: Exercise Demonstrations");
console.log("========================================\n");

// ============================================================================
// EXERCISE 2: Test Domain Models and Type Safety
// ============================================================================
//
// This section tests the Student, Course, and EnrollmentRecord interfaces
// and demonstrates type safety in action.
//
// Key Checks:
// 1. readonly enforcement (compile-time)
// 2. Optional properties (?. safe navigation)
// 3. Non-nullable types (compilation forces handling)
// 4. Type narrowing with guards
//
// ============================================================================

console.log("--- EXERCISE 2: Domain Models ---\n");

// Create a valid Student object
const student: Student = {
  id: "STU-001",
  name: "Hana Tadesse",
  enrollmentDate: Temporal.Now.instant(),
};

console.log(`Student created: ${student.name} (${student.id})`);

// READONLY ENFORCEMENT TEST
// Try this - the compiler should error:
//   student.id = "STU-999"; // Error: Cannot assign to readonly property 'id'
// This error is COMPILE-TIME ONLY. Once you fix it, it compiles.
// Uncomment the line below to see the error:
// student.id = "STU-999"; // ❌ Error: Cannot assign to readonly property

console.log("✓ readonly enforcement: student.id cannot be reassigned\n");

// OPTIONAL PROPERTY TEST: Safe vs Unsafe Access
// student.gpa is optional (undefined unless grades exist)

// UNSAFE: Assumes GPA exists (would crash if undefined)
// Uncomment to see the compile error:
// console.log(student.gpa.toFixed(2)); // ❌ Error: Object is possibly 'undefined'

// SAFE: Uses optional chaining (?.) and null coalescing (??)
const gpaDisplay = student.gpa?.toFixed(2) ?? "Not yet graded";
console.log(`GPA: ${gpaDisplay}`);
console.log("✓ Optional property handling: gpa?.toFixed(2) ?? default\n");

// ============================================================================
// EXERCISE 2: Test Course Model
// ============================================================================

console.log("--- EXERCISE 2: Course Model ---\n");

const course: Course = {
  id: "CSE-10001",
  title: "Data Structures",
  capacity: 50,
  startDate: Temporal.PlainDate.from("2025-01-13"),
};

console.log(`Course: ${course.title} (${course.capacity} seats)`);
console.log(`Start: ${course.startDate?.toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric" })}`);
console.log("✓ Course model with optional startDate\n");

// ============================================================================
// EXERCISE 2: Test EnrollmentRecord Model
// ============================================================================

console.log("--- EXERCISE 2: EnrollmentRecord Model ---\n");

const enrollment: EnrollmentRecord = {
  studentId: "STU-001",
  courseCode: "CSE-10001",
  enrolledAt: Temporal.Now.instant(),
};

console.log(`Enrollment: ${enrollment.studentId} -> ${enrollment.courseCode}`);
console.log("✓ EnrollmentRecord with composite key (both readonly)\n");

// ============================================================================
// EXERCISE 3: Type Guards and Safe API Parsing
// ============================================================================
//
// Situation: The TMS API returns JSON. JSON has no type information.
// response.json() gives you unknown. We need to validate before using.
//
// Two Patterns:
// 1. Type Guard (isStudent): Returns boolean, caller decides what to do
// 2. Parse Function (parseStudent): Throws on invalid, guarantees result
//
// Decision Rule:
// - Use guards when partial success is acceptable (filter array of mixed data)
// - Use parse functions when invalid data should fail loudly
//
// ============================================================================

console.log("--- EXERCISE 3: Type Guards (isStudent) ---\n");

// Simulate API responses of unknown type
const validStudentData: unknown = {
  id: "STU-001",
  name: "Hana Tadesse",
  enrollmentDate: Temporal.Now.instant(),
  gpa: 3.85,
};

const invalidStudentData1: unknown = 42; // A number, not an object
const invalidStudentData2: unknown = {
  id: 12345, // Wrong type: number instead of string
  name: "Test",
};

// TEST 1: Valid data with type guard
console.log("Test 1: Valid student data");
if (isStudent(validStudentData)) {
  // TYPE NARROWING: Inside this block, TypeScript knows validStudentData is Student
  // Autocomplete and type checking work on .gpa, .name, etc.
  const display = validStudentData.gpa?.toFixed(2) ?? "Not yet graded";
  console.log(`  ✓ Valid: ${validStudentData.name} (GPA: ${display})`);
} else {
  console.log("  ✗ Invalid student data");
}

// TEST 2: Invalid data (primitive value)
console.log("\nTest 2: Invalid student data (number instead of object)");
if (isStudent(invalidStudentData1)) {
  console.log("  ✓ Valid");
} else {
  console.log("  ✓ Guard correctly rejected: 42 is not a Student\n");
}

// TEST 3: Invalid data (wrong field type)
console.log("Test 3: Invalid student data (id is number, not string)");
if (isStudent(invalidStudentData2)) {
  console.log("  ✓ Valid");
} else {
  console.log("  ✓ Guard correctly rejected: id must be string, received number\n");
}

// ============================================================================
// EXERCISE 3: Parse Functions - Throwing on Invalid Data
// ============================================================================
//
// Parse functions are for cases where invalid data is a programming error.
// They throw with descriptive messages instead of returning false.
// This pattern is like M1's CapacityReachedException - it tells you exactly
// what went wrong so debugging is straightforward.
//
// ============================================================================

console.log("--- EXERCISE 3: Parse Functions (parseStudent) ---\n");

// TEST 1: Valid data - should succeed
console.log("Test 1: Parse valid student data");
try {
  const parsedStudent = parseStudent({
    id: "STU-001",
    name: "Hana Tadesse",
    enrollmentDate: Temporal.Now.instant().toString(),
  });
  console.log(
    `  ✓ Successfully parsed: ${parsedStudent.name} (${parsedStudent.id})\n`
  );
} catch (error) {
  console.error(`  ✗ Failed: ${error}`);
}

// TEST 2: Invalid data (wrong type) - should throw with descriptive error
console.log("Test 2: Parse invalid student data (id is number)");
try {
  parseStudent({
    id: 12345, // Wrong type
    name: "Test",
    enrollmentDate: Temporal.Now.instant().toString(),
  });
  console.log("  ✗ Should have thrown an error!");
} catch (error) {
  if (error instanceof TypeError) {
    // Descriptive error message names the field and actual type received
    console.log(`  ✓ Correctly threw: "${error.message}"\n`);
  }
}

// TEST 3: Invalid data (missing field) - should throw
console.log("Test 3: Parse invalid student data (missing name)");
try {
  parseStudent({
    id: "STU-001",
    // name is missing
    enrollmentDate: Temporal.Now.instant().toString(),
  });
  console.log("  ✗ Should have thrown an error!");
} catch (error) {
  if (error instanceof TypeError) {
    console.log(`  ✓ Correctly threw: "${error.message}"\n`);
  }
}

// ============================================================================
// EXERCISE 3: Type Guards for Course
// ============================================================================

console.log("--- EXERCISE 3: Course Type Guards ---\n");

const validCourseData: unknown = {
  id: "CSE-10001",
  title: "Data Structures",
  capacity: 50,
  startDate: "2025-01-13",
};

const invalidCourseData: unknown = {
  id: "CSE-10001",
  title: "Data Structures",
  capacity: "fifty", // Wrong type: string instead of number
};

// TEST 1: Valid course data
console.log("Test 1: Valid course data");
if (isCourse(validCourseData)) {
  console.log(
    `  ✓ Valid: ${validCourseData.title} (${validCourseData.capacity} seats)`
  );
} else {
  console.log("  ✗ Invalid course data");
}

// TEST 2: Invalid course data
console.log("\nTest 2: Invalid course data (capacity is string)");
if (isCourse(invalidCourseData)) {
  console.log("  ✓ Valid");
} else {
  console.log("  ✓ Guard correctly rejected: capacity must be number\n");
}

// ============================================================================
// EXERCISE 3: Type Guards for EnrollmentRecord
// ============================================================================

console.log("--- EXERCISE 3: EnrollmentRecord Type Guards ---\n");

const validEnrollmentData: unknown = {
  studentId: "STU-001",
  courseCode: "CSE-10001",
  enrolledAt: Temporal.Now.instant().toString(),
};

const invalidEnrollmentData: unknown = {
  studentId: 12345, // Wrong type
  courseCode: "CSE-10001",
  enrolledAt: Temporal.Now.instant().toString(),
};

// TEST 1: Valid enrollment data
console.log("Test 1: Valid enrollment data");
if (isEnrollmentRecord(validEnrollmentData)) {
  console.log(
    `  ✓ Valid: ${validEnrollmentData.studentId} -> ${validEnrollmentData.courseCode}`
  );
} else {
  console.log("  ✗ Invalid enrollment data");
}

// TEST 2: Invalid enrollment data
console.log("\nTest 2: Invalid enrollment data (studentId is number)");
if (isEnrollmentRecord(invalidEnrollmentData)) {
  console.log("  ✓ Valid");
} else {
  console.log(
    "  ✓ Guard correctly rejected: studentId must be string\n"
  );
}

// ============================================================================
// SESSION 2 TESTS: Discriminated Unions, Generics, and Temporal
// ============================================================================

// (Note: All imports are above, no need to import again)

// ============================================================================
// EXERCISE 4: Assessment Types (Discriminated Unions)
// ============================================================================

console.log("\n--- SESSION 2, EXERCISE 4: Assessment Types (Discriminated Unions) ---\n");

// Create a quiz assessment
const quiz: AssessmentItem = {
  id: "QUIZ-001",
  kind: "quiz",
  title: "SQL Basics",
  correctAnswers: 8,
  totalQuestions: 10,
};

// Create a lab assignment assessment
const lab: AssessmentItem = {
  id: "LAB-001",
  kind: "lab",
  title: "REST API Project",
  functionalityScore: 85,
  codeQualityScore: 90,
};

console.log(`Quiz: ${quiz.title}`);
console.log(`  Grade: ${calculateGrade(quiz)}%`); // 80

console.log(`Lab: ${lab.title}`);
console.log(`  Grade: ${calculateGrade(lab)}%`); // 87

console.log("✓ Discriminated union with type narrowing in calculateGrade\n");

// ============================================================================
// EXERCISE 5: Enrollment Lifecycle (State Machine Union)
// ============================================================================

console.log("--- EXERCISE 5: Enrollment Lifecycle (State Machine Union) ---\n");

const pending: EnrollmentStatus = {
  status: "PENDING",
  requestedAt: Temporal.Now.instant(),
  studentId: "STU-001",
  courseId: "CRS-101",
};

console.log(`Enrollment Status: ${describeEnrollment(pending)}\n`);

const active: EnrollmentStatus = {
  status: "ACTIVE",
  startDate: Temporal.PlainDate.from("2026-09-01"),
  currentGrade: 87,
};

console.log(`Enrollment Status: ${describeEnrollment(active)}`);
console.log("✓ Exhaustive state machine with never check\n");

// ============================================================================
// EXERCISE 5 PART B: Course Lifecycle
// ============================================================================

console.log("--- EXERCISE 5 PART B: Course Lifecycle (State Machine Union) ---\n");

const activeCourse: CourseStatus = {
  status: "ACTIVE",
  enrolledCount: 28,
  startDate: Temporal.PlainDate.from("2026-09-01"),
};

console.log(`Course Status: ${describeCourse(activeCourse)}\n`);

const draftCourse: CourseStatus = {
  status: "DRAFT",
  createdBy: "dr.smith",
  createdAt: Temporal.Now.instant(),
};

console.log(`Course Status: ${describeCourse(draftCourse)}`);
console.log("✓ Course state machine with all 5 states\n");

// ============================================================================
// EXERCISE 6: Reusable API Response (Generics)
// ============================================================================

console.log("--- EXERCISE 6: Reusable API Response (Generics) ---\n");

// Test with Student data
const studentRes: ApiResponse<Student> = {
  status: "success",
  data: {
    id: "STU-001",
    name: "Dawit Bekele",
    enrollmentDate: Temporal.Now.instant(),
    gpa: 3.4,
  },
  fetchedAt: Temporal.Now.instant(),
};

console.log("Student Response:");
console.log(
  `  ${renderResponse(studentRes, (s) => `${s.name} GPA: ${s.gpa ?? "N/A"}`)}`
);

// Test with Course array data
const courseListRes: ApiResponse<Course[]> = {
  status: "success",
  data: [
    {
      id: "CRS-101",
      title: "Web Development Fundamentals",
      capacity: 30,
      startDate: Temporal.PlainDate.from("2026-09-01"),
    },
    {
      id: "CRS-102",
      title: "Database Design",
      capacity: 25,
      startDate: Temporal.PlainDate.from("2026-09-15"),
    },
  ],
  fetchedAt: Temporal.Now.instant(),
};

console.log("\nCourse List Response:");
console.log(
  `  ${renderResponse(courseListRes, (courses) =>
    courses.map((c) => c.title).join(", ")
  )}`
);

// Test with error state
const errorRes: ApiResponse<Student> = {
  status: "error",
  message: "Student not found",
  statusCode: 404,
};

console.log("\nError Response:");
console.log(`  ${renderResponse(errorRes, (_s) => "")}`);  // Formatter is never called in error state

console.log("\n✓ Generic ApiResponse<T> works with multiple data types\n");

// ============================================================================
// EXERCISE 7: Temporal Timestamps
// ============================================================================

console.log("--- EXERCISE 7: Temporal Timestamps (Dates, Timezones, Durations) ---\n");

// 1. Record the exact moment an enrollment is approved (UTC)
const approvedAt = Temporal.Now.instant();
console.log(`Approved at (UTC): ${approvedAt}`);

// 2. Display in local timezone
const addisTime = approvedAt.toZonedDateTimeISO("Africa/Addis_Ababa");
const londonTime = approvedAt.toZonedDateTimeISO("Europe/London");
console.log(`Addis: ${addisTime.toPlainTime()}`);
console.log(`London: ${londonTime.toPlainTime()}`);
console.log("(Same moment, different wall-clock time)\n");

// 3. Course start date (date only, no time)
const courseStart = Temporal.PlainDate.from("2026-09-15");
const today = Temporal.Now.plainDateISO();
const daysUntilStart = today.until(courseStart).total({ unit: "days" });
console.log(`${Math.floor(daysUntilStart)} days until course starts`);

// 4. Assignment deadline duration
const deadline = Temporal.PlainDate.from("2026-12-15");
const remaining = today.until(deadline);
console.log(
  `${Math.floor(remaining.total({ unit: "days" }))} days until assignment is due`
);

console.log("\n✓ Temporal.Instant for UTC timestamps");
console.log("✓ Temporal.PlainDate for date-only values");
console.log("✓ Timezone conversion with toZonedDateTimeISO()\n");

// ============================================================================
// SESSION 2 CHECKLIST: What You Should Be Able to Show
// ============================================================================
//
// Confirm all seven:
//
// ☐ models/assessment.model.ts exports Quiz, LabAssignment, AssessmentItem, 
//   and calculateGrade
// ☐ calculateGrade correctly returns 80 for a quiz with 8/10 and 87 for a 
//   lab with 85 functionality + 90 quality
// ☐ Commenting out any case in describeEnrollment or describeCourse produces 
//   a compile error on the never default
// ☐ You wrote describeCourse yourself (not copied from handout)
// ☐ renderResponse works with both ApiResponse<Student> and ApiResponse<Course[]> 
//   using the same function
// ☐ All Temporal timestamps use Temporal.Instant (not new Date())
// ☐ Temporal.PlainDate.until() correctly calculates days between two dates
//
// ============================================================================

console.log("========================================");
console.log("✓ All exercises completed successfully!");
console.log("========================================");
console.log("\nSession 1 (Type Safety & Domain Models):");
console.log("  ✓ Strict mode enabled");
console.log("  ✓ Student, Course, EnrollmentRecord models");
console.log("  ✓ Type guards and parse functions");
console.log("\nSession 2 (Unions, Generics, Temporal):");
console.log("  ✓ Discriminated unions (Quiz | LabAssignment)");
console.log("  ✓ State machines (EnrollmentStatus, CourseStatus)");
console.log("  ✓ Generic ApiResponse<T>");
console.log("  ✓ Temporal.Instant for UTC timestamps");
console.log("\nTo verify configuration:");
console.log("  npx tsc --showConfig");
console.log("\nTo recompile and run:");
console.log("  npm start");
