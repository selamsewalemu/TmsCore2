# MODULE 2: Type Safety and Domain Models - TypeScript Frontend

## Project Overview

This project implements Module 2 Session 1 exercises for the TMS (Teaching Management System) Frontend.

**Goal**: Build TypeScript models and utilities that enforce type safety between the .NET backend and Angular frontend.

**Problem Solved**: JSON carries no type information. A response like `{ id: "STU-001", gpa: 3.8 }` could contain anything - the id might arrive as a number after an API migration, causing silent runtime bugs.

**Solution**: TypeScript with strict mode catches type mismatches at compile time, before they reach production.

---

## Project Structure

```
tms-client/
├── tsconfig.json                  # TypeScript compiler configuration
├── package.json                   # Node.js dependencies and scripts
├── index.ts                       # Test file for all three exercises
└── models/                        # One file per domain model
    ├── student.model.ts           # Student interface + type guards
    ├── course.model.ts            # Course interface + type guards
    └── enrollment.model.ts        # EnrollmentRecord interface + type guards
```

### File Organization Philosophy

**Professional Angular projects use one file per model** (not one file per type of thing).
- `models/student.model.ts` contains Student interface + isStudent guard + parseStudent parser
- `models/course.model.ts` contains Course interface + isCourse guard + parseCourse parser
- `models/enrollment.model.ts` contains EnrollmentRecord interface + guards + parser

This structure:
- Makes imports clear: `import { Student } from "./models/student.model"`
- Scales well (add 20 more models = add 20 files, not one giant file)
- Matches Angular CLI scaffolding (you'll move this to `src/app/models/` in M8)
- Prevents circular dependencies

---

## Three Exercises in This Project

### EXERCISE 1: Enforcing Strict Mode

**File**: `tsconfig.json`

**Problem**: The existing frontend had `strict: false`, allowing "85" > "9" to evaluate to false (string comparison), causing a student with 85% to appear below a student with 9%.

**Solution**: Enable `strict: true` to force the compiler to flag type errors before code runs.

**Key Flags**:
- `strict: true` - Master flag for all strict checks
- `noImplicitAny: true` - Variables must have explicit types
- `strictNullChecks: true` - null and undefined are distinct types
- `noUncheckedIndexedAccess: true` - Array access must be checked for undefined

**Verification**:
```bash
npx tsc --showConfig
# Should show: "strict": true (and all sub-flags enabled)
```

---

### EXERCISE 2: Domain Models

**Files**: 
- `models/student.model.ts`
- `models/course.model.ts`
- `models/enrollment.model.ts`

**Problem**: The C# backend defines Student, Course, and EnrollmentRecord. The frontend needs matching TypeScript interfaces so API responses have a known shape.

**Solution**: Create interfaces that:
1. Use `readonly` on ID fields (compile-time enforcement)
2. Use `?` for optional properties (forces null-checking)
3. Use Temporal for precise datetime handling (no bugs with legacy Date object)

**Key Concepts**:

#### READONLY Properties
```typescript
export interface Student {
  readonly id: string;  // Cannot reassign after initialization
  name: string;         // Can be updated
}
```

**Why readonly?**
- C#: CLR enforces at runtime
- TypeScript: Compile-time only (JS has no concept of it)
- Value: Catches mistakes during development

#### OPTIONAL Properties
```typescript
export interface Student {
  gpa?: number;  // May be undefined
}

// With strictNullChecks, this forces explicit handling:
const display = student.gpa?.toFixed(2) ?? "Not yet graded"; // ✓ Safe
const display = student.gpa.toFixed(2);  // ✗ Error: might be undefined
```

#### Temporal for Dates
```typescript
import { Temporal } from "@js-temporal/polyfill";

export interface Student {
  enrollmentDate: Temporal.Instant;  // Precise, timezone-aware
}

// Safe to do date arithmetic:
const days = Temporal.Now.instant().since(student.enrollmentDate);
```

---

### EXERCISE 3: Safe API Parsing with Type Guards

**Files**: All model files (each has `isX` and `parseX` functions)

**Problem**: The TMS API returns JSON. JSON has no type information - `response.json()` returns `unknown`.

Legacy dangerous code:
```typescript
function processStudent(data: any) {
  console.log(`GPA: ${data.gpa.toFixed(2)}`); // Crashes if gpa missing/not number
}
```

**Solution**: Two validation patterns:

#### Pattern 1: Type Guards (return boolean)
```typescript
export function isStudent(value: unknown): value is Student {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "name" in value &&
    typeof (value as Record<string, unknown>).id === "string" &&
    typeof (value as Record<string, unknown>).name === "string"
  );
}

// Usage:
if (isStudent(raw)) {
  // Inside this block: TypeScript knows raw is Student
  console.log(raw.name);  // ✓ Safe - autocomplete works
}
```

**When to use**: Filtering arrays of mixed data (partial success acceptable)

#### Pattern 2: Parse Functions (throw on error)
```typescript
export function parseStudent(raw: unknown): Student {
  if (typeof raw !== "object" || raw === null) {
    throw new TypeError(`Expected an object, received ${raw === null ? "null" : typeof raw}`);
  }

  const obj = raw as Record<string, unknown>;

  if (typeof obj.id !== "string") {
    throw new TypeError(`Expected id to be a string, received ${typeof obj.id}`);
  }

  if (typeof obj.name !== "string") {
    throw new TypeError(`Expected name to be a string, received ${typeof obj.name}`);
  }

  return {
    id: obj.id,
    name: obj.name,
    enrollmentDate: Temporal.Now.instant(),
  };
}

// Usage:
try {
  const student = parseStudent(apiResponse);
  console.log(`Enrolled: ${student.name}`);
} catch (error) {
  console.error(`Invalid student data: ${error.message}`);
}
```

**When to use**: API mismatch is a programming error that should fail loudly

**Error Messages Are Descriptive**:
```
parseStudent({ id: 42, name: "Test" })
// Throws: "Expected id to be a string, received number"

parseStudent({ id: "STU-001" })
// Throws: "Expected name to be a string, received undefined"
```

---

## Setup and Running

### 1. Install Dependencies
```bash
cd tms-client
npm install
```

This installs:
- `typescript` - TypeScript compiler
- `@js-temporal/polyfill` - Modern datetime handling
- `@types/node` - Type definitions for Node.js

### 2. Verify Strict Mode Configuration
```bash
npx tsc --showConfig
```

**Expected output**:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    ...
  }
}
```

### 3. Run the Test File
```bash
# Compile TypeScript to JavaScript
npm run build

# Run the compiled JavaScript
node dist/index.js
```

**Expected output**:
```
========================================
MODULE 2: Type Safety and Domain Models
Session 1: Exercise Demonstrations
========================================

--- EXERCISE 2: Domain Models ---

Student created: Hana Tadesse (STU-001)
✓ readonly enforcement: student.id cannot be reassigned
GPA: Not yet graded
✓ Optional property handling: gpa?.toFixed(2) ?? default

--- EXERCISE 2: Course Model ---

Course: Data Structures (50 seats)
Start: January 13, 2025
✓ Course model with optional startDate

...

========================================
✓ All exercises completed successfully!
========================================
```

### 4. Watch Mode (Auto-recompile on changes)
```bash
npm run dev
```

This runs `tsc --watch`, which recompiles whenever you save a file.

---

## Session 1 Checklist: What You Can Now Show

Before moving to Session 2, confirm all five:

- [ ] `npx tsc --showConfig` shows `strict: true` with all flags enabled
- [ ] Your `models/` folder contains three separate files:
  - `student.model.ts`
  - `course.model.ts`
  - `enrollment.model.ts`
- [ ] `index.ts` successfully imports `Student` from `./models/student.model` - the import compiles without errors
- [ ] `isStudent({ id: "STU-001", name: "Hana" })` returns true and narrows to Student inside an if block
- [ ] `parseStudent({ id: 42, name: "Test" })` throws a TypeError with a descriptive message naming the field and actual type

---

## Key Decision Rules (Use in Real Projects)

### 1. Always Enable Strict Mode
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```
This is non-negotiable for production TypeScript.

### 2. Use `readonly` on ID Fields
```typescript
readonly id: string;  // Compile-time enforcement
```
Prevents accidental reassignment during development.

### 3. Use `?` for Optional Properties
```typescript
gpa?: number;  // May be undefined

// Safe access:
student.gpa?.toFixed(2) ?? "Not yet graded"

// FORBIDDEN without ?:
student.gpa.toFixed(2)  // ✗ Error: might be undefined
```

### 4. Use `unknown` for External Data
```typescript
function processData(data: unknown) {  // ✓ Type-safe
  // Must validate before using
}

function processData(data: any) {  // ✗ Dangerous
  // Anything goes - type errors slip to production
}
```

### 5. Type Guards for Filtering, Parse Functions for Errors
```typescript
// Guard: Caller handles both success/failure paths
if (isStudent(data)) { /* valid */ } else { /* invalid */ }

// Parser: Failure is an error that should stop execution
const student = parseStudent(data);  // Throws if invalid
```

---

## Common Errors and Fixes

### Error: `error TS2307: Cannot find module`
**Cause**: Module not set to "nodenext"
**Fix**: In tsconfig.json, set `"module": "nodenext"`

### Error: `error TS18003: No inputs were found`
**Cause**: No TypeScript files in project
**Fix**: Create an `index.ts` file (even if empty) so the compiler has something to process

### Error: `tsc: command not found`
**Cause**: TypeScript not installed locally
**Fix**: Run `npx tsc` instead of `tsc` to use the local installation

### Error: `Cannot assign to readonly property`
**Cause**: Trying to reassign a readonly property
**Fix**: This is compile-time enforcement working! Remove the reassignment line.

### Error: `Object is possibly 'undefined'`
**Cause**: Using optional property without safe access
**Fix**: Use optional chaining: `student.gpa?.toFixed(2)` or null coalescing: `?? "default"`

### Error: `Type 'any' is not assignable to type 'never'`
**Cause**: You're using `any` somewhere (strict mode forbids this)
**Fix**: Replace `any` with proper types. Use `unknown` for external data.

---

## Next: Module 2 Session 2

Session 2 builds on these domain models by:
1. Creating API controllers that return these models as JSON
2. Configuring JSON serialization (camelCase, null handling, etc.)
3. Adding validation attributes (`[Required]`, `[Range]`, `[StringLength]`)
4. Implementing error responses that describe validation failures
5. Testing API endpoints to ensure JSON matches TypeScript expectations

The models you built here will be imported into service classes that fetch from the backend.

---

## Further Reading

- [TypeScript tsconfig.json Documentation](https://www.typescriptlang.org/tsconfig/)
- [TypeScript Handbook: Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript Handbook: Strict Mode](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-0.html#strict-mode)
- [Temporal API: Standard Date/Time Handling](https://tc39.es/proposal-temporal/)
- [Angular Style Guide: Folder Structure](https://angular.io/guide/styleguide)

---

## Summary

You've completed Module 2 Session 1:
- ✓ Enabled strict mode in TypeScript (compile-time type checking)
- ✓ Created domain models matching the C# backend
- ✓ Implemented type guards and parse functions for safe API data handling
- ✓ Demonstrated type safety in action with working code

These models are production-ready and can be moved directly into the Angular project (M8) without modification.
