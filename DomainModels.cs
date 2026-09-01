/// <summary>
/// MODULE 2: Type Safety and Domain Models - C# Backend Implementation
/// 
/// Project: TMS (Teaching Management System)
/// This module focuses on building a robust domain layer with strict type safety.
/// The backend produces JSON responses for every API endpoint that must maintain
/// type consistency with the TypeScript frontend layer.
/// 
/// Learning Outcomes:
/// - Implement strict type safety in C# using nullability annotations
/// - Design domain models (Student, Course, EnrollmentRecord, Quiz, LabAssignment)
/// - Create type guards and validation functions
/// - Understand the relationship between C# domain models and TypeScript interfaces
/// 
/// Problem Statement:
/// JSON carries no type information. A response like { id: "STU-001", gpa: 3.8 }
/// could contain mismatched types after API migrations. This module ensures type
/// safety from backend to frontend to prevent runtime errors.
/// </summary>

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TmsCore2.Models
{
    // ============================================================================
    // EXERCISE 1: Enforcing Nullable Reference Types
    // ============================================================================
    // Situation: Legacy C# code used string and int without null-safety checks.
    // A grade input might be null, but the code attempted calculations anyway.
    // Solution: Enable <Nullable>enable</Nullable> in .csproj to catch null issues.
    // 
    // Decision Rule:
    // - Always enable nullable reference types in production projects
    // - Use ? suffix to explicitly mark nullable types (e.g., string?)
    // - Omit ? for non-nullable types (e.g., string means it cannot be null)
    // 
    // Trade-off: More compiler errors on day one. Fix the code, not the config.
    // ============================================================================

    /// <summary>
    /// DOMAIN MODEL: Student
    /// 
    /// Purpose: Represents a student enrolled in the TMS system.
    /// This model defines the structure of Student data that flows from the
    /// backend API to the TypeScript frontend.
    /// 
    /// Database Mapping: 
    /// - Stored in [Students] table with StudentId as primary key
    /// - EnrollmentDate tracked for academic year calculation
    /// - GPA is optional - students start with no grades
    /// 
    /// Usage:
    /// - API responses: GET /api/students/{id}
    /// - Service layer: StudentService processes Student objects
    /// - TypeScript mapping: Student interface mirrors this structure
    /// </summary>
    public class Student
    {
        /// <summary>
        /// ASSIGNMENT: Implement StudentId Property
        /// 
        /// Requirements:
        /// - Type: string (non-nullable)
        /// - Constraint: readonly after initialization
        /// - Format: "STU-XXXXX" (e.g., "STU-00123")
        /// - Used as: Primary key in database, identifier in API responses
        /// - Validation: Must be unique across all students
        /// 
        /// Why readonly?
        /// In C#, readonly is enforced by the CLR at runtime. Once a Student
        /// is created with an ID, that ID can never change. This prevents bugs
        /// where someone accidentally reassigns a student's ID.
        /// </summary>
        public required string StudentId { get; init; }

        /// <summary>
        /// ASSIGNMENT: Implement Name Property
        /// 
        /// Requirements:
        /// - Type: string (non-nullable)
        /// - Constraint: Can be updated if the student legally changes their name
        /// - Length: 1-200 characters
        /// - Validation: No leading/trailing whitespace
        /// - Example: "Hana Tadesse"
        /// 
        /// Why not readonly?
        /// Student names may change due to marriage, legal name changes, etc.
        /// The Name property is mutable but still type-safe.
        /// </summary>
        public required string Name { get; set; }

        /// <summary>
        /// ASSIGNMENT: Implement EnrollmentDate Property
        /// 
        /// Requirements:
        /// - Type: DateTime (non-nullable, UTC)
        /// - Constraint: readonly - set only during enrollment
        /// - Purpose: Track when the student enrolled in the system
        /// - Used for: Academic year calculation, tenure computation
        /// - Format: ISO 8601 (e.g., 2024-01-15T10:30:00Z)
        /// 
        /// Note: In TypeScript, this maps to Temporal.Instant for precise
        /// timezone-aware datetime handling. Always use UTC in the backend.
        /// </summary>
        public required DateTime EnrollmentDate { get; init; }

        /// <summary>
        /// ASSIGNMENT: Implement GPA Property
        /// 
        /// Requirements:
        /// - Type: decimal? (nullable - IMPORTANT)
        /// - Range: 0.0 to 4.0 when present
        /// - Default: null (not calculated until first grade)
        /// - Precision: Two decimal places (e.g., 3.85)
        /// - Update Frequency: Recalculated after each grade entry
        /// 
        /// Why nullable?
        /// New students have no GPA until they receive at least one grade.
        /// Using decimal? forces the code to explicitly handle the "no grades yet"
        /// case using null coalescing (??) or safe navigation (?.).
        /// 
        /// Frontend Impact (TypeScript):
        /// gpa?: number  // Optional property
        /// // Safe access: student.gpa?.toFixed(2) ?? "Not yet graded"
        /// </summary>
        public decimal? GPA { get; set; }

        // ====================================================================
        // EXERCISE 1 PRACTICE: Type Safety Demo
        // ====================================================================
        // The following two methods demonstrate type safety violations and fixes:

        /// <summary>
        /// EXERCISE 1 UNSAFE METHOD: Demonstrates the problem
        /// 
        /// Problem: This method assumes GPA is never null.
        /// If called on a new student with no grades, it throws NullReferenceException.
        /// Legacy code had no way to prevent this at compile time.
        /// 
        /// DEPRECATED - Use GetGPADisplaySafe() instead
        /// </summary>
        [Obsolete("Use GetGPADisplaySafe() instead - this method doesn't handle null GPA")]
        public string GetGPADisplay_Unsafe()
        {
            // ❌ DANGEROUS: This assumes GPA is not null
            // If GPA is null, this throws NullReferenceException at runtime
            return GPA.Value.ToString("F2"); // CRASH if GPA is null!
        }

        /// <summary>
        /// EXERCISE 1 SAFE METHOD: Demonstrates the solution
        /// 
        /// Solution: Explicitly handle the case where GPA might be null
        /// using the null-coalescing operator (??).
        /// 
        /// Returns:
        /// - "3.85" if GPA is present
        /// - "Not yet graded" if GPA is null
        /// 
        /// This method compiles safely and never crashes.
        /// The TypeScript equivalent: student.gpa?.toFixed(2) ?? "Not yet graded"
        /// </summary>
        public string GetGPADisplaySafe()
        {
            // ✓ SAFE: This handles both cases - GPA present and GPA null
            return GPA?.ToString("F2") ?? "Not yet graded";
        }
    }

    // ============================================================================
    // EXERCISE 2: Domain Models - Course
    // ============================================================================
    // Situation: The backend must return Course data for enrollment management.
    // The frontend needs a matching TypeScript interface so API responses
    // are type-safe and prevent the "85" > "9" string comparison bug.
    // ============================================================================

    /// <summary>
    /// DOMAIN MODEL: Course
    /// 
    /// Purpose: Represents a course that students can enroll in.
    /// Defines the structure returned by GET /api/courses/{id} endpoint.
    /// 
    /// Database Mapping:
    /// - Stored in [Courses] table with CourseId as primary key
    /// - Capacity limits enrollment; prevents over-registration
    /// - StartDate is optional for courses not yet scheduled
    /// 
    /// TypeScript Equivalent:
    /// export interface Course {
    ///   readonly id: string;
    ///   title: string;
    ///   capacity: number;
    ///   startDate?: Temporal.PlainDate;
    /// }
    /// </summary>
    public class Course
    {
        /// <summary>
        /// ASSIGNMENT: Implement CourseId Property
        /// 
        /// Requirements:
        /// - Type: string (non-nullable)
        /// - Constraint: readonly - never changes after creation
        /// - Format: "CSE-XXXXX" (e.g., "CSE-10001") or similar
        /// - Purpose: Unique identifier for the course
        /// - Used as: Primary key, foreign key in enrollments
        /// 
        /// Example: "CSE-20234" for "Data Structures" course
        /// </summary>
        public required string CourseId { get; init; }

        /// <summary>
        /// ASSIGNMENT: Implement Title Property
        /// 
        /// Requirements:
        /// - Type: string (non-nullable)
        /// - Length: 3-200 characters
        /// - Purpose: Human-readable course name
        /// - Examples: "Data Structures", "Web Development", "Algorithms"
        /// 
        /// Mutable: Yes - course titles can be updated before the semester starts
        /// </summary>
        public required string Title { get; set; }

        /// <summary>
        /// ASSIGNMENT: Implement Capacity Property
        /// 
        /// Requirements:
        /// - Type: int (non-nullable)
        /// - Range: 1-1000 students
        /// - Purpose: Maximum enrollment limit
        /// - Validation: CurrentEnrollment <= Capacity
        /// 
        /// Business Rule:
        /// When CurrentEnrollment reaches Capacity, new enrollment requests are rejected.
        /// </summary>
        public required int Capacity { get; set; }

        /// <summary>
        /// ASSIGNMENT: Implement StartDate Property
        /// 
        /// Requirements:
        /// - Type: DateTime? (nullable - IMPORTANT)
        /// - Default: null (course exists before scheduling)
        /// - Purpose: When does the course begin teaching?
        /// - Validation: Must be after current date when set
        /// 
        /// Why nullable?
        /// Courses are created in the catalog before a semester is scheduled.
        /// StartDate is set later when the registrar finalizes the semester.
        /// 
        /// Business Rule:
        /// - null = Not yet scheduled
        /// - HasValue = Confirmed start date (e.g., 2025-01-13)
        /// </summary>
        public DateTime? StartDate { get; set; }

        /// <summary>
        /// ASSIGNMENT EXERCISE: Calculate Days Until Start
        /// 
        /// Purpose: Helper method for course readiness checks
        /// 
        /// Requirements:
        /// - Return: int (number of days until StartDate, or -1 if null)
        /// - Handle null StartDate gracefully
        /// - Consider timezone (use UTC)
        /// 
        /// Implementation Pattern:
        /// if (StartDate.HasValue)
        /// {
        ///     return (int)(StartDate.Value - DateTime.UtcNow).TotalDays;
        /// }
        /// return -1;
        /// </summary>
        public int DaysUntilStart()
        {
            if (StartDate.HasValue)
            {
                return (int)(StartDate.Value - DateTime.UtcNow).TotalDays;
            }
            return -1; // Course not yet scheduled
        }
    }

    // ============================================================================
    // EXERCISE 3: Safe API Parsing - Type Guards and Validation
    // ============================================================================
    // Situation: The TMS API receives JSON from mobile clients and third-party systems.
    // JSON has no type information - a response might have { id: 42 } instead of
    // { id: "STU-001" }. The legacy code used 'any', which allowed invalid data.
    // 
    // Solution: Create validation functions that parse unknown data and either
    // return a valid object or throw a descriptive error.
    // ============================================================================

    /// <summary>
    /// DOMAIN MODEL: EnrollmentRecord
    /// 
    /// Purpose: Represents a student's enrollment in a specific course.
    /// Tracks the relationship between students and courses.
    /// 
    /// Database Mapping:
    /// - Stored in [Enrollments] table with (StudentId, CourseId) composite key
    /// - EnrolledAt timestamp used for "first enrolled" queries
    /// - No end date (students remain enrolled until semester ends)
    /// 
    /// TypeScript Equivalent:
    /// export interface EnrollmentRecord {
    ///   readonly studentId: string;
    ///   readonly courseCode: string;
    ///   enrolledAt: Temporal.Instant;
    /// }
    /// </summary>
    public class EnrollmentRecord
    {
        /// <summary>
        /// ASSIGNMENT: Implement StudentId Property
        /// 
        /// Requirements:
        /// - Type: string (non-nullable)
        /// - Constraint: readonly - part of composite key
        /// - Format: Must match an existing Student.StudentId
        /// - Foreign Key: References Students table
        /// - Example: "STU-00123"
        /// </summary>
        public required string StudentId { get; init; }

        /// <summary>
        /// ASSIGNMENT: Implement CourseCode Property
        /// 
        /// Requirements:
        /// - Type: string (non-nullable)
        /// - Constraint: readonly - part of composite key
        /// - Format: Must match an existing Course.CourseId
        /// - Foreign Key: References Courses table
        /// - Example: "CSE-10001"
        /// </summary>
        public required string CourseCode { get; init; }

        /// <summary>
        /// ASSIGNMENT: Implement EnrolledAt Property
        /// 
        /// Requirements:
        /// - Type: DateTime (non-nullable, UTC)
        /// - Constraint: Set to NOW at enrollment time
        /// - Purpose: When did the student enroll in this course?
        /// - Used for: Enrollment audit trail, "enrolled since" queries
        /// 
        /// Note: Unlike Student.GPA, this is never null - every enrollment
        /// has a definite start time.
        /// </summary>
        public required DateTime EnrolledAt { get; init; }
    }

    // ============================================================================
    // EXERCISE 3: Type Guards - Validation Functions
    // ============================================================================
    // Purpose: Safely parse unknown data from JSON API responses.
    // Pattern: If data is valid -> return typed object
    //          If data is invalid -> throw descriptive TypeError
    // ============================================================================

    /// <summary>
    /// EXERCISE 3 PART A: Parsing Students from API Responses
    /// 
    /// Situation: The TMS API endpoint GET /api/students returns JSON:
    /// {
    ///   "studentId": "STU-00123",
    ///   "name": "Hana Tadesse",
    ///   "enrollmentDate": "2024-01-15T10:30:00Z",
    ///   "gpa": 3.85
    /// }
    /// 
    /// Problem: The JSON parser returns object, not Student. The id might be
    /// a number after an API migration: { "studentId": 12345 }
    /// 
    /// Solution: Write a ParseStudent function that validates each field's type
    /// and throws a descriptive error if anything is wrong.
    /// </summary>
    public static class StudentParser
    {
        /// <summary>
        /// EXERCISE 3 IMPLEMENTATION: Parse and Validate Student Data
        /// 
        /// Method: ParseStudent
        /// Input: object (unknown data from JSON response)
        /// Output: Student (typed object with all required fields validated)
        /// Throws: ArgumentException if validation fails
        /// 
        /// Validation Rules:
        /// 1. Input must be a non-null object
        /// 2. StudentId must be a string (not number, not null)
        /// 3. Name must be a string (not number, not null)
        /// 4. EnrollmentDate must be a valid ISO 8601 string
        /// 5. GPA (if present) must be decimal 0.0 to 4.0
        /// 
        /// Example Usage:
        /// try
        /// {
        ///     var student = StudentParser.ParseStudent(apiResponse);
        ///     Console.WriteLine($"Enrolled: {student.Name}");
        /// }
        /// catch (ArgumentException ex)
        /// {
        ///     Console.Error.WriteLine($"Invalid student data: {ex.Message}");
        ///     // Handle error - log, return error response, etc.
        /// }
        /// 
        /// Why throw instead of return false?
        /// - API data mismatch is a programming error, not a recoverable condition
        /// - Throwing forces developers to handle the error immediately
        /// - The descriptive message makes debugging real API mismatches straightforward
        /// </summary>
        public static Student ParseStudent(object? rawData)
        {
            // Step 1: Validate input is an object
            if (rawData == null)
            {
                throw new ArgumentException(
                    "Expected Student object, received null",
                    nameof(rawData));
            }

            // Step 2: Attempt to extract fields from the raw data
            // In production, use System.Text.Json or JsonConvert
            if (rawData is not System.Collections.Generic.IDictionary<string, object> dict)
            {
                throw new ArgumentException(
                    $"Expected object dictionary, received {rawData.GetType().Name}",
                    nameof(rawData));
            }

            // Step 3: Validate StudentId field
            if (!dict.TryGetValue("studentId", out var idValue) || idValue is not string studentId)
            {
                throw new ArgumentException(
                    $"Expected 'studentId' field to be a string, received {idValue?.GetType().Name ?? "null"}",
                    nameof(rawData));
            }

            // Step 4: Validate Name field
            if (!dict.TryGetValue("name", out var nameValue) || nameValue is not string name)
            {
                throw new ArgumentException(
                    $"Expected 'name' field to be a string, received {nameValue?.GetType().Name ?? "null"}",
                    nameof(rawData));
            }

            // Step 5: Validate EnrollmentDate field
            if (!dict.TryGetValue("enrollmentDate", out var enrollDateValue) ||
                enrollDateValue is not string enrollDateStr ||
                !DateTime.TryParse(enrollDateStr, out var enrollmentDate))
            {
                throw new ArgumentException(
                    $"Expected 'enrollmentDate' field to be a valid ISO 8601 string, received {enrollDateValue?.GetType().Name ?? "null"}",
                    nameof(rawData));
            }

            // Step 6: Validate GPA field (optional, but must be decimal 0-4 if present)
            decimal? gpa = null;
            if (dict.TryGetValue("gpa", out var gpaValue) && gpaValue != null)
            {
                if (gpaValue is not decimal gpaDecimal && gpaValue is not double gpaDouble)
                {
                    throw new ArgumentException(
                        $"Expected 'gpa' field to be a number, received {gpaValue.GetType().Name}",
                        nameof(rawData));
                }

                decimal parsedGpa = gpaValue is decimal d ? d : (decimal)(double)gpaValue;
                if (parsedGpa < 0 || parsedGpa > 4.0m)
                {
                    throw new ArgumentException(
                        $"Expected 'gpa' field to be between 0.0 and 4.0, received {parsedGpa}",
                        nameof(rawData));
                }

                gpa = parsedGpa;
            }

            // Step 7: All validations passed - construct and return Student
            return new Student
            {
                StudentId = studentId,
                Name = name,
                EnrollmentDate = enrollmentDate,
                GPA = gpa
            };
        }

        /// <summary>
        /// EXERCISE 3 DEMONSTRATION: What happens with invalid data?
        /// 
        /// Example calls and their results:
        /// 
        /// 1. Valid data:
        ///    ParseStudent(new { studentId = "STU-001", name = "Hana", ... })
        ///    Returns: Student { StudentId = "STU-001", Name = "Hana", ... }
        /// 
        /// 2. Invalid StudentId (number instead of string):
        ///    ParseStudent(new { studentId = 12345, name = "Hana", ... })
        ///    Throws: ArgumentException with message:
        ///    "Expected 'studentId' field to be a string, received Int32"
        /// 
        /// 3. Missing field:
        ///    ParseStudent(new { name = "Hana" }) // no studentId
        ///    Throws: ArgumentException with message:
        ///    "Expected 'studentId' field to be a string, received null"
        /// 
        /// 4. Null input:
        ///    ParseStudent(null)
        ///    Throws: ArgumentException with message:
        ///    "Expected Student object, received null"
        /// 
        /// The error messages name the specific field and actual type received.
        /// This makes debugging real API mismatches straightforward.
        /// </summary>
    }

    // ============================================================================
    // ADDITIONAL DOMAIN MODELS: Quiz and LabAssignment
    // ============================================================================
    // These models were mentioned in the module introduction but are not covered
    // in Exercise 1-3. They represent additional domain concepts in TMS.
    // ============================================================================

    /// <summary>
    /// DOMAIN MODEL: Quiz
    /// 
    /// Purpose: Represents a quiz that tests student knowledge.
    /// Quizzes are associated with courses and contribute to final grades.
    /// 
    /// Note: Implementation left for a later exercise.
    /// Students will add:
    /// - QuizId (string, readonly)
    /// - CourseId (string, readonly, foreign key)
    /// - Title (string)
    /// - TotalPoints (int)
    /// - DueDate (DateTime)
    /// </summary>
    public class Quiz
    {
        public required string QuizId { get; init; }
        public required string CourseId { get; init; }
        public required string Title { get; set; }
        public required int TotalPoints { get; set; }
        public required DateTime DueDate { get; set; }

        // TODO EXERCISE: Implement method GetTimeRemaining() that returns
        // the number of minutes until DueDate, or 0 if past due
    }

    /// <summary>
    /// DOMAIN MODEL: LabAssignment
    /// 
    /// Purpose: Represents a lab assignment with code submissions.
    /// Students submit code, which is evaluated against test cases.
    /// 
    /// Note: Implementation left for a later exercise.
    /// Students will add:
    /// - AssignmentId (string, readonly)
    /// - CourseId (string, readonly, foreign key)
    /// - Title (string)
    /// - Description (string)
    /// - MaxScore (int)
    /// - DueDate (DateTime)
    /// - RepositoryUrl (string?, nullable - submission link)
    /// </summary>
    public class LabAssignment
    {
        public required string AssignmentId { get; init; }
        public required string CourseId { get; init; }
        public required string Title { get; set; }
        public required string Description { get; set; }
        public required int MaxScore { get; set; }
        public required DateTime DueDate { get; set; }
        public string? RepositoryUrl { get; set; }

        // TODO EXERCISE: Implement method IsSubmitted() that checks
        // if RepositoryUrl is not null and represents a valid GitHub URL
    }

    // ============================================================================
    // SESSION 1 CHECKLIST: What You Should Be Able to Show
    // ============================================================================
    // Before moving to Session 2, confirm all of the following:
    //
    // ☐ Student.cs compiles with nullable reference types enabled
    // ☐ Student class has readonly StudentId property initialized via required init
    // ☐ Student class has nullable GPA property (decimal?)
    // ☐ Student.GetGPADisplaySafe() compiles without null-reference warnings
    // ☐ StudentParser.ParseStudent() throws ArgumentException with descriptive messages
    // ☐ StudentParser.ParseStudent({ id: "STU-001", name: "Hana" }) returns valid Student
    // ☐ StudentParser.ParseStudent({ id: 42, name: "Test" }) throws with message naming field and type
    // ☐ Course class has readonly CourseId and nullable StartDate
    // ☐ EnrollmentRecord class has readonly StudentId and CourseCode
    // ☐ All models can be serialized to JSON and deserialized safely
    //
    // ============================================================================
    // NEXT: Module 2 Session 2 - API Controllers and JSON Serialization
    // ============================================================================
    // Session 2 builds on these domain models by:
    // 1. Creating API controllers that return these models as JSON
    // 2. Configuring JSON serialization (camelCase, null handling, etc.)
    // 3. Adding validation attributes [Required], [Range], [StringLength]
    // 4. Implementing error responses that describe validation failures
    // 5. Testing API endpoints to ensure JSON matches TypeScript expectations
    // ============================================================================
}
