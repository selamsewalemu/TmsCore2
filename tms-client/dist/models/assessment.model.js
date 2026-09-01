"use strict";
// ============================================================================
// MODULE 2, SESSION 2, EXERCISE 4: Assessment Types (Discriminated Unions)
// ============================================================================
//
// File Organization: One file per domain model (assessment types)
// Demonstrates discriminated unions and exhaustive pattern matching.
//
// Key Concepts:
// 1. DISCRIMINATED UNION: One type that can be multiple shapes
// 2. DISCRIMINANT FIELD: "kind" field tags which variant this is
// 3. TYPE NARROWING: Inside each case, TypeScript knows the exact variant
// 4. EXHAUSTIVE CHECKING: Compiler ensures all variants are handled
//
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateGrade = calculateGrade;
exports.isQuiz = isQuiz;
exports.isLabAssignment = isLabAssignment;
exports.isAssessmentItem = isAssessmentItem;
exports.parseQuiz = parseQuiz;
exports.parseLabAssignment = parseLabAssignment;
exports.parseAssessmentItem = parseAssessmentItem;
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
function calculateGrade(item) {
    switch (item.kind) {
        case "quiz":
            // Inside this block: TypeScript knows item is Quiz
            // Only Quiz properties are available
            return Math.round((item.correctAnswers / item.totalQuestions) * 100);
        case "lab":
            // Inside this block: TypeScript knows item is LabAssignment
            // Only LabAssignment properties are available
            return Math.round(item.functionalityScore * 0.7 + item.codeQualityScore * 0.3);
    }
}
// ============================================================================
// TYPE GUARD FOR ASSESSMENT ITEMS (Similar to Exercise 3)
// ============================================================================
/**
 * Type guard to check if a value is a valid Quiz
 *
 * Usage:
 *   if (isQuiz(data)) {
 *     // TypeScript narrows to Quiz inside this block
 *   }
 */
function isQuiz(value) {
    if (typeof value !== "object" || value === null)
        return false;
    const obj = value;
    return (typeof obj.id === "string" &&
        obj.kind === "quiz" &&
        typeof obj.title === "string" &&
        typeof obj.correctAnswers === "number" &&
        typeof obj.totalQuestions === "number");
}
/**
 * Type guard to check if a value is a valid LabAssignment
 */
function isLabAssignment(value) {
    if (typeof value !== "object" || value === null)
        return false;
    const obj = value;
    return (typeof obj.id === "string" &&
        obj.kind === "lab" &&
        typeof obj.title === "string" &&
        typeof obj.functionalityScore === "number" &&
        typeof obj.codeQualityScore === "number");
}
/**
 * Type guard to check if a value is a valid AssessmentItem (either variant)
 */
function isAssessmentItem(value) {
    return isQuiz(value) || isLabAssignment(value);
}
// ============================================================================
// PARSE FUNCTIONS FOR ASSESSMENT ITEMS (Similar to Exercise 3)
// ============================================================================
/**
 * Parse and validate a Quiz from unknown data
 * Throws: TypeError with descriptive message if invalid
 */
function parseQuiz(raw) {
    if (typeof raw !== "object" || raw === null) {
        throw new TypeError(`Expected an object, received ${typeof raw}`);
    }
    const obj = raw;
    if (typeof obj.id !== "string") {
        throw new TypeError(`Expected id to be a string, received ${typeof obj.id}`);
    }
    if (obj.kind !== "quiz") {
        throw new TypeError(`Expected kind to be "quiz", received ${JSON.stringify(obj.kind)}`);
    }
    if (typeof obj.title !== "string") {
        throw new TypeError(`Expected title to be a string, received ${typeof obj.title}`);
    }
    if (typeof obj.correctAnswers !== "number") {
        throw new TypeError(`Expected correctAnswers to be a number, received ${typeof obj.correctAnswers}`);
    }
    if (typeof obj.totalQuestions !== "number") {
        throw new TypeError(`Expected totalQuestions to be a number, received ${typeof obj.totalQuestions}`);
    }
    return {
        id: obj.id,
        kind: "quiz",
        title: obj.title,
        correctAnswers: obj.correctAnswers,
        totalQuestions: obj.totalQuestions,
    };
}
/**
 * Parse and validate a LabAssignment from unknown data
 */
function parseLabAssignment(raw) {
    if (typeof raw !== "object" || raw === null) {
        throw new TypeError(`Expected an object, received ${typeof raw}`);
    }
    const obj = raw;
    if (typeof obj.id !== "string") {
        throw new TypeError(`Expected id to be a string, received ${typeof obj.id}`);
    }
    if (obj.kind !== "lab") {
        throw new TypeError(`Expected kind to be "lab", received ${JSON.stringify(obj.kind)}`);
    }
    if (typeof obj.title !== "string") {
        throw new TypeError(`Expected title to be a string, received ${typeof obj.title}`);
    }
    if (typeof obj.functionalityScore !== "number") {
        throw new TypeError(`Expected functionalityScore to be a number, received ${typeof obj.functionalityScore}`);
    }
    if (typeof obj.codeQualityScore !== "number") {
        throw new TypeError(`Expected codeQualityScore to be a number, received ${typeof obj.codeQualityScore}`);
    }
    return {
        id: obj.id,
        kind: "lab",
        title: obj.title,
        functionalityScore: obj.functionalityScore,
        codeQualityScore: obj.codeQualityScore,
    };
}
/**
 * Parse and validate an AssessmentItem from unknown data
 * Automatically determines if it's Quiz or LabAssignment based on kind field
 */
function parseAssessmentItem(raw) {
    if (typeof raw !== "object" || raw === null) {
        throw new TypeError(`Expected an object, received ${typeof raw}`);
    }
    const obj = raw;
    if (obj.kind === "quiz") {
        return parseQuiz(raw);
    }
    else if (obj.kind === "lab") {
        return parseLabAssignment(raw);
    }
    else {
        throw new TypeError(`Expected kind to be "quiz" or "lab", received ${JSON.stringify(obj.kind)}`);
    }
}
//# sourceMappingURL=assessment.model.js.map