/**
 * EXERCISE 4: Assessment Types - Discriminated Unions
 *
 * Situation: The TMS has two types of graded items:
 * - Quizzes: Scored by correct answers (8/10 questions correct)
 * - Lab Assignments: Scored by functionality and code quality
 *
 * Problem (Legacy): In C#, you used polymorphism (IGradable interface +
 * Quiz/LabAssignment classes). TypeScript has no runtime class hierarchy
 * (JSON has no classes). How do you represent "this could be a quiz OR a
 * lab assignment" with type safety?
 *
 * Solution: Discriminated Union (tagged union)
 * - One union type (AssessmentItem) that can be Quiz | LabAssignment
 * - Each variant has a "kind" field ("quiz" or "lab") as discriminant
 * - TypeScript compiler narrows the type inside each case block
 * - Forget to handle a variant? Compiler error (exhaustiveness check)
 *
 * C# vs TypeScript Comparison:
 * C#:
 *   interface IGradable { decimal CalculateGrade(); }
 *   class Quiz : IGradable { public decimal CalculateGrade() {...} }
 *   class LabAssignment : IGradable { public decimal CalculateGrade() {...} }
 *   // Virtual dispatch at runtime - type is lost
 *
 * TypeScript:
 *   type AssessmentItem = Quiz | LabAssignment;
 *   switch(item.kind) {
 *     case "quiz": // TypeScript knows item is Quiz here
 *     case "lab": // TypeScript knows item is LabAssignment here
 *   }
 *   // Compiler enforces all variants handled (never: never)
 *
 * Decision Rule:
 * - Use discriminated unions when data comes from JSON (no class hierarchy)
 *   and you need exhaustive pattern matching
 * - C# inheritance: Good for shared implementation across subclasses
 * - TypeScript unions: Good for data classification and exhaustiveness
 *
 * Trade-off: Neither is universally better.
 * - C# inheritance lets subclasses share code (calculateGrade logic)
 * - TypeScript unions force you to handle every variant (compiler safety)
 */
/**
 * QUIZ INTERFACE
 *
 * Represents a graded quiz assessment.
 *
 * Properties:
 * - id: Unique identifier (readonly - never changes)
 * - kind: Discriminant field - always "quiz" (literal type)
 * - title: Human-readable name (e.g., "SQL Basics")
 * - correctAnswers: Number of questions answered correctly
 * - totalQuestions: Total number of questions on the quiz
 *
 * Example:
 * {
 *   id: "QUIZ-001",
 *   kind: "quiz",
 *   title: "SQL Basics",
 *   correctAnswers: 8,
 *   totalQuestions: 10
 * }
 *
 * Grade Calculation: (correctAnswers / totalQuestions) * 100
 * Example: (8 / 10) * 100 = 80%
 *
 * Why kind: "quiz" (literal type)?
 * - TypeScript will ONLY accept exactly "quiz"
 * - kind: "quiz" | "lab" would allow any string
 * - kind: "quiz" creates a literal type - strict value checking
 * - This enables type narrowing: if (item.kind === "quiz") {...}
 */
export interface Quiz {
    /**
     * Unique identifier for this quiz
     * Type: string (readonly - never changes)
     * Format: "QUIZ-XXXXX" (e.g., "QUIZ-00123")
     * Used as: Primary key in database
     */
    readonly id: string;
    /**
     * Discriminant field - marks this as a Quiz variant
     * Type: literal "quiz" (not just any string)
     * Purpose: Tells TypeScript which union variant this is
     *
     * With discriminant field:
     *   if (item.kind === "quiz") {
     *     // TypeScript narrows type to Quiz here
     *     // Can access correctAnswers, totalQuestions
     *   }
     *
     * Without discriminant field:
     *   You'd need to check with instanceof (not possible in JSON)
     *   or type guards with property checking
     */
    kind: "quiz";
    /**
     * Human-readable title of the quiz
     * Type: string
     * Examples: "SQL Basics", "TypeScript Generics", "REST API Design"
     * Used for: Display in UI, gradebook, student transcripts
     */
    title: string;
    /**
     * Number of questions the student answered correctly
     * Type: number (integer)
     * Constraint: 0 <= correctAnswers <= totalQuestions
     * Example: Student got 8 out of 10 questions correct
     */
    correctAnswers: number;
    /**
     * Total number of questions on the quiz
     * Type: number (integer)
     * Constraint: > 0 (quiz must have at least one question)
     * Example: This quiz has 10 questions
     */
    totalQuestions: number;
}
/**
 * LAB ASSIGNMENT INTERFACE
 *
 * Represents a graded lab assignment assessment.
 *
 * Properties:
 * - id: Unique identifier (readonly - never changes)
 * - kind: Discriminant field - always "lab" (literal type)
 * - title: Human-readable name (e.g., "REST API Project")
 * - functionalityScore: Does the code work? (0-100)
 * - codeQualityScore: Is the code well-written? (0-100)
 *
 * Example:
 * {
 *   id: "LAB-001",
 *   kind: "lab",
 *   title: "REST API Project",
 *   functionalityScore: 85,
 *   codeQualityScore: 90
 * }
 *
 * Grade Calculation: (functionality * 0.7) + (quality * 0.3)
 * Example: (85 * 0.7) + (90 * 0.3) = 59.5 + 27 = 86.5 ≈ 87%
 *
 * Why weighted average?
 * - Functionality: 70% - Does the code actually do what's required?
 * - Quality: 30% - Is the code maintainable, well-documented, efficient?
 */
export interface LabAssignment {
    /**
     * Unique identifier for this lab assignment
     * Type: string (readonly - never changes)
     * Format: "LAB-XXXXX" (e.g., "LAB-00001")
     * Used as: Primary key in database
     */
    readonly id: string;
    /**
     * Discriminant field - marks this as a LabAssignment variant
     * Type: literal "lab" (not just any string)
     * Purpose: Tells TypeScript which union variant this is
     *
     * Type Guard Pattern:
     *   if (item.kind === "lab") {
     *     // TypeScript narrows type to LabAssignment here
     *     // Can access functionalityScore, codeQualityScore
     *   }
     */
    kind: "lab";
    /**
     * Human-readable title of the lab assignment
     * Type: string
     * Examples: "REST API Project", "Database Design", "React Component Library"
     * Used for: Display in UI, gradebook, student portfolios
     */
    title: string;
    /**
     * Score for functionality: Does the code work as specified?
     * Type: number (0-100)
     * Rubric:
     * - 90-100: All features implemented and working correctly
     * - 70-89: Most features working, minor bugs
     * - 50-69: Some features working, significant bugs
     * - 0-49: Does not work or major functionality missing
     *
     * This score directly reflects the requirements compliance.
     */
    functionalityScore: number;
    /**
     * Score for code quality: Is the code well-written?
     * Type: number (0-100)
     * Rubric:
     * - 90-100: Clean code, well-documented, follows best practices
     * - 70-89: Generally good, some improvements needed
     * - 50-69: Works but messy, poor documentation
     * - 0-49: Unreadable, no documentation, bad patterns
     *
     * This score reflects code maintainability and professionalism.
     */
    codeQualityScore: number;
}
/**
 * ASSESSMENT ITEM UNION TYPE
 *
 * Purpose: Represents any graded assessment in the TMS
 * Can be: Quiz | LabAssignment
 *
 * Why a union type?
 * - A function might receive either a quiz or a lab assignment
 * - JSON API doesn't know about classes - just objects
 * - We need one type that represents "this could be either"
 *
 * Usage:
 *   function calculateGrade(item: AssessmentItem): number { ... }
 *   // item can be Quiz or LabAssignment
 *
 * Type Narrowing:
 *   if (item.kind === "quiz") {
 *     // item is Quiz here
 *     console.log(item.correctAnswers); // OK
 *     console.log(item.functionalityScore); // ERROR - not on Quiz
 *   } else if (item.kind === "lab") {
 *     // item is LabAssignment here
 *     console.log(item.functionalityScore); // OK
 *     console.log(item.correctAnswers); // ERROR - not on LabAssignment
 *   }
 *
 * Exhaustiveness Checking:
 * If you add a new variant (e.g., Essay), and forget to handle it in
 * a switch block, TypeScript will error on the default case.
 */
export type AssessmentItem = Quiz | LabAssignment;
/**
 * CALCULATE GRADE FOR ANY ASSESSMENT
 *
 * Purpose: Compute the numeric grade (0-100) for any assessment type
 * Input: AssessmentItem (Quiz | LabAssignment)
 * Output: number (grade percentage, rounded to nearest integer)
 *
 * Algorithm:
 * - For Quiz: (correctAnswers / totalQuestions) * 100
 * - For Lab: (functionalityScore * 0.7) + (codeQualityScore * 0.3)
 *
 * Exhaustiveness Checking Pattern:
 *   switch (item.kind) {
 *     case "quiz": // Handle quiz
 *     case "lab": // Handle lab
 *     // No default needed - TypeScript knows all variants are covered
 *   }
 *   // If we forget a case, compiler error on the return type
 *
 * Advanced Pattern (Never Check):
 * If we do add a default case:
 *   default: {
 *     const _check: never = item;  // If any variant missed, error here
 *     throw new Error(`Unhandled assessment type: ${JSON.stringify(_check)}`);
 *   }
 *
 * This pattern is used in Exercise 5 (describeEnrollment).
 *
 * Type Narrowing in Action:
 * Inside each case:
 * - case "quiz": TypeScript knows item.kind === "quiz"
 *   → Can access item.correctAnswers, item.totalQuestions
 *   → Cannot access item.functionalityScore (not on Quiz)
 * - case "lab": TypeScript knows item.kind === "lab"
 *   → Can access item.functionalityScore, item.codeQualityScore
 *   → Cannot access item.correctAnswers (not on LabAssignment)
 *
 * Examples:
 * calculateGrade({ kind: "quiz", correctAnswers: 8, totalQuestions: 10, ... })
 *   → (8 / 10) * 100 = 80
 * calculateGrade({ kind: "lab", functionalityScore: 85, codeQualityScore: 90, ... })
 *   → (85 * 0.7) + (90 * 0.3) = 59.5 + 27 = 86.5 → 87 (rounded)
 */
export declare function calculateGrade(item: AssessmentItem): number;
/**
 * Type guard to check if a value is a valid Quiz
 *
 * Usage:
 *   if (isQuiz(data)) {
 *     // TypeScript narrows to Quiz inside this block
 *   }
 */
export declare function isQuiz(value: unknown): value is Quiz;
/**
 * Type guard to check if a value is a valid LabAssignment
 */
export declare function isLabAssignment(value: unknown): value is LabAssignment;
/**
 * Type guard to check if a value is a valid AssessmentItem (either variant)
 */
export declare function isAssessmentItem(value: unknown): value is AssessmentItem;
/**
 * Parse and validate a Quiz from unknown data
 * Throws: TypeError with descriptive message if invalid
 */
export declare function parseQuiz(raw: unknown): Quiz;
/**
 * Parse and validate a LabAssignment from unknown data
 */
export declare function parseLabAssignment(raw: unknown): LabAssignment;
/**
 * Parse and validate an AssessmentItem from unknown data
 * Automatically determines if it's Quiz or LabAssignment based on kind field
 */
export declare function parseAssessmentItem(raw: unknown): AssessmentItem;
//# sourceMappingURL=assessment.model.d.ts.map